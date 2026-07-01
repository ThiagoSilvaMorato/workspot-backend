import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().positive().default(7),
  PORT: z.coerce.number().positive().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().default("WorkSpot <noreply@workspot.app>"),
  APP_URL: z.string().url().default("workspot://"),
  PASSWORD_RESET_EXPIRES_IN_MINUTES: z.coerce.number().positive().default(30),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
