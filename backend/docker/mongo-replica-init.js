/**
 * Инициализация replica set для MongoDB.
 * Выполняется контейнером mongo-replica-init после старта mongo.
 * Идемпотентно: при уже инициализированном replica set — пропуск.
 */
const config = {
    _id: 'rs0',
    members: [{ _id: 0, host: 'mongo:27017' }],
};

try {
    const status = rs.status();
    if (status.ok === 1) {
        print('Replica set уже инициализирован.');
    }
} catch (e) {
    rs.initiate(config);
    print('Replica set инициализирован.');
}
