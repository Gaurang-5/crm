import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export function BodyAnalysisReport() {
  const [params] = useSearchParams();
  const phone = params.get('phone') || '';
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!phone) {
      setError('No phone number provided in link.');
      setLoading(false);
      return;
    }
    fetch(`${BASE_URL}/api/body-analyses?phone=${encodeURIComponent(phone)}`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        if (list.length === 0) {
          setError(`No body analysis records found for ${phone}.`);
        } else {
          setAnalyses(list);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load report. Please check your internet connection.');
        setLoading(false);
      });
  }, [phone]);

  const latest = analyses[0];

  const bmiLabel = (bmi: number) => {
    if (bmi < 18.5) return { text: 'Underweight', color: '#3b82f6', bg: '#eff6ff' };
    if (bmi <= 22.9) return { text: 'Normal / Ideal', color: '#0f766e', bg: '#f0fdfa' };
    if (bmi <= 24.9) return { text: 'Overweight', color: '#d97706', bg: '#fffbeb' };
    return { text: 'Obese', color: '#dc2626', bg: '#fef2f2' };
  };

  const viscLabel = (v: number) => {
    if (v <= 8) return { text: 'Healthy (Range 2–8)', color: '#0f766e', bg: '#f0fdfa' };
    if (v <= 14) return { text: 'High Risk', color: '#d97706', bg: '#fffbeb' };
    return { text: 'Very High Risk', color: '#dc2626', bg: '#fef2f2' };
  };

  const fatLabel = (f: number, gender: string) => {
    const isFemale = gender === 'F' || String(gender).toLowerCase().startsWith('f');
    const high = isFemale ? 30 : 20;
    const vhigh = isFemale ? 35 : 25;
    if (f >= vhigh) return { text: 'Very High', color: '#dc2626', bg: '#fef2f2' };
    if (f >= high) return { text: 'High', color: '#d97706', bg: '#fffbeb' };
    return { text: 'Normal', color: '#0f766e', bg: '#f0fdfa' };
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#64748b' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#0f766e', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontWeight: 600, color: '#0f172a' }}>Loading Health Report...</p>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Healthy Living Club</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !latest) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, fontWeight: 700 }}>
              !
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Report Not Found</h2>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>{error || 'No evaluation record found for this mobile number.'}</p>
            <a
              href="https://wa.me/919876543210?text=Hi%20Coach%20Deepa,%20I%20would%20like%20to%20get%20my%20Body%20Analysis%20report"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.btnPrimary}
            >
              Contact Coach Deepa on WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  const bmi = bmiLabel(Number(latest.bmi));
  const visc = viscLabel(Number(latest.visceral_fat));
  const fat = fatLabel(Number(latest.body_fat_pct), latest.gender);
  const isBodyAgeHigh = Number(latest.body_age) > Number(latest.age);
  const ageDifference = Math.abs(Number(latest.body_age) - Number(latest.age));

  let rawReportText = latest.hindi_report;
  if (!rawReportText) {
    const isFemale = latest.gender === 'F' || String(latest.gender).toLowerCase().startsWith('f');
    const viscNum = Number(latest.visceral_fat || 0);
    const viscComment = viscNum <= 8 ? 'सामान्य सीमा (2–8) में है।' : 'सामान्य सीमा (2–8) से अधिक है, इसे कम करने की आवश्यकता है।';
    const bmiVal = Number(latest.bmi || 0);
    const bmiCat = bmiVal >= 25 ? 'अधिक वजन / ओवरवेट' : bmiVal >= 18.5 ? 'सामान्य' : 'अंडरवेट';

    rawReportText = `नाम: ${latest.name} जी
उम्र: ${latest.age} वर्ष
लंबाई: ${latest.height_cm} सेमी
वजन: ${latest.weight_kg} किग्रा
BMI: ${latest.bmi} (${bmiCat} श्रेणी)

रिपोर्ट का सारांश

* बॉडी फैट: ${latest.body_fat_pct}% – शरीर में फैट का स्तर स्वस्थ सीमा में लाने की आवश्यकता है।
* सबक्यूटेनियस फैट: ${latest.sub_fat_pct}% – त्वचा के नीचे जमी वसा का स्तर।
* विसरल फैट: ${latest.visceral_fat} – ${viscComment}
* स्केलेटल मसल: ${latest.skeletal_muscle_pct}% – मांसपेशियों का प्रतिशत, इसे बढ़ाने पर ध्यान दें।
* बॉडी एज: ${latest.body_age} वर्ष – ${isBodyAgeHigh ? `आपकी वास्तविक उम्र (${latest.age} वर्ष) से ${ageDifference} वर्ष अधिक है।` : 'आपकी शारीरिक उम्र संतुलित है।'}
* BMR: ${latest.bmr} kcal – आराम की अवस्था में प्रतिदिन आवश्यक ऊर्जा।

सुझाव

✅ दैनिक आहार में प्रोटीन की मात्रा बढ़ाएं और मीठे व जंक फूड से परहेज करें।
✅ रोजाना 30–45 मिनट वॉक और हल्की स्ट्रेंth ट्रेनिंग को अपनी दिनचर्या का हिस्सा बनाएं।
✅ रोजाना 3–4 लीटर पानी पिएं और 7–8 घंटे की पर्याप्त नींद लें।
✅ नियमित ट्रैकिंग और फॉलो-अप के लिए कोच दीपा के साथ जुड़े रहें।

लक्ष्य

* स्वस्थ तरीके से आदर्श वजन (${latest.ideal_weight_kg ? latest.ideal_weight_kg + ' किग्रा' : 'संतुलित वजन'}) प्राप्त करना।
* बॉडी फैट ${latest.body_fat_pct}% से घटाकर स्वस्थ सीमा में लाना।
* विसरल फैट ${latest.visceral_fat} से घटाकर सुरक्षित सीमा (8 या कम) में लाना।
* मसल मास बढ़ाकर मेटाबॉलिज्म और बॉडी एज में सुधार करना।`;
  }

  const reportLines = rawReportText ? rawReportText.split('\n') : null;

  return (
    <div style={styles.page}>
      {/* Brand Header */}
      <div style={styles.header}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: '#e6f4ea', borderRadius: 99, color: '#0f766e', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>
          Official Body Composition Report
        </div>
        <h1 style={styles.headerTitle}>Wellness Evaluation Report</h1>
        <p style={styles.headerSub}>Healthy Living Club · Coach Deepa Bhatia</p>
      </div>

      {/* Profile Card */}
      <div style={styles.card}>
        <div style={styles.profileRow}>
          <div style={styles.avatar}>
            {(latest.name || 'C')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.clientName}>{latest.name} जी</div>
            <div style={styles.clientMeta}>
              {latest.age} Years · {latest.gender === 'F' ? 'Female' : 'Male'} · {latest.phone_number || phone}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              Evaluation Date: {latest.date || (latest.created_at ? latest.created_at.split('T')[0] : '—')} · Serial #{latest.serial_no || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Key Health Metrics Grid */}
      <div style={styles.metricsGrid}>
        <MetricBox label="Current Weight" value={`${latest.weight_kg} kg`} />
        <MetricBox label="Ideal Target Weight" value={`${latest.ideal_weight_kg || '52-58'} kg`} badge={{ text: 'Target', color: '#0f766e', bg: '#f0fdfa' }} />
        <MetricBox label="Body Mass Index (BMI)" value={String(latest.bmi)} badge={bmi} />
        <MetricBox label="Body Fat %" value={`${latest.body_fat_pct}%`} badge={fat} />
        <MetricBox label="Visceral Fat (Internal)" value={`Level ${latest.visceral_fat}`} badge={visc} />
        <MetricBox label="Subcutaneous Fat" value={`${latest.sub_fat_pct}%`} />
        <MetricBox label="Skeletal Muscle" value={`${latest.skeletal_muscle_pct}%`} />
        <MetricBox
          label="Body Age vs Real Age"
          value={`${latest.body_age} yrs`}
          subtitle={isBodyAgeHigh ? `+${ageDifference} yrs metabolic strain` : 'Metabolically younger'}
          highlight={isBodyAgeHigh}
        />
        <MetricBox label="Basal Metabolic Rate (BMR)" value={`${latest.bmr} kcal`} subtitle="Resting daily calorie burn" />
        <MetricBox label="Height" value={`${latest.height_cm} cm`} />
      </div>

      {/* Hindi AI Personalized Report */}
      {reportLines && (
        <div style={styles.card}>
          <div style={styles.reportHeader}>
            <span style={{ fontSize: 18 }}>📋</span>
            <span style={styles.reportTitle}>व्यक्तिगत स्वास्थ्य एवं पोषण विश्लेषण</span>
          </div>
          <div style={styles.reportBody}>
            {reportLines.map((line: string, i: number) => {
              if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
              const isHeading = !line.startsWith('*') && !line.startsWith('✅') && !line.startsWith('-') && !line.startsWith('🔗') && !line.startsWith('नाम') && !line.startsWith('उम्र') && !line.startsWith('लंबाई') && !line.startsWith('वजन') && !line.startsWith('BMI') && line.length < 40;
              const isBullet = line.startsWith('*') || line.startsWith('✅') || line.startsWith('-');
              const isLink = line.startsWith('🔗') || line.startsWith('विस्तृत रिपोर्ट');

              if (isHeading) return <div key={i} style={styles.reportHeading}>{line}</div>;
              if (isBullet) return <div key={i} style={styles.reportBullet}>{line}</div>;
              if (isLink) return null; // hide redundant self link on client view
              return <div key={i} style={styles.reportLine}>{line}</div>;
            })}
          </div>
        </div>
      )}

      {/* Action Buttons for Client */}
      <div style={{ ...styles.card, background: '#f8fafc', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Ready to Start Your Transformation?</h3>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Connect with Coach Deepa Bhatia for your customized meal plan and daily guidance.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 }}>
          <a
            href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi Coach Deepa, I reviewed my Body Analysis report (${latest.name}, Weight: ${latest.weight_kg}kg, Body Fat: ${latest.body_fat_pct}%). I would like to schedule my consultation.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.btnPrimary}
          >
            Chat with Coach Deepa on WhatsApp
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            style={styles.btnSecondary}
          >
            Save / Print PDF
          </button>
        </div>
      </div>

      {/* Past Evaluations History */}
      {analyses.length > 1 && (
        <div style={styles.card}>
          <div style={styles.reportHeader}>
            <span style={{ fontSize: 16 }}>📈</span>
            <span style={styles.reportTitle}>Previous Evaluation Progress ({analyses.length} Total)</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Date', 'Weight', 'Body Fat', 'Visceral', 'BMI', 'Body Age'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analyses.map((a, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', color: '#475569', fontSize: 12 }}>{a.date || (a.created_at ? a.created_at.split('T')[0] : '—')}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{a.weight_kg} kg</td>
                    <td style={{ padding: '10px 12px' }}>{a.body_fat_pct}%</td>
                    <td style={{ padding: '10px 12px' }}>Level {a.visceral_fat}</td>
                    <td style={{ padding: '10px 12px' }}>{a.bmi}</td>
                    <td style={{ padding: '10px 12px', color: Number(a.body_age) > Number(a.age) ? '#dc2626' : '#0f766e', fontWeight: 600 }}>{a.body_age} yrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <footer style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: 12 }}>
        © {new Date().getFullYear()} Healthy Living Club · Personalized Wellness Guidance
      </footer>
    </div>
  );
}

