import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_VERSION = process.env.META_API_VERSION || 'v21.0';
const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

const BASE_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

export async function sendText(to: string, body: string) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.log(`[MOCK WHATSAPP SEND_TEXT] To: ${to} | Message:\n${body}`);
    return { data: { mock: true, success: true } };
  }
  return axios.post(
    BASE_URL,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    },
    { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
  );
}

export async function sendDocument(to: string, link: string, filename: string, caption = '') {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.log(`[MOCK WHATSAPP SEND_DOC] To: ${to} | File: ${filename} (${link}) | Caption: ${caption}`);
    return { data: { mock: true, success: true } };
  }
  return axios.post(
    BASE_URL,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document: {
        link,
        filename,
        caption,
      },
    },
    { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
  );
}

export async function sendInteractiveButtons(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
  headerText = ''
) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.log(`[MOCK WHATSAPP BUTTONS] To: ${to} | Body: ${bodyText} | Buttons: ${buttons.map((b) => b.title).join(', ')}`);
    return { data: { mock: true, success: true } };
  }

  const payload: any = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: 'reply',
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  };

  if (headerText) {
    payload.interactive.header = { type: 'text', text: headerText };
  }

  return axios.post(BASE_URL, payload, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });
}

export async function sendInteractiveList(
  to: string,
  bodyText: string,
  buttonText: string,
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>,
  headerText = ''
) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.log(`[MOCK WHATSAPP LIST] To: ${to} | Button: ${buttonText} | Sections: ${JSON.stringify(sections)}`);
    return { data: { mock: true, success: true } };
  }

  const payload: any = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: buttonText.slice(0, 20),
        sections,
      },
    },
  };

  if (headerText) {
    payload.interactive.header = { type: 'text', text: headerText };
  }

  return axios.post(BASE_URL, payload, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });
}

export async function sendTemplate(to: string, templateName: string, languageCode = 'hi') {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.log(`[MOCK WHATSAPP TEMPLATE] To: ${to} | Template: ${templateName}`);
    return { data: { mock: true, success: true } };
  }
  return axios.post(
    BASE_URL,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: { name: templateName, language: { code: languageCode } },
    },
    { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
  );
}
