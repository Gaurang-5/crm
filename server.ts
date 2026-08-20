import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import {
  initSchema,
  markWebhookProcessed,
  upsertLead,
  getLead,
  getAllLeads,
  setLeadState,
  logEvent,
  createBodyAnalysis,
  getBodyAnalyses,
  getAllBodyAnalyses,
  createHomeVisit,
  getHomeVisits,
  getAllHomeVisits,
  createOrder,
  getOrders,
  updateOrderStatus,
  getProfitSheets,
  ensureProfitSheet,
  getProfitEntries,
  createProfitEntry,
  updateProfitEntry,
  deleteProfitEntry,
  getSetting,
  setSetting,
  getLifetimeProfitStats,
  getCoaches,
  getCoachById,
  upsertCoach,
} from './db';
import { handleInboundMessage, getCurrentSheetId, alertCoaches } from './workflows';
import { generateHealthAnalysis, BodyMetrics } from './gemini';
import { generateBodyAnalysisPDF, generateMonthlyProfitSheetPDF, ProfitEntryForPDF } from './pdf';
import { enqueue } from './queue';
import {
  PRICING_CONFIG,
  getIdealWeight,
  GOLDEN_INSTRUCTIONS_HI,
  ROUTINE_BASIC_HI,
  ROUTINE_ELITE_HI,
  FORMULA1_FLAVORS,
  AFRESH_FLAVORS,
} from './constants';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const publicDir = fs.existsSync(path.join(__dirname, 'public', 'index.html'))
  ? path.join(__dirname, 'public')
  : path.join(__dirname, '..', 'public');

const reportsDir = path.join(publicDir, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

app.use(express.static(publicDir));
app.use('/reports', express.static(reportsDir));

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'herbalife_crm_verify_token';

// 1. Meta Webhook Verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 2. Inbound Meta Webhook Receiver
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;
        const val = change.value;
        const contact = (val.contacts && val.contacts[0]) || {};
        const senderName = (contact.profile && contact.profile.name) || 'Wellness Friend';

        for (const msg of val.messages || []) {
          const msgId = msg.id;
          const isNew = await markWebhookProcessed(msgId);
          if (!isNew) continue;

          const fromPhone = msg.from;
          let text = '';

          if (msg.type === 'text') {
            text = msg.text.body;
          } else if (msg.type === 'interactive') {
            if (msg.interactive.type === 'button_reply') {
              text = msg.interactive.button_reply.id || msg.interactive.button_reply.title;
            } else if (msg.interactive.type === 'list_reply') {
              text = msg.interactive.list_reply.id || msg.interactive.list_reply.title;
            }
          } else if (msg.type === 'button') {
            text = msg.button.text || msg.button.payload;
          }

          if (text) {
            await handleInboundMessage(fromPhone, senderName, text);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error handling webhook message:', err);
  }
});

