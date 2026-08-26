#!/bin/bash

echo "🚀 SID API Quick Start Script"
echo "=============================="
echo ""

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js 16+ и повторите попытку."
    exit 1
fi

echo "✅ Node.js: $(node --version)"

# Проверка PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL CLI не найден. Убедитесь, что PostgreSQL установлен."
else
    echo "✅ PostgreSQL установлен"
fi

# Проверка Redis
if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  Redis CLI не найден. Redis опционален, но рекомендуется для production."
else
    echo "✅ Redis установлен"
fi

echo ""
echo "📦 Установка зависимостей..."
npm install

if [ ! -f .env ]; then
    echo ""
    echo "📝 Создание .env файла..."
    cp .env.example .env
    echo "✅ Файл .env создан. Пожалуйста, отредактируйте его перед запуском!"
    echo ""
    echo "⚠️  ВАЖНО: Обновите следующие параметры в .env:"
    echo "   - DB_PASSWORD"
    echo "   - JWT_SECRET"
    echo "   - JWT_REFRESH_SECRET"
    echo "   - ADMIN_PASSWORD"
    echo ""
    read -p "Нажмите Enter когда отредактируете .env файл..."
fi

echo ""
echo "🗄️  Инициализация базы данных..."
echo "   Создайте БД вручную если ещё не создали:"
echo "   psql -U postgres"
echo "   CREATE DATABASE sid_main;"
echo "   CREATE DATABASE sid_test;"
echo ""
read -p "БД созданы? Нажмите Enter для продолжения..."

echo ""
echo "🔄 Запуск миграций..."
npm run migrate

if [ $? -eq 0 ]; then
    echo "✅ Миграции выполнены успешно"
else
    echo "❌ Ошибка выполнения миграций. Проверьте настройки БД в .env"
    exit 1
fi

echo ""
echo "🌱 Заполнение тестовыми данными..."
npm run seed

if [ $? -eq 0 ]; then
    echo "✅ Seed данные загружены"
else
    echo "❌ Ошибка загрузки seed данных"
    exit 1
fi

echo ""
echo "🎉 Установка завершена!"
echo ""
echo "📚 Следующие шаги:"
echo "   1. Создайте администратора: npm run create-admin -- --email you@domain.ru"
echo "   2. Запустите сервер: npm run dev"
echo "   3. Откройте приложение: http://localhost:3000"
echo ""
echo "   Учётных записей по умолчанию нет — пароль администратора"
echo "   печатается один раз при выполнении шага 1."
echo ""
echo "✨ Готово к работе!"
