#!/bin/bash

# Скрипт для восстановления из бекапа MongoDB и Redis в Docker контейнеры
# Использование: ./scripts/restore.sh <путь_к_архиву>

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ -z "$1" ]; then
  echo -e "${RED}Ошибка: укажите путь к архиву бекапа${NC}"
  echo "Использование: ./scripts/restore.sh <путь_к_архиву>"
  exit 1
fi

ARCHIVE_PATH="$1"

if [ ! -f "${ARCHIVE_PATH}" ]; then
  echo -e "${RED}Ошибка: файл ${ARCHIVE_PATH} не найден${NC}"
  exit 1
fi

# Пути проекта
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Подхватываем .env, если есть
if [ -f "${PROJECT_DIR}/.env" ]; then
  set -a
  . "${PROJECT_DIR}/.env"
  set +a
fi

# Имена контейнеров (из docker-compose.yml)
MONGO_CONTAINER="${MONGO_CONTAINER:-app_db}"
REDIS_CONTAINER="${REDIS_CONTAINER:-app_redis}"

# Переменные окружения (задайте в .env). Совместимость с DATABASE_* из .env.example
MONGO_USERNAME="${MONGO_USERNAME:-${DATABASE_USERNAME:-appuser}}"
MONGO_PASSWORD="${MONGO_PASSWORD:-${DATABASE_PASSWORD:-}}"
MONGO_DATABASE="${MONGO_DATABASE:-app}"
REDIS_PASSWORD="${REDIS_PASSWORD:-}"

# Проверяем обязательные параметры
if [ -z "${MONGO_USERNAME}" ] || [ -z "${MONGO_PASSWORD}" ] || [ -z "${MONGO_DATABASE}" ]; then
  echo -e "${RED}Ошибка: не заданы MONGO_USERNAME, MONGO_PASSWORD или MONGO_DATABASE${NC}"
  exit 1
fi


# Проверяем, что контейнеры запущены
if ! docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
  echo -e "${RED}Ошибка: контейнер MongoDB ${MONGO_CONTAINER} не запущен${NC}"
  echo -e "${YELLOW}Запустите: docker-compose up -d${NC}"
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${REDIS_CONTAINER}$"; then
  echo -e "${RED}Ошибка: контейнер Redis ${REDIS_CONTAINER} не запущен${NC}"
  echo -e "${YELLOW}Запустите: docker-compose up -d${NC}"
  exit 1
fi

# Временная директория для распаковки
TEMP_DIR=$(mktemp -d)
trap "rm -rf ${TEMP_DIR}" EXIT

echo -e "${YELLOW}Распаковка архива...${NC}"
tar -xzf "${ARCHIVE_PATH}" -C "${TEMP_DIR}"

# Восстановление MongoDB
if [ -d "${TEMP_DIR}/mongo" ]; then
  echo -e "${YELLOW}Восстановление MongoDB...${NC}"
  echo -e "${RED}ВНИМАНИЕ: Это удалит все данные в базе ${MONGO_DATABASE}!${NC}"
  read -p "Продолжить? (yes/no): " confirm

  if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Восстановление отменено${NC}"
    exit 0
  fi

  docker cp "${TEMP_DIR}/mongo" "${MONGO_CONTAINER}:/tmp/restore"

  docker exec "${MONGO_CONTAINER}" mongorestore \
    --username="${MONGO_USERNAME}" \
    --password="${MONGO_PASSWORD}" \
    --authenticationDatabase=admin \
    --db="${MONGO_DATABASE}" \
    --drop \
    --gzip \
    /tmp/restore

  docker exec "${MONGO_CONTAINER}" rm -rf /tmp/restore

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ MongoDB восстановлена${NC}"
  else
    echo -e "${RED}✗ Ошибка при восстановлении MongoDB${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}Бекап MongoDB не найден в архиве${NC}"
fi

# Восстановление Redis
if [ -f "${TEMP_DIR}/redis.rdb" ]; then
  echo -e "${YELLOW}Восстановление Redis...${NC}"
  echo -e "${RED}ВНИМАНИЕ: Это удалит все данные в Redis!${NC}"
  read -p "Продолжить? (yes/no): " confirm

  if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Восстановление отменено${NC}"
    exit 0
  fi

  echo -e "${YELLOW}Остановка Redis...${NC}"
  docker exec "${REDIS_CONTAINER}" redis-cli -a "${REDIS_PASSWORD}" SHUTDOWN NOSAVE 2>/dev/null || true
  sleep 2

  echo -e "${YELLOW}Копирование файла бекапа...${NC}"
  docker cp "${TEMP_DIR}/redis.rdb" "${REDIS_CONTAINER}:/data/dump.rdb"

  echo -e "${YELLOW}Перезапуск Redis...${NC}"
  docker restart "${REDIS_CONTAINER}"

  sleep 3

  if docker exec "${REDIS_CONTAINER}" redis-cli -a "${REDIS_PASSWORD}" ping 2>/dev/null | grep -q "PONG"; then
    echo -e "${GREEN}✓ Redis восстановлен и запущен${NC}"
  else
    echo -e "${RED}✗ Ошибка при восстановлении Redis${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}Бекап Redis не найден в архиве${NC}"
fi

echo -e "${GREEN}Восстановление завершено${NC}"
