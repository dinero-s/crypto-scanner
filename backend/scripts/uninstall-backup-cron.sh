#!/bin/bash

# Скрипт для удаления cron задачи для автоматических бекапов
# Использование: ./scripts/uninstall-backup-cron.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CRON_MARKER="# app-backup"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_SCRIPT="${PROJECT_DIR}/scripts/backup.sh"

echo -e "${YELLOW}Удаление cron задачи для автоматических бекапов${NC}"

# Проверяем, есть ли задача
EXISTING_CRON=$(crontab -l 2>/dev/null | grep "${CRON_MARKER}" || true)

if [ -z "${EXISTING_CRON}" ]; then
  echo -e "${YELLOW}Cron задача для бекапов не найдена${NC}"
  exit 0
fi

# Показываем текущую задачу
echo -e "${YELLOW}Найдена задача:${NC}"
crontab -l | grep "${CRON_MARKER}"

read -p "Удалить эту задачу? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo -e "${YELLOW}Удаление отменено${NC}"
  exit 0
fi

# Удаляем задачу
(crontab -l 2>/dev/null | grep -v "${CRON_MARKER}" | grep -v "${BACKUP_SCRIPT}" || true) | crontab -

echo -e "${GREEN}✓ Cron задача удалена${NC}"
