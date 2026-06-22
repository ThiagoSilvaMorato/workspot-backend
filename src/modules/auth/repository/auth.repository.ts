import type { PrismaClient, User, RefreshToken } from '@prisma/client';
import crypto from 'node:crypto';
import { env } from '../../../config/env.js';

export interface CreateUserData {
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
}

export interface CreateRefreshTokenData {
  readonly token: string;
  readonly familyId: string;
  readonly userId: string;
  readonly expiresAt: Date;
}

export interface AuthRepository {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(data: CreateUserData): Promise<User>;
  createRefreshToken(data: CreateRefreshTokenData): Promise<RefreshToken>;
  findRefreshToken(token: string): Promise<RefreshToken | null>;
  markRefreshTokenUsed(id: string): Promise<void>;
  createRefreshTokenInFamily(familyId: string, userId: string): Promise<RefreshToken>;
  deleteRefreshTokenFamily(familyId: string): Promise<void>;
  deleteRefreshToken(id: string): Promise<void>;
}

export function makeAuthRepository(prisma: PrismaClient): AuthRepository {
  function getRefreshTokenExpiresAt(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS);
    return expiresAt;
  }

  return {
    findUserByEmail(email) {
      return prisma.user.findUnique({ where: { email } });
    },

    findUserById(id) {
      return prisma.user.findUnique({ where: { id } });
    },

    createUser(data) {
      return prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
        },
      });
    },

    createRefreshToken(data) {
      return prisma.refreshToken.create({ data });
    },

    findRefreshToken(token) {
      return prisma.refreshToken.findUnique({ where: { token } });
    },

    async markRefreshTokenUsed(id) {
      await prisma.refreshToken.update({
        where: { id },
        data: { usedAt: new Date() },
      });
    },

    createRefreshTokenInFamily(familyId, userId) {
      return prisma.refreshToken.create({
        data: {
          token: crypto.randomBytes(32).toString('hex'),
          familyId,
          userId,
          expiresAt: getRefreshTokenExpiresAt(),
        },
      });
    },

    async deleteRefreshTokenFamily(familyId) {
      await prisma.refreshToken.deleteMany({ where: { familyId } });
    },

    async deleteRefreshToken(id) {
      await prisma.refreshToken.delete({ where: { id } });
    },
  };
}
