import type { PrismaClient, Review } from '@prisma/client';
import type { ReviewResponse } from '../types/reviews.types.js';

export interface FindManyOptions {
  readonly workspotId: string;
  readonly skip: number;
  readonly take: number;
}

export interface ReviewsRepository {
  findMany(options: FindManyOptions): Promise<{ reviews: ReviewResponse[]; total: number }>;
  findById(id: string): Promise<Review | null>;
  findByWorkSpotAndUser(workspotId: string, userId: string): Promise<Review | null>;
  createWithAuthor(data: { workspotId: string; userId: string; content: string }): Promise<ReviewResponse>;
  update(id: string, data: { content: string }): Promise<ReviewResponse>;
  delete(id: string): Promise<void>;
}

export function makeReviewsRepository(prisma: PrismaClient): ReviewsRepository {
  return {
    async findMany(options) {
      const [reviews, total] = await prisma.$transaction([
        prisma.review.findMany({
          where: { workspotId: options.workspotId },
          skip: options.skip,
          take: options.take,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        }),
        prisma.review.count({ where: { workspotId: options.workspotId } }),
      ]);

      return {
        reviews: reviews.map((r) => ({
          id: r.id,
          workspotId: r.workspotId,
          content: r.content,
          author: r.user,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
        total,
      };
    },

    findById(id) {
      return prisma.review.findUnique({ where: { id } });
    },

    findByWorkSpotAndUser(workspotId, userId) {
      return prisma.review.findUnique({ where: { workspotId_userId: { workspotId, userId } } });
    },

    async createWithAuthor(data) {
      const review = await prisma.review.create({
        data,
        include: { user: { select: { id: true, name: true } } },
      });
      return {
        id: review.id,
        workspotId: review.workspotId,
        content: review.content,
        author: review.user,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
      };
    },

    async update(id, data) {
      const review = await prisma.review.update({
        where: { id },
        data,
        include: { user: { select: { id: true, name: true } } },
      });
      return {
        id: review.id,
        workspotId: review.workspotId,
        content: review.content,
        author: review.user,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
      };
    },

    async delete(id) {
      await prisma.review.delete({ where: { id } });
    },
  };
}
