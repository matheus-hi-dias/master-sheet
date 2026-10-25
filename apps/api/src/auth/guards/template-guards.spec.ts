import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OwnerGuard } from './owner.guard';
import { TemplateAccessGuard } from './template-access.guard';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ActiveUser } from '../types/auth.types';

type PrismaMock = {
  template: {
    findUnique: jest.Mock;
  };
};

const user: ActiveUser = {
  userId: 'user-1',
  email: 'player@example.com',
  jti: 'token-1',
};

function makeContext(candidate: ActiveUser | undefined, id = 'template-1') {
  const request: {
    user?: ActiveUser;
    params: { id: string };
    template?: unknown;
  } = { user: candidate, params: { id } };

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;

  return { context, request };
}

describe('OwnerGuard', () => {
  let prisma: PrismaMock;
  let guard: OwnerGuard;

  beforeEach(() => {
    prisma = { template: { findUnique: jest.fn() } };
    guard = new OwnerGuard(prisma as unknown as PrismaService);
  });

  it('allows the template owner', async () => {
    prisma.template.findUnique.mockResolvedValue({ authorId: user.userId });

    await expect(guard.canActivate(makeContext(user).context)).resolves.toBe(
      true,
    );
  });

  it('rejects a non-owner with 403', async () => {
    prisma.template.findUnique.mockResolvedValue({ authorId: 'someone-else' });

    await expect(guard.canActivate(makeContext(user).context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects a missing template with 404', async () => {
    prisma.template.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(makeContext(user).context)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns false when the request has no authenticated user', async () => {
    await expect(guard.canActivate(makeContext(undefined).context)).resolves.toBe(
      false,
    );
  });
});

describe('TemplateAccessGuard', () => {
  let prisma: PrismaMock;
  let guard: TemplateAccessGuard;

  const template = {
    id: 'template-1',
    isPublic: false,
    authorId: 'author-1',
    tags: [],
    author: { id: 'author-1', name: 'Author' },
  };

  beforeEach(() => {
    prisma = { template: { findUnique: jest.fn() } };
    guard = new TemplateAccessGuard(prisma as unknown as PrismaService);
  });

  it('allows public templates and exposes the prefetched record', async () => {
    const publicTemplate = { ...template, isPublic: true };
    prisma.template.findUnique.mockResolvedValue(publicTemplate);
    const { context, request } = makeContext(user);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.template).toBe(publicTemplate);
  });

  it('allows the owner of a private template', async () => {
    prisma.template.findUnique.mockResolvedValue({
      ...template,
      authorId: user.userId,
    });

    await expect(guard.canActivate(makeContext(user).context)).resolves.toBe(
      true,
    );
  });

  it('rejects another user private template with 403', async () => {
    prisma.template.findUnique.mockResolvedValue(template);

    await expect(guard.canActivate(makeContext(user).context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects a missing template with 404', async () => {
    prisma.template.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(makeContext(user).context)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
