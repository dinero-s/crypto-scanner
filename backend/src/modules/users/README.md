# Модуль пользователей (Users Module)

## Обзор

Модуль управления пользователями с аутентификацией по номеру телефона и паролю, подтверждением через SMS и email, восстановлением пароля и управлением профилем.

## Основные изменения

### Что удалено
- ❌ Реферальная система (referralCode)
- ❌ Поле `birthDate` (дата рождения)
- ❌ Поле `gender` (гендер)
- ❌ Поле `photo` (фотография)
- ❌ Поля `push_id`, `push_token` (push токены)
- ❌ Поле `oneSignalPlayerId` (OneSignal интеграция)
- ❌ Поле `isCardActive` (статус карты)
- ❌ Поля `name`, `lastName` (заменены на `fullName`)

### Что добавлено
- ✅ Поле `password` (хэшированный пароль)
- ✅ Поле `fullName` (ФИО пользователя)
- ✅ Поле `city` (город)
- ✅ Поле `email` (обязательный, с подтверждением)
- ✅ Поле `company` (необязательное)
- ✅ Поле `clientType` (B2C по умолчанию, может быть B2B)
- ✅ Поле `isEmailConfirmed` (статус подтверждения email)
- ✅ Коды для подтверждения: `phoneConfirmationCode`, `passwordResetCode`, `emailConfirmationCode`
- ✅ Роуты для восстановления пароля через email
- ✅ Роуты для подтверждения email
- ✅ TODO комментарии для будущих фич (история покупок, статистика заказов)

## Структура Entity

```typescript
{
  phone: string;                    // Телефон (обязательный, уникальный)
  password: string;                 // Хэшированный пароль
  fullName: string;                 // ФИО (обязательный)
  city: string;                     // Город (обязательный)
  email: string;                    // Email (обязательный)
  company?: string;                 // Компания (необязательный)
  clientType: 'B2C' | 'B2B';       // Тип клиента (по умолчанию B2C)
  isActive: boolean;                // Активен ли пользователь
  isEmailConfirmed: boolean;        // Подтвержден ли email
  isBlocked: boolean;               // Заблокирован ли
  isDeleted: boolean;               // Удален ли
  registrationDate: Date;           // Дата регистрации
  lastCodeSentAt: Date;             // Последняя отправка кода
  
  // Коды подтверждения (временные)
  phoneConfirmationCode?: string;
  passwordResetCode?: string;
  emailConfirmationCode?: string;
}
```

## API Endpoints

### Публичные роуты (User/Mobile)

#### 1. Регистрация
```
POST /mobile/users/register
```

**Тело запроса:**
```json
{
  "phone": "77012345678",
  "password": "SecurePassword123",
  "fullName": "Иванов Иван Иванович",
  "city": "Алматы",
  "email": "user@example.com",
  "company": "ТОО Компания",        // необязательно
  "clientType": "B2C"               // необязательно, по умолчанию B2C
}
```

**Ответ:**
```json
{
  "message": "Код подтверждения выслан на телефон"
}
```

**Логика:**
1. Проверяет уникальность телефона и email
2. Хэширует пароль
3. Генерирует 6-значный код для подтверждения телефона
4. Отправляет SMS с кодом
5. Сохраняет пользователя в БД

---

#### 2. Подтверждение телефона
```
POST /mobile/users/confirm-phone
```

**Тело запроса:**
```json
{
  "phone": "77012345678",
  "code": "123456"
}
```

**Ответ:**
```json
{
  "token": "jwt_token",
  "refresh_token": "jwt_refresh_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "fullName": "Иванов Иван Иванович",
    "phone": "77012345678",
    "city": "Алматы",
    "company": "ТОО Компания",
    "clientType": "B2C",
    "isEmailConfirmed": false
  },
  "message": "Телефон подтвержден. Код подтверждения email отправлен на почту."
}
```

**Логика:**
1. Проверяет код подтверждения телефона
2. Генерирует JWT токены
3. Генерирует код для подтверждения email
4. Отправляет email с кодом
5. Возвращает токены и информацию о пользователе

---

#### 3. Подтверждение email
```
POST /mobile/users/confirm-email
```

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Ответ:**
```json
{
  "message": "Email успешно подтвержден"
}
```

