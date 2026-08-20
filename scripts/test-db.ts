import dotenv from 'dotenv';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs/promises';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testAndMigrateDatabase() {
  console.log('\n========================================');
  console.log('       SUPABASE DATABASE TEST & SETUP   ');
  console.log('========================================\n');

  const rawUrl = process.env.DATABASE_URL?.trim();

  if (!rawUrl) {
    console.log('❌ DATABASE_URL is NOT set in your .env file.');
    process.exit(1);
  }

  const cleanUrl = rawUrl.replace(/\?.*$/, '');
  const isCloud = rawUrl.includes('supabase') || rawUrl.includes('pooler') || rawUrl.includes('sslmode');
  const maskedUrl = rawUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`📡 Connecting to: ${maskedUrl}`);

  const pool = new Pool({
    connectionString: cleanUrl,
    ssl: isCloud ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to Supabase PostgreSQL successfully!\n');

    // 1. Check version
    const versionRes = await client.query('SELECT version(), NOW() as server_time, current_database() as db_name, current_user as db_user');
    const row = versionRes.rows[0];
    console.log(`⏱️  Server Time:        ${row.server_time}`);
    console.log(`🗄️  Current Database:   ${row.db_name}`);
    console.log(`👤 Connected User:     ${row.db_user}`);
    console.log(`🐘 PostgreSQL Version: ${row.version.split(' on ')[0]}`);

    // 2. Run migrations
    console.log('\n🔄 Applying Schema Migrations to Supabase...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const { rows } = await client.query('SELECT version FROM schema_migrations');
    const applied = new Set(rows.map((r: any) => r.version));

    const migrationsDir = path.resolve(process.cwd(), 'api/src/db/migrations');
    const files = await fs.readdir(migrationsDir);
    files.sort();

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;
      const version = path.basename(file, '.sql');
      if (applied.has(version)) {
        console.log(`   ✓ ${version} (already applied)`);
        continue;
      }

      console.log(`   ⏳ Applying ${version}...`);
      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
      await client.query('COMMIT');
      console.log(`   ✅ Applied ${version}`);
    }

    // 3. List created tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log(`\n📊 Public Tables in Supabase (${tablesRes.rows.length}):`);
    for (const r of tablesRes.rows) {
      console.log(`   • ${r.table_name}`);
    }

    client.release();
    await pool.end();

    console.log('\n🎉 Supabase Database is 100% connected, migrated, and ready for production!\n');
  } catch (err: any) {
    console.error('\n❌ Database Setup Failed:');
    console.error(`   Message: ${err.message}`);
    console.log('\n');
    process.exit(1);
  }
}

testAndMigrateDatabase();
