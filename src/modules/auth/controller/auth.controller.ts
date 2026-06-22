import type { FastifyReply, FastifyRequest } from 'fastify';
import type { makeAuthService } from '../service/auth.service.js';
import type { z } from 'zod';
import type {
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  registerBodySchema,
} from '../schemas/auth.schemas.js';

type AuthService = ReturnType<typeof makeAuthService>;

export function makeAuthController(service: AuthService) {
  async function register(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as z.infer<typeof registerBodySchema>;
    const user = await service.register(body);
    return reply.status(201).send({ data: user });
  }

  async function login(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as z.infer<typeof loginBodySchema>;
    const result = await service.login(body);
    return reply.status(200).send({ data: result });
  }

  async function refresh(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as z.infer<typeof refreshBodySchema>;
    const result = await service.refresh(body);
    return reply.status(200).send({ data: result });
  }

  async function logout(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as z.infer<typeof logoutBodySchema>;
    await service.logout(body);
    return reply.status(204).send();
  }

  return { register, login, refresh, logout };
}
