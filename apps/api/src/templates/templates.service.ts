import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { validateFormulaDependencies } from './utils/template-structure.util';
import type { Prisma } from '../generated/prisma/client';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeTags(tags: string[] = []): string[] {
    return Array.from(
      new Set(tags.map((tag) => tag.toLowerCase().trim()).filter(Boolean)),
    );
  }

  private resolveSystem(
    structure: { system?: string },
    system?: string,
    fallback = 'custom',
  ): string {
    return (
      system?.toLowerCase().trim() ||
      structure?.system?.toLowerCase().trim() ||
      fallback
    );
  }

  async create(authorId: string, createTemplateDto: CreateTemplateDto) {
    const { tags, structure, system, version, ...rest } = createTemplateDto;

    validateFormulaDependencies(structure);

    const normalizedTags = this.normalizeTags(tags);
    const tagConnections = normalizedTags.map((tag) => ({
      where: { name: tag },
      create: { name: tag },
    }));

    return this.prisma.template.create({
      data: {
        ...rest,
        structure: structure as unknown as Prisma.InputJsonValue,
        system: this.resolveSystem(structure, system),
        version: version ?? structure?.version ?? 1,
        authorId,
        tags: {
          connectOrCreate: tagConnections,
        },
      },
      include: {
        tags: true,
        author: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findAll(
    tags?: string,
    isPublic?: string,
    userId?: string,
    search?: string,
    system?: string,
    scope?: string,
    page = 1,
    limit = 10,
  ) {
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));

    const conditions: Record<string, unknown>[] = [];

    if (scope === 'public') {
      conditions.push({ isPublic: true });
    } else if (scope === 'mine') {
      if (!userId) {
        conditions.push({ authorId: '' });
      } else {
        conditions.push({ authorId: userId });
      }
    } else {
      if (isPublic !== undefined) {
        const isPublicBool = isPublic === 'true';
        conditions.push({ isPublic: isPublicBool });
      }

      if (userId && !(isPublic === 'true')) {
        conditions.push({
          OR: [{ isPublic: true }, { authorId: userId }],
        });
      }
    }

    if (search) {
      const term = search.trim();
      conditions.push({
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    if (system) {
      conditions.push({ system: system.toLowerCase().trim() });
    }

    if (tags) {
      const tagList = tags
        .split(',')
        .map((t) => t.toLowerCase().trim())
        .filter(Boolean);
      if (tagList.length > 0) {
        conditions.push({
          tags: {
            some: {
              name: { in: tagList },
            },
          },
        });
      }
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const [total, data] = await Promise.all([
      this.prisma.template.count({ where }),
      this.prisma.template.findMany({
        where,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          tags: true,
          author: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: {
        tags: true,
        author: {
          select: { id: true, name: true },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async update(id: string, updateTemplateDto: UpdateTemplateDto) {
    const existing = await this.prisma.template.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Template not found');
    }

    const { tags, structure, system, version, ...rest } = updateTemplateDto;

    const updateData: Record<string, unknown> = { ...rest };

    if (structure !== undefined) {
      validateFormulaDependencies(structure);

      updateData.structure = structure;

      if (system === undefined) {
        updateData.system =
          structure.system?.toLowerCase().trim() ?? existing.system;
      }

      if (version === undefined) {
        updateData.version = existing.version + 1;
      }
    }

    if (system !== undefined) {
      updateData.system = system.toLowerCase().trim();
    }

    if (version !== undefined) {
      updateData.version = version;
    }

    if (tags !== undefined) {
      const normalizedTags = this.normalizeTags(tags);
      const tagConnections = normalizedTags.map((tag) => ({
        where: { name: tag },
        create: { name: tag },
      }));

      updateData.tags = {
        set: [],
        connectOrCreate: tagConnections,
      };
    }

    return this.prisma.template.update({
      where: { id },
      data: updateData,
      include: {
        tags: true,
        author: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async remove(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: { _count: { select: { sheets: true } } },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template._count.sheets > 0) {
      throw new ConflictException(
        'This template cannot be deleted because active character sheets depend on it',
      );
    }

    return this.prisma.template.delete({ where: { id } });
  }

  async fork(userId: string, sourceId: string) {
    const source = await this.prisma.template.findUnique({
      where: { id: sourceId },
      include: { tags: true },
    });

    if (!source) {
      throw new NotFoundException('Template not found');
    }

    if (!source.isPublic && source.authorId !== userId) {
      throw new ForbiddenException('You do not have access to this template');
    }

    const tagConnections = source.tags.map((tag) => ({
      where: { name: tag.name },
      create: { name: tag.name },
    }));

    return this.prisma.template.create({
      data: {
        name: `${source.name} (Copy)`,
        description: source.description,
        structure: source.structure as Prisma.InputJsonValue,
        system: source.system,
        version: source.version,
        isPublic: false,
        authorId: userId,
        forkedFromId: source.id,
        tags: {
          connectOrCreate: tagConnections,
        },
      },
      include: {
        tags: true,
        author: {
          select: { id: true, name: true },
        },
      },
    });
  }
}
