import type { PrismaClient, Tag } from '@prisma/client';

export interface TagsRepository {
  findAll(): Promise<Tag[]>;
  findBySlug(slug: string): Promise<Tag | null>;
  findManyByIds(ids: string[]): Promise<Tag[]>;
  create(data: { name: string; slug: string }): Promise<Tag>;
}

export function makeTagsRepository(prisma: PrismaClient): TagsRepository {
  return {
    findAll() {
      return prisma.tag.findMany({ orderBy: { name: 'asc' } });
    },

    findBySlug(slug) {
      return prisma.tag.findUnique({ where: { slug } });
    },

    findManyByIds(ids) {
      return prisma.tag.findMany({ where: { id: { in: ids } } });
    },

    create(data) {
      return prisma.tag.create({ data });
    },
  };
}
