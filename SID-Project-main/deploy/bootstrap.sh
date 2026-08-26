#!/usr/bin/env bash
#
# Полная публикация с нуля, целиком на стороне сервера.
# Запускается из веб-консоли, когда SSH недоступен.
#
#   bash bootstrap.sh [домен]
#
# Делает всё: настройка машины, база, секреты, схема, запуск, сертификат.
# Ничего не спрашивает и не требует передачи паролей.

set -euo pipefail

DOMAIN="${1:-}"
APP_USER="sid"
APP_DIR="/home/${APP_USER}/app"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${HERE}/../.." && pwd)"

if [[ $EUID -ne 0 ]]; then
  echo "Запускать нужно от root"
  exit 1
fi

say() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

# ------------------------------------------------------------- 1. настройка
if [[ -f /root/.sid-provision.env ]]; then
  say "Сервер уже настроен, пропускаю"
else
  say "Настройка сервера"
  bash "${HERE}/provision.sh" "${DOMAIN:-localhost}"
fi

# shellcheck disable=SC1091
source /root/.sid-provision.env

# ------------------------------------------------------------ 2. файлы
say "Размещение файлов приложения"
mkdir -p "${APP_DIR}"
# Копируем содержимое репозитория, кроме служебных каталогов
rsync -a --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude 'logs' \
  --exclude 'SID-Project-main/frontend' \
  "${REPO_ROOT}/" "${APP_DIR}/"
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

BACKEND="${APP_DIR}/SID-Project-main/backend"

# --------------------------------------------------------- 3. зависимости
say "Установка зависимостей"
cd "${BACKEND}"
sudo -u "${APP_USER}" npm ci --omit=dev --no-audit --no-fund 2>/dev/null \
  || sudo -u "${APP_USER}" npm install --omit=dev --no-audit --no-fund

# ------------------------------------------------------------ 4. окружение
if [[ -f "${BACKEND}/.env" ]]; then
  say "Файл .env уже существует — секреты сохраняю"
else
  say "Генерация секретов"
  SECRETS="$(node "${BACKEND}/src/utils/generate-secrets.js" \
    | grep -E '^(JWT_SECRET|JWT_REFRESH_SECRET|ENCRYPTION_KEY)=')"
  PANEL_PASSWORD="$(node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))")"
  ORIGIN="${DOMAIN:+https://${DOMAIN}}"

  umask 077
  {
    echo "NODE_ENV=production"
    echo "PORT=3000"
    echo "WEB_ROOT=${APP_DIR}"
    echo "DB_DRIVER=postgres"
    echo "DB_HOST=127.0.0.1"
    echo "DB_PORT=5432"
    echo "DB_NAME=${DB_NAME}"
    echo "DB_USER=${DB_USER}"
    echo "DB_PASSWORD=${DB_PASSWORD}"
    echo "DB_SSL=false"
    echo "${SECRETS}"
    echo "JWT_EXPIRES_IN=7d"
    echo "JWT_REFRESH_EXPIRES_IN=30d"
    echo "REDIS_DISABLED=true"
    echo "BCRYPT_ROUNDS=12"
    echo "CORS_ORIGIN=${ORIGIN:-http://localhost:3000}"
    echo "RATE_LIMIT_WINDOW_MS=900000"
    echo "RATE_LIMIT_MAX_REQUESTS=100"
    echo "RATE_LIMIT_LOGIN_MAX=5"
    echo "LOGIN_LOCK_MAX=5"
    echo "LOGIN_LOCK_WINDOW_MS=900000"
    echo "LOG_LEVEL=warn"
    echo "ADMIN_PANEL_USERNAME=admin"
    echo "ADMIN_PANEL_PASSWORD=${PANEL_PASSWORD}"
  } > "${BACKEND}/.env"
  chmod 600 "${BACKEND}/.env"
  chown "${APP_USER}:${APP_USER}" "${BACKEND}/.env"
  echo "    ключи созданы на сервере и никуда не передавались"
fi

# ---------------------------------------------------------------- 5. база
say "Схема и справочники"
sudo -u "${APP_USER}" npm run migrate --silent
sudo -u "${APP_USER}" npm run seed --silent

# --------------------------------------------------------------- 6. запуск
say "Запуск приложения"
if sudo -u "${APP_USER}" pm2 describe sid >/dev/null 2>&1; then
  sudo -u "${APP_USER}" pm2 restart sid --update-env
else
  sudo -u "${APP_USER}" pm2 start "${BACKEND}/src/server.js" --name sid --cwd "${BACKEND}"
fi
sudo -u "${APP_USER}" pm2 save >/dev/null
sleep 4

# --------------------------------------------------------- 7. сертификат
if [[ -n "${DOMAIN}" ]]; then
  say "Сертификат для ${DOMAIN}"
  certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" \
    --non-interactive --agree-tos --register-unsafely-without-email --redirect \
    || echo "    не удалось — проверьте, что домен указывает на этот сервер"
fi

# ------------------------------------------------------- 8. администратор
say "Создание администратора"
ADMIN_EMAIL_VALUE="${ADMIN_EMAIL:-admin@${DOMAIN:-localhost}}"
sudo -u "${APP_USER}" npm run create-admin -- --email "${ADMIN_EMAIL_VALUE}" || true

# ------------------------------------------------------------ 9. проверка
say "Проверка"
BASE="${DOMAIN:+https://${DOMAIN}}"
bash "${HERE}/verify.sh" "${BASE:-http://127.0.0.1:3000}" || true

cat <<DONE

=====================================================================
Публикация завершена.

  Приложение : ${BASE:-http://$(hostname -I | awk '{print $1}')}
  Состояние  : sudo -u ${APP_USER} pm2 status
  Журнал     : sudo -u ${APP_USER} pm2 logs sid

Пароль администратора показан выше — сохраните его сейчас.
=====================================================================
DONE
