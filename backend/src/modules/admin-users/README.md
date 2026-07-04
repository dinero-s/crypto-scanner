# Модуль Admin Users — роли

## Роли (`AdminRole`)

| Роль | Значение | Назначение |
|------|----------|------------|
| **MAIN_ADMIN** | `main_admin` | Полный доступ: создание/удаление админов, смена любых ролей |
| **ADMIN** | `admin` | Операции back-office без смены ролей (список админов, правки профилей и т.д. по эндпоинтам) |
| **CONTENT_MANAGER** | `content_manager` | Контент, медиа, push и т.п. без финансовых разделов (см. `@Roles` на контроллерах) |

Вспомогательные массивы в `roles.enum.ts`:

- `ADMIN_ROLES_ALL` — все три роли (типовой контент/медиа).
- `ADMIN_ROLES_FINANCE` — только `ADMIN` и `MAIN_ADMIN` (подписки, промокоды, аудит, платёжные события).

## Декоратор `@Roles`

```typescript
import { Roles } from 'src/modules/admin-users/decorators/roles.decorator';
import { AdminRole, ADMIN_ROLES_ALL, ADMIN_ROLES_FINANCE } from 'src/modules/admin-users/enums/roles.enum';

@Roles(...ADMIN_ROLES_ALL)
@Roles(...ADMIN_ROLES_FINANCE)
@Roles(AdminRole.MAIN_ADMIN)
```

Смена роли администратора: **только `MAIN_ADMIN`**, `PATCH .../admin-users/:id/role`.
