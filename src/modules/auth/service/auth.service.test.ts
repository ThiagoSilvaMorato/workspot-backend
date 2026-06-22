import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import type { AuthRepository } from '../repository/auth.repository.js';
import { makeAuthService } from './auth.service.js';
import { ConflictError, UnauthorizedError } from '../../../shared/errors/AppError.js';
import type { User, RefreshToken } from '@prisma/client';

const fakeUser: User = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  passwordHash: bcrypt.hashSync('password123', 12),
  avatarUrl: null,
  role: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeRefreshToken: RefreshToken = {
  id: 'token-1',
  token: 'abc123hex',
  familyId: 'family-1',
  userId: 'user-1',
  usedAt: null,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
};

const mockRepository: AuthRepository = {
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  createRefreshToken: vi.fn(),
  findRefreshToken: vi.fn(),
  markRefreshTokenUsed: vi.fn(),
  createRefreshTokenInFamily: vi.fn(),
  deleteRefreshTokenFamily: vi.fn(),
  deleteRefreshToken: vi.fn(),
};

const mockApp = {
  jwt: {
    sign: vi.fn().mockReturnValue('mock-access-token'),
  },
} as never;

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictError when email already exists', async () => {
      vi.mocked(mockRepository.findUserByEmail).mockResolvedValueOnce(fakeUser);
      const service = makeAuthService(mockRepository, mockApp);

      await expect(
        service.register({ name: 'New', email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(ConflictError);

      expect(mockRepository.createUser).not.toHaveBeenCalled();
    });

    it('should create user and return user response', async () => {
      vi.mocked(mockRepository.findUserByEmail).mockResolvedValueOnce(null);
      vi.mocked(mockRepository.createUser).mockResolvedValueOnce(fakeUser);
      const service = makeAuthService(mockRepository, mockApp);

      const result = await service.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toMatchObject({ id: 'user-1', email: 'test@example.com', role: 'USER' });
      expect(mockRepository.createUser).toHaveBeenCalledOnce();
    });

    it('should hash the password before creating the user', async () => {
      vi.mocked(mockRepository.findUserByEmail).mockResolvedValueOnce(null);
      vi.mocked(mockRepository.createUser).mockResolvedValueOnce(fakeUser);
      const service = makeAuthService(mockRepository, mockApp);

      await service.register({ name: 'Test', email: 'test@example.com', password: 'plaintext' });

      const callArg = vi.mocked(mockRepository.createUser).mock.calls[0]?.[0];
      expect(callArg?.passwordHash).not.toBe('plaintext');
      const isHashed = await bcrypt.compare('plaintext', callArg?.passwordHash ?? '');
      expect(isHashed).toBe(true);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedError when email not found', async () => {
      vi.mocked(mockRepository.findUserByEmail).mockResolvedValueOnce(null);
      const service = makeAuthService(mockRepository, mockApp);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when password is wrong', async () => {
      vi.mocked(mockRepository.findUserByEmail).mockResolvedValueOnce(fakeUser);
      const service = makeAuthService(mockRepository, mockApp);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should return access and refresh tokens on valid credentials', async () => {
      vi.mocked(mockRepository.findUserByEmail).mockResolvedValueOnce(fakeUser);
      vi.mocked(mockRepository.createRefreshToken).mockResolvedValueOnce(fakeRefreshToken);
      const service = makeAuthService(mockRepository, mockApp);

      const result = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('abc123hex');
      expect(result.user.id).toBe('user-1');
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedError when token not found', async () => {
      vi.mocked(mockRepository.findRefreshToken).mockResolvedValueOnce(null);
      const service = makeAuthService(mockRepository, mockApp);

      await expect(service.refresh({ refreshToken: 'invalid' })).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('should revoke family and throw when token was already used (reuse detection)', async () => {
      const usedToken = { ...fakeRefreshToken, usedAt: new Date() };
      vi.mocked(mockRepository.findRefreshToken).mockResolvedValueOnce(usedToken);
      const service = makeAuthService(mockRepository, mockApp);

      await expect(service.refresh({ refreshToken: 'abc123hex' })).rejects.toThrow(
        UnauthorizedError,
      );
      expect(mockRepository.deleteRefreshTokenFamily).toHaveBeenCalledWith('family-1');
    });

    it('should throw UnauthorizedError when token is expired', async () => {
      const expiredToken = { ...fakeRefreshToken, expiresAt: new Date(Date.now() - 1000) };
      vi.mocked(mockRepository.findRefreshToken).mockResolvedValueOnce(expiredToken);
      const service = makeAuthService(mockRepository, mockApp);

      await expect(service.refresh({ refreshToken: 'abc123hex' })).rejects.toThrow(
        UnauthorizedError,
      );
      expect(mockRepository.deleteRefreshToken).toHaveBeenCalledWith('token-1');
    });

    it('should rotate tokens on valid refresh', async () => {
      vi.mocked(mockRepository.findRefreshToken).mockResolvedValueOnce(fakeRefreshToken);
      vi.mocked(mockRepository.findUserById).mockResolvedValueOnce(fakeUser);
      vi.mocked(mockRepository.markRefreshTokenUsed).mockResolvedValueOnce(undefined);
      vi.mocked(mockRepository.createRefreshTokenInFamily).mockResolvedValueOnce({
        ...fakeRefreshToken,
        token: 'new-token-hex',
      });
      const service = makeAuthService(mockRepository, mockApp);

      const result = await service.refresh({ refreshToken: 'abc123hex' });

      expect(mockRepository.markRefreshTokenUsed).toHaveBeenCalledWith('token-1');
      expect(result.refreshToken).toBe('new-token-hex');
      expect(result.accessToken).toBe('mock-access-token');
    });
  });

  describe('logout', () => {
    it('should be idempotent when token not found', async () => {
      vi.mocked(mockRepository.findRefreshToken).mockResolvedValueOnce(null);
      const service = makeAuthService(mockRepository, mockApp);

      await expect(service.logout({ refreshToken: 'unknown' })).resolves.toBeUndefined();
      expect(mockRepository.deleteRefreshTokenFamily).not.toHaveBeenCalled();
    });

    it('should delete the entire token family on logout', async () => {
      vi.mocked(mockRepository.findRefreshToken).mockResolvedValueOnce(fakeRefreshToken);
      vi.mocked(mockRepository.deleteRefreshTokenFamily).mockResolvedValueOnce(undefined);
      const service = makeAuthService(mockRepository, mockApp);

      await service.logout({ refreshToken: 'abc123hex' });

      expect(mockRepository.deleteRefreshTokenFamily).toHaveBeenCalledWith('family-1');
    });
  });
});
