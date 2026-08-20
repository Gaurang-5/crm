import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import {
  memBodyAnalyses,
  memConsumerHomevisitForms,
  memCustomers,
  memLeads,
} from '../../../db';

describe('Compulsory Forms Validation & Persistence', () => {
  const app = createApp({});

  beforeEach(() => {
    memBodyAnalyses.length = 0;
    memConsumerHomevisitForms.length = 0;
    memCustomers.length = 0;
    memLeads.length = 0;
  });

  const getAuthenticatedAgent = async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: 'deepa@wellnessclub.com', password: 'Correct-Horse-2026' })
      .expect(200);
    return agent;
  };

  describe('Form 1: CONSUMER DATA [First Homevisit] (24 Fields Compulsory)', () => {
    const validHomevisit = {
      phone_number: '919876543210',
      date: '2026-08-20',
      name: 'Sunita Sharma',
      age: 34,
      height: '158 cm (5.2")',
      weight: 72.5,
      ideal_weight: 54,
      health_challenges: 'Back pain, knee stiffness',
      purpose_of_joining: 'Weight loss (18 kg) & fitness',
      energy: 'Low in afternoons (3/5)',
      digestion: 'Acidity, constipation',
      sleep: 'Disturbed sleep, wakes up 2-3 times',
      sleeping_time: '11:00 PM',
      wake_up_time: '6:00 AM',
      breakfast_time: '8:30 AM (Paratha/Tea)',
      mid_meal_1: '11:30 AM (Biscuits)',
      lunch: '1:30 PM (2 Roti, Sabzi, Dal)',
      mid_meal_2: '5:30 PM (Tea/Namkeen)',
      dinner: '9:00 PM (Roti/Sabzi)',
      exercise: '15 mins walking',
      water_intake: '1.5 Litres daily',
      family_members: '4 (Self, Husband, 2 Kids)',
      fruit_salad: 'Occasional (Apple/Papaya)',
      tea: '3 Cups with sugar',
      non_veg: 'Eggs twice a week',
    };

    it('rejects submission when any compulsory field is missing', async () => {
      const agent = await getAuthenticatedAgent();
      const incomplete: any = { ...validHomevisit };
      delete incomplete.digestion;

      const res = await agent
        .post('/api/consumer-homevisit')
        .send(incomplete);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_COMPULSORY_FIELD');
      expect(res.body.error.field).toBe('digestion');
    });

    it('rejects submission when energy or sleep timings are missing', async () => {
      const agent = await getAuthenticatedAgent();
      const incomplete: any = { ...validHomevisit, sleeping_time: '' };

      const res = await agent
        .post('/api/consumer-homevisit')
        .send(incomplete);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_COMPULSORY_FIELD');
      expect(res.body.error.field).toBe('sleeping_time');
    });

    it('successfully saves Consumer Data when all 24 fields are provided', async () => {
      const agent = await getAuthenticatedAgent();
      const res = await agent
        .post('/api/consumer-homevisit')
        .send(validHomevisit);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.consumerData.name).toBe('Sunita Sharma');
      expect(res.body.consumerData.ideal_weight).toBe(54);
    });

    it('retrieves saved Consumer Data forms via GET /api/consumer-homevisit', async () => {
      const agent = await getAuthenticatedAgent();
      await agent.post('/api/consumer-homevisit').send(validHomevisit).expect(201);

      const res = await agent
        .get('/api/consumer-homevisit?phone=919876543210');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].name).toBe('Sunita Sharma');
    });
  });

  describe('Form 2: BODY ANALYSIS (17 Fields Compulsory)', () => {
    const validBodyAnalysis = {
      name: 'Sunita Sharma',
      date: '2026-08-20',
      serial_no: '044',
      age: 34,
      gender: 'F',
      height_cm: 158,
      mobile: '919876543210',
      address: 'Sector 14, Urban Estate, Gurugram',
      weight_kg: 72.5,
      sub_fat_pct: 28.5,
      body_age: 44,
      skeletal_muscle_pct: 24.5,
      body_fat_pct: 34.8,
      visceral_fat: 8,
      bmr: 1350,
      bmi: 29.0,
      wellness_consultant: 'Coach Sarika',
    };

    it('rejects submission when serial_no is missing', async () => {
      const agent = await getAuthenticatedAgent();
      const incomplete: any = { ...validBodyAnalysis, serial_no: '' };

      const res = await agent
        .post('/api/body-analysis')
        .send(incomplete);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_COMPULSORY_FIELD');
      expect(res.body.error.field).toBe('serial_no');
    });

    it('rejects submission when sub_fat_pct or visceral_fat is missing', async () => {
      const agent = await getAuthenticatedAgent();
      const incomplete: any = { ...validBodyAnalysis };
      delete incomplete.sub_fat_pct;

      const res = await agent
        .post('/api/body-analysis')
        .send(incomplete);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_COMPULSORY_FIELD');
      expect(res.body.error.field).toBe('sub_fat_pct');
    });

    it('successfully saves Body Analysis when all 17 fields are provided', async () => {
      const agent = await getAuthenticatedAgent();
      const res = await agent
        .post('/api/body-analysis')
        .send(validBodyAnalysis);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.analysis.serial_no).toBe('044');
      expect(res.body.analysis.bmi_category).toBe('OBESE');
      expect(res.body.analysis.visceral_fat_category).toBe('NORMAL');
      expect(res.body.analysis.body_fat_category).toBe('HIGH');
    });

    it('retrieves saved Body Analyses via GET /api/body-analyses', async () => {
      const agent = await getAuthenticatedAgent();
      await agent.post('/api/body-analysis').send(validBodyAnalysis).expect(201);

      const res = await agent.get('/api/body-analyses');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      const found = res.body.find((b: any) => b.serial_no === '044');
      expect(found).toBeDefined();
      expect(found.wellness_consultant).toBe('Coach Sarika');
    });
  });
});
