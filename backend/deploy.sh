#!/bin/bash

set -e

echo "Начало деплоя..."

# Обновление кода (uploads не трогаем — там пользовательские файлы)
echo "Обновление кода из репозитория..."
git fetch origin
git reset --hard origin/main
git clean -fd -e 'uploads'

# Mongo keyfile должен быть закрыт по правам, иначе mongod не стартует
if [ -f "./docker/mongo-keyfile" ]; then
  chmod 400 "./docker/mongo-keyfile"
fi

# Backend: либо образ из реестра (CI), либо локальная сборка на сервере
if [ -n "${BACKEND_IMAGE:-}" ]; then
  echo "Обновление образа из реестра: ${BACKEND_IMAGE}"
  docker compose pull backend
  docker compose up -d backend
else
  echo "Пересборка контейнера приложения на сервере..."
  docker compose up -d --build backend
fi

echo "Деплой завершен!"
echo "Проверка статуса контейнеров:"
docker compose ps

# Регламент бэкапов (TZ п.8): при первом деплое обязательно установите cron
echo ""
echo "Бэкапы: при первом деплое выполните: BACKUP_TIME=3 BACKUP_KEEP_DAYS=7 ./scripts/install-backup-cron.sh"
echo "Инструкция: docs/BACKUP.md (раздел «Первый деплой»)"

echo ""
echo "Логи приложения:"
docker compose logs -f backend
