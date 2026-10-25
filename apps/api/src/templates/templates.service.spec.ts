import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TemplatesService, type ForkSource } from './templates.service';
import type { CreateTemplateDto } from './dto/create-template.dto';
import type { UpdateTemplateDto } from './dto/update-template.dto';
import type { PrismaService } from '../prisma/prisma.service';

type PrismaMock = {
  template: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  tag: {
    deleteMany: jest.Mock;
  };
};

const structure = {
  system: 'dnd5e',
  version: 1,
  tabs: [
    {
      id: 'main',
      label: 'Main',
      sections: [
        {
          id: 'core',
          title: 'Core',
          fields: [
            { id: 'str', label: 'Strength', type: 'number' as const },
            {
              id: 'mod',
              label: 'Modifier',
              type: 'formula' as const,
              expression: 'floor((str - 10) / 2)',
              dependencies: ['str'],
            },
          ],
        },
      ],
    },
  ],
};

describe('TemplatesService', () => {
  let prisma: PrismaMock;
  let service: TemplatesService;

  beforeEach(() => {
    prisma = {
      template: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      tag: {
        deleteMany: jest.fn(),
      },
    };

    service = new TemplatesService(prisma as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('defaults to own + public templates', async () => {
      prisma.template.count.mockResolvedValue(0);
      prisma.template.findMany.mockResolvedValue([]);

      await service.findAll(
        undefined,
        undefined,
        'user-1',
        undefined,
        undefined,
        undefined,
        1,
        10,
      );

      const args = prisma.template.findMany.mock.calls[0][0];
      expect(args.where.AND).toEqual(
        expect.arrayContaining([
          { OR: [{ isPublic: true }, { authorId: 'user-1' }] },
        ]),
      );
    });

    it('filters to the author for scope=mine', async () => {
      prisma.template.count.mockResolvedValue(0);
      prisma.template.findMany.mockResolvedValue([]);

      await service.findAll(
        undefined,
        undefined,
        'user-1',
        undefined,
        undefined,
        'mine',
        1,
        10,
      );

      const args = prisma.template.findMany.mock.calls[0][0];
      expect(args.where.AND).toEqual([{ authorId: 'user-1' }]);
    });

    it('filters to public templates for scope=public', async () => {
      prisma.template.count.mockResolvedValue(0);
      prisma.template.findMany.mockResolvedValue([]);

      await service.findAll(
        undefined,
        undefined,
        'user-1',
        undefined,
        undefined,
        'public',
        1,
        10,
      );

      const args = prisma.template.findMany.mock.calls[0][0];
      expect(args.where.AND).toEqual([{ isPublic: true }]);
    });

    it('clamps pagination bounds', async () => {
      prisma.template.count.mockResolvedValue(0);
      prisma.template.findMany.mockResolvedValue([]);

      await service.findAll(
        undefined,
        undefined,
        'user-1',
        undefined,
        undefined,
        'public',
        0,
        5000,
      );

      const args = prisma.template.findMany.mock.calls[0][0];
      expect(args.take).toBe(100);
      expect(args.skip).toBe(0);
    });
  });

  describe('create', () => {
    it('normalizes tags and derives the system from the structure', async () => {
      prisma.template.create.mockResolvedValue({ id: 'template-1' });

      await service.create('user-1', {
        name: 'Template',
        structure,
        tags: [' DnD ', 'dnd', ' Fantasy '],
      } as unknown as CreateTemplateDto);

      const args = prisma.template.create.mock.calls[0][0];
      expect(args.data.system).toBe('dnd5e');
      expect(args.data.version).toBe(1);
      expect(
        args.data.tags.connectOrCreate.map(
          (connection: { where: { name: string } }) => connection.where.name,
        ),
      ).toEqual(['dnd', 'fantasy']);
    });

    it('rejects an invalid formula before persisting', async () => {
      const invalid = {
        ...structure,
        tabs: [
          {
            ...structure.tabs[0],
            sections: [
              {
                ...structure.tabs[0].sections[0],
                fields: [
                  {
                    id: 'mod',
                    label: 'Modifier',
                    type: 'formula' as const,
                    expression: 'floor((str - 10',
                    dependencies: ['str'],
                  },
                ],
              },
            ],
          },
        ],
      };

      await expect(
        service.create('user-1', {
          name: 'Template',
          structure: invalid,
        } as unknown as CreateTemplateDto),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.template.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('bumps the version and keeps the DSL version in sync', async () => {
      prisma.template.findUnique.mockResolvedValue({
        id: 'template-1',
        version: 3,
        system: 'dnd5e',
      });
      prisma.template.update.mockResolvedValue({ id: 'template-1' });
      prisma.tag.deleteMany.mockResolvedValue({ count: 0 });

      await service.update('template-1', {
        structure,
        tags: ['dnd'],
      } as unknown as UpdateTemplateDto);

      const args = prisma.template.update.mock.calls[0][0];
      expect(args.data.version).toBe(4);
      expect(args.data.structure.version).toBe(4);
      expect(prisma.tag.deleteMany).toHaveBeenCalledWith({
        where: { templates: { none: {} }, sheets: { none: {} } },
      });
    });

    it('rejects an update for a missing template', async () => {
      prisma.template.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', {} as UpdateTemplateDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('rejects deletion when sheets depend on the template', async () => {
      prisma.template.findUnique.mockResolvedValue({
        id: 'template-1',
        _count: { sheets: 2 },
      });

      await expect(service.remove('template-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.template.delete).not.toHaveBeenCalled();
    });

    it('deletes a template without sheets', async () => {
      prisma.template.findUnique.mockResolvedValue({
        id: 'template-1',
        _count: { sheets: 0 },
      });
      prisma.template.delete.mockResolvedValue({ id: 'template-1' });

      await service.remove('template-1');

      expect(prisma.template.delete).toHaveBeenCalledWith({
        where: { id: 'template-1' },
      });
    });
  });

  describe('fork', () => {
    const source = {
      id: 'template-1',
      name: 'Public template',
      description: 'Description',
      structure,
      system: 'dnd5e',
      version: 2,
      isPublic: true,
      isOfficial: false,
      authorId: 'author-1',
      forkedFromId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [{ id: 'tag-1', name: 'dnd' }],
      author: { id: 'author-1', name: 'Author' },
    } as unknown as ForkSource;

    it('creates a private clone with lineage', async () => {
      prisma.template.create.mockResolvedValue({ id: 'fork-1' });

      await service.fork('user-1', source);

      const args = prisma.template.create.mock.calls[0][0];
      expect(args.data.authorId).toBe('user-1');
      expect(args.data.isPublic).toBe(false);
      expect(args.data.forkedFromId).toBe('template-1');
    });

    it('rejects forking another user private template', async () => {
      await expect(
        service.fork('user-1', {
          ...source,
          isPublic: false,
          authorId: 'author-1',
        } as ForkSource),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(prisma.template.create).not.toHaveBeenCalled();
    });
  });
});
