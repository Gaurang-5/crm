import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { BodyMetrics, HealthAnalysisResult } from './gemini';

const ROOT_DIR = fs.existsSync(path.join(__dirname, 'public', 'index.html')) ? __dirname : path.join(__dirname, '..');
const REPORTS_DIR = path.join(ROOT_DIR, 'public', 'reports');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

export async function generateBodyAnalysisPDF(
  analysisId: string | number,
  metrics: BodyMetrics,
  analysis: HealthAnalysisResult,
  coachName = 'Wellness Coach'
): Promise<string> {
  const filename = 'body_analysis_' + analysisId + '_' + Date.now() + '.pdf';
  const filePath = path.join(REPORTS_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Header Background
    doc.rect(0, 0, 595.28, 85).fill('#166534');
    
    doc.fillColor('#FFFFFF')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('WELLNESS & BODY COMPOSITION REPORT', 40, 22);

    doc.fontSize(11)
       .font('Helvetica')
       .text('Personalized Health & Nutrition Evaluation', 40, 48);

    doc.fontSize(10)
       .text('Date: ' + new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 430, 48, { align: 'right' });

    // Client Info Box
    doc.roundedRect(40, 100, 515, 65, 8).lineWidth(1).strokeColor('#E2E8F0').fillAndStroke('#F8FAFC', '#E2E8F0');
    
    doc.fillColor('#1E293B').fontSize(12).font('Helvetica-Bold').text('Member Profile', 55, 112);

    doc.fontSize(10).font('Helvetica')
       .text('Name: ' + metrics.name, 55, 132)
       .text('Age: ' + metrics.age + ' Years', 200, 132)
       .text('Gender: ' + metrics.gender, 310, 132)
       .text('Coach: ' + coachName, 410, 132);

    doc.text('Height: ' + metrics.heightCm + ' cm', 55, 148)
       .text('Weight: ' + metrics.weightKg + ' kg', 200, 148)
       .text('Ideal Weight: ' + analysis.metrics.idealWeightKg + ' kg', 310, 148);

    // Metrics Table Header
    doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text('Body Composition Analysis', 40, 185);

    let startY = 205;

    // Table Header Row
    doc.rect(40, startY, 515, 24).fill('#E2E8F0');
    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold')
       .text('PARAMETER', 50, startY + 7)
       .text('YOUR VALUE', 225, startY + 7)
       .text('HEALTHY RANGE', 335, startY + 7)
       .text('STATUS', 450, startY + 7);

    startY += 24;

    const rows = [
      { name: 'BMI (Body Mass Index)', val: '' + analysis.metrics.bmi, ref: '18.5 - 22.9', status: analysis.metrics.bmiCategory },
      { name: 'Body Fat Percentage', val: analysis.metrics.bodyFatPct + '%', ref: '10 - 25%', status: analysis.metrics.bodyFatCategory },
      { name: 'Visceral Fat (Internal Fat)', val: '' + analysis.metrics.visceralFat, ref: '2 - 8 units', status: analysis.metrics.visceralFatCategory },
      { name: 'Subcutaneous Fat', val: analysis.metrics.subFatPct + '%', ref: '< 15%', status: analysis.metrics.subFatPct <= 15 ? 'Normal' : 'High' },
      { name: 'Skeletal Muscle Mass', val: analysis.metrics.skeletalMusclePct + '%', ref: '30 - 36%', status: analysis.metrics.skeletalMusclePct >= 28 ? 'Healthy' : 'Low' },
      { name: 'Body Age (Metabolic Age)', val: analysis.metrics.bodyAge + ' Yrs', ref: '<= ' + metrics.age + ' Yrs', status: analysis.metrics.bodyAge <= metrics.age ? 'Great' : 'Needs Care' },
      { name: 'BMR (Resting Energy)', val: analysis.metrics.bmr + ' kcal', ref: '1400 - 1800 kcal', status: 'Optimal' },
    ];

    rows.forEach((r, idx) => {
      const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(40, startY, 515, 22).fill(bg);

      doc.fillColor('#1E293B').fontSize(9).font('Helvetica')
         .text(r.name, 50, startY + 6)
         .text(r.val, 225, startY + 6)
         .text(r.ref, 335, startY + 6);

      const statusColor = r.status.includes('Normal') || r.status.includes('Healthy') || r.status.includes('Great') ? '#166534' : '#DC2626';
      doc.fillColor(statusColor).font('Helvetica-Bold').text(r.status, 450, startY + 6);

      startY += 22;
    });

    // Summary & Goal Section
    startY += 15;
    doc.roundedRect(40, startY, 515, 95, 6).lineWidth(1).strokeColor('#CBD5E1').fillAndStroke('#FEFCE8', '#CBD5E1');
    doc.fillColor('#854D0E').fontSize(11).font('Helvetica-Bold').text('🎯 Personalized Target & Goals', 55, startY + 12);
    
    doc.fillColor('#1E293B').fontSize(9).font('Helvetica')
       .text('• Target Weight: ' + analysis.metrics.idealWeightKg + ' kg (Current: ' + metrics.weightKg + ' kg)', 55, startY + 30)
       .text('• Weight Adjustment Goal: ' + (analysis.metrics.weightDiffKg > 0 ? ('Reduce ' + analysis.metrics.weightDiffKg + ' kg safely with balanced nutrition') : 'Maintain healthy body composition'), 55, startY + 45)
       .text('• Reduce Visceral Fat from ' + analysis.metrics.visceralFat + ' down to 8 or below to safeguard organ health', 55, startY + 60)
       .text('• Improve Skeletal Muscle Mass to lower Body Age closer to actual age (' + metrics.age + ' years)', 55, startY + 75);

    // Key Guidelines Section
    startY += 105;
    doc.roundedRect(40, startY, 515, 115, 6).lineWidth(1).strokeColor('#CBD5E1').fillAndStroke('#F0FDF4', '#CBD5E1');
    doc.fillColor('#166534').fontSize(11).font('Helvetica-Bold').text('💡 Recommended Action Steps', 55, startY + 12);
    
    doc.fillColor('#1E293B').fontSize(9).font('Helvetica')
       .text('1. Join the Daily Morning Wellness Club for interactive exercise, positive mindset, and nutrition education.', 55, startY + 30)
       .text('2. Follow the 1-Meal (Basic) or 2-Meal (Elite) specialized nutrition shake routine consistently.', 55, startY + 45)
       .text('3. Hydrate with 4-5 cups of refreshing herbal energy tea daily + water as per weight (1 glass every 30 mins).', 55, startY + 60)
       .text('4. Avoid refined flour (Maida), excess sugar, and deep-fried foods for optimal detoxification.', 55, startY + 75)
       .text('5. Stay in regular 1-on-1 touch with your Wellness Coach for milestone body tracking.', 55, startY + 90);

    // Footer
    doc.rect(0, 800, 595.28, 42).fill('#F1F5F9');
    doc.fillColor('#64748B').fontSize(8).font('Helvetica')
       .text('Automated Wellness Coaching System | Confidential Health Assessment', 40, 814, { align: 'center' });

    doc.end();

    writeStream.on('finish', () => resolve(filename));
    writeStream.on('error', (err) => reject(err));
  });
}

