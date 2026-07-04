#!/bin/bash
# Ожидание готовности MongoDB и инициализация replica set

set -e

MONGO_USER="${MONGO_INITDB_ROOT_USERNAME:-appuser}"
MONGO_PASS="${MONGO_INITDB_ROOT_PASSWORD:-CHANGE_ME}"
MONGO_URI="mongodb://${MONGO_USER}:${MONGO_PASS}@mongo:27017/admin"

echo "Ожидание готовности MongoDB..."
until mongosh "$MONGO_URI" --eval "db.adminCommand('ping')" 2>/dev/null; do
    sleep 1
done

echo "Инициализация replica set..."
mongosh "$MONGO_URI" --file /docker-mongo-replica-init.js

echo "Готово."
