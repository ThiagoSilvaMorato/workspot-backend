import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { AppError } from '../errors/AppError.js';

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, _request, reply) => {
    // Validation errors (from Zod via fastify-type-provider-zod or Fastify's own ajv)
    if (error.validation) {
      return reply.status(400).send({
        message: 'Validation error',
        issues: error.validation,
      });
    }

    // Application-level errors with known status codes
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }

    // Fastify 4xx errors (e.g. 404 from route not found, 405 method not allowed)
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return reply.status(error.statusCode).send({ message: error.message });
    }

    // Unhandled errors — log internally, never expose details
    fastify.log.error({ err: error }, 'Unhandled error');
    return reply.status(500).send({ message: 'Internal server error' });
  });
};

export default fp(errorHandlerPlugin, { name: 'error-handler' });
