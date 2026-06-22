import type { PrismaClient, WorkSpot } from '@prisma/client';
import type {
  WorkSpotDetailResponse,
  WorkSpotSummaryResponse,
} from '../types/workspots.types.js';

export interface FindManyFilters {
  readonly city?: string;
  readonly skip: number;
  readonly take: number;
}

export interface CreateWorkSpotData {
  readonly name: string;
  readonly description: string;
  readonly street: string;
  readonly number: string;
  readonly complement?: string;
  readonly neighborhood: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly createdById: string;
}

export interface UpdateWorkSpotData {
  readonly name?: string;
  readonly description?: string;
  readonly street?: string;
  readonly number?: string;
  readonly complement?: string;
  readonly neighborhood?: string;
  readonly city?: string;
  readonly state?: string;
  readonly zipCode?: string;
  readonly latitude?: number;
  readonly longitude?: number;
}

export interface WorkSpotsRepository {
  findMany(filters: FindManyFilters): Promise<{ workspots: WorkSpotSummaryResponse[]; total: number }>;
  findById(id: string): Promise<WorkSpotDetailResponse | null>;
  findRawById(id: string): Promise<WorkSpot | null>;
  create(data: CreateWorkSpotData): Promise<WorkSpot>;
  update(id: string, data: UpdateWorkSpotData): Promise<WorkSpot>;
  delete(id: string): Promise<void>;
  setTags(workspotId: string, tagIds: string[]): Promise<void>;
}

export function makeWorkSpotsRepository(prisma: PrismaClient): WorkSpotsRepository {
  return {
    async findMany(filters) {
      const where = filters.city ? { city: { equals: filters.city, mode: 'insensitive' as const } } : {};

      const [workspots, total] = await prisma.$transaction([
        prisma.workSpot.findMany({
          where,
          skip: filters.skip,
          take: filters.take,
          orderBy: { createdAt: 'desc' },
          include: {
            tags: { include: { tag: true } },
            _count: { select: { reviews: true } },
          },
        }),
        prisma.workSpot.count({ where }),
      ]);

      // Fetch average ratings per workspot in bulk
      const workspotIds = workspots.map((w) => w.id);
      const ratingsAgg = await prisma.rating.groupBy({
        by: ['workspotId'],
        where: { workspotId: { in: workspotIds } },
        _avg: { overall: true },
      });
      const ratingsByWorkspotId = new Map(ratingsAgg.map((r) => [r.workspotId, r._avg.overall]));

      return {
        workspots: workspots.map((w) => ({
          id: w.id,
          name: w.name,
          description: w.description,
          city: w.city,
          state: w.state,
          tags: w.tags.map((wt) => ({ id: wt.tag.id, name: wt.tag.name, slug: wt.tag.slug })),
          averageOverall: ratingsByWorkspotId.get(w.id) ?? null,
          reviewCount: w._count.reviews,
          createdAt: w.createdAt.toISOString(),
        })),
        total,
      };
    },

    async findById(id) {
      const workspot = await prisma.workSpot.findUnique({
        where: { id },
        include: {
          createdBy: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
          _count: { select: { reviews: true } },
        },
      });

      if (!workspot) return null;

      const ratingsAgg = await prisma.rating.aggregate({
        where: { workspotId: id },
        _avg: { overall: true, wifi: true, noise: true, powerOutlets: true, comfort: true },
        _count: { id: true },
      });

      return {
        id: workspot.id,
        name: workspot.name,
        description: workspot.description,
        address: {
          street: workspot.street,
          number: workspot.number,
          complement: workspot.complement,
          neighborhood: workspot.neighborhood,
          city: workspot.city,
          state: workspot.state,
          zipCode: workspot.zipCode,
          country: workspot.country,
        },
        coordinates: {
          latitude: Number(workspot.latitude),
          longitude: Number(workspot.longitude),
        },
        tags: workspot.tags.map((wt) => ({ id: wt.tag.id, name: wt.tag.name, slug: wt.tag.slug })),
        averageRatings: {
          overall: ratingsAgg._avg.overall ?? null,
          wifi: ratingsAgg._avg.wifi ?? null,
          noise: ratingsAgg._avg.noise ?? null,
          powerOutlets: ratingsAgg._avg.powerOutlets ?? null,
          comfort: ratingsAgg._avg.comfort ?? null,
          count: ratingsAgg._count.id,
        },
        reviewCount: workspot._count.reviews,
        createdBy: workspot.createdBy,
        createdAt: workspot.createdAt.toISOString(),
        updatedAt: workspot.updatedAt.toISOString(),
      };
    },

    findRawById(id) {
      return prisma.workSpot.findUnique({ where: { id } });
    },

    create(data) {
      return prisma.workSpot.create({ data });
    },

    update(id, data) {
      return prisma.workSpot.update({ where: { id }, data });
    },

    async delete(id) {
      await prisma.workSpot.delete({ where: { id } });
    },

    async setTags(workspotId, tagIds) {
      await prisma.$transaction([
        prisma.workSpotTag.deleteMany({ where: { workspotId } }),
        ...(tagIds.length > 0
          ? [prisma.workSpotTag.createMany({
              data: tagIds.map((tagId) => ({ workspotId, tagId })),
            })]
          : []),
      ]);
    },
  };
}
