import type { FastifyReply, FastifyRequest } from 'fastify';
import type { makeUsersService } from '../service/users.service.js';
import type { UpdateUserInput } from '../types/users.types.js';

type UsersService = ReturnType<typeof makeUsersService>;

export function makeUsersController(service: UsersService) {
  async function listUsers(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as { page: number; limit: number };
    const result = await service.listUsers(request.user, {
      page: query.page,
      limit: query.limit,
    });
    return reply.status(200).send(result);
  }

  async function getUserById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const user = await service.getUserById(id);
    return reply.status(200).send({ data: user });
  }

  async function updateUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateUserInput;
    const user = await service.updateUser(id, request.user, body);
    return reply.status(200).send({ data: user });
  }

  async function deleteUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await service.deleteUser(id, request.user);
    return reply.status(204).send();
  }

  return { listUsers, getUserById, updateUser, deleteUser };
}
