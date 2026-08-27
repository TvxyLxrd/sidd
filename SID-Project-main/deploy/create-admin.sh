#!/usr/bin/env bash
#
# Создание администратора из веб-консоли.
#
#   bash create-admin.sh ИМЯ ДОМЕН-ПОЧТЫ
#   bash create-admin.sh ivanov example.ru      -> ivanov@example.ru
#
# Адрес собирается из двух частей потому, что консоль VNC искажает символ @
# при наборе с клавиатуры — набрать почту целиком в ней невозможно.

set -euo pipefail

LOCAL_PART="${1:-}"
MAIL_DOMAIN="${2:-}"
BACKEND="/home/sid/app/SID-Project-main/backend"

if [[ -z "${LOCAL_PART}" || -z "${MAIL_DOMAIN}" ]]; then
  echo "Укажите две части адреса: bash create-admin.sh ivanov example.ru"
  exit 1
fi

EMAIL="${LOCAL_PART}@${MAIL_DOMAIN}"

echo "Создаю администратора: ${EMAIL}"
echo ""

cd "${BACKEND}"
npm run create-admin -- --email "${EMAIL}"
