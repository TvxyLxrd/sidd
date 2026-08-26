const crypto = require('crypto');

// Генератор секретов для боевой конфигурации.
// Сервер отказывается стартовать в production с ключами из шаблона,
// поэтому перед развёртыванием значения ниже нужно подставить в .env.

const secret = (bytes = 48) => crypto.randomBytes(bytes).toString('base64url');
const hexKey = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

console.log('');
console.log('# Скопируйте в .env боевого окружения');
console.log('# Каждый запуск даёт новые значения. Смена ключей разлогинит всех.');
console.log('');
console.log(`JWT_SECRET=${secret()}`);
console.log(`JWT_REFRESH_SECRET=${secret()}`);
console.log(`ENCRYPTION_KEY=${hexKey()}`);
console.log('');
console.log('# ВАЖНО: ENCRYPTION_KEY менять нельзя после первой записи данных —');
console.log('# зашифрованные телефоны и тексты заказов станут нечитаемыми.');
console.log('# Храните его резервную копию отдельно от базы.');
console.log('');
