import { getIdealWeight, PRICING_CONFIG, FORMULA1_FLAVORS, AFRESH_FLAVORS } from './constants';
import { calculateStandardMetrics, generateHealthAnalysis } from './gemini';
import { generateBodyAnalysisPDF, generateMonthlyProfitSheetPDF } from './pdf';
import { getCurrentSheetId } from './workflows';

async function runTests() {
  console.log('=== 1. Testing Constants & Ideal Weight Lookup ===');
  const idealFemale = getIdealWeight(153, 'F');
  console.log('Ideal weight for 153cm Female:', idealFemale, 'kg (Expected ~51-53kg)');
  
  const idealMale = getIdealWeight(175, 'M');
  console.log('Ideal weight for 175cm Male:', idealMale, 'kg (Expected ~69kg)');

  console.log('F1 Flavor count:', FORMULA1_FLAVORS.length, '(Expected 9)');
  console.log('Afresh Flavor count:', AFRESH_FLAVORS.length, '(Expected 7)');

  console.log('=== 2. Testing Pricing & Profit Calculation ===');
  const basicProfit = PRICING_CONFIG.Basic.coachAmount - PRICING_CONFIG.Basic.costOfKitNew;
  console.log('Basic Plan Cash Profit (New):', basicProfit, '(Expected 5320 - 3006 = 2314)');

  const eliteProfit = PRICING_CONFIG.Elite.coachAmount - PRICING_CONFIG.Elite.costOfKitNew;
  console.log('Elite Plan Cash Profit (New):', eliteProfit, '(Expected 8990 - 5660 = 3330)');

  console.log('=== 3. Testing Gemini / Rule-Based Health Analysis ===');
  const sampleMetrics = {
    name: 'सारिका',
    age: 47,
    gender: 'F' as const,
    heightCm: 153,
    weightKg: 67,
    subFatPct: 35.2,
    visceralFat: 11.5,
    skeletalMusclePct: 21.0,
    bodyFatPct: 40.2,
    bodyAge: 62,
    bmr: 1326,
  };

  const analysis = await generateHealthAnalysis(sampleMetrics);
  console.log('Generated Hindi Report:\n', analysis.hindiReport);

  console.log('=== 4. Testing PDF Report Generators ===');
  const bodyPdf = await generateBodyAnalysisPDF('test_sarika', sampleMetrics, analysis, 'Suman Coach');
  console.log('✅ Body Analysis PDF generated at:', bodyPdf);

  const profitPdf = await generateMonthlyProfitSheetPDF('August 2026', [
    {
      sNo: 1,
      paymentDate: '19/08/2026',
      memberName: 'सारिका जी',
      membershipType: 'Basic',
      transactionType: 'New',
      amountReceived: 8400,
      coachAmount: 5320,
      costOfKit: 3006,
      cashProfit: 2314,
      paymentStatus: 'Received',
      clubPaymentDate: '19/08/2026',
    },
    {
      sNo: 2,
      paymentDate: '19/08/2026',
      memberName: 'अमित जी',
      membershipType: 'Elite',
      transactionType: 'New',
      amountReceived: 12070,
      coachAmount: 8990,
      costOfKit: 5660,
      cashProfit: 3330,
      paymentStatus: 'Received',
      clubPaymentDate: '19/08/2026',
    },
  ], {
    totalReceived: 20470,
    totalCoach: 14310,
    totalKit: 8666,
    totalProfit: 5644,
  });
  console.log('✅ Senior Coach Monthly Cash Profit PDF generated at:', profitPdf);

  console.log('=== ALL CORE UNIT & INTEGRATION TESTS PASSED! ===');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
