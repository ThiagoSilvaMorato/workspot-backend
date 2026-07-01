import fp from 'fastify-plugin';
import { Resend } from 'resend';
import type { FastifyPluginAsync } from 'fastify';
import { env } from '../../config/env.js';

const resend = new Resend(env.RESEND_API_KEY);

const emailPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    'sendEmail',
    async (to: string, subject: string, html: string): Promise<void> => {
      await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
    },
  );
};

export default fp(emailPlugin, { name: 'email' });
