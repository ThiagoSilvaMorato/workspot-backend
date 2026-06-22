import type { PrismaClient, Rating } from '@prisma/client';

export interface CreateRatingData {
  readonly workspotId: string;
  readonly userId: string;
  readonly overall: number;
  readonly wifi?: number;
  readonly noise?: number;
  readonly powerOutlets?: number;
  readonly comfort?: number;
}

export interface UpdateRatingData {
  readonly overall?: number;
  readonly wifi?: number;
  readonly noise?: number;
  readonly powerOutlets?: number;
  readonly comfort?: number;
}

export interface RatingsRepository {
  findByWorkSpotAndUser(workspotId: string, userId: string): Promise<Rating | null>;
  findById(id: string): Promise<Rating | null>;
  create(data: CreateRatingData): Promise<Rating>;
  update(id: string, data: UpdateRatingData): Promise<Rating>;
  delete(id: string): Promise<void>;
}

export function makeRatingsRepository(prisma: PrismaClient): RatingsRepository {
  return {
    findByWorkSpotAndUser(workspotId, userId) {
      return prisma.rating.findUnique({ where: { workspotId_userId: { workspotId, userId } } });
    },

    findById(id) {
      return prisma.rating.findUnique({ where: { id } });
    },

    create(data) {
      return prisma.rating.create({ data });
    },

    update(id, data) {
      return prisma.rating.update({ where: { id }, data });
    },

    async delete(id) {
      await prisma.rating.delete({ where: { id } });
    },
  };
}
