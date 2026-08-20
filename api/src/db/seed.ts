import { Pool } from 'pg';
import { hashPassword } from '../auth/auth.service';

export async function seedDefaultCoach(pool: Pool) {
  try {
    const { rows } = await pool.query('SELECT id FROM coaches LIMIT 1');
    if (rows.length === 0) {
      const defaultHash = await hashPassword('admin');
      await pool.query(`
        INSERT INTO coaches (id, name, phone, email, role, club_name, club_code, zoom_link, session_time, active, password_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [
        'coach_deepa',
        'Deepa Bhatia',
        '919897258859',
        'deepa@wellnessclub.com',
        'SENIOR_COACH',
        'Healthy Living Club',
        'WELLNESS101',
        'https://zoom.us/j/community',
        '7:30 AM - 8:30 AM Daily',
        true,
        defaultHash
      ]);
      console.log('🌱 Seeded default coach Deepa Bhatia into Supabase coaches table.');
    }
  } catch (err: any) {
    console.error('⚠️ Could not seed default coach:', err.message);
  }
}
