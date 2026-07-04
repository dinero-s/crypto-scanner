# Changelog - Users Module Refactoring

## Дата: 2026-01-17

## Основные изменения

### 🗑️ Удалено

#### Entity (users.entity.ts)
- `name` и `lastName` → заменены на `fullName`
- `birthDate` - дата рождения
- `gender` - пол
- `photo` - фотография профиля
- `push_id` и `push_token` - push токены
- `oneSignalPlayerId` - OneSignal интеграция
- `isCardActive` - статус активации карты
- `reset_code` → переименован в специфичные коды

#### DTOs
- **Удалены файлы:**
  - `referral-stats.dto.ts`
  - `change-email-request.dto.ts`
  - `confirm-change-email.dto.ts`

- **RegisterDto:**
  - Удалено поле `referralCode`

#### Service (users.service.ts)
- Метод `setPushSubscription()`
- Метод `findByReferralCode()`
- Метод `addBalance()`
- Метод `uploadFile()`
- Метод `addOneSignalPlayerId()`
- Метод `getOneSignalPlayerIdsForUsers()`

#### Controllers
- Удалены все роуты, связанные с push-уведомлениями
- Удалены роуты смены email через старую схему
- Удален параметр `file` из всех методов обновления

---

### ➕ Добавлено

#### Entity (users.entity.ts)
```typescript
// Новые обязательные поля
password: string;                 // Хэш пароля (bcrypt)
fullName: string;                 // ФИО пользователя
city: string;                     // Город
email: string;                    // Email (обязательный)

// Новые необязательные поля
company?: string;                 // Компания (опционально)
clientType: 'B2C' | 'B2B';       // Тип клиента (default: B2C)
isEmailConfirmed: boolean;        // Подтвержден ли email

// Новые коды подтверждения
phoneConfirmationCode?: string;   // Код для подтверждения телефона
passwordResetCode?: string;       // Код для восстановления пароля
emailConfirmationCode?: string;   // Код для подтверждения email

// Переименовано
lastCodeSentAt: Date;             // Было: lastSendEmail
```

#### DTOs (auth.dto.ts)
```typescript
// Новые DTO
export class RegisterDto {
  phone: string;
  password: string;
  fullName: string;
  city: string;
  email: string;
  company?: string;
  clientType?: 'B2C' | 'B2B';
}

export class LoginDto {
  phone: string;
  password: string;              // Добавлено
}

export class ForgotPasswordDto {
  email: string;                 // Изменено с phone на email
}

export class ResetPasswordDto {
  email: string;
  code: string;
  newPassword: string;
}

export class ConfirmEmailDto {
  email: string;
  code: string;
}
```

#### Service (users.service.ts)
```typescript
// Новые методы
async confirmEmail(confirmEmailDto)           // Подтверждение email
async resendEmailConfirmation(email)          // Повторная отправка кода на email
async forgotPassword(forgotPasswordDto)       // Запрос восстановления пароля
async resetPassword(resetPasswordDto)         // Сброс пароля с кодом

// TODO комментарии для будущих фич
// async getPurchaseHistory(userId)
// async getOrdersStatistics(userId)
```

#### Controllers

**UsersMobileController (users.mobile.controller.ts):**
```typescript
// Новые роуты
POST /mobile/users/confirm-email              // Подтверждение email
POST /mobile/users/resend-email-confirmation  // Повторная отправка кода
POST /mobile/users/forgot-password            // Запрос восстановления
POST /mobile/users/reset-password             // Сброс пароля

// TODO роуты для будущих фич
// GET /mobile/users/purchase-history
// GET /mobile/users/orders-statistics
```

**UsersAdminController (users.admin.controller.ts):**
```typescript
// TODO роуты для будущих фич
// GET /admin/users/:id/purchase-history
// GET /admin/users/:id/orders-statistics
```

---

### 🔄 Изменено

#### Логика регистрации
**Было:**
1. Отправка SMS с кодом
2. Подтверждение кода → выдача токена

**Стало:**
1. Валидация данных (телефон, email, пароль, ФИО, город)
2. Хэширование пароля
3. Отправка SMS с кодом на телефон
4. Подтверждение телефона → выдача токена
5. Автоматическая отправка кода на email
6. Подтверждение email (опционально, но рекомендуется)

#### Логика авторизации
**Было:**
1. Ввод телефона
2. Отправка SMS с кодом
3. Подтверждение кода → выдача токена

**Стало:**
1. Ввод телефона + пароля
2. Проверка пароля
3. Выдача токена (без SMS)

#### Восстановление пароля
**Было:**
- Восстановление через SMS (по телефону)

**Стало:**
- Восстановление через email:
  1. Запрос на восстановление (указывается email)
  2. Отправка кода на email (действителен 15 минут)
  3. Ввод кода + новый пароль
  4. Изменение пароля

#### Обновление профиля
**Было:**
```typescript
PUT /mobile/users/profile
Content-Type: multipart/form-data

name: string
lastName: string
birthDate: string
gender: string
photo: file
```

