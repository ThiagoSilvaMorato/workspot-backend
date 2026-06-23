import type { FastifyInstance } from 'fastify';
import { makeUsersRepository } from '../repository/users.repository.js';
import { makeUsersService } from '../service/users.service.js';
import { makeUsersController } from '../controller/users.controller.js';
import {
  getUserResponseSchema,
  listUsersQuerySchema,
  listUsersResponseSchema,
  updateUserBodySchema,
  updateUserResponseSchema,
  userIdParamsSchema,
} from '../schemas/users.schemas.js';

export async function usersRoutes(app: FastifyInstance) {
  const repository = makeUsersRepository(app.prisma);
  const service = makeUsersService(repository);
  const controller = makeUsersController(service);

  // Admin only: list all users
  app.get(
    '/',
    {
      onRequest: [app.requireAdmin],
      schema: {
        tags: ['Users'],
        summary: 'Listar usuários (admin)',
        security: [{ bearerAuth: [] }],
        querystring: listUsersQuerySchema,
        response: { 200: listUsersResponseSchema },
      },
    },
    controller.listUsers,
  );

  // Public: get any user profile
  app.get(
    '/:id',
    {
      schema: {
        tags: ['Users'],
        summary: 'Perfil público do usuário',
        params: userIdParamsSchema,
        response: { 200: getUserResponseSchema },
      },
    },
    controller.getUserById,
  );

  // Authenticated: owner or admin
  app.put(
    '/:id',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Users'],
        summary: 'Atualizar usuário',
        security: [{ bearerAuth: [] }],
        params: userIdParamsSchema,
        body: updateUserBodySchema,
        response: { 200: updateUserResponseSchema },
      },
    },
    controller.updateUser,
  );

  app.delete(
    '/:id',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Users'],
        summary: 'Remover usuário',
        security: [{ bearerAuth: [] }],
        params: userIdParamsSchema,
      },
    },
    controller.deleteUser,
  );
}
