import { Router } from 'express';
import {
  getAllLeads,
  getLead,
  getAllBodyAnalyses,
  getAllHomeVisits,
  getProfitSheets,
  getProfitEntries,
  getLifetimeProfitStats,
  ensureProfitSheet,
  getSetting,
  setSetting,
  getCoaches,
} from '../../../db';
import { getCurrentSheetId } from '../../../workflows';
import {
  PRICING_CONFIG,
  FORMULA1_FLAVORS,
  AFRESH_FLAVORS,
  GOLDEN_INSTRUCTIONS_HI,
  ROUTINE_BASIC_HI,
  ROUTINE_ELITE_HI,
} from '../../../constants';

import { upsertLead } from '../../../db';
import { generateBodyAnalysisSummary } from '../ai/gemini.service';
import { enqueue } from '../../../queue';

export const legacyRouter = Router();

legacyRouter.get('/settings', async (req, res, next) => {
  try {
    const coaches = await getCoaches();
    const zoomLink = await getSetting('zoom_link');
    const sessionTime = await getSetting('session_time');
    const clubCode = await getSetting('club_code');

    res.json({
      coaches,
      pricing: PRICING_CONFIG,
      formula1Flavors: FORMULA1_FLAVORS,
      afreshFlavors: AFRESH_FLAVORS,
      rules: GOLDEN_INSTRUCTIONS_HI,
      routineBasic: ROUTINE_BASIC_HI,
      routineElite: ROUTINE_ELITE_HI,
      settings: {
        zoom_link: zoomLink || 'https://zoom.us/j/community',
        session_time: sessionTime || '7:30 AM - 8:30 AM Daily',
        club_code: clubCode || 'WELLNESS101',
      },
    });
  } catch (err) {
    next(err);
  }
});

legacyRouter.post('/settings', async (req, res, next) => {
  try {
    const { key, value } = req.body;
    const allowedKeys = ['zoom_link', 'session_time', 'club_code', 'app_base_url'];
    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ error: { code: 'INVALID_SETTING_KEY', message: 'Setting key is not allowlisted' } });
    }
    await setSetting(key, value);
    res.json({ success: true, key, value });
  } catch (err) {
    next(err);
  }
});

legacyRouter.get('/dashboard/stats', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || req.query.coachId as string || 'coach_deepa';
    const leads = await getAllLeads(coachId);
    const life = await getLifetimeProfitStats(coachId);
    res.json({
      stats: {
        totalLeads: leads.length,
        lifetimeRevenue: life.lifetimeRevenue,
        lifetimeProfit: life.lifetimeProfit,
      },
    });
  } catch (err) {
    next(err);
  }
});

legacyRouter.get('/body-analyses', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const list = await getAllBodyAnalyses(coachId);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

legacyRouter.get('/home-visits', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const list = await getAllHomeVisits(coachId);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// Form 2: Body Analysis API with Compulsory Fields Validation
legacyRouter.post('/body-analysis', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || req.body.coach_id || 'coach_deepa';
    const data = req.body;

    const requiredFields = [
      'name',
      'date',
      'serial_no',
      'age',
      'gender',
      'height_cm',
      'mobile',
      'address',
      'weight_kg',
      'sub_fat_pct',
      'body_age',
      'skeletal_muscle_pct',
      'body_fat_pct',
      'visceral_fat',
      'bmr',
      'bmi',
      'wellness_consultant',
    ];

    // Accept mobile or phone_number
    if (!data.mobile && data.phone_number) data.mobile = data.phone_number;
    if (!data.phone_number && data.mobile) data.phone_number = data.mobile;

    for (const field of requiredFields) {
      const val = data[field];
      if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
        return res.status(400).json({
          error: {
            code: 'MISSING_COMPULSORY_FIELD',
            message: `Field '${field}' is compulsory on the Body Analysis form`,
            field,
          },
        });
      }
    }

    const { getIdealWeight } = await import('../../../constants');
    const idealWeight = getIdealWeight(Number(data.height_cm), data.gender);

    const isFemale = data.gender === 'F' || String(data.gender).toLowerCase().startsWith('f');
    const bodyFat = Number(data.body_fat_pct);
    let bodyFatCategory: 'LOW' | 'NORMAL' | 'HIGH' | 'VERY_HIGH' = 'NORMAL';
    if (isFemale) {
      if (bodyFat >= 35) bodyFatCategory = 'VERY_HIGH';
      else if (bodyFat >= 30) bodyFatCategory = 'HIGH';
      else if (bodyFat >= 20) bodyFatCategory = 'NORMAL';
      else bodyFatCategory = 'LOW';
    } else {
      if (bodyFat >= 25) bodyFatCategory = 'VERY_HIGH';
      else if (bodyFat >= 20) bodyFatCategory = 'HIGH';
      else if (bodyFat >= 10) bodyFatCategory = 'NORMAL';
      else bodyFatCategory = 'LOW';
    }

    const visc = Number(data.visceral_fat);
    let viscCategory: 'NORMAL' | 'HIGH' | 'VERY_HIGH' = 'NORMAL';
    if (visc >= 15) viscCategory = 'VERY_HIGH';
    else if (visc >= 9) viscCategory = 'HIGH';

    const bmiVal = Number(data.bmi);
    let bmiCategory: 'UNDER_WEIGHT' | 'NORMAL' | 'OVER_WEIGHT' | 'OBESE' = 'NORMAL';
    if (bmiVal < 18.5) bmiCategory = 'UNDER_WEIGHT';
    else if (bmiVal <= 22.9) bmiCategory = 'NORMAL';
    else if (bmiVal <= 24.9) bmiCategory = 'OVER_WEIGHT';
    else bmiCategory = 'OBESE';

    const bmrVal = Number(data.bmr);
    const bmrStatus: 'LOW' | 'NORMAL' = isFemale ? (bmrVal >= 1600 ? 'NORMAL' : 'LOW') : (bmrVal >= 1800 ? 'NORMAL' : 'LOW');

    const { createBodyAnalysis } = await import('../../../db');
    const enrichedData = {
      ...data,
      coach_id: coachId,
      phone_number: data.mobile,
      age: Number(data.age),
      height_cm: Number(data.height_cm),
      weight_kg: Number(data.weight_kg),
      sub_fat_pct: Number(data.sub_fat_pct),
      body_age: Number(data.body_age),
      skeletal_muscle_pct: Number(data.skeletal_muscle_pct),
      body_fat_pct: bodyFat,
      visceral_fat: visc,
      bmr: bmrVal,
      bmi: bmiVal,
      ideal_weight_kg: idealWeight,
      body_fat_category: bodyFatCategory,
      visceral_fat_category: viscCategory,
      bmi_category: bmiCategory,
      bmr_status: bmrStatus,
    };
    
    // 1. Ensure Lead exists in database FIRST (satisfies foreign key constraint in PostgreSQL)
    let isNewLead = false;
    let existingLead = await getLead(data.mobile);
    if (!existingLead) {
      isNewLead = true;
      existingLead = await upsertLead(data.mobile, data.name, { source: 'Body Analysis', stage: 'NEW', status: 'NEW' });
    }

    // 2. Save body analysis record to PostgreSQL / Supabase
    const saved = await createBodyAnalysis(enrichedData);

    // 3. Generate personalized AI summary using Gemini
    const summary = await generateBodyAnalysisSummary(enrichedData, isNewLead);
    if (summary && saved) {
      saved.hindi_report = summary;
    }

    res.status(201).json({
      success: true,
      analysis: saved,
      report: summary,
      leadCreated: isNewLead,
    });
  } catch (err) {
    next(err);
  }
});