**Стало:**
```typescript
PUT /mobile/users/profile
Content-Type: application/json

{
  fullName: string
  city: string
  email: string
  company?: string
  clientType?: 'B2C' | 'B2B'
}
```

#### Поиск пользователей (Admin)
**Было:**
- Поиск по `name` и `email`

**Стало:**
- Поиск по `fullName`, `phone`, `email` и `city`

#### CSV Export
**Было:**
```csv
id,phone,name,isActive,isBlocked,...
```

**Стало:**
```csv
id,phone,fullName,email,city,company,clientType,isActive,isBlocked,isEmailConfirmed,...
```

---

## Безопасность

### Улучшения
1. ✅ Пароли хэшируются с помощью `bcryptjs` (10 раундов)
2. ✅ Пароли никогда не возвращаются в API ответах
3. ✅ Rate limiting для отправки кодов (1 минута)
4. ✅ Коды восстановления пароля истекают через 15 минут
5. ✅ Коды подтверждения очищаются после использования
6. ✅ Минимальная длина пароля: 6 символов
7. ✅ Email валидация

---

## Миграция данных

### Необходимые действия

1. **Создать миграционный скрипт:**
```typescript
// Пример миграции
async function migrateUsers() {
  const users = await UsersModel.find({});
  
  for (const user of users) {
    // Объединить name и lastName
    user.fullName = `${user.lastName || ''} ${user.name || ''}`.trim();
    
    // Установить значения по умолчанию
    user.clientType = 'B2C';
    user.isEmailConfirmed = false;
    
    // Если город не указан, установить дефолтное значение
    if (!user.city) {
      user.city = 'Не указан';
    }
    
    // Удалить старые поля
    delete user.name;
    delete user.lastName;
    delete user.birthDate;
    delete user.gender;
    delete user.photo;
    delete user.push_id;
    delete user.push_token;
    delete user.oneSignalPlayerId;
    delete user.isCardActive;
    
    await user.save();
  }
}
```

2. **Уведомить пользователей:**
   - Отправить email/SMS с просьбой установить пароль
   - Предоставить ссылку на восстановление пароля

3. **Обновить мобильное приложение:**
   - Обновить форму регистрации (добавить поля: пароль, ФИО, город, email)
   - Изменить форму входа (убрать код, добавить пароль)
   - Добавить экраны подтверждения email
   - Добавить экраны восстановления пароля

---

## Тестирование

### Тестовые данные
```typescript
// Специальный тестовый номер
const TEST_PHONE = "7078479598";
const TEST_CODE = "111111";

// Для этого номера:
// - Всегда используется код 111111
// - SMS не отправляется
```

### Сценарии тестирования

#### 1. Успешная регистрация
```bash
# Шаг 1: Регистрация
curl -X POST http://localhost:3000/mobile/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "77012345678",
    "password": "Test123",
    "fullName": "Тестовый Пользователь",
    "city": "Алматы",
    "email": "test@example.com"
  }'

# Шаг 2: Подтверждение телефона
curl -X POST http://localhost:3000/mobile/users/confirm-phone \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "77012345678",
    "code": "123456"
  }'

# Шаг 3: Подтверждение email
curl -X POST http://localhost:3000/mobile/users/confirm-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "654321"
  }'
```

#### 2. Авторизация
```bash
curl -X POST http://localhost:3000/mobile/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "77012345678",
    "password": "Test123"
  }'
```

#### 3. Восстановление пароля
```bash
# Шаг 1: Запрос кода
curl -X POST http://localhost:3000/mobile/users/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'

# Шаг 2: Сброс пароля
curl -X POST http://localhost:3000/mobile/users/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456",
    "newPassword": "NewTest123"
  }'
```

---

## Документация

Создана подробная документация:
- `README.md` - полное описание модуля, API endpoints, примеры
- `CHANGELOG.md` - этот файл с описанием изменений

---

## Следующие шаги

### Высокий приоритет
- [ ] Протестировать все новые роуты
- [ ] Создать миграционный скрипт для существующих пользователей
- [ ] Обновить Swagger документацию
- [ ] Обновить мобильное приложение

### Средний приоритет
- [ ] Добавить unit тесты для новых методов
- [ ] Добавить e2e тесты для flow регистрации/авторизации
- [ ] Настроить мониторинг отправки SMS/Email

### Низкий приоритет (TODO)
- [ ] Реализовать историю покупок
- [ ] Реализовать статистику заказов
- [ ] Добавить поля `ordersCount` и `totalOrdersAmount` в entity
- [ ] Создать роуты для истории покупок и статистики

---

## Обратная совместимость

⚠️ **BREAKING CHANGES:**
1. API для регистрации и авторизации полностью изменен
2. Изменена структура entity (удалены и добавлены поля)
3. Изменена структура токена JWT (новые поля)
4. Старые клиенты не смогут работать с новым API

**Рекомендации:**
- Версионировать API (например, `/api/v2/users/...`)
- Поддерживать старую версию API до полного перехода
- Постепенная миграция пользователей
