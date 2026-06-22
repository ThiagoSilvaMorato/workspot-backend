import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TagsRepository } from '../repository/tags.repository.js';
import { makeTagsService } from './tags.service.js';
import { ConflictError } from '../../../shared/errors/AppError.js';
import type { Tag } from '@prisma/client';

const fakeTag: Tag = { id: 'tag-1', name: 'Wi-Fi Rápido', slug: 'wi-fi-rapido' };

const mockRepository: TagsRepository = {
  findAll: vi.fn(),
  findBySlug: vi.fn(),
  findManyByIds: vi.fn(),
  create: vi.fn(),
};

describe('TagsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listTags', () => {
    it('should return all tags', async () => {
      vi.mocked(mockRepository.findAll).mockResolvedValueOnce([fakeTag]);
      const service = makeTagsService(mockRepository);

      const result = await service.listTags();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'tag-1', name: 'Wi-Fi Rápido', slug: 'wi-fi-rapido' });
    });
  });

  describe('createTag', () => {
    it('should throw ConflictError when slug already exists', async () => {
      vi.mocked(mockRepository.findBySlug).mockResolvedValueOnce(fakeTag);
      const service = makeTagsService(mockRepository);

      await expect(service.createTag({ name: 'Wi-Fi Rápido' })).rejects.toThrow(ConflictError);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should create tag with correct slug', async () => {
      vi.mocked(mockRepository.findBySlug).mockResolvedValueOnce(null);
      vi.mocked(mockRepository.create).mockResolvedValueOnce(fakeTag);
      const service = makeTagsService(mockRepository);

      const result = await service.createTag({ name: 'Wi-Fi Rápido' });

      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'Wi-Fi Rápido',
        slug: 'wi-fi-rapido',
      });
      expect(result.slug).toBe('wi-fi-rapido');
    });

    it('should generate correct slug for accented names', async () => {
      const tagWithAccents: Tag = { id: 'tag-2', name: 'Café Tranquilo', slug: 'cafe-tranquilo' };
      vi.mocked(mockRepository.findBySlug).mockResolvedValueOnce(null);
      vi.mocked(mockRepository.create).mockResolvedValueOnce(tagWithAccents);
      const service = makeTagsService(mockRepository);

      await service.createTag({ name: 'Café Tranquilo' });

      expect(mockRepository.findBySlug).toHaveBeenCalledWith('cafe-tranquilo');
    });
  });
});