---

#### 4. Повторная отправка кода на email
```
POST /mobile/users/resend-email-confirmation
```

**Тело запроса:**
```json
{
  "email": "user@example.com"
}
```

**Ответ:**
```json
{
  "message": "Код подтверждения отправлен на email"
}
```

---

#### 5. Авторизация
```
POST /mobile/users/login
```

**Тело запроса:**
```json
{
  "phone": "77012345678",
  "password": "SecurePassword123"
}
```

**Ответ:**
```json
{
  "token": "jwt_token",
  "refresh_token": "jwt_refresh_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "fullName": "Иванов Иван Иванович",
    "phone": "77012345678",
    "city": "Алматы",
    "company": "ТОО Компания",
    "clientType": "B2C",
    "isEmailConfirmed": true
  }
}
```

**Логика:**
1. Находит пользователя по телефону
2. Проверяет статус (не заблокирован, не удален)
3. Проверяет пароль с использованием bcrypt
4. Генерирует JWT токены
5. Возвращает токены и информацию о пользователе

---

#### 6. Запрос на восстановление пароля
```
POST /mobile/users/forgot-password
```

**Тело запроса:**
```json
{
  "email": "user@example.com"
}
```

**Ответ:**
```json
{
  "message": "Код восстановления отправлен на email"
}
```

**Логика:**
1. Находит пользователя по email
2. Генерирует 6-значный код восстановления
3. Отправляет email с кодом (действителен 15 минут)
4. Не раскрывает информацию о существовании пользователя

---

#### 7. Сброс пароля
```
POST /mobile/users/reset-password
```

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "NewSecurePassword123"
}
```

**Ответ:**
```json
{
  "message": "Пароль успешно изменен"
}
```

**Логика:**
1. Проверяет код восстановления
2. Проверяет, что код не истек (15 минут)
3. Хэширует новый пароль
4. Обновляет пароль и очищает код восстановления

---

### Защищенные роуты (требуют авторизацию)

#### 8. Получить профиль
```
GET /mobile/users/profile
Authorization: Bearer {token}
```

**Ответ:**
```json
{
  "_id": "user_id",
  "phone": "77012345678",
  "fullName": "Иванов Иван Иванович",
  "city": "Алматы",
  "email": "user@example.com",
  "company": "ТОО Компания",
  "clientType": "B2C",
  "isEmailConfirmed": true,
  "isActive": true,
  "registrationDate": "2024-01-01T00:00:00.000Z",
  "cardData": { /* данные карты */ }
}
```

---

#### 9. Обновить профиль
```
PUT /mobile/users/profile
Authorization: Bearer {token}
```

**Тело запроса:**
```json
{
  "fullName": "Иванов Иван Петрович",
  "city": "Астана",
  "email": "newemail@example.com",
  "company": "ТОО Новая Компания",
  "clientType": "B2B"
}
```

**Ответ:** обновленный объект пользователя

---

#### 10. Удалить аккаунт
```
DELETE /mobile/users/delete
Authorization: Bearer {token}
```

**Ответ:**
```json
{
  "message": "Пользователь удален"
}
```

**Логика:** Устанавливает флаг `isDeleted: true` (мягкое удаление)

---

### Admin роуты

#### 11. Список пользователей
```
GET /admin/users
Authorization: Bearer {admin_token}
```

**Query параметры:**
- `page` (default: 1)
- `limit` (default: 10)
- `sortBy` (registrationDate, fullName, email)
- `sortOrder` (asc, desc)
- `isBlocked` (boolean)
- `registrationDate` (today, week, month, year или ISO дата)
- `search` (поиск по ФИО, телефону, email, городу)

---

#### 12. Получить пользователя
```
GET /admin/users/:id
Authorization: Bearer {admin_token}
```

---

#### 13. Обновить пользователя
```
PUT /admin/users/:id
Authorization: Bearer {admin_token}
```

---

#### 14. Заблокировать пользователя
```
PUT /admin/users/:id/block
Authorization: Bearer {admin_token}
```

---

#### 15. Разблокировать пользователя
```
PUT /admin/users/:id/unblock
Authorization: Bearer {admin_token}
```

---

#### 16. Удалить пользователя
```
DELETE /admin/users/:id
Authorization: Bearer {admin_token}
```

---

#### 17. Экспорт в CSV
```
GET /admin/users/export/csv
Authorization: Bearer {admin_token}
```

---

## Безопасность

### Хэширование паролей
- Используется `bcryptjs` с 10 раундами соли
- Пароли никогда не возвращаются в ответах API
- При выборке из БД используется `.select('-password ...')`

### Rate Limiting
- Повторная отправка кодов возможна только через 1 минуту
- Проверка через поле `lastCodeSentAt`

### Валидация
- Все DTO валидируются с помощью `class-validator`
- Минимальная длина пароля: 6 символов
- Email проверяется на корректность формата

### Коды подтверждения
- Генерируются случайные 6-значные коды
- Код восстановления пароля действителен 15 минут
- После использования коды очищаются из БД

## TODO: Будущие фичи

### История покупок
```typescript
// TODO: В Entity добавить
// ordersCount: number;              // Количество заказов
// totalOrdersAmount: number;        // Сумма всех заказов

