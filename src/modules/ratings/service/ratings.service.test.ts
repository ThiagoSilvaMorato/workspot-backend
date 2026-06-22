import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RatingsRepository } from '../repository/ratings.repository.js';
import type { WorkSpotsRepository } from '../../workspots/repository/workspots.repository.js';
import { makeRatingsService } from './ratings.service.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/AppError.js';
import type { Rating, WorkSpot } from '@prisma/client';
import type { JwtUser } from '../../users/types/users.types.js';

const ownerUser: JwtUser = { sub: 'user-1', email: 'owner@example.com', role: 'USER' };
const adminUser: JwtUser = { sub: 'admin-1', email: 'admin@example.com', role: 'ADMIN' };

const fakeWorkspot: WorkSpot = {
  id: 'ws-1', name: 'Café', description: 'Desc', street: 'St', number: '1',
  complement: null, neighborhood: 'Bairro', city: 'SP', state: 'SP', zipCode: '01310100',
  country: 'BR', latitude: '-23.55' as never, longitude: '-46.63' as never,
  createdById: 'user-1', createdAt: new Date(), updatedAt: new Date(),
};

const fakeRating: Rating = {
  id: 'rating-1', workspotId: 'ws-1', userId: 'user-1',
  overall: 4, wifi: 5, noise: 3, powerOutlets: 4, comfort: 5,
  createdAt: new Date(), updatedAt: new Date(),
};

const mockRepository: RatingsRepository = {
  findByWorkSpotAndUser: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
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

describe('RatingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRating', () => {
    it('should throw NotFoundError when workspot does not exist', async () => {
      vi.mocked(mockWorkSpotsRepository.findRawById).mockResolvedValueOnce(null);
      const service = makeRatingsService(mockRepository, mockWorkSpotsRepository);
      await expect(service.createRating('ws-99', ownerUser, { overall: 4 })).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when user already has a rating', async () => {
      vi.mocked(mockWorkSpotsRepository.findRawById).mockResolvedValueOnce(fakeWorkspot);
      vi.mocked(mockRepository.findByWorkSpotAndUser).mockResolvedValueOnce(fakeRating);
      const service = makeRatingsService(mockRepository, mockWorkSpotsRepository);
      await expect(service.createRating('ws-1', ownerUser, { overall: 4 })).rejects.toThrow(ConflictError);
    });

    it('should create rating successfully', async () => {
      vi.mocked(mockWorkSpotsRepository.findRawById).mockResolvedValueOnce(fakeWorkspot);
      vi.mocked(mockRepository.findByWorkSpotAndUser).mockResolvedValueOnce(null);
      vi.mocked(mockRepository.create).mockResolvedValueOnce(fakeRating);
      const service = makeRatingsService(mockRepository, mockWorkSpotsRepository);

      const result = await service.createRating('ws-1', ownerUser, { overall: 4 });
      expect(result.overall).toBe(4);
      expect(result.userId).toBe('user-1');
    });
  });

  describe('updateRating', () => {
    it('should throw NotFoundError when rating does not exist', async () => {
      vi.mocked(mockRepository.findByWorkSpotAndUser).mockResolvedValueOnce(null);
      const service = makeRatingsService(mockRepository, mockWorkSpotsRepository);
      await expect(service.updateRating('ws-1', ownerUser, { overall: 5 })).rejects.toThrow(NotFoundError);
    });

    it('should update rating successfully', async () => {
      vi.mocked(mockRepository.findByWorkSpotAndUser).mockResolvedValueOnce(fakeRating);
      vi.mocked(mockRepository.update).mockResolvedValueOnce({ ...fakeRating, overall: 5 });
      const service = makeRatingsService(mockRepository, mockWorkSpotsRepository);

      const result = await service.updateRating('ws-1', ownerUser, { overall: 5 });
      expect(result.overall).toBe(5);
    });

    it('should allow admin to update any rating', async () => {
      vi.mocked(mockRepository.findByWorkSpotAndUser).mockResolvedValueOnce(fakeRating);
      vi.mocked(mockRepository.update).mockResolvedValueOnce({ ...fakeRating, overall: 3 });
      const service = makeRatingsService(mockRepository, mockWorkSpotsRepository);

      const result = await service.updateRating('ws-1', adminUser, { overall: 3 });
      expect(result.overall).toBe(3);
    });
  });

  describe('deleteRating', () => {
    it('should throw NotFoundError when rating does not exist', async () => {
      vi.mocked(mockRepository.findByWorkSpotAndUser).mockResolvedValueOnce(null);
      const service = makeRatingsService(mockRepository, mockWorkSpotsRepository);
      await expect(service.deleteRating('ws-1', ownerUser)).rejects.toThrow(NotFoundError);
    });

    it('should delete rating successfully', async () => {
      vi.mocked(mockRepository.findByWorkSpotAndUser).mockResolvedValueOnce(fakeRating);
      vi.mocked(mockRepository.delete).mockResolvedValueOnce(undefined);
      const service = makeRatingsService(mockRepository, mockWorkSpotsRepository);
      await expect(service.deleteRating('ws-1', ownerUser)).resolves.toBeUndefined();
    });
  });
});
