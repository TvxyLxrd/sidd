require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const path = require('path');
const fs = require('fs');

const logger = require('./utils/logger');
const db = require('./database/db');
const { connectRedis } = require('./config/redis');
const { generalLimiter, slowDownProtection, suspiciousIPBlocker } = require('./middleware/rateLimiter');
const {
  assertSecrets,
  helmetOptions,
  enforceHttps,
  jsonReviver,
  sanitizeRequest
} = require('./config/security');

// Импорт роутов
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// За обратным прокси реальный адрес и протокол приходят в заголовках X-Forwarded-*.
// Без этого лимиты считались бы по адресу прокси, а редирект на https не сработал бы.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security middleware: строгий CSP, HSTS, запрет встраивания в чужие фреймы
app.use(helmet(helmetOptions()));
app.use(enforceHttps);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing. Лимит снижен до 1 МБ: ни один эндпоинт не принимает больше,
// а крупные тела — дешёвый способ нагрузить сервер.
app.use(express.json({ limit: '1mb', reviver: jsonReviver }));
app.use(express.urlencoded({ extended: false, limit: '1mb', parameterLimit: 100 }));

// Data sanitization
app.use(mongoSanitize());
app.use(hpp());
app.use(sanitizeRequest);

// Compression
app.use(compression());

// Rate limiting и защита от DDoS
app.use(suspiciousIPBlocker);
app.use(slowDownProtection);
app.use('/api', generalLimiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/api/v1/health', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: dbHealth
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'SID API Server',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    documentation: '/admin',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      requests: '/api/v1/requests'
    }
  });
});

// Каталог с файлами сайта. По умолчанию — корень репозитория, но на сервере
// раскладка каталогов другая, поэтому путь можно задать переменной WEB_ROOT.
const webRoot = process.env.WEB_ROOT
  ? path.resolve(process.env.WEB_ROOT)
  : path.resolve(__dirname, '../../..');

if (!fs.existsSync(path.join(webRoot, 'index.html'))) {
  logger.error(
    `Файлы сайта не найдены в ${webRoot}. Укажите правильный путь в переменной WEB_ROOT.`
  );
}
const webPages = new Set([
  'index.html',
  'login.html',
  'register.html',
  'dashboard.html',
  'requests.html',
  'new-request.html',
  'request-detail.html',
  'profile.html',
  'admin.html',
  'admin-dashboard.html',
  'admin-requests.html',
  'admin-users.html',
  'admin-services.html'
]);

app.use('/css', express.static(path.join(webRoot, 'css')));
app.use('/js', express.static(path.join(webRoot, 'js')));
app.get('/', (req, res) => res.sendFile(path.join(webRoot, 'index.html')));
app.get('/:page', (req, res, next) => {
  if (!webPages.has(req.params.page)) return next();
  return res.sendFile(path.join(webRoot, req.params.page));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await db.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await db.end();
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Проверка секретов до подключения к чему-либо: в production сервер
    // не должен подниматься на ключах из шаблона конфигурации.
    assertSecrets();

    await db.initialize();

    // Подключение к Redis
    await connectRedis();
    
    // Проверка подключения к БД
    const dbHealth = await db.healthCheck();
    if (dbHealth.status === 'healthy') {
      logger.info('Database connection established');
    } else {
      logger.error('Database connection failed');
      process.exit(1);
    }
    
    // Запуск сервера
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Web application: http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