// 3. Webhook Flow Simulator API
app.post('/api/simulate-webhook', async (req, res) => {
  try {
    const { phone, name, text } = req.body;
    if (!phone || !text) {
      return res.status(400).json({ error: 'Phone and text are required' });
    }
    await handleInboundMessage(phone.replace(/\D/g, ''), name || 'Test Customer', text);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Coaches Management APIs
app.get('/api/coaches', async (req, res) => {
  try {
    const list = await getCoaches();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/coaches', async (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.phone) {
      return res.status(400).json({ error: 'Coach name and phone are required' });
    }
    const id = data.id || ('coach_' + data.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4));
    const saved = await upsertCoach({ ...data, id });
    res.json({ success: true, coach: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/coaches/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const saved = await upsertCoach({ ...data, id });
    res.json({ success: true, coach: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Leads APIs with Coach Scoping
app.get('/api/leads', async (req, res) => {
  try {
    const coachId = req.query.coachId as string | undefined;
    const leads = await getAllLeads(coachId);
    res.json(leads);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/leads/:phone', async (req, res) => {
  try {
    const lead = await getLead(req.params.phone);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const analyses = await getBodyAnalyses(req.params.phone);
    const orders = await getOrders(req.params.phone);
    const visits = await getHomeVisits(req.params.phone);
    res.json({ lead, analyses, orders, visits });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leads/:phone/attended-zoom', async (req, res) => {
  try {
    const phone = req.params.phone;
    const lead = await getLead(phone);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const coach = (await getCoachById(lead.coach_id || 'coach_sarika')) || { name: 'Wellness Coach' };

    await setLeadState(phone, 'ATTENDED_ZOOM', 'SELECT_PLAN', { zoom_attended_at: new Date() });

    const msg = [
      '🎉 *बधाई हो ' + (lead.display_name || 'Member') + ' जी! आपने लाइव ज़ूम सेशन सफलतापूर्वक पूरा किया।*',
      '',
      'अब आप अपनी सुविधानुसार निम्नलिखित 2 प्रमाणित वेलनेस प्रोग्राम्स में से चुन सकते हैं:',
      '',
      '1️⃣ *Basic Membership Plan* (₹8,400)',
      '• 1 टाइम शेक मील रिप्लेसमेंट',
      '• मॉर्निंग क्लब + 1 Afresh रूटीन',
      '• 2 Shake + 1 Afresh Flavors',
      '',
      '2️⃣ *Elite / Pro Membership* (₹12,070)',
      '• 2 टाइम शेक मील रिप्लेसमेंट',
      '• मॉर्निंग व इवनिंग क्लब + 2 Afresh रूटीन',
      '• 3 Shake + 2 Afresh Flavors',
      '',
      '👉 शुरू करने के लिए कृपया *1* (Basic) या *2* (Elite) लिखकर भेजें:',
    ].join(String.fromCharCode(10));
    await enqueue({ task: 'SEND_TEXT', phone, body: msg });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leads/:phone/order-status', async (req, res) => {
  try {
    const phone = req.params.phone;
    const { status } = req.body;
    await setLeadState(phone, status, 'IDLE');

    if (status === 'ORDER_DELIVERED') {
      const msg = [
        '📦 *नमस्ते! आपका वेलनेस पार्सल सफलतापूर्वक डिलीवर हो गया है।* 🌿',
        '',
        'कोच आपके साथ *1st Home Visit सेशन* शेड्यूल करेंगे ताकि आपकी सही शेक रेसिपी, मील टाइमिंग्स और रूटीन शुरू कराई जा सके।',
      ].join(String.fromCharCode(10));
      await enqueue({ task: 'SEND_TEXT', phone, body: msg });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Body Analysis APIs
app.get('/api/body-analyses', async (req, res) => {
  try {
    const coachId = req.query.coachId as string | undefined;
    const all = await getAllBodyAnalyses(coachId);
    res.json(all);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/body-analysis', async (req, res) => {
  try {
    const {
      coachId = 'coach_sarika',
      phone,
      name,
      age,
      gender,
      heightCm,
      weightKg,
      subFatPct,
      visceralFat,
      skeletalMusclePct,
      bodyFatPct,
      bodyAge,
      bmr,
      consultant,
      sendWhatsApp,
    } = req.body;

    const coach = (await getCoachById(coachId)) || { name: consultant || 'Wellness Coach', phone: '919876543210', zoom_link: 'https://zoom.us/j/community' };

    const metrics: BodyMetrics = {
      name,
      age: Number(age),
      gender,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      subFatPct: subFatPct ? Number(subFatPct) : undefined,
      visceralFat: visceralFat ? Number(visceralFat) : undefined,
      skeletalMusclePct: skeletalMusclePct ? Number(skeletalMusclePct) : undefined,
      bodyFatPct: bodyFatPct ? Number(bodyFatPct) : undefined,
      bodyAge: bodyAge ? Number(bodyAge) : undefined,
      bmr: bmr ? Number(bmr) : undefined,
    };

    const analysisResult = await generateHealthAnalysis(metrics);
    const idealWeight = analysisResult.metrics.idealWeightKg;
    let pdfFilename = '';
    try {
      pdfFilename = await generateBodyAnalysisPDF(Date.now(), metrics, analysisResult, coach.name);
    } catch (pdfErr) {
      console.error('PDF generation error:', pdfErr);
    }

    await upsertLead(phone, name, {
      coach_id: coachId,
      age: metrics.age,
      gender: metrics.gender,
      height_cm: metrics.heightCm,
      weight_kg: metrics.weightKg,
      funnel_state: 'ANALYSIS_DONE',
      conversation_step: 'IDLE',
      state_data: { idealWeight, pdfFilename, coach_id: coachId },
    });

    const saved = await createBodyAnalysis({
      coach_id: coachId,
      phone_number: phone,
      name,
      age: metrics.age,
      gender: metrics.gender,
      height_cm: metrics.heightCm,
      weight_kg: metrics.weightKg,
      bmi: analysisResult.metrics.bmi,
      sub_fat_pct: analysisResult.metrics.subFatPct,
      visceral_fat: analysisResult.metrics.visceralFat,
      skeletal_muscle_pct: analysisResult.metrics.skeletalMusclePct,
      body_fat_pct: analysisResult.metrics.bodyFatPct,
      body_age: analysisResult.metrics.bodyAge,
      bmr: analysisResult.metrics.bmr,
      ideal_weight_kg: idealWeight,
      hindi_report: analysisResult.hindiReport,
      pdf_filename: pdfFilename,
    });

    if (sendWhatsApp !== false) {
      await enqueue({ task: 'SEND_TEXT', phone, body: analysisResult.combinedWhatsAppMessage });
      if (pdfFilename) {
        const appBaseUrl = (await getSetting('app_base_url')) || 'http://localhost:3000';
        await enqueue({
          task: 'SEND_TEXT',
          phone,
          body: '📄 आपकी विस्तृत बॉडी एनालिसिस PDF रिपोर्ट डाउनलोड करने के लिए यहाँ क्लिक करें:' + String.fromCharCode(10) + appBaseUrl + '/reports/' + pdfFilename,
        });
      }
      const alertMsg = [
        '🔔 *नया बॉडी एनालिसिस दर्ज हुआ!* 🔔',
        '• कोच: ' + coach.name,
        '• नाम: ' + name + ' जी (' + phone + ')',
        '• वजन: ' + metrics.weightKg + ' kg (आदर्श: ' + idealWeight + ' kg)',
        '• BMI: ' + analysisResult.metrics.bmi,
      ].join(String.fromCharCode(10));
      await alertCoaches(alertMsg, coach.phone);
    }

    res.json({ success: true, analysis: saved, analysisResult, pdfFilename });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ideal-weight', (req, res) => {
  const heightCm = Number(req.query.heightCm) || 160;
  const gender = String(req.query.gender || 'F');
  const ideal = getIdealWeight(heightCm, gender);
  res.json({ heightCm, gender, idealWeightKg: ideal });
});

// 7. 1st Home Visit APIs
app.get('/api/home-visits', async (req, res) => {
  try {
    const coachId = req.query.coachId as string | undefined;
    const all = await getAllHomeVisits(coachId);
    res.json(all);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/home-visit', async (req, res) => {
  try {
    const data = req.body;
    const phone = data.phone_number;
    const coachId = data.coach_id || 'coach_sarika';
    const saved = await createHomeVisit({ ...data, coach_id: coachId });
    await setLeadState(phone, 'HOME_VISIT_DONE', 'IDLE', { coach_id: coachId });

    if (data.sendWhatsApp !== false) {
      const routineList = data.routine_type === 'Elite' ? ROUTINE_ELITE_HI : ROUTINE_BASIC_HI;
      const routineText = routineList.join(String.fromCharCode(10) + String.fromCharCode(10));
      const msg1 = [
        '🏠 *1st HOME VISIT & दैनिक रूटीन चार्ट* 🏠',
        'सदस्य: ' + (data.member_name || 'Member') + ' जी',
        'मेंबरशिप: ' + data.routine_type + ' Routine',
        '',
        '📋 *दैनिक शेड्यूल:*',
        '',
        routineText,
      ].join(String.fromCharCode(10));
      await enqueue({ task: 'SEND_TEXT', phone, body: msg1 });

      const rulesSummary = GOLDEN_INSTRUCTIONS_HI.slice(0, 10).join(String.fromCharCode(10)) + String.fromCharCode(10) + String.fromCharCode(10) + '(कोच के साथ 5वें, 15वें और 25वें दिन फॉलो-अप कॉल्स शेड्यूल रहेंगी)';
      const msg2 = '📜 *18 महत्वपूर्ण नियम और निर्देश (Golden Rules):*' + String.fromCharCode(10) + String.fromCharCode(10) + rulesSummary;
      await enqueue({ task: 'SEND_TEXT', phone, body: msg2 });
    }
    res.json({ success: true, visit: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Profit Sheet APIs
app.get('/api/profit-sheets', async (req, res) => {
  try {
    const coachId = req.query.coachId as string | undefined;
    const sheets = await getProfitSheets(coachId);
    const currentSheet = getCurrentSheetId();
    await ensureProfitSheet(currentSheet, coachId || 'coach_sarika');
    res.json({ currentSheet, sheets });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profit-sheets', async (req, res) => {
  try {
    const { sheetId, coachId = 'coach_sarika' } = req.body;
    const sheet = await ensureProfitSheet(sheetId, coachId);
    res.json({ success: true, sheet });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profit-sheets/:sheetId', async (req, res) => {
  try {
    const sheetId = req.params.sheetId;
    const coachId = req.query.coachId as string | undefined;
    const entries = await getProfitEntries(sheetId, coachId);

    let totalReceived = 0;
    let totalCoach = 0;
    let totalKit = 0;
    let totalProfit = 0;
    entries.forEach((e: any) => {
      totalReceived += Number(e.amount_received || 0);
      totalCoach += Number(e.coach_amount || 0);
      totalKit += Number(e.cost_of_kit || 0);
      totalProfit += Number(e.cash_profit || 0);
    });

    const life = await getLifetimeProfitStats(coachId);
    res.json({
      sheetId,
      entries,
      totals: {
        totalReceived,
        totalCoach,
        totalKit,
        totalProfit,
      },
      lifetime: {
        lifetimeCustomers: life.lifetimeCustomers,
        lifetimeRevenue: life.lifetimeRevenue,
        lifetimeProfit: life.lifetimeProfit,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profit-entries', async (req, res) => {
  try {
    const data = req.body;
    const saved = await createProfitEntry(data);
    res.json({ success: true, entry: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profit-entries/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await updateProfitEntry(id, req.body);
    res.json({ success: true, entry: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/profit-entries/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteProfitEntry(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profit-sheets/:sheetId/pdf', async (req, res) => {
  try {
    const sheetId = req.params.sheetId;
    const coachId = req.query.coachId as string | undefined;
    const entries = await getProfitEntries(sheetId, coachId);

    let totalReceived = 0;
    let totalCoach = 0;
    let totalKit = 0;
    let totalProfit = 0;

    const formattedEntries: ProfitEntryForPDF[] = entries.map((e: any, idx: number) => {
      const rec = Number(e.amount_received || 0);
      const coach = Number(e.coach_amount || 0);
      const kit = Number(e.cost_of_kit || 0);
      const prof = Number(e.cash_profit || 0);
      totalReceived += rec;
      totalCoach += coach;
      totalKit += kit;
      totalProfit += prof;
      return {
        sNo: idx + 1,
        paymentDate: e.payment_date ? new Date(e.payment_date).toLocaleDateString('en-IN') : '-',
        memberName: e.member_name,
        membershipType: e.membership_type,
        transactionType: e.transaction_type,
        amountReceived: rec,
        coachAmount: coach,
        costOfKit: kit,
        cashProfit: prof,
        paymentStatus: e.payment_status || 'Received',
        clubPaymentDate: e.club_payment_date ? new Date(e.club_payment_date).toLocaleDateString('en-IN') : '',
      };
    });

    const filename = await generateMonthlyProfitSheetPDF(sheetId, formattedEntries, {
      totalReceived,
      totalCoach,
      totalKit,
      totalProfit,
    });
    res.json({ success: true, filename, url: '/reports/' + filename });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Settings & Metadata APIs
app.get('/api/settings', async (req, res) => {
  try {
    const coaches = await getCoaches();
    res.json({
      coaches,
      pricing: PRICING_CONFIG,
      formula1Flavors: FORMULA1_FLAVORS,
      afreshFlavors: AFRESH_FLAVORS,
      rules: GOLDEN_INSTRUCTIONS_HI,
      routineBasic: ROUTINE_BASIC_HI,
      routineElite: ROUTINE_ELITE_HI,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const PORT = process.env.PORT || 3000;

initSchema()
  .catch((err) => {
    console.warn('[Database] Schema initialization warning:', err.message);
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log('🌿 Wellness CRM Server listening on port ' + PORT);
    });
  });
