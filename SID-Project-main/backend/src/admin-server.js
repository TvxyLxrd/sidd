require('dotenv').config();
const express = require('express');
const path = require('path');
const basicAuth = require('express').basicAuth || ((username, password) => {
  return (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
      return res.status(401).send('Authentication required');
    }
    const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    if (credentials[0] === username && credentials[1] === password) {
      next();
    } else {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
      res.status(401).send('Invalid credentials');
    }
  };
});

const app = express();
const PORT = process.env.ADMIN_PANEL_PORT || 3001;

// Basic authentication
const { safeEqual } = require('./utils/crypto');

// Доступ к панели документации. Пароля по умолчанию нет: без него панель
// не поднимается, чтобы её нельзя было случайно опубликовать открытой.
const PANEL_USERNAME = process.env.ADMIN_PANEL_USERNAME || process.env.ADMIN_USERNAME || 'admin';
const PANEL_PASSWORD = process.env.ADMIN_PANEL_PASSWORD;

if (!PANEL_PASSWORD || PANEL_PASSWORD.length < 12) {
  console.error('ADMIN_PANEL_PASSWORD не задан или короче 12 символов — панель не запущена.');
  console.error('Сгенерировать: node -e "console.log(require(\'crypto\').randomBytes(18).toString(\'base64url\'))"');
  process.exit(1);
}

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const requestAuth = () => {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
    return res.status(401).send('Authentication required');
  };

  if (!authHeader || !authHeader.startsWith('Basic ')) return requestAuth();

  const decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
  const separator = decoded.indexOf(':');
  if (separator === -1) return requestAuth();

  const username = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);

  // Сравнение за постоянное время: побитовое И, чтобы не выходить раньше срока
  const usernameOk = safeEqual(username, PANEL_USERNAME);
  const passwordOk = safeEqual(password, PANEL_PASSWORD);

  if (usernameOk && passwordOk) return next();
  return requestAuth();
};

app.use(auth);
app.use(express.static(path.join(__dirname, '../admin-panel')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-panel/index.html'));
});

app.listen(PORT, () => {
  console.log(`Admin Panel running on http://localhost:${PORT}`);
  console.log(`Username: ${PANEL_USERNAME}`);
  console.log('Password: из ADMIN_PANEL_PASSWORD');
});
