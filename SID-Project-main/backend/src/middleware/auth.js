const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const logger = require('../utils/logger');

// Middleware для проверки JWT токена
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        logger.warn('Invalid token attempt', { 
          ip: req.ip, 
          error: err.message 
        });
        
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            error: 'Token expired',
            code: 'TOKEN_EXPIRED'
          });
        }
        
        return res.status(403).json({
          success: false,
          error: 'Invalid token'
        });
      }

      // Проверяем существование пользователя
      const result = await db.query(
        'SELECT id, email, role, is_active, full_name FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'User not found'
        });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      // Добавляем данные пользователя в request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name
      };

      next();
    });
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Middleware для проверки роли пользователя
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path
      });
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware для проверки прав администратора
const requireAdmin = requireRole('admin');

// Middleware для проверки прав модератора или администратора
const requireModerator = requireRole('admin', 'moderator');

// Optional authentication (не требует токен, но если есть - проверяет)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return next(); // Продолжаем без аутентификации
      }

      const result = await db.query(
        'SELECT id, email, role, is_active, full_name FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length > 0 && result.rows[0].is_active) {
        req.user = {
          id: result.rows[0].id,
          email: result.rows[0].email,
          role: result.rows[0].role,
          fullName: result.rows[0].full_name
        };
      }

      next();
    });
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};

// Генерация токенов
const generateTokens = (userId) => {
  // jwtid гарантирует уникальность токена: без него два токена, выданные
  // в одну и ту же секунду, идентичны и ломают UNIQUE-констрейнт refresh_tokens.
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d', jwtid: uuidv4() }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d', jwtid: uuidv4() }
  );

  return { accessToken, refreshToken };
};

// Проверка refresh токена
const verifyRefreshToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireModerator,
  optionalAuth,
  generateTokens,
  verifyRefreshToken
};
