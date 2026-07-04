import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import * as bcrypt from 'bcryptjs';

import { AdminRole } from '../enums/roles.enum';

export const TableName = 'admin_users';

@DatabaseEntity({ collection: TableName, timestamps: true })
export class AdminUsersEntity {

    @DatabaseProp({ type: String, required: true })
    name: string;

    @DatabaseProp({ type: String, required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @DatabaseProp({
        type: String,
        required: true,
        minlength: 6,
        set: (v: string) => {
            if (!v || v.length < 6) {
                return v;
            }
            if (v.startsWith('$2a$') || v.startsWith('$2b$') || v.startsWith('$2y$')) {
                return v;
            }
            return bcrypt.hashSync(String(v), 10);
        },
    })
    password: string;

    @DatabaseProp({ type: String, enum: AdminRole, default: AdminRole.CONTENT_MANAGER })
    role: AdminRole;

    @DatabaseProp({ type: String, enum: ['ACTIVE', 'BLOCKED'], default: 'ACTIVE' })
    status: string;

    @DatabaseProp()
    lastLoginAt: Date;

    /** Версия refresh-токена для rotation и инвалидации сессий */
    @DatabaseProp({ type: Number, default: 0 })
    refreshTokenVersion: number;
}

export const AdminUsersSchema = DatabaseSchema(AdminUsersEntity);
// email уже имеет unique: true в декораторе, индекс создается автоматически
export type AdminUsersDoc = IDatabaseDocument<AdminUsersEntity>; 