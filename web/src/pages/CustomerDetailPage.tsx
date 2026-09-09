import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatCard } from '../components/ui/StatCard';
import { Icons } from '../components/ui/Icons';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { BodyAnalysisModal } from '../components/forms/BodyAnalysisModal';
import { ConsumerHomevisitModal } from '../components/forms/ConsumerHomevisitModal';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'onboarding' | 'progress' | 'measurements' | 'photos' | 'orders'>('onboarding');

  // New Check-in Dialog State
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [checkinWeight, setCheckinWeight] = useState('');
  const [checkinWater, setCheckinWater] = useState('');
  const [checkinMeals, setCheckinMeals] = useState(true);
  const [checkinExercise, setCheckinExercise] = useState('');
  const [checkinEnergy, setCheckinEnergy] = useState('');
  const [checkinSleep, setCheckinSleep] = useState('');
  const [checkinNotes, setCheckinNotes] = useState('');
  const [checkinFeedback, setCheckinFeedback] = useState('');

  // New Measurement Dialog State
  const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false);
  const [mChest, setMChest] = useState('');
  const [mWaist, setMWaist] = useState('');
  const [mHips, setMHips] = useState('');
  const [mThighs, setMThighs] = useState('');
  const [mArms, setMArms] = useState('');

  // New Photo Dialog State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoType, setPhotoType] = useState<'FRONT' | 'BACK' | 'SIDE'>('FRONT');
  const [photoCaption, setPhotoCaption] = useState('');

  // New Assessment Forms State
  const [isBodyModalOpen, setIsBodyModalOpen] = useState(false);
  const [isHomevisitModalOpen, setIsHomevisitModalOpen] = useState(false);

  const loadCustomerData = () => {
    if (!id) return;
    setLoading(true);
    api.getCustomer(id)
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomerData();
  }, [id]);

  const handleToggleOnboarding = async (itemId: number, currentStatus: boolean) => {
    try {
      await api.toggleOnboardingItem(itemId, !currentStatus);
      loadCustomerData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle onboarding item');
    }
  };

  const handleSaveCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.createCheckin(id, {
        weight_kg: checkinWeight ? Number(checkinWeight) : undefined,
        water_liters: Number(checkinWater),
        meals_compliant: checkinMeals,
        exercise_mins: Number(checkinExercise),
        energy_level: Number(checkinEnergy),
        sleep_hours: Number(checkinSleep),
        notes: checkinNotes,
        coach_feedback: checkinFeedback,
        reviewed_by_coach: true,
      });
      setIsCheckinModalOpen(false);
      setCheckinWeight('');
      setCheckinNotes('');
      loadCustomerData();
    } catch (err: any) {
      alert(err.message || 'Failed to save check-in');
    }
  };

  const handleSaveMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.createMeasurement(id, {
        chest_cm: mChest ? Number(mChest) : undefined,
        waist_cm: mWaist ? Number(mWaist) : undefined,
        hips_cm: mHips ? Number(mHips) : undefined,
        thighs_cm: mThighs ? Number(mThighs) : undefined,
        arms_cm: mArms ? Number(mArms) : undefined,
      });
      setIsMeasureModalOpen(false);
      loadCustomerData();
    } catch (err: any) {
      alert(err.message || 'Failed to save measurement');
    }
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.createPhoto(id, {
        photo_url: photoUrl || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
        photo_type: photoType,
        caption: photoCaption,
        is_private: true,
      });
      setIsPhotoModalOpen(false);
      setPhotoUrl('');
      loadCustomerData();
    } catch (err: any) {
      alert(err.message || 'Failed to save photo');
    }
  };

  if (loading && !data) {
    return <LoadingSpinner message="Loading customer hub..." fullPage />;
  }

  if (!data?.customer) {
    return (
      <div className="card text-center p-8 space-y-3" style={{ maxWidth: 500, margin: '40px auto' }}>
        <p className="text-lg font-bold">Customer Not Found</p>
        <Link to="/crm/customers" className="btn btn-secondary">
          Back to Customers
        </Link>
      </div>
    );
  }

  const { customer, onboarding, checkins, measurements, photos, orders, payments, progressSummary } = data;
  const completedCount = onboarding?.filter((i: any) => i.is_completed).length || 0;
  const totalOnboarding = onboarding?.length || 10;
  const completionPct = Math.round((completedCount / totalOnboarding) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header with Customer Details and Actions */}
      <PageHeader
        title={customer.name}
        subtitle={`${customer.phone_number} • Plan: ${customer.current_plan || 'Standard'} • Renewal: ${customer.renewal_date || 'N/A'}`}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Link to="/crm/customers" className="btn btn-secondary btn-sm">
              ← Customers
            </Link>
            <a
              href={`https://wa.me/${(customer.phone_number || '').replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icons.Message size={14} />
              <span>WhatsApp</span>
            </a>
            <button onClick={() => setIsHomevisitModalOpen(true)} className="btn btn-secondary btn-sm">
              First Homevisit
            </button>
            <button onClick={() => setIsBodyModalOpen(true)} className="btn btn-secondary btn-sm">
              Body Analysis
            </button>
            <button onClick={() => setIsCheckinModalOpen(true)} className="btn btn-primary btn-sm">
              + Log Check-in
            </button>
          </div>
        }
      />

      {/* Metric Cards Row (Single Line Compact Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--space-3)' }}>
        <StatCard
          icon={<Icons.Customers size={18} />}
          label="Total Weight Change"
          value={progressSummary?.totalWeightLossKg > 0 ? `-${progressSummary.totalWeightLossKg} kg` : progressSummary?.totalWeightLossKg < 0 ? `+${Math.abs(progressSummary.totalWeightLossKg)} kg` : 'On Track'}
          subtitle="Progress vs baseline"
          variant="primary"
        />
        <StatCard
          icon={<Icons.BodyAnalysis size={18} />}
          label="Baseline Weight"
          value={progressSummary?.baselineWeight ? `${progressSummary.baselineWeight} kg` : 'N/A'}
          subtitle="Day 1 starting record"
          variant="neutral"
        />
        <StatCard
          icon={<Icons.Reports size={18} />}
          label="Current Weight"
          value={progressSummary?.currentWeight ? `${progressSummary.currentWeight} kg` : 'N/A'}
          subtitle="Latest recorded check-in"
          variant="neutral"
        />
        <StatCard
          icon={<Icons.Today size={18} />}
          label="Check-ins Logged"
          value={progressSummary?.checkinCount || 0}
          subtitle="Total compliance reviews"
          variant="neutral"
        />
      </div>

      {/* Main Tabs Navigation Bar */}
      <div className="card" style={{ padding: 'var(--space-2)' }}>
        <div className="tabs-nav" style={{ margin: 0, border: 'none' }}>
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`tab-btn ${activeTab === 'onboarding' ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span>Onboarding Checklist</span>
            <span className="badge badge-neutral" style={{ fontSize: '0.75rem', padding: '2px 6px' }}>
              {completedCount}/{totalOnboarding}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span>Daily Check-ins</span>
            <span className="badge badge-neutral" style={{ fontSize: '0.75rem', padding: '2px 6px' }}>
              {checkins?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('measurements')}
            className={`tab-btn ${activeTab === 'measurements' ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span>Body Measurements</span>
            <span className="badge badge-neutral" style={{ fontSize: '0.75rem', padding: '2px 6px' }}>
              {measurements?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span>Progress Photos</span>
            <span className="badge badge-neutral" style={{ fontSize: '0.75rem', padding: '2px 6px' }}>
              {photos?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span>Orders & Ledger</span>
            <span className="badge badge-neutral" style={{ fontSize: '0.75rem', padding: '2px 6px' }}>
              {orders?.length || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Onboarding Checklist (Enhanced UI) */}
      {activeTab === 'onboarding' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Progress Banner Card */}
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--clr-text-primary)' }}>
                  Standard 10-Point Member Onboarding Checklist
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-tertiary)' }}>
                  {completedCount === totalOnboarding ? 'All onboarding milestones completed!' : `${totalOnboarding - completedCount} pending action item${totalOnboarding - completedCount > 1 ? 's' : ''} remaining.`}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: completionPct === 100 ? '#0f766e' : 'var(--clr-text-primary)' }}>
                  {completionPct}%
                </span>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--clr-text-tertiary)' }}>
                  {completedCount} of {totalOnboarding} Completed
                </div>
              </div>
            </div>

            {/* Visual Animated Progress Bar */}
            <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${completionPct}%`,
                  background: completionPct === 100 ? '#0f766e' : 'linear-gradient(90deg, #0f766e 0%, #14b8a6 100%)',
                  borderRadius: 99,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          {/* Checklist Items Grid (2-Column Responsive Layout) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-3)' }}>
            {onboarding?.map((item: any) => {
              const isDone = Boolean(item.is_completed);

              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleOnboarding(item.id, isDone)}
                  className="card"
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                    cursor: 'pointer',
                    background: isDone ? '#f0fdf4' : '#ffffff',
                    borderColor: isDone ? '#86efac' : 'var(--clr-border)',
                    transition: 'all 0.15s ease',
                    boxShadow: isDone ? 'none' : '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
                    {/* Custom Styled Circular Checkbox */}
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: isDone ? 'none' : '2px solid #cbd5e1',
                        background: isDone ? '#0f766e' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 700,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isDone && '✓'}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: isDone ? '#0f766e' : '#94a3b8',
                            background: isDone ? '#dcfce7' : '#f1f5f9',
                            padding: '1px 5px',
                            borderRadius: 4,
                          }}
                        >
                          Step {String(item.order_index).padStart(2, '0')}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: isDone ? 500 : 600,
                          color: isDone ? '#475569' : 'var(--clr-text-primary)',
                          textDecoration: isDone ? 'line-through' : 'none',
                          lineHeight: 1.3,
                        }}
                      >
                        {item.title}
                      </div>
                    </div>
                  </div>

                  {/* Completed Date Tag */}
                  {isDone && item.completed_at && (
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: '#0f766e',
                        background: '#dcfce7',
                        padding: '2px 8px',
                        borderRadius: 99,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {new Date(item.completed_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Progress Check-ins */}
      {activeTab === 'progress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--clr-text-primary)' }}>
                Routine Daily Check-ins
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-tertiary)' }}>
                Nutrition compliance, water logs, and energy level tracking
              </p>
            </div>
            <button onClick={() => setIsCheckinModalOpen(true)} className="btn btn-primary btn-sm">
              + Log Check-in
            </button>
          </div>

          {checkins?.length === 0 ? (
            <EmptyState
              icon={<Icons.Today size={32} color="var(--clr-text-tertiary)" />}
              title="No check-ins logged yet"
              message="Record the member's daily diet compliance, water intake and body metrics."
              action={
                <button onClick={() => setIsCheckinModalOpen(true)} className="btn btn-primary">
                  Log First Check-in
                </button>
              }
            />
          ) : (
            <div className="table-container responsive-card-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Weight</th>
                    <th>Water Intake</th>
                    <th>Diet Compliance</th>
                    <th>Energy & Sleep</th>
                    <th>Coach Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {checkins.map((c: any) => (
                    <tr key={c.id}>
                      <td data-label="Date" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-secondary)', fontWeight: 600 }}>
                        {c.checkin_date}
                      </td>
                      <td data-label="Weight" style={{ fontWeight: 700, color: 'var(--clr-text-primary)' }}>
                        {c.weight_kg ? `${c.weight_kg} kg` : '—'}
                      </td>
                      <td data-label="Water">
                        <span className="badge badge-neutral">{c.water_liters || 0} L</span>
                      </td>
                      <td data-label="Diet">
                        <span className={`badge ${c.meals_compliant ? 'badge-success' : 'badge-warning'}`}>
                          {c.meals_compliant ? 'Compliant' : 'Cheat Day'}
                        </span>
                      </td>
                      <td data-label="Energy & sleep" style={{ fontSize: 'var(--font-size-xs)' }}>
                        Energy {c.energy_level}/5 • {c.sleep_hours}h sleep
                      </td>
                      <td data-label="Feedback" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-secondary)', maxWidth: 280 }}>
                        {c.coach_feedback || c.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Measurements */}
      {activeTab === 'measurements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--clr-text-primary)' }}>
                Body Tape Measurements
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-tertiary)' }}>
                Inch-loss circumference tracking across chest, waist, hips, thighs, and arms
              </p>
            </div>
            <button onClick={() => setIsMeasureModalOpen(true)} className="btn btn-primary btn-sm">
              + Record Measurement
            </button>
          </div>

          {measurements?.length === 0 ? (
            <EmptyState
              icon={<Icons.BodyAnalysis size={32} color="var(--clr-text-tertiary)" />}
              title="No tape measurements recorded"
              message="Track inch-loss progress by recording circumference measurements regularly."
              action={
                <button onClick={() => setIsMeasureModalOpen(true)} className="btn btn-primary">
                  Record Measurements
                </button>
              }
            />
          ) : (
            <div className="table-container responsive-card-table">
              <table>
                <thead>
                  <tr>
                    <th>Recorded Date</th>
                    <th>Chest (cm)</th>
                    <th>Waist (cm)</th>
                    <th>Hips (cm)</th>
                    <th>Thighs (cm)</th>
                    <th>Arms (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((m: any) => (
                    <tr key={m.id}>
                      <td data-label="Date" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-secondary)', fontWeight: 600 }}>
                        {m.recorded_date}
                      </td>
                      <td data-label="Chest">{m.chest_cm ? `${m.chest_cm} cm` : '—'}</td>
                      <td data-label="Waist" style={{ fontWeight: 700, color: '#0f766e' }}>
                        {m.waist_cm ? `${m.waist_cm} cm` : '—'}
                      </td>
                      <td data-label="Hips">{m.hips_cm ? `${m.hips_cm} cm` : '—'}</td>
                      <td data-label="Thighs">{m.thighs_cm ? `${m.thighs_cm} cm` : '—'}</td>
                      <td data-label="Arms">{m.arms_cm ? `${m.arms_cm} cm` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Photos */}
      {activeTab === 'photos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--clr-text-primary)' }}>
                Private Progress Photos
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-tertiary)' }}>
                Secure photo gallery for client transformation tracking
              </p>
            </div>
            <button onClick={() => setIsPhotoModalOpen(true)} className="btn btn-primary btn-sm">
              + Upload Photo
            </button>
          </div>

          {photos?.length === 0 ? (
            <EmptyState
              icon={<Icons.Customers size={32} color="var(--clr-text-tertiary)" />}
              title="No progress photos yet"
              message="Upload Day 1 baseline and weekly milestone transformation photos."
              action={
                <button onClick={() => setIsPhotoModalOpen(true)} className="btn btn-primary">
                  Upload Photo
                </button>
              }
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
              {photos.map((p: any) => (
                <div key={p.id} className="card" style={{ padding: 'var(--space-2)', overflow: 'hidden' }}>
                  <div style={{ height: 200, background: '#f1f5f9', borderRadius: 8, overflow: 'hidden' }}>
                    <img src={p.photo_url} alt={p.caption || 'Progress Photo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: 'var(--space-2) var(--space-1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="badge badge-neutral">{p.photo_type}</span>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-tertiary)' }}>{p.recorded_date}</span>
                  </div>
                  {p.caption && (
                    <p style={{ margin: 0, padding: '0 var(--space-1)', fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-secondary)' }}>
                      {p.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Orders & Payments */}
      {activeTab === 'orders' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--clr-text-primary)', borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--space-2)' }}>
              Orders & Deliveries
            </h3>
            {orders?.length === 0 ? (
              <EmptyState title="No orders" message="No product orders recorded for this member." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {orders.map((o: any) => (
                  <div key={o.id} style={{ padding: 'var(--space-3)', background: 'var(--clr-neutral-bg)', border: '1px solid var(--clr-border)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--clr-text-primary)', marginBottom: 4 }}>
                      <span>Order #{o.order_number || o.id}</span>
                      <span style={{ color: '#0f766e' }}>₹{o.amount_received?.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-secondary)', marginBottom: 4 }}>
                      Flavors: F1 ({(o.f1_flavors || []).join(', ') || 'Default'}) • Afresh ({(o.afresh_flavors || []).join(', ') || 'Default'})
                    </div>
                    <span className="badge badge-info">{o.order_status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--clr-text-primary)', borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--space-2)' }}>
              Payments Received
            </h3>
            {payments?.length === 0 ? (
              <EmptyState title="No payments" message="No transaction records logged." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {payments.map((pm: any) => (
                  <div key={pm.id} style={{ padding: 'var(--space-3)', background: 'var(--clr-neutral-bg)', border: '1px solid var(--clr-border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--clr-text-primary)' }}>
                        ₹{pm.amount?.toLocaleString('en-IN')} via {pm.payment_method}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-tertiary)' }}>
                        Ref: {pm.reference_no || 'N/A'} • {pm.payment_date}
                      </div>
                    </div>
                    <span className="badge badge-success">Received</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Dialogs */}
      {isCheckinModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckinModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">Log Daily Check-in</h3>
              <button onClick={() => setIsCheckinModalOpen(false)} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSaveCheckin} style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 74.2"
                  value={checkinWeight}
                  onChange={(e) => setCheckinWeight(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Water Intake (L)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={checkinWater}
                    onChange={(e) => setCheckinWater(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Exercise (mins)</label>
                  <input
                    type="number"
                    value={checkinExercise}
                    onChange={(e) => setCheckinExercise(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Energy Level (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={checkinEnergy}
                    onChange={(e) => setCheckinEnergy(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sleep Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={checkinSleep}
                    onChange={(e) => setCheckinSleep(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Meals Compliance</label>
                <select
                  value={checkinMeals ? 'true' : 'false'}
                  onChange={(e) => setCheckinMeals(e.target.value === 'true')}
                  className="form-select"
                >
                  <option value="true">100% Meal Plan Compliant</option>
                  <option value="false">Cheat Day / Off-Plan Meals</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Coach Notes / Feedback</label>
                <textarea
                  rows={2}
                  value={checkinFeedback}
                  onChange={(e) => setCheckinFeedback(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div className="modal-footer" style={{ padding: 0, marginTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setIsCheckinModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMeasureModalOpen && (
        <div className="modal-overlay" onClick={() => setIsMeasureModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Record Body Tape Measurements</h3>
              <button onClick={() => setIsMeasureModalOpen(false)} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSaveMeasurement} style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Chest (cm)</label>
                  <input type="number" step="0.5" value={mChest} onChange={(e) => setMChest(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Waist (cm)</label>
                  <input type="number" step="0.5" value={mWaist} onChange={(e) => setMWaist(e.target.value)} className="form-input" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Hips (cm)</label>
                  <input type="number" step="0.5" value={mHips} onChange={(e) => setMHips(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Thighs (cm)</label>
                  <input type="number" step="0.5" value={mThighs} onChange={(e) => setMThighs(e.target.value)} className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Arms (cm)</label>
                <input type="number" step="0.5" value={mArms} onChange={(e) => setMArms(e.target.value)} className="form-input" />
              </div>
              <div className="modal-footer" style={{ padding: 0, marginTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setIsMeasureModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Measurements
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPhotoModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPhotoModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Upload Progress Photo</h3>
              <button onClick={() => setIsPhotoModalOpen(false)} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSavePhoto} style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Photo URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Photo Angle</label>
                <select
                  value={photoType}
                  onChange={(e) => setPhotoType(e.target.value as any)}
                  className="form-select"
                >
                  <option value="FRONT">Front View</option>
                  <option value="SIDE">Side View</option>
                  <option value="BACK">Back View</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Caption</label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="modal-footer" style={{ padding: 0, marginTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setIsPhotoModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Upload Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Body Analysis & Homevisit Modals */}
      {isBodyModalOpen && (
        <BodyAnalysisModal
          initialName={customer.name}
          initialPhone={customer.phone_number}
          onClose={() => setIsBodyModalOpen(false)}
          onSuccess={() => {
            setIsBodyModalOpen(false);
            loadCustomerData();
          }}
        />
      )}

      {isHomevisitModalOpen && (
        <ConsumerHomevisitModal
          initialName={customer.name}
          initialPhone={customer.phone_number}
          onClose={() => setIsHomevisitModalOpen(false)}
          onSuccess={() => {
            setIsHomevisitModalOpen(false);
            loadCustomerData();
          }}
        />
      )}
    </div>
  );
}
