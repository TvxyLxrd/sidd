#!/usr/bin/env bash
#
# Прописывает домен в настройках приложения и перезапускает службу.
#
#   bash set-domain.sh work-sid.ru
#
# Нужен отдельным скриптом, потому что веб-консоль VNC искажает двоеточие
# при наборе — набрать адрес с https вручную в ней невозможно.

set -euo pipefail

DOMAIN="${1:-}"
BACKEND="/home/sid/app/SID-Project-main/backend"
ENV_FILE="${BACKEND}/.env"

if [[ -z "${DOMAIN}" ]]; then
  echo "Укажите домен: bash set-domain.sh work-sid.ru"
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Не найден ${ENV_FILE}"
  exit 1
fi

ORIGIN="https://${DOMAIN}"

# Заменяем строку целиком, сохраняя остальные настройки нетронутыми
if grep -q '^CORS_ORIGIN=' "${ENV_FILE}"; then
  sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=${ORIGIN}|" "${ENV_FILE}"
else
  echo "CORS_ORIGIN=${ORIGIN}" >> "${ENV_FILE}"
fi

chmod 600 "${ENV_FILE}"
chown sid:sid "${ENV_FILE}"

echo "CORS_ORIGIN установлен в ${ORIGIN}"

systemctl restart sid
sleep 4

if systemctl is-active --quiet sid; then
  echo "Служба перезапущена"
else
  echo "Служба не поднялась:"
  journalctl -u sid -n 20 --no-pager
  exit 1
fi

echo ""
echo "Проверка снаружи:"
bash "$(dirname "${BASH_SOURCE[0]}")/verify.sh" "${ORIGIN}" || true
