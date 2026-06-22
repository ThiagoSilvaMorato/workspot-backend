import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { AuthRepository } from '../repository/auth.repository.js';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/AppError.js';
import { env } from '../../../config/env.js';
import type {
  AuthResponse,
  AuthTokensResponse,
  LoginInput,
  LogoutInput,
  RefreshInput,
  RegisterInput,
  UserResponse,
} from '../types/auth.types.js';

function toUserResponse(user: {
  id: string;
  name: string;
  email: string;
  role: string;
}): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function makeAuthService(repository: AuthRepository, app: FastifyInstance) {
  function generateAccessToken(user: { id: string; email: string; role: 'USER' | 'ADMIN' }): string {
    return app.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: env.JWT_EXPIRES_IN },
    );
  }

  async function register(data: RegisterInput): Promise<UserResponse> {
    const existing = await repository.findUserByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email already in use');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await repository.createUser({
      name: data.name,
      email: data.email,
      passwordHash,
    });

    return toUserResponse(user);
  }

  async function login(data: LoginInput): Promise<AuthResponse> {
    const user = await repository.findUserByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const accessToken = generateAccessToken(user);
    const familyId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS);

    const refreshTokenRecord = await repository.createRefreshToken({
      token: crypto.randomBytes(32).toString('hex'),
      familyId,
      userId: user.id,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: refreshTokenRecord.token,
      user: toUserResponse(user),
    };
  }

  async function refresh(data: RefreshInput): Promise<AuthTokensResponse> {
    const tokenRecord = await repository.findRefreshToken(data.refreshToken);

    if (!tokenRecord) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Reuse detected — revoke entire session family
    if (tokenRecord.usedAt !== null) {
      await repository.deleteRefreshTokenFamily(tokenRecord.familyId);
      throw new UnauthorizedError('Refresh token already used');
    }

    if (tokenRecord.expiresAt < new Date()) {
      await repository.deleteRefreshToken(tokenRecord.id);
      throw new UnauthorizedError('Refresh token expired');
    }

    const user = await repository.findUserById(tokenRecord.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Mark current token as used before issuing new one (rotation)
    await repository.markRefreshTokenUsed(tokenRecord.id);

    const accessToken = generateAccessToken(user);
    const newRefreshToken = await repository.createRefreshTokenInFamily(
      tokenRecord.familyId,
      user.id,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken.token,
    };
  }

  async function logout(data: LogoutInput): Promise<void> {
    const tokenRecord = await repository.findRefreshToken(data.refreshToken);
    if (!tokenRecord) {
      return; // Idempotent — already logged out
    }
    await repository.deleteRefreshTokenFamily(tokenRecord.familyId);
  }

  return { register, login, refresh, logout };
}
