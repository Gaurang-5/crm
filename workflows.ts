import {
  getLead,
  upsertLead,
  setLeadState,
  logEvent,
  getSetting,
  setSetting,
  createBodyAnalysis,
  createOrder,
  createProfitEntry,
  ensureProfitSheet,
  getAllLeads,
  getSheetProfitStats,
  getCoaches,
  getCoachById,
  getCoachByPhone,
} from './db';
import { generateHealthAnalysis, BodyMetrics } from './gemini';
import { generateBodyAnalysisPDF } from './pdf';
import { enqueue } from './queue';
import {
  FORMULA1_FLAVORS,
  AFRESH_FLAVORS,
  PRICING_CONFIG,
  getIdealWeight,
  ROUTINE_BASIC_HI,
  ROUTINE_ELITE_HI,
  GOLDEN_INSTRUCTIONS_HI,
} from './constants';

const ADMIN_NUMBERS = (process.env.ADMIN_PHONE_NUMBERS || '')
  .split(',')
  .map((n) => n.trim())
  .filter(Boolean);

export function getCurrentSheetId(): string {
  const date = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[date.getMonth()] + ' ' + date.getFullYear();
}

export async function handleInboundMessage(phone: string, senderName: string, text: string) {
  const trimmed = text.trim();
  const upper = trimmed.toUpperCase();

  // 1. Check if sender is a registered coach or admin
  const coachRecord = await getCoachByPhone(phone);
  const isAdmin = !!coachRecord || ADMIN_NUMBERS.includes(phone);

  // 2. Opt-out
  if (upper === 'STOP' || upper === 'UNSUBSCRIBE' || upper === 'बंद करो') {
    await setLeadState(phone, 'OPTED_OUT', 'IDLE');
    await enqueue({
      task: 'SEND_TEXT',
      phone,
      body: 'नमस्ते! आपको अनसब्सक्राइब कर दिया गया है। पुनः जुड़ने के लिए कभी भी START लिखकर भेजें।',
    });
    return;
  }

  // 3. Coach Admin Commands
  if (isAdmin && upper.startsWith('/')) {
    await handleAdminCommand(phone, upper, trimmed, coachRecord);
    return;
  }

  // Fetch or initialize Lead
  let lead = await getLead(phone);
  if (!lead) {
    await upsertLead(phone, senderName, { coach_id: 'coach_sarika', funnel_state: 'NEW', conversation_step: 'IDLE' });
    lead = await getLead(phone);
  }
  if (!lead) return;

  const currentLead = lead;
  const coachId = currentLead.coach_id || 'coach_sarika';
  const assignedCoach = (await getCoachById(coachId)) || {
    id: 'coach_sarika',
    name: 'Wellness Coach',
    phone: '919876543210',
    zoom_link: 'https://zoom.us/j/community',
    session_time: '7:30 AM - 8:30 AM Daily',
  };

  const funnelState = currentLead.funnel_state || 'NEW';
  const step = currentLead.conversation_step || 'IDLE';
  const stateData = currentLead.state_data || {};

  // 4. Price-Gatekeeper: Never reveal prices before Zoom attendance
  const priceKeywords = ['PRICE', 'COST', 'FEE', 'FEES', 'RUPEES', 'RS', 'KITNA', 'PAISE', 'पैसे', 'कीमत', 'फीस', 'कितना', 'चार्ज'];
  const asksPrice = priceKeywords.some((kw) => upper.includes(kw));

  if (asksPrice && funnelState !== 'ATTENDED_ZOOM' && funnelState !== 'PLAN_SELECTED' && funnelState !== 'ORDER_PLACED') {
    const msg = [
      'नमस्ते ' + (currentLead.display_name || senderName) + ' जी! 🙏',
      '',
      'वेलनेस कोच ' + assignedCoach.name + ' लाइव ज़ूम सेशन में आपकी बॉडी रिपोर्ट, मेटाबॉलिज्म और लक्ष्यों के अनुसार डाइट प्लान, रूटीन और मेंबरशिप के बारे में विस्तार से समझाते हैं।',
      '',
      'कृपया हमारे आगामी मॉर्निंग सेशन से जुड़ें:',
      '⏰ समय: ' + assignedCoach.session_time,
      '🔗 ज़ूम लिंक: ' + assignedCoach.zoom_link,
      '',
      '(सेशन अटेंड करने के बाद कोच आपको सही प्लान चुनने में मदद करेंगे!)',
    ].join(String.fromCharCode(10));
    await enqueue({ task: 'SEND_TEXT', phone, body: msg });
    return;
  }

  // 5. Lead in ANALYSIS_DONE accepts Zoom invite
  if (funnelState === 'ANALYSIS_DONE' || upper === 'YES' || upper === 'HAAN' || upper === 'HA' || upper === 'हाँ' || upper === 'JOIN' || upper === 'TRIAL' || upper === 'ZOOM') {
    if (upper === 'YES' || upper === 'HAAN' || upper === 'HA' || upper === 'हाँ' || upper === 'JOIN' || upper === 'TRIAL' || upper === 'ZOOM') {
      await setLeadState(phone, 'INVITED_TO_ZOOM', 'IDLE');
      const msg = [
        '🎉 बहुत बढ़िया ' + (currentLead.display_name || senderName) + ' जी! आपको लाइव ज़ूम वर्कआउट और वेलनेस ओरिएंटेशन सेशन के लिए आमंत्रित किया गया है।',
        '',
        '⏰ सेशन समय: ' + assignedCoach.session_time,
        '🔗 ज़ूम लिंक: ' + assignedCoach.zoom_link,
        '',
        '💡 सेशन में जुड़ने के बाद आपको सम्पूर्ण डाइट चार्ट और दोनों प्रोग्राम्स (Basic व Elite) के बारे में बताया जाएगा।',
      ].join(String.fromCharCode(10));
      await enqueue({ task: 'SEND_TEXT', phone, body: msg });
      await logEvent(phone, 'ZOOM_INVITE_SENT', { coach_id: coachId });
      return;
    }
  }

  // 6. Post-Zoom Plan Selection (Triggered after Coach marks 'Attended Zoom')
  if (funnelState === 'ATTENDED_ZOOM' || step === 'SELECT_PLAN') {
    if (upper === '1' || upper.includes('BASIC') || upper.includes('बेसिक')) {
      await setLeadState(phone, 'PLAN_SELECTED', 'SELECT_F1_FLAVORS', { membership: 'Basic' });
      const f1Msg = [
        '✅ आपने *Basic Wellness Plan* (₹8,400) चुना है!',
        '',
        '🥤 इस प्लान में आपको *2 Formula 1 Shakes (500g)* मिलते हैं।',
        'कृपया नीचे दी गई लिस्ट में से अपनी पसंद के *2 फ्लेवर* चुनकर भेजें:',
        '',
        FORMULA1_FLAVORS.map((f, i) => (i + 1) + '. ' + f.emoji + ' ' + f.name).join(String.fromCharCode(10)),
        '',
        '👉 उदाहरण के लिए लिखें: *Kulfi, Rose Kheer*',
      ].join(String.fromCharCode(10));
      await enqueue({ task: 'SEND_TEXT', phone, body: f1Msg });
      return;
    }

    if (upper === '2' || upper.includes('ELITE') || upper.includes('PRO') || upper.includes('एलीट')) {
      await setLeadState(phone, 'PLAN_SELECTED', 'SELECT_F1_FLAVORS', { membership: 'Elite' });
      const f1Msg = [
        '🌟 आपने *Elite / Pro Wellness Plan* (₹12,070) चुना है!',
        '',
        '🥤 इस प्लान में आपको *3 Formula 1 Shakes (500g)* मिलते हैं।',
        'कृपया नीचे दी गई लिस्ट में से अपनी पसंद के *3 फ्लेवर* चुनकर भेजें:',
        '',
        FORMULA1_FLAVORS.map((f, i) => (i + 1) + '. ' + f.emoji + ' ' + f.name).join(String.fromCharCode(10)),
        '',
        '👉 उदाहरण के लिए लिखें: *Kulfi, Mango, Chocolate*',
      ].join(String.fromCharCode(10));
      await enqueue({ task: 'SEND_TEXT', phone, body: f1Msg });
      return;
    }
  }

  // 7. Flavor Selection Engine
  if (step === 'SELECT_F1_FLAVORS') {
    const f1Names = FORMULA1_FLAVORS.map((f) => f.name);
    const selectedF1 = extractFlavors(trimmed, f1Names);
    const membership = stateData.membership || 'Basic';

    await setLeadState(phone, 'PLAN_SELECTED', 'SELECT_AFRESH_FLAVORS', {
      f1_flavors: selectedF1.length ? selectedF1 : [trimmed],
    });

    const afreshMsg = [
      '👍 आपके शेक फ्लेवर दर्ज कर लिए गए हैं!',
      '',
      '⚡ अब अपने *Afresh Energy Drink (' + (membership === 'Elite' ? '2' : '1') + ')* के लिए फ्लेवर चुनें:',
      '',
      AFRESH_FLAVORS.map((f, i) => (i + 1) + '. ' + f.emoji + ' ' + f.name).join(String.fromCharCode(10)),
      '',
      '👉 उदाहरण के लिए लिखें: *Lemon*' + (membership === 'Elite' ? ' या *Lemon, Peach*' : ''),
    ].join(String.fromCharCode(10));
    await enqueue({ task: 'SEND_TEXT', phone, body: afreshMsg });
    return;
  }

  if (step === 'SELECT_AFRESH_FLAVORS') {
    const afreshNames = AFRESH_FLAVORS.map((f) => f.name);
    const selectedAfresh = extractFlavors(trimmed, afreshNames);
    const membership = (stateData.membership === 'Elite' ? 'Elite' : 'Basic') as 'Basic' | 'Elite';
    const f1Flavors = stateData.f1_flavors || [];
    const afreshFlavors = selectedAfresh.length ? selectedAfresh : [trimmed];

    // Compute pricing and profit
    const pricing = PRICING_CONFIG[membership];
    const amountReceived = pricing.amountReceived;
    const coachAmount = pricing.coachAmount;
    const costOfKit = pricing.costOfKitNew;
    const cashProfit = coachAmount - costOfKit;

    // Create Order
    await createOrder({
      coach_id: coachId,
      phone_number: phone,
      membership_type: membership,
      transaction_type: 'New',
      f1_flavors: f1Flavors,
      afresh_flavors: afreshFlavors,
      amount_received: amountReceived,
      coach_amount: coachAmount,
      cost_of_kit: costOfKit,
      cash_profit: cashProfit,
      order_status: 'PLACED',
    });

    // Auto-log to Coach Monthly Profit Sheet
    const sheetId = getCurrentSheetId();
    await createProfitEntry({
      sheet_id: sheetId,
      coach_id: coachId,
      payment_date: new Date(),
      phone_number: phone,
      member_name: currentLead.display_name || senderName,
      membership_type: membership,
      transaction_type: 'New',
      amount_received: amountReceived,
      coach_amount: coachAmount,
      cost_of_kit: costOfKit,
      cash_profit: cashProfit,
      payment_status: 'Received',
    });

    await setLeadState(phone, 'ORDER_PLACED', 'IDLE', {
      membership,
      f1_flavors: f1Flavors,
      afresh_flavors: afreshFlavors,
      order_placed_at: new Date(),
    });

    const confirmationMsg = [
      '🎉 *बधाई हो ' + (currentLead.display_name || senderName) + ' जी! आपका वेलनेस ऑर्डर सफलतापूर्वक दर्ज कर लिया गया है।*',
      '',
      '📦 *ऑर्डर विवरण:*',
      '• प्लान: ' + membership + ' Membership (₹' + amountReceived.toLocaleString('en-IN') + ')',
      '• Shake Flavors: ' + f1Flavors.join(', '),
      '• Afresh Flavors: ' + afreshFlavors.join(', '),
      '',
      '🚚 आपका पार्सल तैयार किया जा रहा है। डिलीवरी के समय आपका *1st Home Visit & डाइट रूटीन* शेड्यूल किया जाएगा।',
      '',
      'आपके वेलनेस कोच ' + assignedCoach.name + ' शीघ्र ही आपसे संपर्क करेंगे! 🙏',
    ].join(String.fromCharCode(10));
    await enqueue({ task: 'SEND_TEXT', phone, body: confirmationMsg });

    // Alert Coach
    const alertMsg = [
      '💰 *नया ऑर्डर व प्रॉफिट दर्ज हुआ!* 💰',
      '• कोच: ' + assignedCoach.name,
      '• ग्राहक: ' + (currentLead.display_name || senderName) + ' (' + phone + ')',
      '• प्लान: ' + membership + ' (₹' + amountReceived.toLocaleString('en-IN') + ')',
      '• 🟢 नेट कैश प्रॉफिट: ₹' + cashProfit.toLocaleString('en-IN'),
      '• शीट: ' + sheetId,
    ].join(String.fromCharCode(10));
    await alertCoaches(alertMsg, assignedCoach.phone);
    return;
  }

  // Fallback friendly message
  const fallback = [
    'नमस्ते ' + (currentLead.display_name || senderName) + ' जी! 🙏',
    '',
    'वेलनेस कोच ' + assignedCoach.name + ' की टीम में आपका स्वागत है। किसी भी सहायता या सेशन जानकारी के लिए हमें यहाँ सन्देश भेज सकते हैं।',
  ].join(String.fromCharCode(10));
  await enqueue({ task: 'SEND_TEXT', phone, body: fallback });
}

