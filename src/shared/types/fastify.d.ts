import type { PrismaClient } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      role: 'USER' | 'ADMIN';
    };
    user: {
      sub: string;
      email: string;
      role: 'USER' | 'ADMIN';
    };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    sendEmail: (to: string, subject: string, html: string) => Promise<void>;
  }
}
