# Конфигурация MailerService (Brevo/Sendinblue)

## Обзор
MailerService настроен для использования SMTP-сервера Brevo (ранее Sendinblue) для отправки писем.

## Конфигурация

### Переменные окружения (.env)
```env
MAILER_HOST="smtp-relay.brevo.com"
MAILER_PORT=587
MAILER_MAIL="your-login@smtp-brevo.com"
MAILER_PASS="your-smtp-password"
MAILER_FROM_EMAIL="noreply@rivus.kz"
MAILER_FROM_NAME="rivus.kz"
```

### Параметры SMTP
- **Сервер**: smtp-relay.brevo.com
- **Порт**: 587 (STARTTLS)
- **Безопасность**: STARTTLS (не SSL/TLS напрямую)
- **Логин**: your-login@smtp-brevo.com
- **Пароль**: your-smtp-password

### Отправитель по умолчанию
- **Email**: noreply@rivus.kz
- **Имя**: rivus.kz

## Использование

### Базовое использование
```typescript
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class YourService {
    constructor(private readonly mailerService: MailerService) {}

    async sendEmail() {
        try {
            await this.mailerService.sendMail({
                to: 'user@example.com',
                subject: 'Тема письма',
                html: '<p>Содержимое письма</p>',
            });
        } catch (error) {
            console.error('Ошибка отправки email:', error);
            throw new InternalServerErrorException('Ошибка отправки email');
        }
    }
}
```

### Использование с пользовательским отправителем
```typescript
await this.mailerService.sendMail({
    from: '"Кастомное имя" <custom@rivus.kz>',
    to: 'user@example.com',
    subject: 'Тема письма',
    html: '<p>Содержимое письма</p>',
});
```

### Примеры из проекта

#### Подтверждение email
```typescript
await this.mailerService.sendMail({
    to: user.email,
    subject: 'Подтверждение email',
    html: `<p>Ваш код подтверждения email: <strong>${emailCode}</strong></p>`,
});
```

#### Восстановление пароля
```typescript
await this.mailerService.sendMail({
    to: user.email,
    subject: 'Восстановление пароля',
    html: `<p>Ваш код для восстановления пароля: <strong>${resetCode}</strong></p>
           <p>Код действителен в течение 15 минут.</p>`,
});
```

## Ограничения Brevo

### Бесплатный план
- 300 писем в день
- Только через SMTP или API
- Нет ограничений на количество контактов

### Рекомендации
1. Используйте HTML-шаблоны для лучшего внешнего вида
2. Добавьте обработку ошибок для всех вызовов sendMail
3. Используйте rate limiting для предотвращения спама
4. Логируйте все попытки отправки писем

## API Brevo
Документация API: https://developers.brevo.com/

API Key (если потребуется): `xkeysib-your-api-key`

### Использование API (альтернатива SMTP)
Для использования API вместо SMTP:
```bash
npm install @sendinblue/client
```

```typescript
import * as SibApiV3Sdk from '@sendinblue/client';

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, 'your-api-key');

const sendSmtpEmail = {
    sender: { email: 'noreply@rivus.kz', name: 'rivus.kz' },
    to: [{ email: 'recipient@example.com' }],
    subject: 'Test Email',
    htmlContent: '<html><body><h1>Hello</h1></body></html>',
};

await apiInstance.sendTransacEmail(sendSmtpEmail);
```

## Мониторинг
Проверяйте статистику отправки писем в личном кабинете Brevo:
https://app.brevo.com/

## Устранение неполадок

### Ошибка аутентификации
- Проверьте правильность логина и пароля в .env
- Убедитесь, что учетные данные активны в Brevo

### Письма не доходят
- Проверьте спам-папку
- Убедитесь, что домен отправителя (rivus.kz) подтвержден в Brevo
- Проверьте лимиты на отправку в личном кабинете

### Медленная отправка
- SMTP может быть медленнее, чем API
- Рассмотрите использование очереди (BullMQ) для отправки писем

## Безопасность
⚠️ **ВАЖНО**: Не коммитьте .env файл с реальными учетными данными в Git!
Убедитесь, что .env добавлен в .gitignore.
