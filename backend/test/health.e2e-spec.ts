import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';

/** E2E: Healthcheck (TZ п.7). Требует MongoDB. */
describe('HealthController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(
            new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
        );
        await app.init();
    }, 30000);

    afterAll(async () => {
        await app.close();
    });

    it('/api/health/live (GET) — liveness', () => {
        return request(app.getHttpServer())
            .get('/api/health/live')
            .expect(200)
            .expect((res) => {
                expect(res.body.status).toBe('ok');
            });
    });

    it('/api/health/ready (GET) — readiness (MongoDB + Redis)', async () => {
        const res = await request(app.getHttpServer()).get('/api/health/ready');
        expect([200, 503]).toContain(res.status);
        if (res.status === 200) {
            expect(res.body.status).toBe('ok');
            expect(res.body.mongo).toBe('connected');
            expect(res.body.redis).toBe('connected');
        }
    });
});
