import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { getUserToken } from './e2e-helpers';

/** E2E: Ozon Operator REST. Требует MongoDB/Redis и E2E_USER_* в env. */
describe('OzonController (e2e)', () => {
    let app: INestApplication;
    let userToken: string | null;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );
        await app.init();

        userToken = await getUserToken(app);
    }, 30000);

    afterAll(async () => {
        await app.close();
    });

    it('/api/user/ozon/connections (GET) — 401 без токена', () => {
        return request(app.getHttpServer())
            .get('/api/user/ozon/connections')
            .expect(401);
    });

    it('/api/user/ozon/connections (GET) — список подключений', async () => {
        if (!userToken) {
            return;
        }

        const res = await request(app.getHttpServer())
            .get('/api/user/ozon/connections')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('/api/user/ozon/products (GET) — список товаров', async () => {
        if (!userToken) {
            return;
        }

        const res = await request(app.getHttpServer())
            .get('/api/user/ozon/products')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('/api/user/ozon/alerts (GET) — уведомления', async () => {
        if (!userToken) {
            return;
        }

        const res = await request(app.getHttpServer())
            .get('/api/user/ozon/alerts')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('/api/user/ozon/audit/run (POST) — 401 без токена', () => {
        return request(app.getHttpServer())
            .post('/api/user/ozon/audit/run')
            .send({ periodDays: 30 })
            .expect(401);
    });

    it('/api/user/ozon/audit/status (GET) — 401 без токена', () => {
        return request(app.getHttpServer())
            .get('/api/user/ozon/audit/status')
            .expect(401);
    });

    it('/api/user/ozon/audit/latest (GET) — 401 без токена', () => {
        return request(app.getHttpServer())
            .get('/api/user/ozon/audit/latest')
            .expect(401);
    });

    it('/api/user/ozon/audit/status (GET) — возвращает UI state', async () => {
        if (!userToken) {
            return;
        }

        const res = await request(app.getHttpServer())
            .get('/api/user/ozon/audit/status')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('state');
        expect([
            'NO_CONNECTION',
            'CONNECTED_NOT_AUDITED',
            'AUDIT_RUNNING',
            'AUDIT_READY',
            'PARTIAL_DATA',
            'AUDIT_FAILED',
        ]).toContain(res.body.state);
    });

    it('/api/user/ozon/audit/latest (GET) — возвращает latest report view', async () => {
        if (!userToken) {
            return;
        }

        const res = await request(app.getHttpServer())
            .get('/api/user/ozon/audit/latest')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('topIssues');
        expect(res.body).toHaveProperty('topRecommendations');
        expect(Array.isArray(res.body.topIssues)).toBe(true);
        expect(Array.isArray(res.body.topRecommendations)).toBe(true);
    });

    it('/api/user/ozon/audit/run (POST) — запуск или возврат активного аудита', async () => {
        if (!userToken) {
            return;
        }

        const res = await request(app.getHttpServer())
            .post('/api/user/ozon/audit/run')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ periodDays: 30 });

        if (res.status === 404) {
            expect(res.body.message).toMatch(/подключение|connection/i);
            return;
        }

        expect([200, 201]).toContain(res.status);
        expect(res.body).toHaveProperty('auditRunId');
        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('progressStep');
    });

    it('/api/user/ozon/issues/:id/status (PATCH) — 401 без токена', () => {
        return request(app.getHttpServer())
            .patch('/api/user/ozon/issues/000000000000000000000001/status')
            .send({ status: 'VIEWED' })
            .expect(401);
    });

    it('/api/user/ozon/audit/recommendations/:id/status (PATCH) — 401 без токена', () => {
        return request(app.getHttpServer())
            .patch('/api/user/ozon/audit/recommendations/000000000000000000000001/status')
            .send({ status: 'VIEWED' })
            .expect(401);
    });
});