function extractFlavors(input: string, availableList: string[]): string[] {
  const matched: string[] = [];
  availableList.forEach((f) => {
    if (input.toLowerCase().includes(f.toLowerCase()) || input.toLowerCase().includes(f.split(' ')[0].toLowerCase())) {
      matched.push(f);
    }
  });
  return matched;
}

export async function handleAdminCommand(coachPhone: string, upper: string, raw: string, coach?: any) {
  if (upper === '/COACHES') {
    const coaches = await getCoaches();
    const list = coaches.map((c, i) => (i + 1) + '. ' + c.name + ' (' + c.role + ') - ' + c.phone).join(String.fromCharCode(10));
    await enqueue({ task: 'SEND_TEXT', phone: coachPhone, body: '👥 *Registered Coaches:*' + String.fromCharCode(10) + String.fromCharCode(10) + list });
    return;
  }

  if (upper === '/LEADS') {
    const leads = await getAllLeads(coach?.id);
    const list = leads.slice(0, 15).map((l: any, i: number) => (i + 1) + '. ' + (l.display_name || 'Customer') + ' (' + l.phone_number + ') - [' + l.funnel_state + ']').join(String.fromCharCode(10)) || 'No leads yet.';
    await enqueue({ task: 'SEND_TEXT', phone: coachPhone, body: '📋 *Active Leads:*' + String.fromCharCode(10) + String.fromCharCode(10) + list });
    return;
  }

  if (upper === '/STATS') {
    const sheetId = getCurrentSheetId();
    const stats = await getSheetProfitStats(sheetId, coach?.id);
    const msg = [
      '📊 *' + sheetId + ' Stats (' + (coach ? coach.name : 'Team') + '):*',
      '',
      '• Total Members: ' + stats.count,
      '• Total Amount: ₹' + Number(stats.total_received || 0).toLocaleString('en-IN'),
      '• 🟢 Total Cash Profit: ₹' + Number(stats.total_profit || 0).toLocaleString('en-IN'),
    ].join(String.fromCharCode(10));
    await enqueue({ task: 'SEND_TEXT', phone: coachPhone, body: msg });
    return;
  }

  const helpMsg = [
    '🛠️ *Coach Admin Commands:*',
    '',
    '• /stats – Current month profit and member statistics',
    '• /leads – View active leads and funnel status',
    '• /coaches – List all registered coaches and clubs',
    '• /help – Show available commands',
  ].join(String.fromCharCode(10));
  await enqueue({ task: 'SEND_TEXT', phone: coachPhone, body: helpMsg });
}

export async function alertCoaches(message: string, specificPhone?: string) {
  const targetPhones = specificPhone ? [specificPhone] : ADMIN_NUMBERS;
  for (const phone of targetPhones) {
    if (phone) {
      await enqueue({ task: 'SEND_TEXT', phone, body: message });
    }
  }
}
