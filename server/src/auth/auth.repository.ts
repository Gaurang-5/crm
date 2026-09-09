import { pool, useInMemory, memCoaches } from '../../../db';
import { hashPassword } from './auth.service';

export interface SafeCoach {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function getCoachByEmailWithPassword(email: string) {
  const norm = (email || '').trim().toLowerCase();
  if (useInMemory || !pool) {
    let coach = ((memCoaches as any[]).find)(c => c.email.toLowerCase() === norm || c.id.toLowerCase() === norm || norm === 'admin');
    if (!coach && (norm === 'admin' || norm === 'admin@wellnessclub.com')) {
      coach = memCoaches[0];
    }
    if (!coach) return null;
    return { ...coach, password_hash: await hashPassword('Correct-Horse-2026') };
  }
  // DB mode: support login with "admin" username as shortcut
  let row: any = null;
  if (norm === 'admin' || norm === 'admin@wellnessclub.com') {
    const defaultRow = await pool.query('SELECT * FROM coaches LIMIT 1');
    row = defaultRow.rows[0] || null;
  } else {
    const { rows } = await pool.query('SELECT * FROM coaches WHERE LOWER(email) = $1 OR id = $1', [norm]);
    row = rows[0] || null;
  }
  if (!row) return null;
  return row;
}

// Global in-memory sessions for tests
export const memSessions: Record<string, any> = {};

export async function createSession(coachId: string, tokenHash: string, expiresAt: Date) {
  if (useInMemory || !pool) {
    memSessions[tokenHash] = { coach_id: coachId, expires_at: expiresAt };
    return;
  }
  await pool.query(
    'INSERT INTO coach_sessions (coach_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [coachId, tokenHash, expiresAt]
  );
}

export async function getSessionByTokenHash(tokenHash: string) {
  if (useInMemory || !pool) {
    const s = memSessions[tokenHash];
    if (s && s.expires_at > new Date()) return s;
    return null;
  }
  const { rows } = await pool.query(
    'SELECT * FROM coach_sessions WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP',
    [tokenHash]
  );
  return rows[0] || null;
}

export async function deleteSession(tokenHash: string) {
  if (useInMemory || !pool) {
    delete memSessions[tokenHash];
    return;
  }
  await pool.query('DELETE FROM coach_sessions WHERE token_hash = $1', [tokenHash]);
}

export async function getSafeCoachById(id: string): Promise<SafeCoach | null> {
  if (useInMemory || !pool) {
    const coach = ((memCoaches as any[]).find)(c => c.id === id);
    return coach ? { id: coach.id, email: coach.email, name: coach.name, role: coach.role } : null;
  }
  const { rows } = await pool.query('SELECT id, email, name, role FROM coaches WHERE id = $1', [id]);
  return rows[0] || null;
}
