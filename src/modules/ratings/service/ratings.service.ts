import type { RatingsRepository } from '../repository/ratings.repository.js';
import type { WorkSpotsRepository } from '../../workspots/repository/workspots.repository.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../shared/errors/AppError.js';
import type { JwtUser } from '../../users/types/users.types.js';
import type { CreateRatingInput, RatingResponse, UpdateRatingInput } from '../types/ratings.types.js';

function toRatingResponse(rating: {
  id: string;
  workspotId: string;
  userId: string;
  overall: number;
  wifi: number | null;
  noise: number | null;
  powerOutlets: number | null;
  comfort: number | null;
  createdAt: Date;
  updatedAt: Date;
}): RatingResponse {
  return {
    id: rating.id,
    workspotId: rating.workspotId,
    userId: rating.userId,
    overall: rating.overall,
    wifi: rating.wifi,
    noise: rating.noise,
    powerOutlets: rating.powerOutlets,
    comfort: rating.comfort,
    createdAt: rating.createdAt.toISOString(),
    updatedAt: rating.updatedAt.toISOString(),
  };
}

export function makeRatingsService(
  repository: RatingsRepository,
  workSpotsRepository: WorkSpotsRepository,
) {
  async function createRating(
    workspotId: string,
    requestUser: JwtUser,
    data: CreateRatingInput,
  ): Promise<RatingResponse> {
    const workspot = await workSpotsRepository.findRawById(workspotId);
    if (!workspot) {
      throw new NotFoundError('WorkSpot');
    }

    const existing = await repository.findByWorkSpotAndUser(workspotId, requestUser.sub);
    if (existing) {
      throw new ConflictError('You have already rated this WorkSpot');
    }

    const rating = await repository.create({ ...data, workspotId, userId: requestUser.sub });
    return toRatingResponse(rating);
  }

  async function updateRating(
    workspotId: string,
    requestUser: JwtUser,
    data: UpdateRatingInput,
  ): Promise<RatingResponse> {
    const rating = await repository.findByWorkSpotAndUser(workspotId, requestUser.sub);
    if (!rating) {
      throw new NotFoundError('Rating');
    }

    const isOwner = rating.userId === requestUser.sub;
    const isAdmin = requestUser.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenError();
    }

    const updated = await repository.update(rating.id, data);
    return toRatingResponse(updated);
  }

  async function deleteRating(workspotId: string, requestUser: JwtUser): Promise<void> {
    const rating = await repository.findByWorkSpotAndUser(workspotId, requestUser.sub);
    if (!rating) {
      throw new NotFoundError('Rating');
    }

    const isOwner = rating.userId === requestUser.sub;
    const isAdmin = requestUser.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenError();
    }

    await repository.delete(rating.id);
  }

  return { createRating, updateRating, deleteRating };
}
