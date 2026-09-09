import { loadEnv } from '../server/src/config/env';
import { createApp } from '../server/src/app';
import { createPool } from '../server/src/db/pool';
import { runMigrations } from '../server/src/db/migrate';
import { setPool } from '../db';
import { seedDefaultCoach } from '../server/src/db/seed';

let initialized = false;
let appInstance: any = null;

async function getApp() {
  if (initialized && appInstance) {
    return appInstance;
  }

  const env = loadEnv();
  if (env.DATABASE_URL) {
    try {
      const pool = createPool(env);
      await runMigrations(pool);
      setPool(pool);
      await seedDefaultCoach(pool);
    } catch (err: any) {
      console.error('Database initialization failed');
      throw err;
    }
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is required in production');
  }

  appInstance = createApp({trustProxy:1});
  initialized = true;
  return appInstance;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch {
    return res.status(503).json({error:{code:'SERVICE_UNAVAILABLE',message:'Please try again shortly. Your request has not been saved.'}});
  }
}
