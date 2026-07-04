/**
 * Создаёт или обновляет dev-админа и dev-пользователя для локальной разработки.
 * Запуск: npm run seed:dev
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { hash } from 'bcryptjs';
import mongoose from 'mongoose';

export const DEV_ADMIN_EMAIL = 'admin@crypto-scanner.test';
export const DEV_ADMIN_PASSWORD = 'Admin123';
export const DEV_USER_EMAIL = 'dev@crypto-scanner.test';
export const DEV_USER_PASSWORD = 'Test123';

function loadDatabaseUri(): string {
    const envPath = resolve(__dirname, '../.env');
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
        const match = line.match(/^DATABASE_URI=(.+)$/);
        if (match?.[1]) {
            return match[1].trim();
        }
    }
    throw new Error('DATABASE_URI не найден в backend/.env');
}

async function seedDevAdmin(now: Date): Promise<void> {
    const passwordHash = await hash(DEV_ADMIN_PASSWORD, 10);

    const result = await mongoose.connection.db.collection('admin_users').updateOne(
        { email: DEV_ADMIN_EMAIL },
        {
            $set: {
                email: DEV_ADMIN_EMAIL,
                password: passwordHash,
                name: 'Dev Admin',
                role: 'main_admin',
                status: 'ACTIVE',
                updatedAt: now,
            },
            $setOnInsert: {
                createdAt: now,
            },
        },
        { upsert: true },
    );

    console.log(`Dev admin ready: ${DEV_ADMIN_EMAIL}`);
    console.log(`Password: ${DEV_ADMIN_PASSWORD}`);
    console.log(`Admin login UI: http://localhost:5173/admin/login`);
    console.log(
        result.upsertedCount > 0 ? 'Created new admin' : 'Updated existing admin',
    );
}

async function seedDevUser(now: Date): Promise<void> {
    const passwordHash = await hash(DEV_USER_PASSWORD, 10);

    const result = await mongoose.connection.db.collection('users').updateOne(
        { email: DEV_USER_EMAIL },
        {
            $set: {
                email: DEV_USER_EMAIL,
                password: passwordHash,
                fullName: 'Dev Ozon Operator',
                clientType: 'B2C',
                role: 'user',
                isEmailConfirmed: true,
                isActive: true,
                isBlocked: false,
                isDisabled: false,
                isDeleted: false,
                registrationDate: now,
                ordersCount: 0,
                totalOrdersAmount: 0,
                averageOrderAmount: 0,
                loginCount: 0,
                pushNotificationsEnabled: true,
                emailNewsletterEnabled: true,
                notificationSoundEnabled: true,
                updatedAt: now,
            },
            $setOnInsert: {
                createdAt: now,
            },
        },
        { upsert: true },
    );

    console.log(`Dev user ready: ${DEV_USER_EMAIL}`);
    console.log(`Password: ${DEV_USER_PASSWORD}`);
    console.log(
        result.upsertedCount > 0 ? 'Created new user' : 'Updated existing user',
    );
}

async function seedDev(): Promise<void> {
    const uri = loadDatabaseUri();
    await mongoose.connect(uri);

    const now = new Date();
    await seedDevAdmin(now);
    console.log('');
    await seedDevUser(now);

    await mongoose.disconnect();
}

seedDev().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('seed:dev failed:', message);
    process.exit(1);
});
