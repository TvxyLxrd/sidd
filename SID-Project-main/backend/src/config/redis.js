require('dotenv').config();
const redis = require('redis');
const logger = require('../utils/logger');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      logger.error('Redis connection refused');
      return new Error('Redis server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      logger.error('Redis retry time exhausted');
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      logger.error('Redis max retry attempts reached');
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
};

const client = redis.createClient({
  socket: {
    host: redisConfig.host,
    port: redisConfig.port
  },
  password: redisConfig.password,
  database: redisConfig.db
});

client.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

client.on('connect', () => {
  logger.info('Redis Client Connected');
});

client.on('ready', () => {
  logger.info('Redis Client Ready');
});

// Подключение к Redis
const connectRedis = async () => {
  if (process.env.REDIS_DISABLED === 'true') {
    logger.info('Redis disabled for this environment');
    return;
  }

  try {
    await client.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Redis connection error:', error);
    // Не прерываем работу приложения, если Redis недоступен
    logger.warn('Application will continue without Redis caching');
  }
};

module.exports = { client, connectRedis };
