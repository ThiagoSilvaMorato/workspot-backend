import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { AuthRepository } from '../repository/auth.repository.js';
import {
  AppError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/AppError.js';
import { env } from '../../../config/env.js';
import { buildPasswordResetEmail } from '../../../shared/email/templates/password-reset.template.js';
import type {
  AuthResponse,
  AuthTokensResponse,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  RefreshInput,
  RegisterInput,
  ResetPasswordInput,
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

  async function forgotPassword(data: ForgotPasswordInput): Promise<void> {
    const user = await repository.findUserByEmail(data.email);
    if (!user) {
      // Não revelar se email existe (evita user enumeration)
      return;
    }

    await repository.deletePasswordResetTokensByUserId(user.id);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + env.PASSWORD_RESET_EXPIRES_IN_MINUTES * 60 * 1000,
    );
    await repository.createPasswordResetToken(user.id, token, expiresAt);

    const resetUrl = `${env.APP_URL}/recuperar-senha?token=${token}`;
    const html = buildPasswordResetEmail(resetUrl, env.PASSWORD_RESET_EXPIRES_IN_MINUTES);
    await app.sendEmail(user.email, 'Redefinição de senha - WorkSpot', html);
  }

  async function resetPassword(data: ResetPasswordInput): Promise<void> {
    const tokenRecord = await repository.findPasswordResetToken(data.token);

    if (!tokenRecord) {
      throw new AppError('Token inválido ou expirado', 400);
    }
    if (tokenRecord.usedAt !== null) {
      throw new AppError('Token já utilizado', 400);
    }
    if (tokenRecord.expiresAt < new Date()) {
      await repository.deletePasswordResetTokensByUserId(tokenRecord.userId);
      throw new AppError('Token expirado', 400);
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, 12);
    await repository.markPasswordResetTokenUsed(tokenRecord.id);
    await repository.updateUserPassword(tokenRecord.userId, newPasswordHash);
    await repository.deleteAllRefreshTokensByUserId(tokenRecord.userId);
  }

  async function changePassword(userId: string, data: ChangePasswordInput): Promise<void> {
    const user = await repository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    const passwordMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Senha atual incorreta');
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, 12);
    await repository.updateUserPassword(userId, newPasswordHash);
    await repository.deleteAllRefreshTokensByUserId(userId);
  }

  return { register, login, refresh, logout, forgotPassword, resetPassword, changePassword };
}
