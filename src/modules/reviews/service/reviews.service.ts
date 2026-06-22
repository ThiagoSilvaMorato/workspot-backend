import type { ReviewsRepository } from '../repository/reviews.repository.js';
import type { WorkSpotsRepository } from '../../workspots/repository/workspots.repository.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../shared/errors/AppError.js';
import type { JwtUser, PaginatedResult, PaginationInput } from '../../users/types/users.types.js';
import type { CreateReviewInput, ReviewResponse, UpdateReviewInput } from '../types/reviews.types.js';

export function makeReviewsService(
  repository: ReviewsRepository,
  workSpotsRepository: WorkSpotsRepository,
) {
  async function listReviews(
    workspotId: string,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<ReviewResponse>> {
    const skip = (pagination.page - 1) * pagination.limit;
    const { reviews, total } = await repository.findMany({
      workspotId,
      skip,
      take: pagination.limit,
    });

    return {
      data: reviews,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async function createReview(
    workspotId: string,
    requestUser: JwtUser,
    data: CreateReviewInput,
  ): Promise<ReviewResponse> {
    const workspot = await workSpotsRepository.findRawById(workspotId);
    if (!workspot) {
      throw new NotFoundError('WorkSpot');
    }

    const existing = await repository.findByWorkSpotAndUser(workspotId, requestUser.sub);
    if (existing) {
      throw new ConflictError('You have already reviewed this WorkSpot');
    }

    return repository.createWithAuthor({
      workspotId,
      userId: requestUser.sub,
      content: data.content,
    });
  }

  async function updateReview(
    reviewId: string,
    requestUser: JwtUser,
    data: UpdateReviewInput,
  ): Promise<ReviewResponse> {
    const review = await repository.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review');
    }

    const isOwner = review.userId === requestUser.sub;
    const isAdmin = requestUser.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenError();
    }

    return repository.update(reviewId, { content: data.content });
  }

  async function deleteReview(reviewId: string, requestUser: JwtUser): Promise<void> {
    const review = await repository.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review');
    }

    const isOwner = review.userId === requestUser.sub;
    const isAdmin = requestUser.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenError();
    }

    await repository.delete(reviewId);
  }

  return { listReviews, createReview, updateReview, deleteReview };
}
