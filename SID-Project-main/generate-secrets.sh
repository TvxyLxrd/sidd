#!/bin/bash

echo "🔐 Генерация Production Секретов для SID API"
echo "=============================================="
echo ""

# Генерация JWT секретов
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ADMIN_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo "✅ Секреты сгенерированы!"
echo ""
echo "📝 Скопируйте эти значения в ваш .env файл:"
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo ""
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo ""
echo "ADMIN_SECRET_KEY=$ADMIN_SECRET"
echo ""
echo "⚠️  ВАЖНО: Сохраните эти значения в безопасном месте!"
echo "⚠️  НЕ КОММИТЬТЕ их в Git!"
echo ""

# Генерация случайных паролей
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
REDIS_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)

echo "🔑 Рекомендуемые пароли (или создайте свои):"
echo ""
echo "DB_PASSWORD=$DB_PASSWORD"
echo "REDIS_PASSWORD=$REDIS_PASSWORD"
echo "ADMIN_PASSWORD=$ADMIN_PASSWORD"
echo ""
echo "=============================================="
echo "Готово! 🎉"
