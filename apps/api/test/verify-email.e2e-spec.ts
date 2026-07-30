import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

describe('Email verification (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // cleanup tokens and users created by tests
    await prisma.emailVerificationToken.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { contains: 'e2e+' } } });
  });

  it('verifies a valid token and redirects to success landing page', async () => {
    const token = randomBytes(16).toString('hex');

    const user = await prisma.user.create({
      data: {
        email: `e2e+valid-${Date.now()}@example.com`,
        name: 'E2E User',
        password: 'irrelevant',
      },
    });

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const res = await request(app.getHttpServer()).get(
      `/auth/verify-email?token=${encodeURIComponent(token)}`,
    );

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/email-verified\?status=success/);
  });

  it('redirects to expired for expired tokens', async () => {
    const token = randomBytes(16).toString('hex');

    const user = await prisma.user.create({
      data: {
        email: `e2e+expired-${Date.now()}@example.com`,
        name: 'E2E User',
        password: 'irrelevant',
      },
    });

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const res = await request(app.getHttpServer()).get(
      `/auth/verify-email?token=${encodeURIComponent(token)}`,
    );

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/email-verified\?status=expired/);
  });

  it('redirects to invalid when token missing or wrong', async () => {
    const res = await request(app.getHttpServer()).get(
      `/auth/verify-email?token=does-not-exist`,
    );

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/email-verified\?status=invalid/);
  });
});
