#!/bin/bash

# Скрипт для создания бекапа MongoDB и Redis из Docker контейнеров
# Использование: ./scripts/backup.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
# Проверяем обязательные параметры
if [ -z "${MONGO_USERNAME}" ] || [ -z "${MONGO_PASSWORD}" ] || [ -z "${MONGO_DATABASE}" ]; then
  echo -e "${RED}Ошибка: не заданы MONGO_USERNAME, MONGO_PASSWORD или MONGO_DATABASE${NC}"
  echo -e "${YELLOW}Добавьте в .env (см. .env.example)${NC}"
  exit 1
fi

# Директория для бекапов
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"

echo -e "${GREEN}Начинаем создание бекапа...${NC}"

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

# Создаем директорию для бекапов
mkdir -p "${BACKUP_PATH}"

# Бекап MongoDB
echo -e "${YELLOW}Создание бекапа MongoDB...${NC}"
docker exec "${MONGO_CONTAINER}" mongodump \
  --username="${MONGO_USERNAME}" \
  --password="${MONGO_PASSWORD}" \
  --authenticationDatabase=admin \
  --db="${MONGO_DATABASE}" \
  --out=/tmp/backup \
  --gzip

if [ $? -eq 0 ]; then
  docker cp "${MONGO_CONTAINER}:/tmp/backup/${MONGO_DATABASE}" "${BACKUP_PATH}/mongo"
  docker exec "${MONGO_CONTAINER}" rm -rf /tmp/backup
  echo -e "${GREEN}✓ Бекап MongoDB создан${NC}"
else
  echo -e "${RED}✗ Ошибка при создании бекапа MongoDB${NC}"
  exit 1
fi

# Бекап Redis (пропускаем, если пароль не задан)
if [ -n "${REDIS_PASSWORD}" ]; then
echo -e "${YELLOW}Создание бекапа Redis...${NC}"
docker exec "${REDIS_CONTAINER}" redis-cli -a "${REDIS_PASSWORD}" BGSAVE
sleep 2
docker cp "${REDIS_CONTAINER}:/data/dump.rdb" "${BACKUP_PATH}/redis.rdb" 2>/dev/null || {
  echo -e "${YELLOW}Redis dump.rdb не найден в /data, пропускаем Redis${NC}"
  rm -f "${BACKUP_PATH}/redis.rdb"
}

if [ -f "${BACKUP_PATH}/redis.rdb" ]; then
  echo -e "${GREEN}✓ Бекап Redis создан${NC}"
fi
else
  echo -e "${YELLOW}REDIS_PASSWORD не задан, пропускаем Redis${NC}"
fi

# Создаем архив
echo -e "${YELLOW}Создание архива...${NC}"
ARCHIVE_NAME="${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"
tar -czf "${ARCHIVE_NAME}" -C "${BACKUP_PATH}" .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Архив создан: ${ARCHIVE_NAME}${NC}"
  rm -rf "${BACKUP_PATH}"
  echo -e "${GREEN}✓ Временные файлы удалены${NC}"
else
  echo -e "${RED}✗ Ошибка при создании архива${NC}"
  exit 1
fi

# Показываем размер архива
ARCHIVE_SIZE=$(du -h "${ARCHIVE_NAME}" | cut -f1)
echo -e "${GREEN}Размер архива: ${ARCHIVE_SIZE}${NC}"

# Очистка старых бекапов (если включена)
KEEP_DAYS="${BACKUP_KEEP_DAYS:-7}"
if [ "${BACKUP_CLEANUP:-true}" = "true" ]; then
  echo -e "${YELLOW}Очистка бекапов старше ${KEEP_DAYS} дней...${NC}"
  DELETED=$(find "${BACKUP_DIR}" -name "backup_*.tar.gz" -type f -mtime +${KEEP_DAYS} -delete -print | wc -l | tr -d ' ')
  if [ "${DELETED}" -gt 0 ]; then
    echo -e "${GREEN}✓ Удалено старых бекапов: ${DELETED}${NC}"
  else
    echo -e "${GREEN}✓ Старые бекапы не найдены${NC}"
  fi
fi

# Показываем количество сохраненных бекапов
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "backup_*.tar.gz" -type f | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1 || echo "0")
echo -e "${GREEN}Всего бекапов сохранено: ${BACKUP_COUNT} (общий размер: ${TOTAL_SIZE})${NC}"

echo -e "${GREEN}Бекап успешно создан: ${ARCHIVE_NAME}${NC}"
