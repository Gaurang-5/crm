import { Pool } from 'pg';
import { AppEnv } from '../config/env';

export function createPool(env: AppEnv): Pool {
  const rawUrl = env.DATABASE_URL || '';
  const cleanUrl = rawUrl.replace(/\?.*$/, '');
  const isCloudDb = rawUrl.includes('supabase') || 
                    rawUrl.includes('pooler') || 
                    rawUrl.includes('sslmode');

  return new Pool({
    connectionString: cleanUrl,
    ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
    max: env.APP_RUNTIME_MODE === 'production' ? 20 : 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}
