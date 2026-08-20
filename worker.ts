import { Worker } from 'bullmq';
import { connection, OutboundJob, isRedisEnabled } from './queue';
import { sendText, sendDocument, sendInteractiveButtons, sendInteractiveList, sendTemplate } from './whatsapp';

export async function processJobDirectly(data: OutboundJob) {
  switch (data.task) {
    case 'SEND_TEXT':
      return sendText(data.phone, data.body);
    case 'SEND_DOC':
      return sendDocument(data.phone, data.link, data.filename, data.caption);
    case 'SEND_BUTTONS':
      return sendInteractiveButtons(data.phone, data.body, data.buttons, data.header);
    case 'SEND_LIST':
      return sendInteractiveList(data.phone, data.body, data.buttonText, data.sections, data.header);
    case 'SEND_TEMPLATE':
      return sendTemplate(data.phone, data.template, data.languageCode);
    default:
      console.warn('Unknown job task');
  }
}

export let worker: Worker<OutboundJob> | null = null;

if (isRedisEnabled && connection) {
  try {
    worker = new Worker<OutboundJob>(
      'whatsapp-outbound',
      async (job) => {
        return processJobDirectly(job.data);
      },
      { connection, concurrency: 5 }
    );
    worker.on('completed', (job) => {
      console.log('[worker] job ' + job.id + ' (' + job.name + ') completed');
    });
    worker.on('failed', (job, err) => {
      console.error('[worker] job ' + job?.id + ' (' + job?.name + ') failed:', err.message);
    });
    console.log('WhatsApp Outbound Worker listening on queue: whatsapp-outbound');
  } catch (err: any) {
    console.warn('[Worker] Could not start BullMQ worker:', err.message);
    worker = null;
  }
} else {
  console.log('[Worker] Redis not active. Outbound messages will be dispatched immediately via in-memory queue.');
}