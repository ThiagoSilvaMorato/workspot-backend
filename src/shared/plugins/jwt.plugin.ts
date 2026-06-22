import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../config/env.js';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError.js';

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        throw new UnauthorizedError();
      }
    },
  );

  fastify.decorate(
    'requireAdmin',
    async (request: FastifyRequest, reply: FastifyReply) => {
      await fastify.authenticate(request, reply);
      if (request.user.role !== 'ADMIN') {
        throw new ForbiddenError();
      }
    },
  );
};

export default fp(jwtPlugin, { name: 'jwt' });
