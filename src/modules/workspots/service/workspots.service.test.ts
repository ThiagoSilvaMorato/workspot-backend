import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WorkSpotsRepository } from '../repository/workspots.repository.js';
import type { TagsRepository } from '../../tags/repository/tags.repository.js';
import { makeWorkSpotsService } from './workspots.service.js';
import { ForbiddenError, NotFoundError } from '../../../shared/errors/AppError.js';
import type { Tag, WorkSpot } from '@prisma/client';
import type { JwtUser, WorkSpotDetailResponse } from '../types/workspots.types.js';

const ownerUser: JwtUser = { sub: 'user-1', email: 'owner@example.com', role: 'USER' };
const adminUser: JwtUser = { sub: 'admin-1', email: 'admin@example.com', role: 'ADMIN' };
const otherUser: JwtUser = { sub: 'user-2', email: 'other@example.com', role: 'USER' };

const fakeRawWorkspot: WorkSpot = {
  id: 'ws-1',
  name: 'Café Central',
  description: 'Great place to work',
  street: 'Rua das Flores',
  number: '123',
  complement: null,
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01310100',
  country: 'BR',
  latitude: '-23.55000000' as never,
  longitude: '-46.63000000' as never,
  createdById: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeDetail: WorkSpotDetailResponse = {
  id: 'ws-1',
  name: 'Café Central',
  description: 'Great place to work',
  address: {
    street: 'Rua das Flores',
    number: '123',
    complement: null,
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310100',
    country: 'BR',
  },
  coordinates: { latitude: -23.55, longitude: -46.63 },
  tags: [],
  averageRatings: { overall: null, wifi: null, noise: null, powerOutlets: null, comfort: null, count: 0 },
  reviewCount: 0,
  createdBy: { id: 'user-1', name: 'Test User' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fakeTag: Tag = { id: 'tag-1', name: 'Wi-Fi', slug: 'wi-fi' };

const mockRepository: WorkSpotsRepository = {
  findMany: vi.fn(),
  findById: vi.fn(),
  findRawById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  setTags: vi.fn(),
};

const mockTagsRepository: TagsRepository = {
  findAll: vi.fn(),
  findBySlug: vi.fn(),
  findManyByIds: vi.fn(),
  create: vi.fn(),
};

describe('WorkSpotsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWorkSpotById', () => {
    it('should throw NotFoundError when workspot does not exist', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(null);
      const service = makeWorkSpotsService(mockRepository, mockTagsRepository);
      await expect(service.getWorkSpotById('ws-99')).rejects.toThrow(NotFoundError);
    });

    it('should return workspot detail', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(fakeDetail);
      const service = makeWorkSpotsService(mockRepository, mockTagsRepository);
      const result = await service.getWorkSpotById('ws-1');
      expect(result.id).toBe('ws-1');
    });
  });

  describe('createWorkSpot', () => {
    const createInput = {
      name: 'Café Central', description: 'Great place to work',
      street: 'Rua das Flores', number: '123', neighborhood: 'Centro',
      city: 'São Paulo', state: 'SP', zipCode: '01310100',
      latitude: -23.55, longitude: -46.63, tagIds: [],
    };

    it('should create workspot without tags', async () => {
      vi.mocked(mockRepository.create).mockResolvedValueOnce(fakeRawWorkspot);
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(fakeDetail);
      const service = makeWorkSpotsService(mockRepository, mockTagsRepository);

      const result = await service.createWorkSpot(ownerUser, createInput);
      expect(result.id).toBe('ws-1');
      expect(mockTagsRepository.findManyByIds).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when tagIds contains invalid IDs', async () => {
      vi.mocked(mockTagsRepository.findManyByIds).mockResolvedValueOnce([]); // 0 found, 1 requested
      const service = makeWorkSpotsService(mockRepository, mockTagsRepository);

      await expect(
        service.createWorkSpot(ownerUser, { ...createInput, tagIds: ['invalid-tag-id'] }),
      ).rejects.toThrow(NotFoundError);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should associate tags when tagIds are valid', async () => {
      vi.mocked(mockTagsRepository.findManyByIds).mockResolvedValueOnce([fakeTag]);
      vi.mocked(mockRepository.create).mockResolvedValueOnce(fakeRawWorkspot);
      vi.mocked(mockRepository.setTags).mockResolvedValueOnce(undefined);
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(fakeDetail);
      const service = makeWorkSpotsService(mockRepository, mockTagsRepository);

      await service.createWorkSpot(ownerUser, { ...createInput, tagIds: ['tag-1'] });

      expect(mockRepository.setTags).toHaveBeenCalledWith('ws-1', ['tag-1']);
    });
  });

  describe('updateWorkSpot', () => {
    it('should throw NotFoundError when workspot does not exist', async () => {
      vi.mocked(mockRepository.findRawById).mockResolvedValueOnce(null);
      const service = makeWorkSpotsService(mockRepository, mockTagsRepository);
      await expect(service.updateWorkSpot('ws-99', ownerUser, { name: 'New' })).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when non-owner USER tries to update', async () => {
      vi.mocked(mockRepository.findRawById).mockResolvedValueOnce(fakeRawWorkspot);
      const service = makeWorkSpotsService(mockRepository, mockTagsRepository);
      await expect(service.updateWorkSpot('ws-1', otherUser, { name: 'New' })).rejects.toThrow(ForbiddenError);
    });

    it('should allow owner to update', async () => {
      vi.mocked(mockRepository.findRawById).mockResolvedValueOnce(fakeRawWorkspot);
      vi.mocked(mockRepository.update).mockResolvedValueOnce(fakeRawWorkspot);
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(fakeDetail);
      const service = makeWorkSpotsService(mockRepository, mockTagsRepository);

      const result = await service.updateWorkSpot('ws-1', ownerUser, { name: 'Updated' });
      expect(result.id).toBe('ws-1');
    });

    it('should allow admin to update any workspot', async () => {
      vi.mocked(mockRepository.findRawById).mockResolvedValueOnce(fakeRawWorkspot);
      vi.mocked(mockRepository.update).mockResolvedValueOnce(fakeRawWorkspot);
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(fakeDetail);
      const service = makeWorkSpotsService(mockRepository, mockTagsRepository);

      const result = await service.updateWorkSpot('ws-1', adminUser, { name: 'Admin Edit' });
      expect(result.id).toBe('ws-1');
    });
  });

  describe('deleteWorkSpot', () => {
    it('should throw ForbiddenError when non-owner USER tries to delete', async () => {
      vi.mocked(mockRepository.findRawById).mockResolvedValueOnce(fakeRawWorkspot);
      const service = makeWorkSpotsService(mockRepository, mockTagsRepository);
      await expect(service.deleteWorkSpot('ws-1', otherUser)).rejects.toThrow(ForbiddenError);
    });

    it('should allow owner to delete', async () => {
      vi.mocked(mockRepository.findRawById).mockResolvedValueOnce(fakeRawWorkspot);
      vi.mocked(mockRepository.delete).mockResolvedValueOnce(undefined);
      const service = makeWorkSpotsService(mockRepository, mockTagsRepository);
      await expect(service.deleteWorkSpot('ws-1', ownerUser)).resolves.toBeUndefined();
    });

    it('should allow admin to delete any workspot', async () => {
      vi.mocked(mockRepository.findRawById).mockResolvedValueOnce(fakeRawWorkspot);
      vi.mocked(mockRepository.delete).mockResolvedValueOnce(undefined);
      const service = makeWorkSpotsService(mockRepository, mockTagsRepository);
      await expect(service.deleteWorkSpot('ws-1', adminUser)).resolves.toBeUndefined();
    });
  });
});
