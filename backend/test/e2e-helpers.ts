import request from 'supertest';
import { INestApplication } from '@nestjs/common';

/** Получить admin JWT для e2e (требует E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD в env) */
export async function getAdminToken(app: INestApplication): Promise<string | null> {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    if (!email || !password) return null;
    const res = await request(app.getHttpServer())
        .post('/api/admin/admin-users/login')
        .send({ email, password });
    if (res.status !== 200 || !res.body?.token) return null;
    return res.body.token as string;
}

/** Получить user JWT для e2e (требует E2E_USER_EMAIL, E2E_USER_PASSWORD в env) */
export async function getUserToken(app: INestApplication): Promise<string | null> {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) return null;
    const res = await request(app.getHttpServer())
        .post('/api/users/login')
        .send({ email, password });
    if (res.status !== 200 || !res.body?.token) return null;
    return res.body.token as string;
}
