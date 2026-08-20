import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const API_VERSION = process.env.META_API_VERSION || 'v21.0';
const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const RECIPIENT = process.env.ADMIN_PHONE_NUMBERS?.split(',')[0]?.trim() || '919897258859';

async function testWhatsApp() {
  console.log('\n========================================');
  console.log('       META WHATSAPP CLOUD API TEST      ');
  console.log('========================================\n');

  console.log(`📱 Phone Number ID : ${PHONE_NUMBER_ID || 'NOT SET'}`);
  console.log(`🔑 Access Token     : ${ACCESS_TOKEN ? ACCESS_TOKEN.slice(0, 12) + '...' + ACCESS_TOKEN.slice(-6) : 'NOT SET'}`);
  console.log(`🌐 API Version      : ${API_VERSION}`);
  console.log(`🎯 Test Recipient   : ${RECIPIENT}\n`);

  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.error('❌ Missing META_PHONE_NUMBER_ID or META_ACCESS_TOKEN in .env file.');
    process.exit(1);
  }

  // Step 1: Verify Phone Number Registration and Status on Meta
  console.log('📡 1. Checking WhatsApp Phone Number Registration with Meta...');
  try {
    const metaInfoRes = await axios.get(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}`,
      {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        params: { fields: 'verified_name,display_phone_number,quality_rating,code_verification_status' },
      }
    );

    console.log('✅ Meta Phone Number Details:');
    console.log(`   - Display Number    : ${metaInfoRes.data.display_phone_number || 'N/A'}`);
    console.log(`   - Verified Name     : ${metaInfoRes.data.verified_name || 'N/A'}`);
    console.log(`   - Quality Rating    : ${metaInfoRes.data.quality_rating || 'N/A'}`);
    console.log(`   - Verification Status: ${metaInfoRes.data.code_verification_status || 'N/A'}\n`);
  } catch (err: any) {
    console.warn(`⚠️ Warning checking phone details: ${err.response?.data?.error?.message || err.message}\n`);
  }

  // Step 2: Attempt Sending a Real Message
  console.log(`📤 2. Sending live WhatsApp message to ${RECIPIENT}...`);
  const endpoint = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  try {
    const res = await axios.post(
      endpoint,
      {
        messaging_product: 'whatsapp',
        to: RECIPIENT,
        type: 'text',
        text: {
          body: '🌿 *Wellness Coach CRM Test*\n\nYour Meta WhatsApp Cloud API is connected and working successfully!',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('🎉 SUCCESS! Message dispatched via Meta WhatsApp Cloud API:');
    console.log(`   - Message ID : ${res.data.messages?.[0]?.id}`);
    console.log(`   - WhatsApp ID: ${res.data.contacts?.[0]?.wa_id}\n`);
  } catch (err: any) {
    const metaError = err.response?.data?.error;
    console.error('❌ Failed to send WhatsApp message via Meta API:');
    if (metaError) {
      console.error(`   - Code   : ${metaError.code} (${metaError.type})`);
      console.error(`   - Message: ${metaError.message}`);
      if (metaError.error_user_title) {
        console.error(`   - Title  : ${metaError.error_user_title}`);
        console.error(`   - Detail : ${metaError.error_user_msg}`);
      }
      if (metaError.code === 131030) {
        console.error('\n💡 Note: In Meta Sandbox/Test mode, the recipient phone number must be added to your "To" test numbers list in the Meta Developer Dashboard.');
      } else if (metaError.code === 190) {
        console.error('\n💡 Note: Your Meta Access Token has expired. Generate a fresh token in the Meta Developer Dashboard.');
      }
    } else {
      console.error(`   - Error: ${err.message}`);
    }
  }
}

testWhatsApp();
