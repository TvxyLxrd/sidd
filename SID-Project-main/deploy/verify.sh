#!/usr/bin/env bash
#
# Проверка развёрнутого сервиса снаружи.
#   bash verify.sh https://вашдомен.ru
#
# Проверяет то, что чаще всего ломается при первом выкате.

set -uo pipefail

BASE="${1:-}"
if [[ -z "$BASE" ]]; then
  echo "Укажите адрес: bash verify.sh https://вашдомен.ru"
  exit 1
fi

HOST="${BASE#https://}"
HOST="${HOST#http://}"
HOST="${HOST%%/*}"

pass=0
fail=0

check() {
  local name="$1" ok="$2" detail="${3:-}"
  if [[ "$ok" == "1" ]]; then
    pass=$((pass + 1))
    printf '  OK   %s\n' "$name"
  else
    fail=$((fail + 1))
    printf '  СБОЙ %s%s\n' "$name" "${detail:+ -> $detail}"
  fi
}

echo ""
echo "== доступность =="

health="$(curl -fsS --max-time 10 "${BASE}/api/v1/health" 2>/dev/null || echo '')"
check "сервис отвечает" "$([[ -n "$health" ]] && echo 1 || echo 0)"
check "состояние healthy" "$(grep -q '"status":"healthy"' <<<"$health" && echo 1 || echo 0)" "$health"
check "база postgres, а не в памяти" \
  "$(grep -q '"driver":"postgres"' <<<"$health" && echo 1 || echo 0)" \
  "$(grep -o '"driver":"[^"]*"' <<<"$health")"

echo ""
echo "== перенаправление на https =="

redirect="$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' --max-time 10 "http://${HOST}/" 2>/dev/null || echo '')"
code="${redirect%% *}"
target="${redirect#* }"
check "http отвечает перенаправлением" "$([[ "$code" =~ ^30[178]$ ]] && echo 1 || echo 0)" "$redirect"
check "ведёт на https, а не по кругу" "$([[ "$target" == https://* ]] && echo 1 || echo 0)" "$target"

hops="$(curl -s -o /dev/null -w '%{num_redirects}' -L --max-redirs 5 --max-time 15 "http://${HOST}/" 2>/dev/null || echo 9)"
check "нет петли перенаправлений" "$([[ "$hops" -le 2 ]] && echo 1 || echo 0)" "переходов: ${hops}"

echo ""
echo "== заголовки безопасности =="

headers="$(curl -sI --max-time 10 "${BASE}/login.html" 2>/dev/null || echo '')"
lower="$(tr '[:upper:]' '[:lower:]' <<<"$headers")"

check "Content-Security-Policy" "$(grep -q 'content-security-policy' <<<"$lower" && echo 1 || echo 0)"
check "скрипты только со своего домена" "$(grep -q "script-src 'self'" <<<"$headers" && echo 1 || echo 0)"
check "Strict-Transport-Security" "$(grep -q 'strict-transport-security' <<<"$lower" && echo 1 || echo 0)"
check "X-Frame-Options: DENY" "$(grep -qi 'x-frame-options: deny' <<<"$headers" && echo 1 || echo 0)"
check "X-Content-Type-Options: nosniff" "$(grep -qi 'x-content-type-options: nosniff' <<<"$headers" && echo 1 || echo 0)"
check "версия сервера не раскрыта" "$(grep -qi 'x-powered-by' <<<"$lower" && echo 0 || echo 1)"

echo ""
echo "== служебные файлы не отдаются =="

for path in "/.env" "/package.json" "/src/server.js" "/backend/.env"; do
  status="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${BASE}${path}" 2>/dev/null || echo 000)"
  check "${path} -> ${status}" "$([[ "$status" == "404" ]] && echo 1 || echo 0)"
done

echo ""
echo "== страницы сайта =="

for page in "/" "/login.html" "/register.html" "/css/style.css" "/js/app.js"; do
  status="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${BASE}${page}" 2>/dev/null || echo 000)"
  check "${page} -> ${status}" "$([[ "$status" == "200" ]] && echo 1 || echo 0)"
done

echo ""
echo "== учётные записи по умолчанию =="

for creds in 'admin@sid.com:admin123' 'john.doe@example.com:user123'; do
  email="${creds%%:*}"
  password="${creds##*:}"
  status="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 \
    -X POST "${BASE}/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${email}\",\"password\":\"${password}\"}" 2>/dev/null || echo 000)"
  check "${email} не пускает" "$([[ "$status" == "401" ]] && echo 1 || echo 0)" "код ${status}"
done

echo ""
echo "=== ИТОГО: ${pass} прошло, ${fail} упало ==="
[[ "$fail" -eq 0 ]] || exit 1
