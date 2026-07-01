import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import type { AuthRepository } from '../repository/auth.repository.js';
import { makeAuthService } from './auth.service.js';
import { AppError, ConflictError, NotFoundError, UnauthorizedError } from '../../../shared/errors/AppError.js';
import type { User, RefreshToken, PasswordResetToken } from '@prisma/client';

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

const fakePasswordResetToken: PasswordResetToken = {
  id: 'reset-token-1',
  token: 'reset-hex-token',
  userId: 'user-1',
  usedAt: null,
  expiresAt: new Date(Date.now() + 30 * 60 * 1000),
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
  deleteAllRefreshTokensByUserId: vi.fn(),
  updateUserPassword: vi.fn(),
  createPasswordResetToken: vi.fn(),
  findPasswordResetToken: vi.fn(),
  markPasswordResetTokenUsed: vi.fn(),
  deletePasswordResetTokensByUserId: vi.fn(),
};

const mockApp = {
  jwt: {
    sign: vi.fn().mockReturnValue('mock-access-token'),
  },
  sendEmail: vi.fn().mockResolvedValue(undefined),
};

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictError when email already exists', async () => {
      vi.mocked(mockRepository.findUserByEmail).mockResolvedValueOnce(fakeUser);
      const service = makeAuthService(mockRepository, mockApp as never);

      await expect(
        service.register({ name: 'New', email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(ConflictError);

      expect(mockRepository.createUser).not.toHaveBeenCalled();
    });

    it('should create user and return user response', async () => {
      vi.mocked(mockRepository.findUserByEmail).mockResolvedValueOnce(null);
      vi.mocked(mockRepository.createUser).mockResolvedValueOnce(fakeUser);
      const service = makeAuthService(mockRepository, mockApp as never);

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
      const service = makeAuthService(mockRepository, mockApp as never);

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
      const service = makeAuthService(mockRepository, mockApp as never);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when password is wrong', async () => {
      vi.mocked(mockRepository.findUserByEmail).mockResolvedValueOnce(fakeUser);
      const service = makeAuthService(mockRepository, mockApp as never);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should return access and refresh tokens on valid credentials', async () => {
      vi.mocked(mockRepository.findUserByEmail).mockResolvedValueOnce(fakeUser);
      vi.mocked(mockRepository.createRefreshToken).mockResolvedValueOnce(fakeRefreshToken);
      const service = makeAuthService(mockRepository, mockApp as never);

      const result = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('abc123hex');
      expect(result.user.id).toBe('user-1');
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedError when token not found', async () => {
      vi.mocked(mockRepository.findRefreshToken).mockResolvedValueOnce(null);
      const service = makeAuthService(mockRepository, mockApp as never);

      await expect(service.refresh({ refreshToken: 'invalid' })).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('should revoke family and throw when token was already used (reuse detection)', async () => {
      const usedToken = { ...fakeRefreshToken, usedAt: new Date() };
      vi.mocked(mockRepository.findRefreshToken).mockResolvedValueOnce(usedToken);
      const service = makeAuthService(mockRepository, mockApp as never);

      await expect(service.refresh({ refreshToken: 'abc123hex' })).rejects.toThrow(
        UnauthorizedError,
      );
      expect(mockRepository.deleteRefreshTokenFamily).toHaveBeenCalledWith('family-1');
    });

    it('should throw UnauthorizedError when token is expired', async () => {
      const expiredToken = { ...fakeRefreshToken, expiresAt: new Date(Date.now() - 1000) };
      vi.mocked(mockRepository.findRefreshToken).mockResolvedValueOnce(expiredToken);
      const service = makeAuthService(mockRepository, mockApp as never);

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
      const service = makeAuthService(mockRepository, mockApp as never);

      const result = await service.refresh({ refreshToken: 'abc123hex' });

      expect(mockRepository.markRefreshTokenUsed).toHaveBeenCalledWith('token-1');
      expect(result.refreshToken).toBe('new-token-hex');
      expect(result.accessToken).toBe('mock-access-token');
    });
  });

  describe('logout', () => {
    it('should be idempotent when token not found', async () => {
      vi.mocked(mockRepository.findRefreshToken).mockResolvedValueOnce(null);
      const service = makeAuthService(mockRepository, mockApp as never);

      await expect(service.logout({ refreshToken: 'unknown' })).resolves.toBeUndefined();
      expect(mockRepository.deleteRefreshTokenFamily).not.toHaveBeenCalled();
    });

    it('should delete the entire token family on logout', async () => {
      vi.mocked(mockRepository.findRefreshToken).mockResolvedValueOnce(fakeRefreshToken);
      vi.mocked(mockRepository.deleteRefreshTokenFamily).mockResolvedValueOnce(undefined);
      const service = makeAuthService(mockRepository, mockApp as never);

      await service.logout({ refreshToken: 'abc123hex' });

      expect(mockRepository.deleteRefreshTokenFamily).toHaveBeenCalledWith('family-1');
    });
  });

  describe('forgotPassword', () => {
    it('should resolve without error and not send email when email does not exist', async () => {
      vi.mocked(mockRepository.findUserByEmail).mockResolvedValueOnce(null);
      const service = makeAuthService(mockRepository, mockApp as never);

      await expect(service.forgotPassword({ email: 'unknown@example.com' })).resolves.toBeUndefined();
      expect(mockRepository.createPasswordResetToken).not.toHaveBeenCalled();
      expect(mockApp.sendEmail).not.toHaveBeenCalled();
    });

    it('should delete previous tokens, create a new token and send email when email exists', async () => {
      vi.mocked(mockRepository.findUserByEmail).mockResolvedValueOnce(fakeUser);
      vi.mocked(mockRepository.deletePasswordResetTokensByUserId).mockResolvedValueOnce(undefined);
      vi.mocked(mockRepository.createPasswordResetToken).mockResolvedValueOnce(fakePasswordResetToken);
      const service = makeAuthService(mockRepository, mockApp as never);

      await service.forgotPassword({ email: 'test@example.com' });

      expect(mockRepository.deletePasswordResetTokensByUserId).toHaveBeenCalledWith('user-1');
      expect(mockRepository.createPasswordResetToken).toHaveBeenCalledOnce();
      expect(mockApp.sendEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Redefinição de senha - WorkSpot',
        expect.stringContaining('recuperar-senha'),
      );
    });
  });

  describe('resetPassword', () => {
    it('should throw AppError 400 when token is not found', async () => {
      vi.mocked(mockRepository.findPasswordResetToken).mockResolvedValueOnce(null);
      const service = makeAuthService(mockRepository, mockApp as never);

      await expect(
        service.resetPassword({ token: 'invalid', newPassword: 'newpass123' }),
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError 400 when token was already used', async () => {
      const usedToken = { ...fakePasswordResetToken, usedAt: new Date() };
      vi.mocked(mockRepository.findPasswordResetToken).mockResolvedValueOnce(usedToken);
      const service = makeAuthService(mockRepository, mockApp as never);

      await expect(
        service.resetPassword({ token: 'reset-hex-token', newPassword: 'newpass123' }),
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError 400 and delete tokens when token is expired', async () => {
      const expiredToken = { ...fakePasswordResetToken, expiresAt: new Date(Date.now() - 1000) };
      vi.mocked(mockRepository.findPasswordResetToken).mockResolvedValueOnce(expiredToken);
      vi.mocked(mockRepository.deletePasswordResetTokensByUserId).mockResolvedValueOnce(undefined);
      const service = makeAuthService(mockRepository, mockApp as never);

      await expect(
        service.resetPassword({ token: 'reset-hex-token', newPassword: 'newpass123' }),
      ).rejects.toThrow(AppError);
      expect(mockRepository.deletePasswordResetTokensByUserId).toHaveBeenCalledWith('user-1');
    });

    it('should mark token used, update password and revoke all refresh tokens on success', async () => {
      vi.mocked(mockRepository.findPasswordResetToken).mockResolvedValueOnce(fakePasswordResetToken);
      vi.mocked(mockRepository.markPasswordResetTokenUsed).mockResolvedValueOnce(undefined);
      vi.mocked(mockRepository.updateUserPassword).mockResolvedValueOnce(undefined as never);
      vi.mocked(mockRepository.deleteAllRefreshTokensByUserId).mockResolvedValueOnce(undefined);
      const service = makeAuthService(mockRepository, mockApp as never);

      await service.resetPassword({ token: 'reset-hex-token', newPassword: 'newpass123' });

      expect(mockRepository.markPasswordResetTokenUsed).toHaveBeenCalledWith('reset-token-1');
      expect(mockRepository.updateUserPassword).toHaveBeenCalledWith('user-1', expect.any(String));
      expect(mockRepository.deleteAllRefreshTokensByUserId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('changePassword', () => {
    it('should throw NotFoundError when user does not exist', async () => {
      vi.mocked(mockRepository.findUserById).mockResolvedValueOnce(null);
      const service = makeAuthService(mockRepository, mockApp as never);

      await expect(
        service.changePassword('nonexistent-id', { currentPassword: 'old', newPassword: 'newpass123' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw UnauthorizedError when current password is wrong', async () => {
      vi.mocked(mockRepository.findUserById).mockResolvedValueOnce(fakeUser);
      const service = makeAuthService(mockRepository, mockApp as never);

      await expect(
        service.changePassword('user-1', { currentPassword: 'wrongpassword', newPassword: 'newpass123' }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should update password and revoke all refresh tokens on success', async () => {
      vi.mocked(mockRepository.findUserById).mockResolvedValueOnce(fakeUser);
      vi.mocked(mockRepository.updateUserPassword).mockResolvedValueOnce(undefined as never);
      vi.mocked(mockRepository.deleteAllRefreshTokensByUserId).mockResolvedValueOnce(undefined);
      const service = makeAuthService(mockRepository, mockApp as never);

      await service.changePassword('user-1', { currentPassword: 'password123', newPassword: 'newpass123' });

      expect(mockRepository.updateUserPassword).toHaveBeenCalledWith('user-1', expect.any(String));
      expect(mockRepository.deleteAllRefreshTokensByUserId).toHaveBeenCalledWith('user-1');
    });
  });
});
