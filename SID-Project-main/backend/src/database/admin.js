const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { encrypt } = require('../utils/crypto');

// Создание учётной записи администратора. Вынесено отдельно от наполнения
// справочников: пароли не должны появляться в базе как побочный эффект миграции.

const MIN_PASSWORD_LENGTH = 12;

const WEAK_PASSWORDS = new Set([
  'admin', 'admin123', 'password', 'qwerty', '123456', '12345678',
  'admin1234', 'password123', 'qwerty123', 'changeme', 'letmein'
]);

// Пароль из этого набора читается вслух по телефону без ошибок:
// исключены символы, которые путают между собой (0/O, 1/l/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function generatePassword(length = 20) {
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return password;
}

function validatePassword(password) {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `Пароль администратора должен быть не короче ${MIN_PASSWORD_LENGTH} символов`;
  }
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    return 'Этот пароль есть в списках для перебора — выберите другой';
  }
  if (/^(.)\1+$/.test(password)) {
    return 'Пароль не должен состоять из одного повторяющегося символа';
  }
  return null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const validateEmail = (email) =>
  EMAIL_PATTERN.test(String(email || '').trim()) ? null : 'Некорректный адрес электронной почты';

/**
 * Создаёт администратора или повышает существующего пользователя до этой роли.
 * Возвращает { id, email, created, passwordSet }.
 */
async function ensureAdmin(db, { email, password, fullName, phone } = {}) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const emailError = validateEmail(normalizedEmail);
  if (emailError) throw new Error(emailError);

  const passwordError = validatePassword(password);
  if (passwordError) throw new Error(passwordError);

  const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
  const passwordHash = await bcrypt.hash(password, rounds);

  const existing = await db.query('SELECT id, role FROM users WHERE email = $1', [normalizedEmail]);

  if (existing.rows.length) {
    const { id } = existing.rows[0];
    await db.query(
      `UPDATE users
       SET password_hash = $1, role = 'admin', is_active = true, is_verified = true,
           full_name = COALESCE($2, full_name), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [passwordHash, fullName || null, id]
    );
    // Сменили пароль — все ранее выданные сессии больше не действуют
    await db.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [id]);

    return { id, email: normalizedEmail, created: false, passwordSet: true };
  }

  const result = await db.query(
    `INSERT INTO users (email, password_hash, full_name, phone, role, is_active, is_verified)
     VALUES ($1, $2, $3, $4, 'admin', true, true)
     RETURNING id`,
    [normalizedEmail, passwordHash, fullName || 'Администратор', encrypt(phone) || null]
  );

  const { id } = result.rows[0];
  await db.query('INSERT INTO user_stats (user_id) VALUES ($1)', [id]);

  return { id, email: normalizedEmail, created: true, passwordSet: true };
}

module.exports = {
  ensureAdmin,
  generatePassword,
  validatePassword,
  validateEmail,
  MIN_PASSWORD_LENGTH
};
