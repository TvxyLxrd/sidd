require('dotenv').config();

// Администратора заводим здесь и только здесь — автосоздание при
// инициализации базы для этой команды выключаем.
process.env.SID_SKIP_STARTUP_ADMIN = 'true';

const db = require('./db');
const { ensureAdmin, generatePassword, validatePassword } = require('./admin');

// Создание администратора отдельной командой:
//   npm run create-admin -- --email you@example.com
//   npm run create-admin -- --email you@example.com --password "..." --name "Имя"
// Без --password пароль генерируется и печатается один раз.

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const email = args.email || process.env.ADMIN_EMAIL;
  const fullName = args.name || process.env.ADMIN_NAME || 'Администратор';
  const phone = args.phone || process.env.ADMIN_PHONE || null;

  if (!email) {
    console.error('Не указан адрес. Пример: npm run create-admin -- --email you@example.com');
    process.exitCode = 1;
    return;
  }

  let password = args.password || process.env.ADMIN_PASSWORD;
  let generated = false;

  if (!password) {
    password = generatePassword();
    generated = true;
  } else {
    const problem = validatePassword(password);
    if (problem) {
      console.error(problem);
      process.exitCode = 1;
      return;
    }
  }

  await db.initialize();
  const result = await ensureAdmin(db, { email, password, fullName, phone });

  console.log('');
  console.log(result.created ? 'Администратор создан.' : 'Существующий пользователь повышен до администратора.');
  console.log(`  Адрес: ${result.email}`);

  if (generated) {
    console.log(`  Пароль: ${password}`);
    console.log('');
    console.log('  Пароль показан один раз и нигде не сохранён. Скопируйте его сейчас.');
  } else {
    console.log('  Пароль: задан из параметров запуска');
  }

  if (!result.created) {
    console.log('');
    console.log('  Все ранее выданные сессии этого пользователя отозваны.');
  }
  console.log('');
}

main()
  .catch((error) => {
    console.error('Не удалось создать администратора:', error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
