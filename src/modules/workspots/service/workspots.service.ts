import type { WorkSpotsRepository } from '../repository/workspots.repository.js';
import type { TagsRepository } from '../../tags/repository/tags.repository.js';
import { ForbiddenError, NotFoundError } from '../../../shared/errors/AppError.js';
import type {
  CreateWorkSpotInput,
  JwtUser,
  ListWorkSpotsFilters,
  PaginatedResult,
  UpdateWorkSpotInput,
  WorkSpotDetailResponse,
  WorkSpotSummaryResponse,
} from '../types/workspots.types.js';

export function makeWorkSpotsService(
  repository: WorkSpotsRepository,
  tagsRepository: TagsRepository,
) {
  async function listWorkSpots(
    filters: ListWorkSpotsFilters,
  ): Promise<PaginatedResult<WorkSpotSummaryResponse>> {
    const skip = (filters.page - 1) * filters.limit;
    const { workspots, total } = await repository.findMany({
      city: filters.city,
      skip,
      take: filters.limit,
    });

    return {
      data: workspots,
      meta: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async function getWorkSpotById(id: string): Promise<WorkSpotDetailResponse> {
    const workspot = await repository.findById(id);
    if (!workspot) {
      throw new NotFoundError('WorkSpot');
    }
    return workspot;
  }

  async function createWorkSpot(
    requestUser: JwtUser,
    data: CreateWorkSpotInput,
  ): Promise<WorkSpotDetailResponse> {
    if (data.tagIds.length > 0) {
      const foundTags = await tagsRepository.findManyByIds(data.tagIds);
      if (foundTags.length !== data.tagIds.length) {
        throw new NotFoundError('One or more tags');
      }
    }

    const { tagIds, ...workspotData } = data;
    const workspot = await repository.create({
      ...workspotData,
      createdById: requestUser.sub,
    });

    if (tagIds.length > 0) {
      await repository.setTags(workspot.id, tagIds);
    }

    const detail = await repository.findById(workspot.id);
    if (!detail) {
      throw new NotFoundError('WorkSpot');
    }
    return detail;
  }

  async function updateWorkSpot(
    workspotId: string,
    requestUser: JwtUser,
    data: UpdateWorkSpotInput,
  ): Promise<WorkSpotDetailResponse> {
    const workspot = await repository.findRawById(workspotId);
    if (!workspot) {
      throw new NotFoundError('WorkSpot');
    }

    const isOwner = workspot.createdById === requestUser.sub;
    const isAdmin = requestUser.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenError();
    }

    if (data.tagIds !== undefined) {
      if (data.tagIds.length > 0) {
        const foundTags = await tagsRepository.findManyByIds(data.tagIds);
        if (foundTags.length !== data.tagIds.length) {
          throw new NotFoundError('One or more tags');
        }
      }
      await repository.setTags(workspotId, data.tagIds);
    }

    const { tagIds: _, ...updateData } = data;
    if (Object.keys(updateData).length > 0) {
      await repository.update(workspotId, updateData);
    }

    const detail = await repository.findById(workspotId);
    if (!detail) {
      throw new NotFoundError('WorkSpot');
    }
    return detail;
  }

  async function deleteWorkSpot(workspotId: string, requestUser: JwtUser): Promise<void> {
    const workspot = await repository.findRawById(workspotId);
    if (!workspot) {
      throw new NotFoundError('WorkSpot');
    }

    const isOwner = workspot.createdById === requestUser.sub;
    const isAdmin = requestUser.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenError();
    }

    await repository.delete(workspotId);
  }

  return { listWorkSpots, getWorkSpotById, createWorkSpot, updateWorkSpot, deleteWorkSpot };
}