// Explicit WhatsApp Send for Body Analysis Report after User Review
legacyRouter.post('/body-analysis/send-whatsapp', async (req, res, next) => {
  try {
    const { phone, report } = req.body;
    if (!phone || !report) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Phone and report are required' } });
    }
    const { enqueue } = await import('../../../queue');
    const { recordMessageDelivery } = await import('../../../db');

    await enqueue({ task: 'SEND_TEXT', phone, body: report });
    await recordMessageDelivery({
      phone,
      direction: 'OUTBOUND',
      message_type: 'TEXT',
      content: report,
      status: 'SENT',
    });

    res.json({ success: true, message: 'Report queued for WhatsApp delivery' });
  } catch (err) {
    next(err);
  }
});

// Form 1: Consumer Data [First Homevisit] API with Compulsory Fields Validation
legacyRouter.post('/consumer-homevisit', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || req.body.coach_id || 'coach_deepa';
    const data = req.body;

    const requiredFields = [
      'date',
      'name',
      'age',
      'height',
      'weight',
      'ideal_weight',
      'health_challenges',
      'purpose_of_joining',
      'energy',
      'digestion',
      'sleep',
      'sleeping_time',
      'wake_up_time',
      'breakfast_time',
      'mid_meal_1',
      'lunch',
      'mid_meal_2',
      'dinner',
      'exercise',
      'water_intake',
      'family_members',
      'fruit_salad',
      'tea',
      'non_veg',
    ];

    const phone = data.phone_number || data.phone || data.mobile;
    if (!phone) {
      return res.status(400).json({
        error: {
          code: 'MISSING_COMPULSORY_FIELD',
          message: "Field 'phone_number' is compulsory to identify the consumer record",
          field: 'phone_number',
        },
      });
    }

    for (const field of requiredFields) {
      const val = data[field];
      if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
        return res.status(400).json({
          error: {
            code: 'MISSING_COMPULSORY_FIELD',
            message: `Field '${field}' is compulsory on the Consumer Data [First Homevisit] form`,
            field,
          },
        });
      }
    }

    // Ensure lead exists in database FIRST
    const existingLead = await getLead(phone);
    if (!existingLead) {
      await upsertLead(phone, data.name, { source: 'Home Visit', stage: 'NEW', status: 'NEW' });
    }

    const { saveConsumerHomevisitForm } = await import('../../../db');
    const saved = await saveConsumerHomevisitForm({
      ...data,
      phone_number: phone,
      coach_id: coachId,
      age: Number(data.age),
      weight: Number(data.weight),
      ideal_weight: Number(data.ideal_weight),
    });

    res.status(201).json({ success: true, consumerData: saved });
  } catch (err) {
    next(err);
  }
});

legacyRouter.get('/consumer-homevisit', async (req, res, next) => {
  try {
    const phone = req.query.phone as string | undefined;
    const customerId = req.query.customerId as string | undefined;
    const { getConsumerHomevisitForms } = await import('../../../db');
    const list = await getConsumerHomevisitForms(phone, customerId);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

