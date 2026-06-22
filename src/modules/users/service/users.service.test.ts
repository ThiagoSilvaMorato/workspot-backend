import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UsersRepository } from '../repository/users.repository.js';
import { makeUsersService } from './users.service.js';
import { ForbiddenError, NotFoundError } from '../../../shared/errors/AppError.js';
import type { User } from '@prisma/client';
import type { JwtUser } from '../types/users.types.js';

const fakeUser: User = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  passwordHash: 'hash',
  avatarUrl: null,
  role: 'USER',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const adminUser: JwtUser = { sub: 'admin-1', email: 'admin@example.com', role: 'ADMIN' };
const regularUser: JwtUser = { sub: 'user-1', email: 'test@example.com', role: 'USER' };
const otherUser: JwtUser = { sub: 'user-2', email: 'other@example.com', role: 'USER' };

const mockRepository: UsersRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

describe('UsersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should throw ForbiddenError for non-admin users', async () => {
      const service = makeUsersService(mockRepository);
      await expect(
        service.listUsers(regularUser, { page: 1, limit: 20 }),
      ).rejects.toThrow(ForbiddenError);
      expect(mockRepository.findAll).not.toHaveBeenCalled();
    });

    it('should return paginated users for admin', async () => {
      vi.mocked(mockRepository.findAll).mockResolvedValueOnce({ users: [fakeUser], total: 1 });
      const service = makeUsersService(mockRepository);

      const result = await service.listUsers(adminUser, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('getUserById', () => {
    it('should throw NotFoundError for unknown user', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(null);
      const service = makeUsersService(mockRepository);
      await expect(service.getUserById('unknown')).rejects.toThrow(NotFoundError);
    });

    it('should return the user public response', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(fakeUser);
      const service = makeUsersService(mockRepository);

      const result = await service.getUserById('user-1');
      expect(result.id).toBe('user-1');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('updateUser', () => {
    it('should throw ForbiddenError when regular user tries to update another user', async () => {
      const service = makeUsersService(mockRepository);
      await expect(
        service.updateUser('user-2', regularUser, { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should allow owner to update their own profile', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(fakeUser);
      vi.mocked(mockRepository.update).mockResolvedValueOnce({ ...fakeUser, name: 'Updated' });
      const service = makeUsersService(mockRepository);

      const result = await service.updateUser('user-1', regularUser, { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('should allow admin to update any user', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(fakeUser);
      vi.mocked(mockRepository.update).mockResolvedValueOnce({ ...fakeUser, name: 'Admin Edit' });
      const service = makeUsersService(mockRepository);

      const result = await service.updateUser('user-1', adminUser, { name: 'Admin Edit' });
      expect(result.name).toBe('Admin Edit');
    });

    it('should throw NotFoundError when user does not exist', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(null);
      const service = makeUsersService(mockRepository);

      await expect(
        service.updateUser('user-1', regularUser, { name: 'New' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteUser', () => {
    it('should throw ForbiddenError when regular user tries to delete another user', async () => {
      const service = makeUsersService(mockRepository);
      await expect(service.deleteUser('user-2', regularUser)).rejects.toThrow(ForbiddenError);
    });

    it('should allow owner to delete their own account', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(fakeUser);
      vi.mocked(mockRepository.delete).mockResolvedValueOnce(undefined);
      const service = makeUsersService(mockRepository);

      await expect(service.deleteUser('user-1', regularUser)).resolves.toBeUndefined();
      expect(mockRepository.delete).toHaveBeenCalledWith('user-1');
    });

    it('should allow admin to delete any user', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(fakeUser);
      vi.mocked(mockRepository.delete).mockResolvedValueOnce(undefined);
      const service = makeUsersService(mockRepository);

      await expect(service.deleteUser('user-1', adminUser)).resolves.toBeUndefined();
    });

    it('should throw NotFoundError when user does not exist', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(null);
      const service = makeUsersService(mockRepository);

      await expect(service.deleteUser('user-1', otherUser)).rejects.toThrow(ForbiddenError);
    });
  });
});
