/**
 * Скрипт подготовки данных для ручного интеграционного теста GET /api/videos/feed.
 * Запуск: mongosh "mongodb://..." --file scripts/feed-integration-test-data.js
 * Или: mongosh "mongodb://..." < scripts/feed-integration-test-data.js
 */
const db = db.getSiblingDB('qasiet');

// Пароль: TestPass1 (bcrypt 10 rounds)
const PASSWORD_HASH = '$2a$10$z8Bbmz5EHMQl5kBPrtqcNOu6Rb6DBSTXoQt6fwwp66DjvGsgFAr9O';

// Удаляем старые тестовые данные (по email)
db.users.deleteMany({
  email: { $in: ['test-no-sub@qasiet.kz', 'test-with-sub@qasiet.kz'] }
});

const now = new Date();
const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const endDate = new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000);

// Пользователь БЕЗ подписки
const userNoSub = db.users.insertOne({
  email: 'test-no-sub@qasiet.kz',
  password: PASSWORD_HASH,
  fullName: 'Test NoSub',
  isEmailConfirmed: true,
  role: 'user',
  clientType: 'B2C',
  isActive: true,
  isBlocked: false,
  isDisabled: false,
  isDeleted: false,
  registrationDate: now,
});
const userIdNoSub = userNoSub.insertedId;

// Пользователь С активной подпиской
const userWithSub = db.users.insertOne({
  email: 'test-with-sub@qasiet.kz',
  password: PASSWORD_HASH,
  fullName: 'Test WithSub',
  isEmailConfirmed: true,
  role: 'user',
  clientType: 'B2C',
  isActive: true,
  isBlocked: false,
  isDisabled: false,
  isDeleted: false,
  registrationDate: now,
});
const userIdWithSub = userWithSub.insertedId;

// Подписка только для второго пользователя (активна)
db.subscriptions.insertOne({
  userId: userIdWithSub,
  startDate: startDate,
  endDate: endDate,
  status: 'active',
  amount: 2990,
  tariffCode: 'individual_1m',
  subscriptionType: 'individual',
  activatedAt: now,
});

// Видео для ленты (preview/free, active)
const videoIds = [];
for (let i = 1; i <= 5; i++) {
  const r = db.videos.insertOne({
    titleRu: 'Тест превью ' + i,
    titleKz: 'Test preview ' + i,
    status: 'active',
    collectionId: i <= 3 ? 'preview' : 'free',
    publicationDate: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
    viewsCount: 10 + i,
    likesCount: i,
    hideCount: 0,
    tags: ['test'],
  });
  videoIds.push(r.insertedId);
}

print('OK: users (no-sub, with-sub) and subscription and videos created.');
print('userIdNoSub (ObjectId): ' + userIdNoSub);
print('userIdWithSub (ObjectId): ' + userIdWithSub);
print('Use emails: test-no-sub@qasiet.kz, test-with-sub@qasiet.kz, password: TestPass1');
