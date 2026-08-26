#!/usr/bin/env bash
#
# Первичная настройка чистого сервера Ubuntu 22.04 под SID.
# Запускать от root на свежесозданной машине:
#   bash provision.sh вашдомен.ru
#
# Скрипт ставит Node.js, PostgreSQL, nginx и настраивает межсетевой экран.
# Приложение он не выкладывает — это отдельный шаг.

set -euo pipefail

DOMAIN="${1:-}"
APP_USER="sid"
APP_DIR="/home/${APP_USER}/app"
DB_NAME="sid_production"
DB_USER="sid_user"
NODE_MAJOR=22

if [[ -z "$DOMAIN" ]]; then
  echo "Укажите домен: bash provision.sh вашдомен.ru"
  exit 1
fi

if [[ $EUID -ne 0 ]]; then
  echo "Запускать нужно от root"
  exit 1
fi

echo "==> Обновление пакетов"
apt-get update -qq
apt-get upgrade -y -qq

echo "==> Базовые утилиты"
apt-get install -y -qq curl ca-certificates gnupg ufw rsync

echo "==> Node.js ${NODE_MAJOR}"
if ! command -v node >/dev/null 2>&1; then
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update -qq
  apt-get install -y -qq nodejs
fi
echo "    node $(node -v), npm $(npm -v)"

echo "==> PostgreSQL"
apt-get install -y -qq postgresql postgresql-contrib
systemctl enable --now postgresql

# Пароль базы генерируется здесь и попадает только в .env приложения
DB_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)"

sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -qc "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -qc "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
sudo -u postgres psql -qc "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

# Пароль базы кладём в файл, доступный только root: выкладка прочитает его
# оттуда, и его не придётся переносить руками через переписку.
umask 077
cat > /root/.sid-provision.env <<PROV
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DOMAIN=${DOMAIN}
PROV
chmod 600 /root/.sid-provision.env

echo "==> Пользователь приложения"
id -u "${APP_USER}" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "${APP_USER}"
mkdir -p "${APP_DIR}"
chown -R "${APP_USER}:${APP_USER}" "/home/${APP_USER}"

# Ключ доступа root копируем приложению, чтобы выкладывать файлы под ним
if [[ -f /root/.ssh/authorized_keys ]]; then
  mkdir -p "/home/${APP_USER}/.ssh"
  cp /root/.ssh/authorized_keys "/home/${APP_USER}/.ssh/authorized_keys"
  chmod 700 "/home/${APP_USER}/.ssh"
  chmod 600 "/home/${APP_USER}/.ssh/authorized_keys"
  chown -R "${APP_USER}:${APP_USER}" "/home/${APP_USER}/.ssh"
fi

echo "==> PM2"
npm install -g pm2 --silent
pm2 startup systemd -u "${APP_USER}" --hp "/home/${APP_USER}" >/dev/null

echo "==> nginx"
apt-get install -y -qq nginx

cat > "/etc/nginx/sites-available/sid" <<NGINX
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 2m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        # Без этого заголовка приложение зациклит редирект на https
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/sid /etc/nginx/sites-enabled/sid
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> Межсетевой экран"
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null

echo "==> Сертификат Let's Encrypt"
apt-get install -y -qq certbot python3-certbot-nginx
echo "    Запустите после того, как домен начнёт указывать на этот сервер:"
echo "    certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"

cat <<SUMMARY

=====================================================================
Сервер готов.

  Пользователь приложения : ${APP_USER}
  Каталог приложения      : ${APP_DIR}
  База данных             : ${DB_NAME}
  Пользователь базы       : ${DB_USER}
  Пароль базы             : ${DB_PASSWORD}

Пароль базы показан один раз — сохраните его, он понадобится для .env.

Дальше:
  1. Выложить файлы приложения в ${APP_DIR}
  2. Создать .env на основе .env.production.example
  3. npm ci --omit=dev && npm run migrate && npm run seed
  4. npm run create-admin -- --email you@domain.ru
  5. pm2 start src/server.js --name sid && pm2 save
  6. certbot --nginx -d ${DOMAIN}
=====================================================================
SUMMARY
