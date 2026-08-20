import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../hooks/useToast';
import { CustomerSearch } from '../ui/CustomerSearch';
import { Icons } from '../ui/Icons';

interface Props {
  initialPhone?: string;
  initialName?: string;
  previewReport?: string | null;
  onClose: () => void;
  onSuccess?: (saved: any) => void;
  inline?: boolean;
}

const DRAFT_KEY = 'draft_body_analysis';

export function BodyAnalysisModal({
  initialPhone = '',
  initialName = '',
  previewReport = null,
  onClose,
  onSuccess,
  inline = false,
}: Props) {
  const [name, setName] = useState(initialName);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Auto-generate serial number: BA-YYYYMMDD-NNN (e.g. BA-20260820-001)
  const generateSerialNo = () => {
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const rand = String(Math.floor(Math.random() * 900) + 100);
    return `BA-${dateStr}-${rand}`;
  };

  const [serialNo, setSerialNo] = useState(() => generateSerialNo());
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'F' | 'M'>('F');
  const [heightCm, setHeightCm] = useState('');
  const [mobile, setMobile] = useState(initialPhone);
  const [address, setAddress] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [subFatPct, setSubFatPct] = useState('');
  const [bodyAge, setBodyAge] = useState('');
  const [skeletalMusclePct, setSkeletalMusclePct] = useState('');
  const [bodyFatPct, setBodyFatPct] = useState('');
  const [visceralFat, setVisceralFat] = useState('');
  const [bmr, setBmr] = useState('');
  const [bmi, setBmi] = useState('');
  const [wellnessConsultant, setWellnessConsultant] = useState('Coach Deepa');

  const [submitting, setSubmitting] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [aiProgress, setAiProgress] = useState(15);
  const [sendingWa, setSendingWa] = useState(false);
  const [waSent, setWaSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const [generatedReport, setGeneratedReport] = useState<string | null>(previewReport);
  const [savedAnalysis, setSavedAnalysis] = useState<any>(null);

  const toast = useToast();

  // Progress animation ticker when AI report generation is active
  useEffect(() => {
    if (!submitting) return;
    setAiStep(0);
    setAiProgress(12);

    const interval = setInterval(() => {
      setAiProgress((prev) => {
        if (prev < 35) {
          setAiStep(0);
          return prev + 6;
        }
        if (prev < 65) {
          setAiStep(1);
          return prev + 5;
        }
        if (prev < 90) {
          setAiStep(2);
          return prev + 3;
        }
        setAiStep(3);
        return Math.min(prev + 1, 96);
      });
    }, 240);

    return () => clearInterval(interval);
  }, [submitting]);

  // Load draft from localStorage on mount if not in preview mode
  useEffect(() => {
    if (previewReport) return;
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        if (d.name) setName(d.name);
        if (d.date) setDate(d.date);
        if (d.serialNo) setSerialNo(d.serialNo);
        if (d.age) setAge(d.age);
        if (d.gender) setGender(d.gender);
        if (d.heightCm) setHeightCm(d.heightCm);
        if (d.mobile) setMobile(d.mobile);
        if (d.address) setAddress(d.address);
        if (d.weightKg) setWeightKg(d.weightKg);
        if (d.subFatPct) setSubFatPct(d.subFatPct);
        if (d.bodyAge) setBodyAge(d.bodyAge);
        if (d.skeletalMusclePct) setSkeletalMusclePct(d.skeletalMusclePct);
        if (d.bodyFatPct) setBodyFatPct(d.bodyFatPct);
        if (d.visceralFat) setVisceralFat(d.visceralFat);
        if (d.bmr) setBmr(d.bmr);
        if (d.bmi) setBmi(d.bmi);
        if (d.wellnessConsultant) setWellnessConsultant(d.wellnessConsultant);
        setDraftRestored(true);
      }
    } catch (_) {}
  }, [previewReport]);

  // Save draft to localStorage on any field change
  useEffect(() => {
    if (previewReport || generatedReport) return;
    const isDirty = name || mobile || age || weightKg || heightCm || serialNo;
    if (!isDirty) return;

    const draft = {
      name,
      date,
      serialNo,
      age,
      gender,
      heightCm,
      mobile,
      address,
      weightKg,
      subFatPct,
      bodyAge,
      skeletalMusclePct,
      bodyFatPct,
      visceralFat,
      bmr,
      bmi,
      wellnessConsultant,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (_) {}
  }, [name, date, serialNo, age, gender, heightCm, mobile, address, weightKg, subFatPct, bodyAge, skeletalMusclePct, bodyFatPct, visceralFat, bmr, bmi, wellnessConsultant, previewReport, generatedReport]);

  // Auto-calculate BMI when weight or height changes
  useEffect(() => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    if (w > 0 && h > 0) {
      const computedBmi = (w / Math.pow(h / 100, 2)).toFixed(1);
      setBmi(computedBmi);
    }
  }, [weightKg, heightCm]);

  const isFormDirty = () => {
    return !!(name || mobile || age || weightKg || heightCm || serialNo || subFatPct || bodyFatPct);
  };

  const handleRequestClose = () => {
    if (generatedReport) {
      onClose();
      return;
    }
    if (isFormDirty()) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSaveDraftAndClose = () => {
    toast.info('Draft preserved. You can continue anytime.');
    setShowCloseConfirm(false);
    onClose();
  };

  const handleDiscardAndClose = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (_) {}
    setShowCloseConfirm(false);
    onClose();
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (_) {}
    setName('');
    setMobile('');
    setAge('');
    setHeightCm('');
    setWeightKg('');
    setSerialNo('');
    setAddress('');
    setSubFatPct('');
    setBodyAge('');
    setSkeletalMusclePct('');
    setBodyFatPct('');
    setVisceralFat('');
    setBmr('');
    setBmi('');
    setDraftRestored(false);
    toast.info('Draft cleared.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        name,
        date,
        serial_no: serialNo,
        age,
        gender,
        height_cm: heightCm,
        mobile,
        address,
        weight_kg: weightKg,
        sub_fat_pct: subFatPct,
        body_age: bodyAge,
        skeletal_muscle_pct: skeletalMusclePct,
        body_fat_pct: bodyFatPct,
        visceral_fat: visceralFat,
        bmr,
        bmi,
        wellness_consultant: wellnessConsultant,
      };

      const res: any = await api.createBodyAnalysis(payload);
      if (res.success) {
        setAiProgress(100);
        setAiStep(4);
        // Smooth completion pause
        await new Promise((resolve) => setTimeout(resolve, 450));

        // Clear draft upon successful submission
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch (_) {}

        setSavedAnalysis(res.analysis);
        if (res.report) {
          setGeneratedReport(res.report);
        }
        if (res.leadCreated) {
          toast.info('New lead added to Pipeline automatically.');
        }
        toast.success('Body Analysis saved and AI report generated.');
        if (onSuccess) onSuccess(res.analysis);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save body analysis');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!generatedReport) return;
    const targetPhone = mobile || savedAnalysis?.phone_number;
    if (!targetPhone) {
      toast.error('Phone number missing to send WhatsApp');
      return;
    }

    setSendingWa(true);
    try {
      await api.sendBodyAnalysisWhatsApp(targetPhone, generatedReport);
      setWaSent(true);
      toast.success('Report queued for WhatsApp delivery.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send WhatsApp message');
    } finally {
      setSendingWa(false);
    }
  };

  const handleCopyReport = () => {
    if (generatedReport) {
      navigator.clipboard.writeText(generatedReport);
      toast.success('Report copied to clipboard.');
    }
  };

  const cleanPhone = (mobile || savedAnalysis?.phone_number || '').replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(generatedReport || '')}`;

  return (
    <div
      className={inline ? "" : "modal-overlay"}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, ...(inline ? { padding: 0 } : {}) }}
      onClick={(e) => {
        // Prevent accidental backdrop click closure
        e.stopPropagation();
      }}
    >
      <div
        className="modal-content"
        style={{ maxWidth: inline ? '100%' : '860px', maxHeight: inline ? 'none' : '90vh', overflowY: 'auto', border: inline ? 'none' : undefined, boxShadow: inline ? 'none' : undefined, flex: 1, position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {generatedReport ? 'Personalized Health Analysis Report' : 'New Body Analysis Evaluation'}
          </h2>
          {!inline && (
            <button className="modal-close" type="button" onClick={handleRequestClose} aria-label="Close">
              <Icons.Close size={16} />
            </button>
          )}
        </div>

        {/* Draft Restored Banner */}
        {draftRestored && !generatedReport && (
          <div className="alert alert-info mx-4 mt-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-xs)' }}>Restored your previously unsaved draft.</span>
            <button type="button" onClick={clearDraft} className="btn btn-ghost btn-sm" style={{ height: 24, fontSize: '0.7rem' }}>
              Clear Draft
            </button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger mx-4 mt-4" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Icons.AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* --- CLOSE CONFIRMATION MODAL OVERLAY --- */}
        {showCloseConfirm && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-4)',
            }}
          >
            <div className="card" style={{ maxWidth: 440, width: '100%', background: '#ffffff', boxShadow: 'var(--shadow-modal)', border: '1px solid var(--clr-border)' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: '0 0 var(--space-2) 0' }}>
                Unsaved Form Data
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--clr-text-secondary)', marginBottom: 'var(--space-5)' }}>
                You have started filling out this evaluation. Would you like to save it as a draft to finish later, or discard your changes?
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCloseConfirm(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={handleDiscardAndClose}
                  className="btn btn-danger btn-sm"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraftAndClose}
                  className="btn btn-primary btn-sm"
                >
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW 1: AI GENERATION IN PROGRESS ANIMATION --- */}
        {submitting ? (
          <div
            style={{
              padding: 'var(--space-8) var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              minHeight: 460,
            }}
          >
            {/* Glowing Dual-Ring Pulsing AI Orb */}
            <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 'var(--space-5)' }}>
              {/* Outer rotating dashed ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: -8,
                  borderRadius: '50%',
                  border: '2px dashed rgba(15, 118, 110, 0.4)',
                  animation: 'ai-orbit 8s linear infinite',
                }}
              />
              {/* Inner counter-rotating ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: -2,
                  borderRadius: '50%',
                  border: '2px solid transparent',
                  borderTopColor: '#0f766e',
                  borderRightColor: '#14b8a6',
                  animation: 'ai-orbit-reverse 3s linear infinite',
                }}
              />
              {/* Central pulsing glowing core */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 0 28px rgba(15, 118, 110, 0.4)',
                  animation: 'ai-pulse 2s ease-in-out infinite',
                }}
              >
                <Icons.BodyAnalysis size={36} color="#ffffff" />
              </div>
            </div>

            {/* Title & Stage Heading */}
            <h3 style={{ margin: '0 0 var(--space-1) 0', fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--clr-text-primary)' }}>
              Generating Personalized AI Health Report
            </h3>
            <p style={{ margin: '0 0 var(--space-5) 0', fontSize: 'var(--font-size-sm)', color: 'var(--clr-text-secondary)', maxWidth: 460 }}>
              Analyzing body composition metrics for <strong style={{ color: '#0f766e' }}>{name || 'Client'}</strong> with Google Gemini AI...
            </p>

            {/* Progress Bar Container */}
            <div style={{ width: '100%', maxWidth: 480, marginBottom: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--clr-text-secondary)', marginBottom: 6 }}>
                <span>Evaluating Biomarkers</span>
                <span style={{ color: '#0f766e' }}>{aiProgress}%</span>
              </div>
              <div style={{ width: '100%', height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', border: '1px solid var(--clr-border)', position: 'relative' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${aiProgress}%`,
                    background: 'linear-gradient(90deg, #0f766e 0%, #14b8a6 50%, #2dd4bf 100%)',
                    borderRadius: 99,
                    transition: 'width 0.25s ease-out',
                    boxShadow: '0 0 12px rgba(20, 184, 166, 0.6)',
                  }}
                />
              </div>
            </div>

            {/* Live Step Progress Checklist */}
            <div
              style={{
                width: '100%',
                maxWidth: 480,
                background: 'var(--clr-neutral-bg)',
                border: '1px solid var(--clr-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                textAlign: 'left',
              }}
            >
              {[
                { label: 'Computing BMI, Body Fat & Visceral Fat categories', desc: `BMI: ${bmi || '—'} • Body Fat: ${bodyFatPct || '—'}% • Visceral: ${visceralFat || '—'}` },
                { label: 'Assessing Metabolic Health & Muscle vs Fat Distribution', desc: `Body Age: ${bodyAge || '—'}y • Skeletal Muscle: ${skeletalMusclePct || '—'}%` },
                { label: 'Google Gemini 3.6 Flash composing Hindi Coaching Report', desc: 'Crafting tailored nutrition, workout & lifestyle tips' },
                { label: 'Formatting WhatsApp summary & persisting to database', desc: 'Structuring WhatsApp dispatch message & shareable report link' },
              ].map((step, idx) => {
                const isComplete = aiStep > idx || aiProgress === 100;
                const isCurrent = aiStep === idx && aiProgress < 100;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-md)',
                      background: isCurrent ? '#ffffff' : 'transparent',
                      border: isCurrent ? '1px solid var(--clr-border)' : '1px solid transparent',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                        background: isComplete ? '#0f766e' : isCurrent ? '#ccfbf1' : '#e2e8f0',
                        color: isComplete ? '#ffffff' : isCurrent ? '#0f766e' : '#94a3b8',
                        border: isCurrent ? '2px solid #0f766e' : 'none',
                        animation: isCurrent ? 'pulse-dot 1.5s infinite' : 'none',
                      }}
                    >
                      {isComplete ? '✓' : idx + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: isCurrent ? 700 : isComplete ? 600 : 500, color: isCurrent ? 'var(--clr-text-primary)' : isComplete ? '#0f766e' : 'var(--clr-text-tertiary)' }}>
                        {step.label}
                      </div>
                      {isCurrent && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-tertiary)', marginTop: 1 }}>
                          {step.desc}
                        </div>
                      )}
                    </div>

                    {isCurrent && (
                      <div style={{ width: 14, height: 14, border: '2px solid #0f766e', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : generatedReport ? (
          <div className="p-4 space-y-5">
            <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '2px' }}>AI Analysis Ready</strong>
                <p style={{ margin: 0, fontSize: 'var(--font-size-xs)' }}>
                  Review the report below before dispatching to {name || 'the client'} on WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGeneratedReport(null)}
                className="btn btn-secondary btn-sm"
              >
                Edit Inputs
              </button>
            </div>

            <div className="card" style={{ background: '#f8fafc', border: '1px solid var(--clr-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--clr-text-secondary)', letterSpacing: 'var(--tracking-label)' }}>
                  WhatsApp Message Preview
                </span>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}
                >
                  <Icons.Copy size={13} />
                  <span>Copy Text</span>
                </button>
              </div>

              <textarea
                value={generatedReport}
                onChange={(e) => setGeneratedReport(e.target.value)}
                rows={16}
                className="form-textarea"
                style={{
                  width: '100%',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: '#ffffff',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Close
              </button>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                <Icons.Message size={15} />
                <span>Open in WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={sendingWa || waSent}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontWeight: 600,
                }}
              >
                {sendingWa ? 'Sending...' : waSent ? 'Sent to WhatsApp' : 'Send via WhatsApp'}
              </button>
            </div>
          </div>
        ) : (
          /* --- VIEW 2: FORM ENTRY --- */
          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            <div className="card card-flat space-y-4">
              <h4 className="text-subheading border-b pb-1">Personal Details</h4>

              {/* Quick customer/lead lookup */}
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--clr-brand)', fontWeight: 600 }}>
                  Quick Fill — Search existing customer or lead
                </label>
                <CustomerSearch
                  placeholder="Type name or phone to auto-fill..."
                  onSelect={(p) => {
                    setMobile(p.phone);
                    if (p.name) setName(p.name);
                    toast.info(`Filled details for ${p.name || p.phone}`);
                  }}
                />
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-tertiary)', marginTop: 'var(--space-1)' }}>
                  Or enter client details manually below:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="form-input"
                    placeholder="10 digit number"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Serial No. *</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <input
                      type="text"
                      required
                      value={serialNo}
                      onChange={(e) => setSerialNo(e.target.value)}
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="Auto-generated"
                    />
                    <button
                      type="button"
                      onClick={() => setSerialNo(generateSerialNo())}
                      className="btn btn-secondary btn-sm"
                      title="Generate new serial number"
                      style={{ whiteSpace: 'nowrap', padding: '0 var(--space-3)' }}
                    >
                      <Icons.Refresh size={14} />
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Age *</label>
                  <input
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Wellness Consultant *</label>
                  <input
                    type="text"
                    required
                    value={wellnessConsultant}
                    onChange={(e) => setWellnessConsultant(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Address / Location *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                      <input type="radio" name="gender" checked={gender === 'M'} onChange={() => setGender('M')} />
                      Male
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                      <input type="radio" name="gender" checked={gender === 'F'} onChange={() => setGender('F')} />
                      Female
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Height (cm) *</label>
                  <input
                    type="number"
                    required
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="card card-flat space-y-4">
              <h4 className="text-subheading border-b pb-1">Body Composition Readings</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="form-group">
                  <label className="form-label">WEIGHT (Kg) *</label>
                  <input type="number" step="0.1" required value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="form-input font-bold" />
                </div>
                <div className="form-group">
                  <label className="form-label">Subcutaneous Fat % *</label>
                  <input type="number" step="0.1" required value={subFatPct} onChange={(e) => setSubFatPct(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">BODY AGE (Years) *</label>
                  <input type="number" required value={bodyAge} onChange={(e) => setBodyAge(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">SKELETAL MUSCLE % *</label>
                  <input type="number" step="0.1" required value={skeletalMusclePct} onChange={(e) => setSkeletalMusclePct(e.target.value)} className="form-input" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="form-group">
                  <label className="form-label">BODY FAT % *</label>
                  <input type="number" step="0.1" required value={bodyFatPct} onChange={(e) => setBodyFatPct(e.target.value)} className="form-input font-bold" />
                </div>
                <div className="form-group">
                  <label className="form-label">VISCERAL FAT *</label>
                  <input type="number" step="1" required value={visceralFat} onChange={(e) => setVisceralFat(e.target.value)} className="form-input font-bold" />
                </div>
                <div className="form-group">
                  <label className="form-label">BMR (kcal) *</label>
                  <input type="number" required value={bmr} onChange={(e) => setBmr(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">BMI *</label>
                  <input type="number" step="0.1" required value={bmi} onChange={(e) => setBmi(e.target.value)} className="form-input font-bold" />
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              {!inline && (
                <button type="button" onClick={handleRequestClose} className="btn btn-secondary">
                  Cancel
                </button>
              )}
              <button type="submit" disabled={submitting} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {submitting ? 'Generating AI Report...' : 'Generate AI Report & Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
