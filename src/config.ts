import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('file:./data/app.sqlite'),
  PORT: z.string().transform(Number).default('3000'),
  ADMIN_SEED_EMAIL: z.string().email().default('admin@example.com'),
  ADMIN_SEED_PASSWORD: z.string().min(6).default('changeme123'),
  SESSION_SECRET: z.string().min(16).default('change-this-secret-in-production'),
  CORS_ORIGIN: z.string().optional(),
  OFFLINE_GRACE_DAYS: z.string().transform(Number).default('7'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  databaseUrl: parsed.data.DATABASE_URL,
  port: parsed.data.PORT,
  adminSeedEmail: parsed.data.ADMIN_SEED_EMAIL,
  adminSeedPassword: parsed.data.ADMIN_SEED_PASSWORD,
  sessionSecret: parsed.data.SESSION_SECRET,
  corsOrigin: parsed.data.CORS_ORIGIN,
  offlineGraceDays: parsed.data.OFFLINE_GRACE_DAYS,
  nodeEnv: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
};
