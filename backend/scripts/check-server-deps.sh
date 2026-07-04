#!/bin/bash
# Проверка зависимостей для деплоя Rivus Backend на Ubuntu.
# Запуск: bash scripts/check-server-deps.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check() {
  if command -v "$1" &>/dev/null; then
    local version
    version=$("$1" "$2" 2>/dev/null | head -n1 || true)
    echo -e "${GREEN}✓${NC} $1 установлен: ${version:-версия не показана}"
    return 0
  else
    echo -e "${RED}✗${NC} $1 не найден"
    return 1
  fi
}

missing=0

echo "=== Проверка зависимостей для Rivus Backend ==="
echo ""

echo "--- Обязательные ---"
check "node" "--version" || missing=1
check "npm" "--version" || missing=1
check "git" "--version" || missing=1

echo ""
echo "--- Для MongoDB и Redis (если не через Docker) ---"
if check "mongod" "--version" 2>/dev/null; then
  :
else
  echo -e "  ${YELLOW}MongoDB не установлен. Можно поднять через Docker (docker-compose).${NC}"
fi
if check "redis-server" "--version" 2>/dev/null; then
  :
else
  echo -e "  ${YELLOW}Redis не установлен. Можно поднять через Docker (docker-compose).${NC}"
fi

echo ""
echo "--- Docker (если MongoDB/Redis в контейнерах) ---"
if check "docker" "--version" 2>/dev/null; then
  :
else
  echo -e "  ${YELLOW}Docker не установлен. Нужен, если mongo/redis запускаются через docker-compose.${NC}"
fi
if command -v docker-compose &>/dev/null || docker compose version &>/dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Docker Compose доступен"
else
  echo -e "${YELLOW}Docker Compose не найден. Нужен для docker-compose up.${NC}"
fi

echo ""
if [ "$missing" -eq 1 ]; then
  echo -e "${RED}Не хватает обязательных программ. См. DEPLOY_DEPS.md для установки.${NC}"
  exit 1
fi

# Проверка версии Node (рекомендуется 18+)
node_version=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -n "$node_version" ] && [ "$node_version" -lt 18 ]; then
  echo -e "${YELLOW}Рекомендуется Node.js 18 или 20 LTS (сейчас: $(node -v)).${NC}"
fi

echo ""
echo -e "${GREEN}Проверка завершена.${NC}"
