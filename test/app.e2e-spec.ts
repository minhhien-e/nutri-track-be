import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

process.env.DATABASE_URL ??= 'postgresql://nutri:password@localhost:5432/nutri_track?schema=public';
process.env.JWT_SECRET ??= 'test-secret';

describe('NutriTrack API (e2e)', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('/health (GET)', () => {
    return request(app!.getHttpServer()).get('/health').expect(200);
  });
});
