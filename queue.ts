import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const rawRedisUrl = (process.env.REDIS_URL || '').trim();
const isRedisConfigured = rawRedisUrl.length > 0 &&
  !rawRedisUrl.includes('your-upstash-url') &&
  !rawRedisUrl.includes('placeholder') &&
  !rawRedisUrl.includes('example.com');

export const isRedisEnabled = isRedisConfigured;

export let connection: IORedis | null = null;
export let outboundQueue: Queue | null = null;

if (isRedisEnabled) {
  try {
    connection = new IORedis(rawRedisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 1000, 3000);
      },
    });
    connection.on('error', (err) => {
      console.warn('[Redis] Connection warning (running in direct fallback mode):', err.message);
    });
    outboundQueue = new Queue('whatsapp-outbound', { connection });
    console.log('[Queue] Initialized with Redis queue.');
  } catch (err: any) {
    console.warn('[Queue] Failed to initialize Redis, falling back to direct mode:', err.message);
    connection = null;
    outboundQueue = null;
  }
} else {
  console.log('[Queue] Redis not configured. Running in direct in-memory dispatch mode.');
}

export type OutboundJob =
  | { task: 'SEND_TEXT'; phone: string; body: string }
  | { task: 'SEND_DOC'; phone: string; link: string; filename: string; caption?: string }
  | { task: 'SEND_BUTTONS'; phone: string; body: string; buttons: Array<{ id: string; title: string }>; header?: string }
  | { task: 'SEND_LIST'; phone: string; body: string; buttonText: string; sections: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }>; header?: string }
  | { task: 'SEND_TEMPLATE'; phone: string; template: string; languageCode?: string };

export async function enqueue(job: OutboundJob, delayMs = 0) {
  if (outboundQueue) {
    try {
      await outboundQueue.add(job.task, job, {
        delay: delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
      });
      return;
    } catch (err: any) {
      console.warn('[Queue] Enqueue error, executing job directly:', err.message);
    }
  }
  // Direct execution fallback when Redis is not available or offline
  try {
    const { processJobDirectly } = require('./worker');
    if (delayMs > 0) {
      setTimeout(() => processJobDirectly(job).catch(console.error), delayMs);
    } else {
      await processJobDirectly(job);
    }
  } catch (err: any) {
    console.error('[Direct Dispatch] Error processing outbound job:', err.message);
  }
}