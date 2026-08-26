const fs = require('fs');
const path = require('path');
const { Pool: PostgresPool } = require('pg');
const { newDb, DataType } = require('pg-mem');
const { v4: uuidv4 } = require('uuid');
const dbConfig = require('../config/database');
const logger = require('../utils/logger');
const { ensureAdmin, generatePassword } = require('./admin');

class Database {
  constructor() {
    this.isMemory = process.env.DB_DRIVER === 'memory';
    this.initialized = false;

    if (this.isMemory) {
      const memoryDb = newDb({ autoCreateForeignKeyIndices: true });
      memoryDb.public.registerFunction({
        name: 'gen_random_uuid',
        returns: DataType.uuid,
        implementation: uuidv4,
        impure: true
      });
      const adapter = memoryDb.adapters.createPg();
      this.pool = new adapter.Pool();
    } else {
      this.pool = new PostgresPool(dbConfig);
    }

    this.pool.on('error', (error) => {
      logger.error('Unexpected database error:', error);
    });
  }

  async initialize() {
    if (this.initialized) return;

    if (this.isMemory || process.env.DB_AUTO_MIGRATE === 'true') {
      const schemaPath = path.join(__dirname, 'schema.sql');
      await this.pool.query(fs.readFileSync(schemaPath, 'utf8'));
    }

    if (this.isMemory) {
      await this.seedMemoryDatabase();
    }

    this.initialized = true;
  }

  // Наполнение базы в памяти: только справочник направлений и одна учётная
  // запись администратора. Ни демонстрационных пользователей, ни готовых
  // заказов здесь нет — площадка стартует пустой.
  async seedMemoryDatabase() {
    await this.insertCategories();

    // Когда администратора заводят отдельной командой, автосоздание при
    // инициализации только мешает и печатает лишний пароль.
    if (process.env.SID_SKIP_STARTUP_ADMIN === 'true') return;

    const email = process.env.ADMIN_EMAIL;
    if (!email) {
      logger.warn(
        'ADMIN_EMAIL не задан — администратор не создан. ' +
        'Создайте его командой: npm run create-admin -- --email you@example.com'
      );
      return;
    }

    // Пароль берётся из настроек, а если его нет — генерируется на этот запуск
    // и выводится в журнал. База в памяти всё равно живёт до перезапуска.
    const password = process.env.ADMIN_PASSWORD || generatePassword();
    const generated = !process.env.ADMIN_PASSWORD;

    try {
      await ensureAdmin(this, {
        email,
        password,
        fullName: process.env.ADMIN_NAME || 'Администратор'
      });

      if (generated) {
        // Пароль печатаем прямо в консоль, а не через logger: тот пишет
        // ещё и в файл, а пароль в открытом виде в журнале оставаться не должен.
        logger.warn(`Администратор ${email} создан с временным паролем на этот запуск`);
        console.log('');
        console.log(`  Вход администратора: ${email}`);
        console.log(`  Временный пароль:    ${password}`);
        console.log('  Действует до перезапуска. Чтобы задать постоянный, укажите ADMIN_PASSWORD в .env');
        console.log('');
      } else {
        logger.info(`Администратор ${email} создан из настроек окружения`);
      }
    } catch (error) {
      logger.error('Не удалось создать администратора при старте:', { error: error.message });
    }
  }

  // Направления работы — справочные данные, а не тестовые: без них
  // невозможно оформить ни один заказ.
  async insertCategories() {
    const categories = [
      ['development', 'Разработка', 'code', 'Сайты, приложения, доработки и автоматизация'],
      ['design', 'Дизайн', 'palette', 'Интерфейсы, графика и фирменный стиль'],
      ['tech', 'Техническая поддержка', 'headset', 'Сопровождение, ошибки, доступы и обслуживание'],
      ['analytics', 'Аналитика', 'chart-line', 'Отчёты, метрики и исследования'],
      ['marketing', 'Маркетинг', 'bullhorn', 'Продвижение, контент и рекламные кампании'],
      ['other', 'Другое', 'layer-group', 'Задачи вне основных направлений']
    ];

    for (const [slug, name, icon, description] of categories) {
      await this.query(
        `INSERT INTO categories (id, slug, name, icon, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), slug, name, icon, description]
      );
    }

    return categories.length;
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      logger.debug('Executed query', {
        duration: Date.now() - start,
        rows: result.rowCount
      });
      return result;
    } catch (error) {
      logger.error('Database query error:', { text, error: error.message });
      throw error;
    }
  }

  async getClient() {
    return this.pool.connect();
  }

  async end() {
    await this.pool.end();
  }

  async healthCheck() {
    try {
      const result = await this.query('SELECT NOW() AS now');
      return {
        status: 'healthy',
        driver: this.isMemory ? 'memory-postgres' : 'postgres',
        timestamp: result.rows[0].now
      };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

module.exports = new Database();
