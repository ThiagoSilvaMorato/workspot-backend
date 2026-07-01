import type { FastifyInstance } from 'fastify';
import { makeAuthRepository } from '../repository/auth.repository.js';
import { makeAuthService } from '../service/auth.service.js';
import { makeAuthController } from '../controller/auth.controller.js';
import {
  changePasswordBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  loginResponseSchema,
  logoutBodySchema,
  messageResponseSchema,
  refreshBodySchema,
  refreshResponseSchema,
  registerBodySchema,
  registerResponseSchema,
  resetPasswordBodySchema,
} from '../schemas/auth.schemas.js';

export async function authRoutes(app: FastifyInstance) {
  const repository = makeAuthRepository(app.prisma);
  const service = makeAuthService(repository, app);
  const controller = makeAuthController(service);

  app.post(
    '/register',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Registrar novo usuário',
        body: registerBodySchema,
        response: { 201: registerResponseSchema },
      },
    },
    controller.register,
  );

  app.post(
    '/login',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Autenticar usuário',
        body: loginBodySchema,
        response: { 200: loginResponseSchema },
      },
    },
    controller.login,
  );

  app.post(
    '/refresh',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Renovar tokens de acesso',
        body: refreshBodySchema,
        response: { 200: refreshResponseSchema },
      },
    },
    controller.refresh,
  );

  app.delete(
    '/logout',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Auth'],
        summary: 'Revogar sessão (logout)',
        security: [{ bearerAuth: [] }],
        body: logoutBodySchema,
      },
    },
    controller.logout,
  );

  app.post(
    '/forgot-password',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Solicitar recuperação de senha por email',
        body: forgotPasswordBodySchema,
        response: { 200: messageResponseSchema },
      },
    },
    controller.forgotPassword,
  );

  app.post(
    '/reset-password',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Redefinir senha via token do email (usuário não autenticado)',
        body: resetPasswordBodySchema,
        response: { 200: messageResponseSchema },
      },
    },
    controller.resetPassword,
  );

  app.put(
    '/change-password',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Auth'],
        summary: 'Trocar senha (usuário autenticado, exige senha atual)',
        security: [{ bearerAuth: [] }],
        body: changePasswordBodySchema,
        response: { 200: messageResponseSchema },
      },
    },
    controller.changePassword,
  );
}
