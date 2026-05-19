import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeTags(tags: string[] = []): string[] {
    return Array.from(
      new Set(tags.map((tag) => tag.toLowerCase().trim()).filter(Boolean)),
    );
  }

  async create(authorId: string, createTemplateDto: CreateTemplateDto) {
    const { tags, ...rest } = createTemplateDto;

    const normalizedTags = this.normalizeTags(tags);

    const tagConnections = normalizedTags.map((tag) => ({
      where: { name: tag },
      create: { name: tag },
    }));

    return this.prisma.template.create({
      data: {
        ...rest,
        authorId,
        tags: {
          connectOrCreate: tagConnections,
        },
      },
      include: {
        tags: true,
      },
    });
  }

  async findAll(tags?: string, isPublic?: boolean, userId?: string) {
    const where: any = {};

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    if (tags) {
      const tagList = tags
        .split(',')
        .map((t) => t.toLowerCase().trim())
        .filter(Boolean);
      if (tagList.length > 0) {
        where.tags = {
          some: {
            name: { in: tagList },
          },
        };
      }
    }

    // Se no for para buscar apenas pblicos, o usurio s pode ver os pblicos e os seus prprios
    if (!where.isPublic && userId) {
      where.OR = [{ isPublic: true }, { authorId: userId }];
    }

    return this.prisma.template.findMany({
      where,
      include: {
        tags: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: {
        tags: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async update(id: string, updateTemplateDto: UpdateTemplateDto) {
    const { tags, ...rest } = updateTemplateDto;

    const updateData: any = { ...rest };

    if (tags !== undefined) {
      const normalizedTags = this.normalizeTags(tags);
      const tagConnections = normalizedTags.map((tag) => ({
        where: { name: tag },
        create: { name: tag },
      }));

      // To update tags in Prisma we can set the relation entirely
      updateData.tags = {
        set: [], // Clear existing relations
        connectOrCreate: tagConnections, // Reconnect or create new ones
      };
    }

    return this.prisma.template.update({
      where: { id },
      data: updateData,
      include: {
        tags: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.template.delete({
      where: { id },
    });
  }
}