export interface ProfitEntryForPDF {
  sNo: number;
  paymentDate: string;
  memberName: string;
  membershipType: string;
  transactionType: string;
  amountReceived: number;
  coachAmount: number;
  costOfKit: number;
  cashProfit: number;
  paymentStatus: string;
  clubPaymentDate?: string;
}

export async function generateMonthlyProfitSheetPDF(
  sheetName: string,
  entries: ProfitEntryForPDF[],
  totals: {
    totalReceived: number;
    totalCoach: number;
    totalKit: number;
    totalProfit: number;
  }
): Promise<string> {
  const filename = 'profit_sheet_' + sheetName.replace(/s+/g, '_') + '_' + Date.now() + '.pdf';
  const filePath = path.join(REPORTS_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Header
    doc.rect(0, 0, 841.89, 70).fill('#0F172A');
    doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('MONTHLY CASH PROFIT REPORT - ' + sheetName.toUpperCase(), 30, 20);
    doc.fontSize(10).font('Helvetica').text('Herbalife Wellness Coach Business Record | Submission for Senior Coach', 30, 46);
    doc.text('Generated: ' + new Date().toLocaleDateString('en-IN'), 700, 46, { align: 'right' });

    // Summary Cards Row
    let startY = 85;
    const cardW = 180;
    const cards = [
      { title: 'Total Amount Received', val: 'Rs. ' + totals.totalReceived.toLocaleString('en-IN'), color: '#3B82F6' },
      { title: 'Total Coach Amount', val: 'Rs. ' + totals.totalCoach.toLocaleString('en-IN'), color: '#6366F1' },
      { title: 'Total Cost of Kit', val: 'Rs. ' + totals.totalKit.toLocaleString('en-IN'), color: '#EC4899' },
      { title: 'Total Cash Profit', val: 'Rs. ' + totals.totalProfit.toLocaleString('en-IN'), color: '#10B981' },
    ];

    cards.forEach((c, i) => {
      const x = 30 + i * (cardW + 15);
      doc.roundedRect(x, startY, cardW, 45, 6).lineWidth(1).strokeColor('#E2E8F0').fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(c.title, x + 10, startY + 8);
      doc.fillColor(c.color).fontSize(14).font('Helvetica-Bold').text(c.val, x + 10, startY + 22);
    });

    // Table Headers
    startY = 145;
    const tableW = 780;
    doc.rect(30, startY, tableW, 24).fill('#1E293B');

    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold')
       .text('S.No', 35, startY + 7)
       .text('Date', 65, startY + 7)
       .text('Member Name', 130, startY + 7)
       .text('Plan', 255, startY + 7)
       .text('Type', 305, startY + 7)
       .text('Received', 370, startY + 7)
       .text('Coach Amt', 440, startY + 7)
       .text('Cost of Kit', 515, startY + 7)
       .text('Cash Profit', 590, startY + 7)
       .text('Status', 665, startY + 7)
       .text('Club Date', 725, startY + 7);

    startY += 24;

    entries.forEach((e, idx) => {
      if (startY > 520) {
        doc.addPage();
        startY = 40;
      }

      const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(30, startY, tableW, 20).fill(bg);

      doc.fillColor('#334155').fontSize(8).font('Helvetica')
         .text(String(e.sNo), 35, startY + 5)
         .text(e.paymentDate, 65, startY + 5)
         .font('Helvetica-Bold').text(e.memberName, 130, startY + 5).font('Helvetica')
         .text(e.membershipType, 255, startY + 5)
         .text(e.transactionType, 305, startY + 5)
         .text('Rs. ' + e.amountReceived.toLocaleString('en-IN'), 370, startY + 5)
         .text('Rs. ' + e.coachAmount.toLocaleString('en-IN'), 440, startY + 5)
         .text('Rs. ' + e.costOfKit.toLocaleString('en-IN'), 515, startY + 5);

      doc.fillColor('#059669').font('Helvetica-Bold').text('Rs. ' + e.cashProfit.toLocaleString('en-IN'), 590, startY + 5).font('Helvetica');

      const statusColor = e.paymentStatus === 'Received' ? '#166534' : '#DC2626';
      doc.fillColor(statusColor).text(e.paymentStatus, 665, startY + 5);
      doc.fillColor('#64748B').text(e.clubPaymentDate || '-', 725, startY + 5);

      startY += 20;
    });

    // Totals Row
    doc.rect(30, startY, tableW, 22).fill('#E2E8F0');
    doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold')
       .text('TOTALS:', 280, startY + 6)
       .text('Rs. ' + totals.totalReceived.toLocaleString('en-IN'), 370, startY + 6)
       .text('Rs. ' + totals.totalCoach.toLocaleString('en-IN'), 440, startY + 6)
       .text('Rs. ' + totals.totalKit.toLocaleString('en-IN'), 515, startY + 6);

    doc.fillColor('#047857').text('Rs. ' + totals.totalProfit.toLocaleString('en-IN'), 590, startY + 6);

    doc.end();

    writeStream.on('finish', () => resolve(filename));
    writeStream.on('error', (err) => reject(err));
  });
}
