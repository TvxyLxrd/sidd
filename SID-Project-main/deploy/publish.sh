#!/usr/bin/env bash
#
# Публикация SID на сервер одной командой.
#
#   bash deploy/publish.sh root@159.194.213.251 вашдомен.ru
#   bash deploy/publish.sh root@159.194.213.251            # без домена, по IP
#
# Требует доступа по SSH-ключу. Пароли скрипт не спрашивает и не принимает.
# Секреты генерируются на сервере и сюда не возвращаются.

set -euo pipefail

SERVER="${1:-}"
DOMAIN="${2:-}"
APP_USER="sid"
APP_DIR="/home/sid/app"

if [[ -z "$SERVER" ]]; then
  echo "Укажите сервер: bash deploy/publish.sh root@IP [домен]"
  exit 1
fi

# Каталог репозитория — на уровень выше SID-Project-main
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${HERE}/../.." && pwd)"

SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new)

say() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

# ---------------------------------------------------------------- 1. доступ
say "Проверка доступа по ключу"
if ! ssh "${SSH_OPTS[@]}" "$SERVER" 'echo ok' >/dev/null 2>&1; then
  cat <<'HINT'
Не удалось подключиться по ключу.

Добавьте открытый ключ на сервер через веб-консоль в панели Beget:

  mkdir -p ~/.ssh && chmod 700 ~/.ssh \
    && echo 'ВАШ_ОТКРЫТЫЙ_КЛЮЧ' >> ~/.ssh/authorized_keys \
    && chmod 600 ~/.ssh/authorized_keys

Открытый ключ лежит в ~/.ssh/id_ed25519.pub
HINT
  exit 1
fi
echo "    подключение работает"

# ------------------------------------------------------------- 2. настройка
say "Настройка сервера"
if ssh "${SSH_OPTS[@]}" "$SERVER" 'test -f /root/.sid-provision.env' 2>/dev/null; then
  echo "    сервер уже настроен, пропускаю"
else
  scp "${SSH_OPTS[@]}" "${HERE}/provision.sh" "${SERVER}:/root/provision.sh" >/dev/null
  ssh "${SSH_OPTS[@]}" "$SERVER" "bash /root/provision.sh '${DOMAIN:-localhost}'"
fi

# ---------------------------------------------------------------- 3. сборка
say "Сборка пакета"
BUNDLE="$(mktemp -d)/sid.tar.gz"
tar -czf "$BUNDLE" -C "$ROOT" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='logs' \
  --exclude='.env' \
  --exclude='SID-Project-main/frontend' \
  index.html login.html register.html dashboard.html requests.html \
  new-request.html request-detail.html profile.html admin.html \
  admin-dashboard.html admin-requests.html admin-users.html admin-services.html \
  css js SID-Project-main/backend SID-Project-main/deploy
echo "    размер: $(du -h "$BUNDLE" | cut -f1)"

# -------------------------------------------------------------- 4. загрузка
say "Загрузка на сервер"
ssh "${SSH_OPTS[@]}" "$SERVER" "mkdir -p ${APP_DIR} && rm -rf ${APP_DIR}/SID-Project-main/backend/src"
scp "${SSH_OPTS[@]}" "$BUNDLE" "${SERVER}:/tmp/sid.tar.gz" >/dev/null
ssh "${SSH_OPTS[@]}" "$SERVER" "tar -xzf /tmp/sid.tar.gz -C ${APP_DIR} && rm -f /tmp/sid.tar.gz && chown -R ${APP_USER}:${APP_USER} ${APP_DIR}"
rm -rf "$(dirname "$BUNDLE")"
echo "    файлы на месте"

# ------------------------------------------------------------ 5. окружение
say "Настройка окружения"
ssh "${SSH_OPTS[@]}" "$SERVER" DOMAIN="${DOMAIN}" APP_DIR="${APP_DIR}" 'bash -s' <<'REMOTE'
set -euo pipefail
source /root/.sid-provision.env
BACKEND="${APP_DIR}/SID-Project-main/backend"
cd "$BACKEND"

if [[ -f .env ]]; then
  echo "    .env уже существует, секреты сохранены"
else
  npm ci --omit=dev --silent >/dev/null 2>&1 || npm install --omit=dev --silent >/dev/null 2>&1
  SECRETS="$(node src/utils/generate-secrets.js | grep -E '^(JWT_SECRET|JWT_REFRESH_SECRET|ENCRYPTION_KEY)=')"
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
    echo "$SECRETS"
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
  } > .env
  chmod 600 .env
  chown sid:sid .env
  echo "    .env создан, секреты сгенерированы на сервере"
fi

npm ci --omit=dev --silent >/dev/null 2>&1 || npm install --omit=dev --silent >/dev/null 2>&1
npm run migrate --silent
npm run seed --silent
REMOTE

# ---------------------------------------------------------------- 6. запуск
say "Запуск приложения"
ssh "${SSH_OPTS[@]}" "$SERVER" APP_DIR="${APP_DIR}" 'bash -s' <<'REMOTE'
set -euo pipefail
BACKEND="${APP_DIR}/SID-Project-main/backend"
cd "$BACKEND"
if sudo -u sid pm2 describe sid >/dev/null 2>&1; then
  sudo -u sid pm2 restart sid --update-env
else
  sudo -u sid pm2 start src/server.js --name sid --cwd "$BACKEND"
fi
sudo -u sid pm2 save >/dev/null
sleep 3
sudo -u sid pm2 status sid | tail -n 4
REMOTE

# ------------------------------------------------------------ 7. сертификат
if [[ -n "$DOMAIN" ]]; then
  say "Сертификат для ${DOMAIN}"
  ssh "${SSH_OPTS[@]}" "$SERVER" "certbot --nginx -d '${DOMAIN}' -d 'www.${DOMAIN}' --non-interactive --agree-tos --register-unsafely-without-email --redirect" \
    || echo "    не удалось выпустить сертификат — проверьте, что домен указывает на этот сервер"
fi

# -------------------------------------------------------------- 8. проверка
say "Проверка"
BASE="${DOMAIN:+https://${DOMAIN}}"
bash "${HERE}/verify.sh" "${BASE:-http://${SERVER#*@}}" || true

cat <<DONE

=====================================================================
Осталось создать администратора — пароль будет показан один раз:

  ssh ${SERVER} "cd ${APP_DIR}/SID-Project-main/backend && sudo -u sid npm run create-admin -- --email you@domain.ru"

=====================================================================
DONE
