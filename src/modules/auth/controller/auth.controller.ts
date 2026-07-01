import type { FastifyReply, FastifyRequest } from 'fastify';
import type { makeAuthService } from '../service/auth.service.js';
import type { z } from 'zod';
import type {
  changePasswordBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
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

  async function forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as z.infer<typeof forgotPasswordBodySchema>;
    await service.forgotPassword(body);
    return reply.status(200).send({ message: 'Se o email existir, um link de redefinição foi enviado' });
  }

  async function resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as z.infer<typeof resetPasswordBodySchema>;
    await service.resetPassword(body);
    return reply.status(200).send({ message: 'Senha atualizada com sucesso' });
  }

  async function changePassword(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as z.infer<typeof changePasswordBodySchema>;
    await service.changePassword(request.user.sub, body);
    return reply.status(200).send({ message: 'Senha atualizada com sucesso' });
  }

  return { register, login, refresh, logout, forgotPassword, resetPassword, changePassword };
}