function MetricBox({ label, value, badge, subtitle, highlight }: {
  label: string;
  value: string;
  badge?: { text: string; color: string; bg: string };
  subtitle?: string;
  highlight?: boolean;
}) {
  return (
    <div style={styles.metricBox}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={{ ...styles.metricValue, color: highlight ? '#dc2626' : '#0f172a' }}>{value}</div>
      {subtitle && <div style={{ fontSize: 11, color: highlight ? '#dc2626' : '#64748b', marginTop: 2, fontWeight: 500 }}>{subtitle}</div>}
      {badge && (
        <div style={{ ...styles.badge, background: badge.bg, color: badge.color }}>
          {badge.text}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 16px 48px',
    gap: 16,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  header: {
    textAlign: 'center',
    padding: '16px 0 8px',
    width: '100%',
    maxWidth: 640,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 6px',
    letterSpacing: '-0.02em',
  },
  headerSub: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
    fontWeight: 500,
  },
  card: {
    background: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 640,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
    border: '1px solid #e2e8f0',
  },
  profileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    background: '#0f766e',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    fontWeight: 800,
    flexShrink: 0,
  },
  clientName: {
    fontSize: 20,
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.01em',
  },
  clientMeta: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
    fontWeight: 500,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    width: '100%',
    maxWidth: 640,
  },
  metricBox: {
    background: '#ffffff',
    borderRadius: 12,
    padding: '14px 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  badge: {
    display: 'inline-block',
    alignSelf: 'flex-start',
    marginTop: 6,
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
  },
  reportHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #f1f5f9',
  },
  reportTitle: {
    fontWeight: 700,
    color: '#0f172a',
    fontSize: 16,
  },
  reportBody: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    lineHeight: 1.8,
    color: '#1e293b',
    fontSize: 14,
  },
  reportHeading: {
    fontWeight: 700,
    color: '#0f766e',
    fontSize: 15,
    marginTop: 14,
    marginBottom: 4,
  },
  reportBullet: {
    paddingLeft: 4,
    color: '#334155',
    fontSize: 14,
    lineHeight: 1.8,
  },
  reportLine: {
    color: '#1e293b',
    fontSize: 14,
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: '#0f766e',
    color: '#ffffff',
    padding: '10px 18px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: '#ffffff',
    color: '#334155',
    padding: '10px 18px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    textDecoration: 'none',
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
  },
};
