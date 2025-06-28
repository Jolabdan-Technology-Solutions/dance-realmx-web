import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('FeatureGuard (e2e)', () => {
  let app: INestApplication;
  let adminJwt: string;
  let studentJwt: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login as admin
    const adminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password' });
    adminJwt = adminRes.body.access_token;

    // Login as student
    const studentRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'student@example.com', password: 'password' });
    studentJwt = studentRes.body.access_token;
  });

  it('should allow admin to access a protected feature endpoint', async () => {
    await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', `Bearer ${adminJwt}`)
      .send({ title: 'Test Course', description: 'desc' })
      .expect(201);
  });

  it('should forbid a student from accessing an admin-only feature', async () => {
    await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', `Bearer ${studentJwt}`)
      .send({ title: 'Test Course', description: 'desc' })
      .expect(403);
  });

  afterAll(async () => {
    await app.close();
  });
});
