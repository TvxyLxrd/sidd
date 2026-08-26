require('dotenv').config();
const db = require('./db');

// Наполнение справочников. Учётные записи здесь не создаются:
// администратор заводится отдельной командой npm run create-admin,
// чтобы пароль не появлялся в базе как побочный эффект развёртывания.

async function seedDatabase() {
  await db.initialize();

  const existing = await db.query('SELECT COUNT(*)::int AS count FROM categories');
  if (existing.rows[0].count > 0) {
    console.log('Справочник направлений уже заполнен, повторное наполнение пропущено.');
    return;
  }

  const inserted = await db.insertCategories();
  console.log(`Добавлено направлений работы: ${inserted}.`);
  console.log('');
  console.log('Следующий шаг — создать администратора:');
  console.log('  npm run create-admin -- --email you@example.com');
}

seedDatabase()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.end());
