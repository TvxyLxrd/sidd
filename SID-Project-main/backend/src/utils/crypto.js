const crypto = require('crypto');
const logger = require('./logger');

// Шифрование чувствительных полей перед записью в базу.
// Формат хранения: enc.v1.<iv>.<tag>.<ciphertext>, все части в base64url.
// Значения без префикса читаются как есть — это позволяет включить шифрование
// на существующей базе и дошифровывать записи по мере их обновления.

const ALGORITHM = 'aes-256-gcm';
const PREFIX = 'enc.v1.';
const IV_BYTES = 12;
const KEY_BYTES = 32;

let dataKey = null;
let indexKey = null;

const isProduction = () => process.env.NODE_ENV === 'production';

function readMasterKey() {
  const raw = process.env.ENCRYPTION_KEY;

  if (raw) {
    const key = Buffer.from(raw.trim(), 'hex');
    if (key.length !== KEY_BYTES) {
      throw new Error(
        `ENCRYPTION_KEY должен содержать ${KEY_BYTES * 2} hex-символов (получено ${raw.trim().length})`
      );
    }
    return key;
  }

  if (isProduction()) {
    throw new Error('ENCRYPTION_KEY обязателен в production: без него данные пишутся в открытом виде');
  }

  // Для локальной разработки ключ выводится из JWT-секрета, чтобы демо
  // запускалось без дополнительной настройки. В production такой путь закрыт.
  logger.warn('ENCRYPTION_KEY не задан — ключ выведен из JWT_SECRET (только для разработки)');
  return crypto.scryptSync(process.env.JWT_SECRET || 'sid-development-fallback', 'sid.encryption.v1', KEY_BYTES);
}

function keys() {
  if (!dataKey) {
    const master = readMasterKey();
    // Разные ключи для шифрования и для слепых индексов: компрометация
    // индекса не должна давать возможности расшифровать данные.
    dataKey = Buffer.from(crypto.hkdfSync('sha256', master, Buffer.alloc(0), 'sid.data.v1', KEY_BYTES));
    indexKey = Buffer.from(crypto.hkdfSync('sha256', master, Buffer.alloc(0), 'sid.index.v1', KEY_BYTES));
  }
  return { dataKey, indexKey };
}

const isEncrypted = (value) => typeof value === 'string' && value.startsWith(PREFIX);

// Шифрует строку. null, undefined и пустая строка возвращаются без изменений,
// чтобы не превращать «поля нет» в «поле есть, но зашифровано».
function encrypt(value) {
  if (value === null || value === undefined || value === '') return value;
  if (isEncrypted(value)) return value;

  const { dataKey: key } = keys();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return PREFIX + [iv, tag, ciphertext].map((part) => part.toString('base64url')).join('.');
}

// Расшифровывает значение. Незашифрованные значения возвращаются как есть.
function decrypt(value) {
  if (!isEncrypted(value)) return value;

  try {
    const [iv, tag, ciphertext] = value.slice(PREFIX.length).split('.');
    const { dataKey: key } = keys();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64url')),
      decipher.final()
    ]).toString('utf8');
  } catch (error) {
    // Сюда попадаем при подмене шифротекста или смене ключа — GCM это ловит.
    logger.error('Не удалось расшифровать значение', { error: error.message });
    return null;
  }
}

// Слепой индекс: детерминированный HMAC для поиска по зашифрованному полю
// без его расшифровки. Одинаковый вход даёт одинаковый индекс.
function blindIndex(value) {
  if (value === null || value === undefined || value === '') return null;
  const { indexKey: key } = keys();
  return crypto.createHmac('sha256', key).update(String(value).trim().toLowerCase()).digest('hex');
}

// Токены обновления хранятся в виде хеша: утечка базы не даёт готовых токенов.
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

// Сравнение за постоянное время — против атак по времени отклика.
function safeEqual(a, b) {
  const left = Buffer.from(String(a ?? ''));
  const right = Buffer.from(String(b ?? ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

const randomKey = () => crypto.randomBytes(KEY_BYTES).toString('hex');

module.exports = {
  encrypt,
  decrypt,
  blindIndex,
  hashToken,
  safeEqual,
  isEncrypted,
  randomKey
};
