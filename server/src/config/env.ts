import { z } from 'zod';

const BaseEnvSchema = z.object({
  PORT: z.string().default('3000'),
  SESSION_SECRET: z.string().min(32, { message: 'SESSION_SECRET must be at least 32 characters' }),
  META_APP_SECRET: z.string().min(1),
  META_VERIFY_TOKEN: z.string().refine((val) => val !== 'herbalife_crm_verify_token', {
    message: 'Must not use the legacy default META_VERIFY_TOKEN',
  }),
  APP_BASE_URL: z.string().url(),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

const EnvSchema = z.discriminatedUnion('APP_RUNTIME_MODE', [
  BaseEnvSchema.extend({
    APP_RUNTIME_MODE: z.literal('test'),
    NODE_ENV: z.literal('test').optional(),
  }),
  BaseEnvSchema.extend({
    APP_RUNTIME_MODE: z.literal('development'),
    NODE_ENV: z.literal('development').optional(),
    DATABASE_URL: z.string().optional(),
  }),
  BaseEnvSchema.extend({
    APP_RUNTIME_MODE: z.literal('production'),
    NODE_ENV: z.literal('production').optional(),
    DATABASE_URL: z.string().min(1, { message: 'DATABASE_URL is required in production' }),
    REDIS_URL: z.string().optional(),
  }),
]);

export type AppEnv = z.infer<typeof EnvSchema> & {
  DATABASE_URL?: string;
  REDIS_URL?: string;
};

export function loadEnv(source: Record<string, string | undefined> = process.env): AppEnv {
  const mode = source.APP_RUNTIME_MODE || (source.NODE_ENV === 'production' ? 'production' : source.NODE_ENV === 'test' ? 'test' : 'development');
  const defaults: Record<string, string> = {
    APP_RUNTIME_MODE: mode,
    PORT: '3000',
    SESSION_SECRET: 'dev_session_secret_32_characters_long_123',
    META_APP_SECRET: 'dev_meta_app_secret_value',
    META_VERIFY_TOKEN: 'dev_meta_verify_token_secret',
    APP_BASE_URL: 'http://localhost:3000',
  };

  const merged = { ...defaults, ...source, APP_RUNTIME_MODE: source.APP_RUNTIME_MODE || mode };
  return EnvSchema.parse(merged);
}