// TODO: В Service добавить методы
async getPurchaseHistory(userId: string) {
  // Получение истории покупок пользователя
}

async getOrdersStatistics(userId: string) {
  // Получение статистики заказов (количество, сумма)
}
```

### Роуты для пользователей
```typescript
// GET /mobile/users/purchase-history
// @ApiBearerAuth('accessToken')
// @ApiOperation({ summary: 'Получить историю покупок пользователя' })

// GET /mobile/users/orders-statistics
// @ApiBearerAuth('accessToken')
// @ApiOperation({ summary: 'Получить статистику заказов (количество, сумма)' })
```

### Роуты для админов
```typescript
// GET /admin/users/:id/purchase-history
// @ApiOperation({ summary: 'Получить историю покупок пользователя' })

// GET /admin/users/:id/orders-statistics
// @ApiOperation({ summary: 'Получить статистику заказов пользователя' })
```

## Тестовые данные

Для тестирования используется специальный номер телефона:
- **Телефон:** `7078479598`
- **Код подтверждения:** `111111` (всегда)
- SMS не отправляется для этого номера

## Зависимости

- `bcryptjs` - хэширование паролей
- `jsonwebtoken` - генерация JWT токенов
- `@nestjs-modules/mailer` - отправка email
- `class-validator` - валидация DTO
- `mongoose` - работа с MongoDB

## Примеры использования

### Полный флоу регистрации

```typescript
// 1. Регистрация
POST /mobile/users/register
{
  "phone": "77012345678",
  "password": "SecurePassword123",
  "fullName": "Иванов Иван Иванович",
  "city": "Алматы",
  "email": "user@example.com",
  "clientType": "B2C"
}
// Получаем SMS с кодом

// 2. Подтверждение телефона
POST /mobile/users/confirm-phone
{
  "phone": "77012345678",
  "code": "123456"
}
// Получаем токены + email с кодом

// 3. Подтверждение email
POST /mobile/users/confirm-email
{
  "email": "user@example.com",
  "code": "654321"
}
// Email подтвержден

// 4. Использование API с токеном
GET /mobile/users/profile
Authorization: Bearer {token}
```

### Флоу восстановления пароля

```typescript
// 1. Запрос на восстановление
POST /mobile/users/forgot-password
{
  "email": "user@example.com"
}
// Получаем email с кодом

// 2. Сброс пароля
POST /mobile/users/reset-password
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "NewSecurePassword123"
}
// Пароль изменен

// 3. Вход с новым паролем
POST /mobile/users/login
{
  "phone": "77012345678",
  "password": "NewSecurePassword123"
}
// Получаем токены
```

## Миграция данных

При переходе со старой схемы на новую необходимо:

1. Создать миграцию для существующих пользователей
2. Объединить `name` и `lastName` в `fullName`
3. Запросить у пользователей установить пароль
4. Удалить старые поля: `birthDate`, `gender`, `photo`, `push_*`, `oneSignalPlayerId`, `isCardActive`

## Лицензия

Proprietary - Rivus Backend
