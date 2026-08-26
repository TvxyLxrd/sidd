const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const { encrypt, decrypt, hashToken } = require('../utils/crypto');

// Блокировка после серии неудачных попыток: ограничение по IP не спасает,
// если перебор идёт с разных адресов, поэтому считаем попытки по аккаунту.
const LOGIN_MAX_ATTEMPTS = parseInt(process.env.LOGIN_LOCK_MAX, 10) || 5;
const LOGIN_LOCK_WINDOW_MS = parseInt(process.env.LOGIN_LOCK_WINDOW_MS, 10) || 15 * 60 * 1000;

async function countRecentFailures(userId) {
  const since = new Date(Date.now() - LOGIN_LOCK_WINDOW_MS);
  const result = await db.query(
    `SELECT COUNT(*)::int AS attempts
     FROM security_logs
     WHERE user_id = $1 AND event_type = 'LOGIN_FAILED' AND created_at > $2`,
    [userId, since]
  );
  return result.rows[0].attempts;
}

// Успешный вход обнуляет счётчик, иначе аккаунт заблокировался бы
// из-за давних опечаток владельца.
async function clearFailures(userId) {
  await db.query(
    `DELETE FROM security_logs WHERE user_id = $1 AND event_type = 'LOGIN_FAILED'`,
    [userId]
  );
}

// Токен обновления хранится только в виде хеша: из украденной базы
// восстановить рабочий токен нельзя.
async function storeRefreshToken(userId, token) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await db.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, hashToken(token), expiresAt]
  );
}

// Регистрация пользователя
const register = async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // Проверка существования пользователя
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Хеширование пароля
    const passwordHash = await bcrypt.hash(
      password,
      parseInt(process.env.BCRYPT_ROUNDS) || 12
    );

    // Создание пользователя
    // Телефон — персональные данные, в базу он попадает зашифрованным
    const result = await db.query(
      `INSERT INTO users (email, password_hash, full_name, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role, created_at`,
      [email, passwordHash, fullName, encrypt(phone) || null]
    );

    const user = result.rows[0];

    // Создание статистики пользователя
    await db.query(
      'INSERT INTO user_stats (user_id) VALUES ($1)',
      [user.id]
    );

    // Генерация токенов
    const { accessToken, refreshToken } = generateTokens(user.id);
    await storeRefreshToken(user.id, refreshToken);

    // Логирование
    await db.query(
      `INSERT INTO security_logs (user_id, event_type, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'REGISTER', req.ip, req.get('user-agent')]
    );

    logger.info('User registered', { userId: user.id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          createdAt: user.created_at
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
};

// Авторизация
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Поиск пользователя
    const result = await db.query(
      `SELECT id, email, password_hash, full_name, role, is_active, avatar_url
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      await db.query(
        `INSERT INTO security_logs (event_type, ip_address, user_agent, details)
         VALUES ($1, $2, $3, $4)`,
        ['LOGIN_FAILED', req.ip, req.get('user-agent'), JSON.stringify({ email, reason: 'User not found' })]
      );

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Проверка активности аккаунта
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Аккаунт временно закрыт, если подряд шли неудачные попытки
    const failures = await countRecentFailures(user.id);
    if (failures >= LOGIN_MAX_ATTEMPTS) {
      logger.warn('Login blocked: too many failed attempts', { userId: user.id, failures });
      return res.status(429).json({
        success: false,
        error: 'Too many failed attempts, account temporarily locked',
        retryAfter: Math.round(LOGIN_LOCK_WINDOW_MS / 60000) + ' minutes'
      });
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      await db.query(
        `INSERT INTO security_logs (user_id, event_type, ip_address, user_agent, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, 'LOGIN_FAILED', req.ip, req.get('user-agent'), JSON.stringify({ reason: 'Invalid password' })]
      );

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Генерация токенов
    const { accessToken, refreshToken } = generateTokens(user.id);
    await storeRefreshToken(user.id, refreshToken);
    await clearFailures(user.id);

    // Обновление last_login
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Логирование успешного входа
    await db.query(
      `INSERT INTO security_logs (user_id, event_type, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'LOGIN_SUCCESS', req.ip, req.get('user-agent')]
    );

    logger.info('User logged in', { userId: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          avatarUrl: user.avatar_url
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

// Обновление токена
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    // Проверка токена
    const decoded = await verifyRefreshToken(refreshToken);

    // В базе лежит хеш, поэтому и ищем по хешу
    const tokenResult = await db.query(
      `SELECT id, user_id, expires_at, revoked
       FROM refresh_tokens
       WHERE token = $1`,
      [hashToken(refreshToken)]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    const tokenData = tokenResult.rows[0];

    if (tokenData.revoked) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token has been revoked'
      });
    }

    if (new Date() > new Date(tokenData.expires_at)) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token expired'
      });
    }

    // Генерация новых токенов
    const tokens = generateTokens(decoded.userId);

    // Отзываем старый refresh токен
    await db.query(
      'UPDATE refresh_tokens SET revoked = true WHERE id = $1',
      [tokenData.id]
    );

    await storeRefreshToken(decoded.userId, tokens.refreshToken);

    logger.info('Token refreshed', { userId: decoded.userId });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token'
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    if (refreshToken) {
      // Отзываем конкретный токен
      await db.query(
        'UPDATE refresh_tokens SET revoked = true WHERE token = $1 AND user_id = $2',
        [hashToken(refreshToken), userId]
      );
    } else {
      // Отзываем все токены пользователя
      await db.query(
        'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false',
        [userId]
      );
    }

    // Логирование
    await db.query(
      `INSERT INTO security_logs (user_id, event_type, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'LOGOUT', req.ip, req.get('user-agent')]
    );

    logger.info('User logged out', { userId });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

// Получение текущего пользователя
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url, u.role, u.is_verified, u.created_at,
              us.total_requests, us.completed_requests, us.pending_requests
       FROM users u
       LEFT JOIN user_stats us ON u.id = us.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: decrypt(user.phone),
          avatarUrl: user.avatar_url,
          role: user.role,
          isVerified: user.is_verified,
          createdAt: user.created_at,
          stats: {
            totalRequests: user.total_requests || 0,
            completedRequests: user.completed_requests || 0,
            pendingRequests: user.pending_requests || 0
          }
        }
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user data'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser
};
