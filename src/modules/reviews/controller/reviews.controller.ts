import type { FastifyReply, FastifyRequest } from 'fastify';
import type { makeReviewsService } from '../service/reviews.service.js';
import type { CreateReviewInput, UpdateReviewInput } from '../types/reviews.types.js';

type ReviewsService = ReturnType<typeof makeReviewsService>;

export function makeReviewsController(service: ReviewsService) {
  async function listReviews(request: FastifyRequest, reply: FastifyReply) {
    const { workspotId } = request.params as { workspotId: string };
    const query = request.query as { page: number; limit: number };
    const result = await service.listReviews(workspotId, {
      page: query.page,
      limit: query.limit,
    });
    return reply.status(200).send(result);
  }

  async function createReview(request: FastifyRequest, reply: FastifyReply) {
    const { workspotId } = request.params as { workspotId: string };
    const body = request.body as CreateReviewInput;
    const review = await service.createReview(workspotId, request.user, body);
    return reply.status(201).send({ data: review });
  }

  async function updateReview(request: FastifyRequest, reply: FastifyReply) {
    const { reviewId } = request.params as { workspotId: string; reviewId: string };
    const body = request.body as UpdateReviewInput;
    const review = await service.updateReview(reviewId, request.user, body);
    return reply.status(200).send({ data: review });
  }

  async function deleteReview(request: FastifyRequest, reply: FastifyReply) {
    const { reviewId } = request.params as { workspotId: string; reviewId: string };
    await service.deleteReview(reviewId, request.user);
    return reply.status(204).send();
  }

  return { listReviews, createReview, updateReview, deleteReview };
}
