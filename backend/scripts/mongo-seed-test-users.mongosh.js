/**
 * Тестовые пользователи B2C (коллекция users).
 * Пароль для всех: Test123456!
 *
 * Запуск (URI без коммита в репозиторий):
 *   mongosh "$MONGO_URI" scripts/mongo-seed-test-users.mongosh.js
 *
 * Или:
 *   mongosh "mongodb://USER:PASS@host:port/qasiet?..." scripts/mongo-seed-test-users.mongosh.js
 */

const bcryptHash =
    '$2a$10$/WvtAjr4keCY.jwQA27IPO86NUKoEcH8y7C24fNSTRKXra2CH7Q5W';
const now = new Date();

const emails = [
    'test-seed-1@qasiet.local',
    'test-seed-2@qasiet.local',
    'test-seed-3@qasiet.local',
];

db.users.deleteMany({ email: { $in: emails } });

const docs = [
    {
        email: emails[0],
        phone: '+77000009001',
        password: bcryptHash,
        fullName: 'Тест Сид 1',
        city: '',
        clientType: 'B2C',
        role: 'user',
        isActive: true,
        isEmailConfirmed: true,
        isBlocked: false,
        isDisabled: false,
        isDeleted: false,
        registrationDate: now,
        createdAt: now,
        updatedAt: now,
        pushNotificationsEnabled: true,
        emailNewsletterEnabled: true,
        notificationSoundEnabled: true,
        ordersCount: 0,
        totalOrdersAmount: 0,
        averageOrderAmount: 0,
        loginCount: 0,
    },
    {
        email: emails[1],
        phone: '+77000009002',
        password: bcryptHash,
        fullName: 'Тест Сид 2',
        city: '',
        clientType: 'B2C',
        role: 'user',
        isActive: true,
        isEmailConfirmed: true,
        isBlocked: false,
        isDisabled: false,
        isDeleted: false,
        registrationDate: now,
        createdAt: now,
        updatedAt: now,
        pushNotificationsEnabled: true,
        emailNewsletterEnabled: true,
        notificationSoundEnabled: true,
        ordersCount: 0,
        totalOrdersAmount: 0,
        averageOrderAmount: 0,
        loginCount: 0,
    },
    {
        email: emails[2],
        phone: '+77000009003',
        password: bcryptHash,
        fullName: 'Тест Сид 3',
        city: '',
        clientType: 'B2C',
        role: 'user',
        isActive: true,
        isEmailConfirmed: true,
        isBlocked: false,
        isDisabled: false,
        isDeleted: false,
        registrationDate: now,
        createdAt: now,
        updatedAt: now,
        pushNotificationsEnabled: true,
        emailNewsletterEnabled: true,
        notificationSoundEnabled: true,
        ordersCount: 0,
        totalOrdersAmount: 0,
        averageOrderAmount: 0,
        loginCount: 0,
    },
];

const r = db.users.insertMany(docs);
print('Вставлено пользователей:', Object.keys(r.insertedIds).length);
print('Email:', emails.join(', '));
print('Пароль (все): Test123456!');
