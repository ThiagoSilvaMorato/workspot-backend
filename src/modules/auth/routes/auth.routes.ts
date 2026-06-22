import type { FastifyInstance } from 'fastify';
import { makeAuthRepository } from '../repository/auth.repository.js';
import { makeAuthService } from '../service/auth.service.js';
import { makeAuthController } from '../controller/auth.controller.js';
import {
  loginBodySchema,
  loginResponseSchema,
  logoutBodySchema,
  refreshBodySchema,
  refreshResponseSchema,
  registerBodySchema,
  registerResponseSchema,
} from '../schemas/auth.schemas.js';

export async function authRoutes(app: FastifyInstance) {
  const repository = makeAuthRepository(app.prisma);
  const service = makeAuthService(repository, app);
  const controller = makeAuthController(service);

  app.post(
    '/register',
    {
      schema: {
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
        body: logoutBodySchema,
      },
    },
    controller.logout,
  );
}
