import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActiveUser } from '../types/auth.types';
import { Request } from 'express';

@Injectable()
export class TemplateAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: ActiveUser; template?: unknown }>();
    const user = request.user;
    const templateId = request.params.id as string;

    if (!user || !templateId) {
      return false;
    }

    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
      include: {
        tags: true,
        author: { select: { id: true, name: true } },
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (!template.isPublic && template.authorId !== user.userId) {
      throw new ForbiddenException('You do not have access to this template');
    }

    // Attach the pre-fetched record so controllers/services avoid a second query.
    request.template = template;

    return true;
  }
}
