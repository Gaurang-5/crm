import fs from 'fs/promises';
import path from 'path';

export async function runMigrations(
  pool: { connect?: any, query?: any },
  migrationsOverride?: { version: string, sql: string }[]
): Promise<void> {
  const client = typeof pool.connect === 'function' ? await pool.connect() : pool;
  let error;
  try {
    await client.query('SELECT pg_advisory_lock(826024)');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const { rows } = await client.query('SELECT version FROM schema_migrations');
    const applied = new Set(rows.map((r: any) => r.version));

    let migrations = migrationsOverride;
    
    if (!migrations) {
      migrations = [];
      const migrationsDir = path.join(__dirname, 'migrations');
      let files;
      try {
        files = await fs.readdir(migrationsDir);
        files.sort();
        for (const file of files) {
          if (!file.endsWith('.sql')) continue;
          const version = path.basename(file, '.sql');
          const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
          migrations.push({ version, sql });
        }
      } catch (e) {
        throw new Error('Database migration files could not be loaded', { cause: e });
      }
    }

    for (const { version, sql } of migrations) {
      if (applied.has(version)) continue;
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
        await client.query('COMMIT');
        console.log(`[Migration] Applied ${version}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Migration] Failed on ${version}`, err);
        throw err;
      }
    }
  } catch (err) {
    error = err;
  } finally {
    await client.query('SELECT pg_advisory_unlock(826024)');
    if (typeof pool.connect === 'function' && typeof client.release === 'function') {
      client.release();
    }
  }
  if (error) throw error;
}
