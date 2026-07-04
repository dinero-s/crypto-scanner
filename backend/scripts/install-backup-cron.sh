#!/bin/bash

# Скрипт для установки cron задачи для автоматических бекапов
# Использование: ./scripts/install-backup-cron.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Получаем абсолютный путь к проекту
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_SCRIPT="${PROJECT_DIR}/scripts/backup.sh"
LOG_FILE="/var/log/app-backup.log"

echo -e "${GREEN}Установка cron задачи для автоматических бекапов${NC}"

# Проверяем, что скрипт бекапа существует
if [ ! -f "${BACKUP_SCRIPT}" ]; then
  echo -e "${RED}Ошибка: скрипт ${BACKUP_SCRIPT} не найден${NC}"
  exit 1
fi

# Проверяем, что скрипт исполняемый
if [ ! -x "${BACKUP_SCRIPT}" ]; then
  echo -e "${YELLOW}Делаем скрипт исполняемым...${NC}"
  chmod +x "${BACKUP_SCRIPT}"
fi

# Параметры (можно переопределить через переменные окружения)
BACKUP_TIME="${BACKUP_TIME:-3}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-7}"
BACKUP_FREQUENCY="${BACKUP_FREQUENCY:-daily}"

# Формируем cron строку в зависимости от частоты
case "${BACKUP_FREQUENCY}" in
  daily)
    CRON_SCHEDULE="0 ${BACKUP_TIME} * * *"
    DESCRIPTION="ежедневно в ${BACKUP_TIME}:00"
    ;;
  6h)
    CRON_SCHEDULE="0 */6 * * *"
    DESCRIPTION="каждые 6 часов"
    ;;
  12h)
    CRON_SCHEDULE="0 */12 * * *"
    DESCRIPTION="каждые 12 часов"
    ;;
  *)
    echo -e "${RED}Неизвестная частота: ${BACKUP_FREQUENCY}. Используйте: daily, 6h, 12h${NC}"
    exit 1
    ;;
esac

# Формируем команду cron
CRON_COMMAND="cd ${PROJECT_DIR} && BACKUP_KEEP_DAYS=${BACKUP_KEEP_DAYS} BACKUP_CLEANUP=true ./scripts/backup.sh >> ${LOG_FILE} 2>&1"

# Проверяем, есть ли уже такая задача
CRON_MARKER="# app-backup"
EXISTING_CRON=$(crontab -l 2>/dev/null | grep "${CRON_MARKER}" || true)

if [ -n "${EXISTING_CRON}" ]; then
  echo -e "${YELLOW}Найдена существующая cron задача для бекапов${NC}"
  read -p "Заменить существующую задачу? (yes/no): " confirm

  if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Установка отменена${NC}"
    exit 0
  fi

  (crontab -l 2>/dev/null | grep -v "${CRON_MARKER}" | grep -v "${BACKUP_SCRIPT}" || true) | crontab -
fi

# Добавляем новую задачу
(crontab -l 2>/dev/null || true; echo "${CRON_SCHEDULE} ${CRON_COMMAND} ${CRON_MARKER}") | crontab -

echo -e "${GREEN}✓ Cron задача установлена${NC}"
echo -e "${GREEN}  Расписание: ${DESCRIPTION}${NC}"
echo -e "${GREEN}  Хранение бекапов: ${BACKUP_KEEP_DAYS} дней${NC}"
echo -e "${GREEN}  Лог файл: ${LOG_FILE}${NC}"

# Создаем директорию для логов, если не существует
LOG_DIR=$(dirname "${LOG_FILE}")
if [ ! -d "${LOG_DIR}" ]; then
  echo -e "${YELLOW}Создание директории для логов: ${LOG_DIR}${NC}"
  sudo mkdir -p "${LOG_DIR}"
  sudo touch "${LOG_FILE}"
  sudo chmod 666 "${LOG_FILE}" 2>/dev/null || true
fi

echo -e "${YELLOW}Проверка установленной задачи:${NC}"
crontab -l | grep "${CRON_MARKER}"

echo -e "${GREEN}Готово! Бекапы будут создаваться автоматически.${NC}"
