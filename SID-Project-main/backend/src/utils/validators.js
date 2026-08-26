const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Postgres завершает запрос ошибкой на невалидном UUID, поэтому проверяем параметр заранее.
const isUuid = (value) => typeof value === 'string' && UUID_PATTERN.test(value);

module.exports = { isUuid };
