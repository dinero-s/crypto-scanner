/**
 * Инициализация БД при первом запуске MongoDB.
 */
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'app');
print(`Database ${db.getName()} ready.`);
