jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('verifyEmailGet', () => {
    let authServiceMock: { verifyEmail: jest.Mock };
    let configServiceMock: { get: jest.Mock };

    beforeEach(() => {
      authServiceMock = controller['authService'] as any;
      authServiceMock.verifyEmail = jest.fn();
      configServiceMock = controller['config'] as any;
      configServiceMock.get.mockReturnValue('http://localhost:3000');
    });

    it('redirects to default base URL when external malicious redirect is supplied', async () => {
      authServiceMock.verifyEmail.mockResolvedValue({});
      const req = { accepts: jest.fn().mockReturnValue('html') } as any;
      const res = { redirect: jest.fn() } as any;

      await controller.verifyEmailGet(
        req,
        'valid-token',
        res,
        'https://evil-attacker-site.com',
      );

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/email-verified?status=success',
      );
    });

    it('allows redirect when origin matches configured base URL', async () => {
      authServiceMock.verifyEmail.mockResolvedValue({});
      const req = { accepts: jest.fn().mockReturnValue('html') } as any;
      const res = { redirect: jest.fn() } as any;

      await controller.verifyEmailGet(
        req,
        'valid-token',
        res,
        'http://localhost:3000/custom-path',
      );

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/custom-path/email-verified?status=success',
      );
    });

    it('allows relative path redirects', async () => {
      authServiceMock.verifyEmail.mockResolvedValue({});
      const req = { accepts: jest.fn().mockReturnValue('html') } as any;
      const res = { redirect: jest.fn() } as any;

      await controller.verifyEmailGet(
        req,
        'valid-token',
        res,
        '/welcome',
      );

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/welcome/email-verified?status=success',
      );
    });
  });
});
