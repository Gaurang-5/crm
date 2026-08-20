import { loadEnv } from './config/env';
import { createApp } from './app';
import { createPool } from './db/pool';
import { runMigrations } from './db/migrate';
import { setPool } from '../../db';
import { seedDefaultCoach } from './db/seed';

async function bootstrap() {
  const env = loadEnv();
  
  if (env.DATABASE_URL) {
    try {
      const pool = createPool(env);
      await runMigrations(pool);
      setPool(pool);
      await seedDefaultCoach(pool);
      console.log('✅ Connected to Supabase PostgreSQL database and migrations active.');
    } catch (err: any) {
      console.error('❌ Failed to connect to PostgreSQL database:', err.message);
      if (env.APP_RUNTIME_MODE === 'production') {
        process.exit(1);
      }
      console.log('⚠️ Running in in-memory mode.');
    }
  } else {
    console.log('ℹ️ No DATABASE_URL found. Running in in-memory mode.');
  }

  const app = createApp({});
  const port = parseInt(env.PORT || '3000', 10);
  const server = app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port} in ${env.APP_RUNTIME_MODE} mode`);
  });

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

if (require.main === module) {
  bootstrap().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
