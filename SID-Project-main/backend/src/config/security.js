const logger = require('../utils/logger');

const isProduction = () => process.env.NODE_ENV === 'production';

const WEAK_MARKERS = ['change_this', 'change_in_production', 'your_', 'secret_key', 'password_here'];

// Проверка секретов при старте. В production сервер отказывается подниматься
// с ключами из примера конфигурации — молча работать на слабом ключе опаснее,
// чем не запуститься вовсе.
function assertSecrets() {
  const problems = [];
  const { JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY } = process.env;

  const check = (name, value, minLength) => {
    if (!value) {
      problems.push(`${name} не задан`);
      return;
    }
    if (value.length < minLength) {
      problems.push(`${name} короче ${minLength} символов`);
    }
    const lowered = value.toLowerCase();
    if (WEAK_MARKERS.some((marker) => lowered.includes(marker))) {
      problems.push(`${name} содержит значение из шаблона конфигурации`);
    }
  };

  check('JWT_SECRET', JWT_SECRET, 32);
  check('JWT_REFRESH_SECRET', JWT_REFRESH_SECRET, 32);

  if (JWT_SECRET && JWT_SECRET === JWT_REFRESH_SECRET) {
    problems.push('JWT_SECRET и JWT_REFRESH_SECRET совпадают');
  }

  if (!ENCRYPTION_KEY) {
    problems.push('ENCRYPTION_KEY не задан');
  } else if (!/^[0-9a-f]{64}$/i.test(ENCRYPTION_KEY.trim())) {
    problems.push('ENCRYPTION_KEY должен содержать 64 hex-символа');
  }

  if (!problems.length) return;

  if (isProduction()) {
    problems.forEach((problem) => logger.error(`Небезопасная конфигурация: ${problem}`));
    throw new Error(
      'Запуск в production остановлен из-за небезопасных секретов. ' +
      'Сгенерируйте новые: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  problems.forEach((problem) => logger.warn(`Конфигурация разработки: ${problem}`));
}

// Content-Security-Policy: скрипты только свои, посторонние фреймы запрещены.
// Инлайновые стили разрешены — интерфейс расставляет их через атрибут style,
// а вектор атаки у стилей несопоставим со скриптовым.
function helmetOptions() {
  return {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
        fontSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'data:'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        ...(isProduction() ? { upgradeInsecureRequests: [] } : {})
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: isProduction()
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    frameguard: { action: 'deny' },
    noSniff: true,
    hidePoweredBy: true
  };
}

// В production трафик по http перенаправляется на https. За обратным прокси
// протокол приходит в X-Forwarded-Proto, поэтому нужен trust proxy.
function enforceHttps(req, res, next) {
  if (!isProduction()) return next();
  if (req.secure || req.get('x-forwarded-proto') === 'https') return next();
  if (req.method === 'GET' || req.method === 'HEAD') {
    return res.redirect(308, `https://${req.get('host')}${req.originalUrl}`);
  }
  return res.status(403).json({ success: false, error: 'HTTPS required' });
}

const POLLUTION_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// Реквайвер для express.json: опасные ключи выбрасываются ещё на разборе,
// до того как объект где-либо используется.
function jsonReviver(key, value) {
  if (POLLUTION_KEYS.has(key)) return undefined;
  return value;
}

// Управляющие символы в строках ломают журналы и могут обрывать значения
// при выводе. Оставляем перевод строки и табуляцию, остальное вырезаем.
const CONTROL_CHARS = new RegExp('[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]', 'g');

function cleanString(value) {
  return value.replace(CONTROL_CHARS, '');
}

function cleanDeep(value, depth = 0) {
  if (depth > 8) return null;
  if (typeof value === 'string') return cleanString(value);
  if (Array.isArray(value)) return value.map((item) => cleanDeep(item, depth + 1));
  if (value && typeof value === 'object') {
    const result = Object.create(null);
    for (const [key, item] of Object.entries(value)) {
      if (POLLUTION_KEYS.has(key)) continue;
      result[key] = cleanDeep(item, depth + 1);
    }
    return Object.assign({}, result);
  }
  return value;
}

// Приводит в порядок тело, строку запроса и параметры пути каждого запроса.
function sanitizeRequest(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = cleanDeep(req.body);
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      if (typeof req.params[key] === 'string') req.params[key] = cleanString(req.params[key]);
    }
  }
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      const value = req.query[key];
      if (typeof value === 'string') req.query[key] = cleanString(value);
      // Повторённый параметр приходит массивом и ломает ожидания контроллера.
      if (Array.isArray(value)) req.query[key] = cleanString(String(value[0] ?? ''));
    }
  }
  next();
}

module.exports = {
  assertSecrets,
  helmetOptions,
  enforceHttps,
  jsonReviver,
  sanitizeRequest,
  cleanString
};
