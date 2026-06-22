import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReviewsRepository } from '../repository/reviews.repository.js';
import type { WorkSpotsRepository } from '../../workspots/repository/workspots.repository.js';
import { makeReviewsService } from './reviews.service.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../shared/errors/AppError.js';
import type { Review, WorkSpot } from '@prisma/client';
import type { JwtUser } from '../../users/types/users.types.js';
import type { ReviewResponse } from '../types/reviews.types.js';

const ownerUser: JwtUser = { sub: 'user-1', email: 'owner@example.com', role: 'USER' };
const adminUser: JwtUser = { sub: 'admin-1', email: 'admin@example.com', role: 'ADMIN' };
const otherUser: JwtUser = { sub: 'user-2', email: 'other@example.com', role: 'USER' };

const fakeWorkspot: WorkSpot = {
  id: 'ws-1', name: 'Café', description: 'Desc', street: 'St', number: '1',
  complement: null, neighborhood: 'B', city: 'SP', state: 'SP', zipCode: '01310100',
  country: 'BR', latitude: '-23.55' as never, longitude: '-46.63' as never,
  createdById: 'user-1', createdAt: new Date(), updatedAt: new Date(),
};

const fakeReview: Review = {
  id: 'review-1', workspotId: 'ws-1', userId: 'user-1',
  content: 'Great place!', createdAt: new Date(), updatedAt: new Date(),
};

const fakeReviewResponse: ReviewResponse = {
  id: 'review-1', workspotId: 'ws-1', content: 'Great place!',
  author: { id: 'user-1', name: 'Test User' },
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

const mockRepository: ReviewsRepository = {
  findMany: vi.fn(),
  findById: vi.fn(),
  findByWorkSpotAndUser: vi.fn(),
  createWithAuthor: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockWorkSpotsRepository: WorkSpotsRepository = {
  findMany: vi.fn(),
  findById: vi.fn(),
  findRawById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  setTags: vi.fn(),
};

describe('ReviewsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReview', () => {
    it('should throw NotFoundError when workspot does not exist', async () => {
      vi.mocked(mockWorkSpotsRepository.findRawById).mockResolvedValueOnce(null);
      const service = makeReviewsService(mockRepository, mockWorkSpotsRepository);
      await expect(
        service.createReview('ws-99', ownerUser, { content: 'Great place!' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when user already reviewed this workspot', async () => {
      vi.mocked(mockWorkSpotsRepository.findRawById).mockResolvedValueOnce(fakeWorkspot);
      vi.mocked(mockRepository.findByWorkSpotAndUser).mockResolvedValueOnce(fakeReview);
      const service = makeReviewsService(mockRepository, mockWorkSpotsRepository);
      await expect(
        service.createReview('ws-1', ownerUser, { content: 'Another review!' }),
      ).rejects.toThrow(ConflictError);
    });

    it('should create review successfully', async () => {
      vi.mocked(mockWorkSpotsRepository.findRawById).mockResolvedValueOnce(fakeWorkspot);
      vi.mocked(mockRepository.findByWorkSpotAndUser).mockResolvedValueOnce(null);
      vi.mocked(mockRepository.createWithAuthor).mockResolvedValueOnce(fakeReviewResponse);
      const service = makeReviewsService(mockRepository, mockWorkSpotsRepository);

      const result = await service.createReview('ws-1', ownerUser, { content: 'Great place!' });
      expect(result.id).toBe('review-1');
      expect(result.author.name).toBe('Test User');
    });
  });

  describe('updateReview', () => {
    it('should throw NotFoundError when review does not exist', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(null);
      const service = makeReviewsService(mockRepository, mockWorkSpotsRepository);
      await expect(
        service.updateReview('review-99', ownerUser, { content: 'Updated' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when non-owner USER tries to update', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(fakeReview);
      const service = makeReviewsService(mockRepository, mockWorkSpotsRepository);
      await expect(
        service.updateReview('review-1', otherUser, { content: 'Updated' }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should allow admin to update any review', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(fakeReview);
      vi.mocked(mockRepository.update).mockResolvedValueOnce({
        ...fakeReviewResponse,
        content: 'Admin updated',
      });
      const service = makeReviewsService(mockRepository, mockWorkSpotsRepository);
      const result = await service.updateReview('review-1', adminUser, { content: 'Admin updated' });
      expect(result.content).toBe('Admin updated');
    });
  });

  describe('deleteReview', () => {
    it('should throw NotFoundError when review does not exist', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(null);
      const service = makeReviewsService(mockRepository, mockWorkSpotsRepository);
      await expect(service.deleteReview('review-99', ownerUser)).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError for non-owner USER', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(fakeReview);
      const service = makeReviewsService(mockRepository, mockWorkSpotsRepository);
      await expect(service.deleteReview('review-1', otherUser)).rejects.toThrow(ForbiddenError);
    });

    it('should delete review successfully', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(fakeReview);
      vi.mocked(mockRepository.delete).mockResolvedValueOnce(undefined);
      const service = makeReviewsService(mockRepository, mockWorkSpotsRepository);
      await expect(service.deleteReview('review-1', ownerUser)).resolves.toBeUndefined();
    });
  });
});
