import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { BodyAnalysisModal } from '../components/forms/BodyAnalysisModal';
import { Icons } from '../components/ui/Icons';
import { useToast } from '../hooks/useToast';

export function BodyAnalysisPage() {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [previewReport, setPreviewReport] = useState<{ report: string; name: string; phone: string } | null>(null);

  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await api.getBodyAnalyses();
      setAnalyses(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast.error('Failed to load body analyses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = analyses.filter((item) => {
    const q = search.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(q) ||
      (item.phone_number || '').includes(q) ||
      (item.serial_no || '').toLowerCase().includes(q)
    );
  });

  // Calculate high-level stats
  const totalCount = analyses.length;
  const highVisceralCount = analyses.filter((a) => Number(a.visceral_fat) >= 9).length;
  const highBodyFatCount = analyses.filter((a) => Number(a.body_fat_pct) >= 30).length;

  const openReport = (item: any) => {
    let reportText = item.hindi_report;
    if (!reportText) {
      const visc = Number(item.visceral_fat || 0);
      const viscComment = visc >= 9 ? 'सामान्य सीमा (2–8) से अधिक है।' : 'सामान्य सीमा (2–8) में है।';
      const bmiVal = Number(item.bmi || 0);
      const bmiCat = bmiVal >= 25 ? 'ओवरवेट / मोटापा' : bmiVal >= 18.5 ? 'सामान्य' : 'अंडरवेट';

      reportText = `नाम: ${item.name} जी
उम्र: ${item.age} वर्ष
लंबाई: ${item.height_cm} सेमी
वजन: ${item.weight_kg} किग्रा
BMI: ${item.bmi} (${bmiCat} श्रेणी)

रिपोर्ट का सारांश

* बॉडी फैट: ${item.body_fat_pct}%
* सबक्यूटेनियस फैट: ${item.sub_fat_pct}%
* विसरल फैट: ${item.visceral_fat} – ${viscComment}
* स्केलेटल मसल: ${item.skeletal_muscle_pct}%
* बॉडी एज: ${item.body_age} वर्ष
* BMR: ${item.bmr} kcal

सुझाव

- प्रोटीन व फाइबर युक्त संतुलित आहार लें।
- 30–45 मिनट नियमित वर्कआउट करें।
- पर्याप्त पानी पिएँ और अच्छी नींद लें।

विस्तृत रिपोर्ट लिंक: http://localhost:5173/report?phone=${encodeURIComponent(item.phone_number || '')}`;
    }

    setPreviewReport({
      report: reportText,
      name: item.name,
      phone: item.phone_number,
    });
  };

  return (
    <div className="crm-workflow-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Body Analysis"
        subtitle="Create an analysis or find an existing health report."
        action={
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <Icons.Plus size={16} />
            <span>New Body Analysis</span>
          </button>
        }
      />

      {/* Metrics Row (Single Line Compact Grid) */}
      <div className="crm-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-3)' }}>
        <StatCard
          icon={<Icons.BodyAnalysis size={18} />}
          label="Total Evaluations"
          value={totalCount}
          subtitle="Total body composition records"
          variant="primary"
        />
        <StatCard
          icon={<Icons.AlertCircle size={18} />}
          label="High Visceral Fat (>8)"
          value={highVisceralCount}
          subtitle="Attention needed"
          variant="warning"
        />
        <StatCard
          icon={<Icons.Reports size={18} />}
          label="Elevated Body Fat (>30%)"
          value={highBodyFatCount}
          subtitle="Weight management prospects"
          variant="danger"
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card crm-toolbar" style={{ padding: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{
              position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--clr-text-tertiary)', display: 'flex', alignItems: 'center', pointerEvents: 'none',
            }}>
              <Icons.Search size={15} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client name, mobile or serial no..."
              className="form-input"
              style={{ paddingLeft: 'var(--space-8)', height: '36px' }}
            />
          </div>

          <button
            type="button"
            onClick={loadData}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', height: '36px' }}
          >
            <Icons.Refresh size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Evaluations Data Table */}
      <div className="table-container responsive-card-table">
        {loading ? (
          <div style={{ padding: 'var(--space-12)' }}>
            <LoadingSpinner message="Loading body evaluations..." />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Icons.BodyAnalysis size={32} color="var(--clr-text-tertiary)" />}
            title="No Body Analysis evaluations found"
            message={search ? 'No records match your search criteria.' : 'Click "+ New Body Analysis" to create your first client evaluation.'}
            action={
              !search ? (
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                  Add First Evaluation
                </button>
              ) : undefined
            }
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Client Name & Phone</th>
                <th>Age / Gender</th>
                <th>Weight (Kg)</th>
                <th>Body Fat %</th>
                <th>Visceral Fat</th>
                <th>BMI</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => {
                const visc = Number(item.visceral_fat || 0);
                const fat = Number(item.body_fat_pct || 0);
                const bmi = Number(item.bmi || 0);

                return (
                  <tr key={item.id || idx}>
                    <td data-label="Date" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-secondary)', whiteSpace: 'nowrap' }}>
                      {item.date || (item.created_at ? item.created_at.split('T')[0] : '—')}
                      {item.serial_no && (
                        <div style={{ color: 'var(--clr-text-tertiary)', fontSize: '0.7rem' }}>
                          #{item.serial_no}
                        </div>
                      )}
                    </td>
                    <td data-label="Person">
                      <div style={{ fontWeight: 600, color: 'var(--clr-text-primary)' }}>
                        {item.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-tertiary)' }}>
                        {item.phone_number || item.mobile || '—'}
                      </div>
                    </td>
                    <td data-label="Age / Gender">
                      <span style={{ fontSize: 'var(--font-size-sm)' }}>
                        {item.age ? `${item.age}y` : '—'} / {item.gender || '—'}
                      </span>
                    </td>
                    <td data-label="Weight" style={{ fontWeight: 600 }}>
                      {item.weight_kg ? `${item.weight_kg} kg` : '—'}
                    </td>
                    <td data-label="Body Fat">
                      <span className={`badge ${fat >= 32 ? 'badge-danger' : fat >= 25 ? 'badge-warning' : 'badge-success'}`}>
                        {item.body_fat_pct ? `${item.body_fat_pct}%` : '—'}
                      </span>
                    </td>
                    <td data-label="Visceral Fat">
                      <span className={`badge ${visc >= 9 ? 'badge-danger' : 'badge-success'}`}>
                        {item.visceral_fat ? `Level ${item.visceral_fat}` : '—'}
                      </span>
                    </td>
                    <td data-label="BMI">
                      <span className={`badge ${bmi >= 25 ? 'badge-warning' : 'badge-neutral'}`}>
                        {item.bmi || '—'}
                      </span>
                    </td>
                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
                        <button
                          type="button"
                          onClick={() => openReport(item)}
                          className="btn btn-secondary btn-sm"
                          title="View / Send AI Report"
                          style={{ fontWeight: 500 }}
                        >
                          AI Report
                        </button>
                        <a
                          href={`/report?phone=${encodeURIComponent(item.phone_number || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                          title="Customer View (shareable link)"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Icons.Eye size={14} />
                        </a>
                        <a
                          href={`https://wa.me/${(item.phone_number || '').replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                          title="Open WhatsApp Chat"
                        >
                          <Icons.Message size={15} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* New Evaluation Modal */}
      {showModal && (
        <BodyAnalysisModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {/* Existing Report Preview Modal */}
      {previewReport && (
        <BodyAnalysisModal
          initialName={previewReport.name}
          initialPhone={previewReport.phone}
          previewReport={previewReport.report}
          onClose={() => setPreviewReport(null)}
        />
      )}
    </div>
  );
}
