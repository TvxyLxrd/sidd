const rateLimit = require('express-rate-limit');
const { client: redisClient } = require('../config/redis');
const logger = require('../utils/logger');

// Store для rate limiting (использует Redis если доступен, иначе память)
class RateLimitStore {
  constructor() {
    this.useRedis = false;
    this.memoryStore = new Map();
  }

  async init() {
    try {
      if (redisClient.isOpen) {
        this.useRedis = true;
        logger.info('Rate limiter using Redis store');
      } else {
        logger.warn('Rate limiter using memory store (Redis unavailable)');
      }
    } catch (error) {
      logger.warn('Rate limiter falling back to memory store:', error.message);
    }
  }

  async increment(key) {
    if (this.useRedis) {
      try {
        const count = await redisClient.incr(key);
        if (count === 1) {
          await redisClient.expire(key, 900); // 15 minutes
        }
        return count;
      } catch (error) {
        logger.error('Redis increment error:', error);
        this.useRedis = false;
      }
    }
    
    // Fallback to memory
    const current = this.memoryStore.get(key) || { count: 0, resetTime: Date.now() + 900000 };
    if (Date.now() > current.resetTime) {
      current.count = 0;
      current.resetTime = Date.now() + 900000;
    }
    current.count++;
    this.memoryStore.set(key, current);
    return current.count;
  }

  async decrement(key) {
    if (this.useRedis) {
      try {
        return await redisClient.decr(key);
      } catch (error) {
        logger.error('Redis decrement error:', error);
      }
    }
    
    const current = this.memoryStore.get(key);
    if (current) {
      current.count = Math.max(0, current.count - 1);
      this.memoryStore.set(key, current);
    }
  }

  async resetKey(key) {
    if (this.useRedis) {
      try {
        await redisClient.del(key);
      } catch (error) {
        logger.error('Redis delete error:', error);
      }
    }
    this.memoryStore.delete(key);
  }
}

const store = new RateLimitStore();
store.init();

// Общий rate limiter для всех запросов
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  },
  skip: (req) => {
    // Пропускаем health check
    return req.path === '/api/v1/health';
  }
});

// Строгий rate limiter для авторизации (защита от brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX) || 5,
  message: {
    success: false,
    error: 'Too many login attempts, please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Не считаем успешные попытки
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body.email,
      path: req.path
    });
    res.status(429).json({
      success: false,
      error: 'Too many login attempts, please try again after 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

// Rate limiter для API endpoints (более строгий)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: {
    success: false,
    error: 'API rate limit exceeded, please slow down.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter для создания заявок
const createRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 заявок в час
  message: {
    success: false,
    error: 'Too many requests created, please try again later.',
    retryAfter: '1 hour'
  },
  keyGenerator: (req) => {
    return req.user?.id || req.ip; // Лимит по пользователю или IP
  }
});

// Rate limiter для загрузки файлов
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 загрузок в час
  message: {
    success: false,
    error: 'Upload limit exceeded, please try again later.',
    retryAfter: '1 hour'
  }
});

// Middleware для защиты от медленных атак (Slowloris)
const slowDownProtection = (req, res, next) => {
  const timeout = setTimeout(() => {
    logger.warn('Slow request timeout', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(408).json({
      success: false,
      error: 'Request timeout'
    });
  }, 30000); // 30 seconds timeout

  res.on('finish', () => clearTimeout(timeout));
  res.on('close', () => clearTimeout(timeout));
  
  next();
};

// Middleware для блокировки подозрительных IP
const suspiciousIPBlocker = async (req, res, next) => {
  const ip = req.ip;
  const blockKey = `blocked_ip:${ip}`;
  
  try {
    if (redisClient.isOpen) {
      const isBlocked = await redisClient.get(blockKey);
      if (isBlocked) {
        logger.warn('Blocked IP attempted access', { ip, path: req.path });
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }
  } catch (error) {
    logger.error('Error checking blocked IP:', error);
  }
  
  next();
};

// Функция для блокировки IP
const blockIP = async (ip, duration = 3600) => {
  try {
    if (redisClient.isOpen) {
      const blockKey = `blocked_ip:${ip}`;
      await redisClient.setEx(blockKey, duration, 'blocked');
      logger.info(`IP blocked for ${duration} seconds`, { ip });
    }
  } catch (error) {
    logger.error('Error blocking IP:', error);
  }
};

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter,
  createRequestLimiter,
  uploadLimiter,
  slowDownProtection,
  suspiciousIPBlocker,
  blockIP
};
