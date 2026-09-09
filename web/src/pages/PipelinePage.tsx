import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Icons } from '../components/ui/Icons';

export function PipelinePage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedLeadPhone, setDraggedLeadPhone] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const navigate = useNavigate();

  // Lost Stage Modal
  const [lostModalLead, setLostModalLead] = useState<any>(null);
  const [lostReason, setLostReason] = useState('');

  // Won Conversion Modal
  const [wonModalLead, setWonModalLead] = useState<any>(null);
  const [wonPlan, setWonPlan] = useState<'Basic' | 'Elite'>('Basic');
  const [wonGoals, setWonGoals] = useState('');
  const [wonF1, setWonF1] = useState('');
  const [wonAfresh, setWonAfresh] = useState('');
  const [converting, setConverting] = useState(false);

  const loadPipeline = () => {
    setLoading(true);
    Promise.all([api.getLeads(), api.getPipelineStages()])
      .then(([leadsData, stagesData]) => {
        setLeads(leadsData);
        setStages(stagesData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  const handleStageMove = async (leadPhone: string, targetStage: string) => {
    const lead = leads.find((l) => l.phone_number === leadPhone);
    if (!lead || lead.funnel_state === targetStage) return;

    if (targetStage === 'LOST') {
      setLostModalLead(lead);
      return;
    }
    if (targetStage === 'WON') {
      setWonModalLead(lead);
      return;
    }

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l.phone_number === leadPhone ? { ...l, funnel_state: targetStage } : l))
    );

    try {
      await api.updateLeadStage(leadPhone, { stage: targetStage });
    } catch (err: any) {
      console.error(err.message || 'Failed to move stage');
      loadPipeline(); // Rollback on error
    }
  };

  const submitLostReason = async () => {
    if (!lostReason || !lostModalLead) return;
    try {
      await api.updateLeadStage(lostModalLead.phone_number, { stage: 'LOST', reason: lostReason });
      setLostModalLead(null);
      setLostReason('');
      loadPipeline();
    } catch (err: any) {
      console.error(err.message || 'Failed to update stage to Lost');
    }
  };

  const submitWonConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wonModalLead) return;
    setConverting(true);
    try {
      const f1List = wonF1.split(',').map((s) => s.trim()).filter(Boolean);
      const afreshList = wonAfresh.split(',').map((s) => s.trim()).filter(Boolean);

      const result = await api.convertLeadToCustomer({
        leadPhone: wonModalLead.phone_number,
        planCode: wonPlan,
        goals: wonGoals,
        initialWeightKg: wonModalLead.weight_kg,
        f1Flavors: f1List,
        afreshFlavors: afreshList,
      });

      setWonModalLead(null);
      navigate(`/crm/customers/${result.customer.id}`);
    } catch (err: any) {
      console.error(err.message || 'Failed to convert lead');
    } finally {
      setConverting(false);
    }
  };

  if (loading && leads.length === 0) {
    return <LoadingSpinner message="Loading Pipeline..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Sales Pipeline Kanban"
        subtitle="Drag and drop leads to advance them through stages"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Link to="/crm/leads" className="btn btn-secondary">
              Table View
            </Link>
            <button onClick={loadPipeline} className="btn btn-secondary btn-sm" title="Refresh">
              Refresh
            </button>
          </div>
        }
      />

      {/* Kanban Board */}
      <div className="kanban-board">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.funnel_state === stage.code);
          const isOver = dragOverStage === stage.code;

          // Pick a badge variant based on stage code
          const stageBadgeVariant = (() => {
            const code = (stage.code || '').toUpperCase();
            if (code === 'WON') return 'success';
            if (code === 'LOST') return 'danger';
            if (code === 'NEGOTIATION' || code === 'PROPOSAL') return 'warning';
            if (code === 'QUALIFIED') return 'info';
            if (code === 'CONTACTED') return 'purple';
            return 'neutral';
          })();

          return (
            <div
              key={stage.code}
              className={`kanban-column ${isOver ? 'kanban-column--drag-over' : ''}`}
              style={{
                border: isOver ? '2px dashed var(--clr-brand)' : undefined,
                background: isOver ? 'var(--clr-brand-light)' : undefined,
                transition: 'all 0.15s ease',
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverStage !== stage.code) {
                  setDragOverStage(stage.code);
                }
              }}
              onDragLeave={(e) => {
                // Check if moving out of this column
                const rect = e.currentTarget.getBoundingClientRect();
                if (
                  e.clientX < rect.left ||
                  e.clientX >= rect.right ||
                  e.clientY < rect.top ||
                  e.clientY >= rect.bottom
                ) {
                  if (dragOverStage === stage.code) {
                    setDragOverStage(null);
                  }
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const leadPhone = e.dataTransfer.getData('text/plain') || draggedLeadPhone;
                if (leadPhone) {
                  handleStageMove(leadPhone, stage.code);
                }
                setDragOverStage(null);
                setDraggedLeadPhone(null);
              }}
            >
              <div className="kanban-column-header">
                <span style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stage.name}
                </span>
                <Badge variant={stageBadgeVariant}>{stageLeads.length}</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', overflowY: 'auto', flex: 1, maxHeight: '70vh', minHeight: 120 }}>
                {stageLeads.length === 0 ? (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 'var(--space-4)',
                      border: isOver ? '1px dashed var(--clr-brand)' : '1px dashed transparent',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <EmptyState
                      icon=""
                      title={isOver ? "Drop Lead Here" : "No leads"}
                      message={isOver ? "Release to move lead to this stage" : "This stage is empty."}
                    />
                  </div>
                ) : (
                  stageLeads.map((lead) => {
                    const isDraggingThis = draggedLeadPhone === lead.phone_number;

                    return (
                      <div
                        key={lead.phone_number}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', lead.phone_number);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggedLeadPhone(lead.phone_number);
                        }}
                        onDragEnd={() => {
                          setDraggedLeadPhone(null);
                          setDragOverStage(null);
                        }}
                        className={`kanban-card ${isDraggingThis ? 'kanban-card--dragging' : ''}`}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'var(--space-2)',
                          opacity: isDraggingThis ? 0.4 : 1,
                          transform: isDraggingThis ? 'scale(0.96)' : undefined,
                          cursor: 'grab',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                          <Link
                            to={`/crm/leads/${lead.phone_number}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--clr-text-primary)', lineHeight: 1.3 }}
                          >
                            {lead.display_name || 'Lead'}
                          </Link>
                          <Badge variant="neutral">Score {lead.lead_score || 50}</Badge>
                        </div>

                        <p className="text-caption" style={{ color: 'var(--clr-text-secondary)' }}>{lead.phone_number}</p>
                        {lead.interest_topic && (
                          <p className="text-caption" style={{ color: 'var(--clr-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lead.interest_topic}
                          </p>
                        )}

                        <div style={{ paddingTop: 'var(--space-2)', borderTop: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <select
                            value={lead.funnel_state}
                            onChange={(e) => handleStageMove(lead.phone_number, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="form-select"
                            style={{ fontSize: 'var(--font-size-xs)', padding: '2px var(--space-2)', maxWidth: '65%' }}
                          >
                            {stages.map((s) => (
                              <option key={s.code} value={s.code}>
                                Move: {s.name}
                              </option>
                            ))}
                          </select>
                          <a
                            href={`https://wa.me/${lead.phone_number}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="btn btn-ghost btn-sm"
                            title="WhatsApp"
                            style={{ padding: 'var(--space-1)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}
                          >
                            <Icons.Message size={13} />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lost Reason Modal */}
      {lostModalLead && (
        <div className="modal-overlay" onClick={() => setLostModalLead(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Mark Lead as Lost</h3>
              <button onClick={() => setLostModalLead(null)} className="modal-close">×</button>
            </div>

            <p className="text-body" style={{ color: 'var(--clr-text-secondary)', marginBottom: 'var(--space-3)' }}>
              Please document why <strong>{lostModalLead.display_name}</strong> is marked as Lost. This is required to maintain conversion analytics integrity.
            </p>

            <div className="form-group">
              <label className="form-label">Lost Reason *</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Budget constraints, relocation, timing not right..."
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="form-textarea"
              />
            </div>

            <div className="modal-footer">
              <button onClick={() => setLostModalLead(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={submitLostReason} disabled={!lostReason} className="btn btn-danger">
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Won Conversion Modal */}
      {wonModalLead && (
        <div className="modal-overlay" onClick={() => setWonModalLead(null)}>
          <div className="modal-content" style={{ maxWidth: '32rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Convert Won Lead to Customer</h3>
                <p className="text-caption" style={{ color: 'var(--clr-text-secondary)', marginTop: 'var(--space-1)' }}>
                  Atomic setup of Customer, Plan Enrollment, Onboarding Checklist &amp; Initial Order
                </p>
              </div>
              <button onClick={() => setWonModalLead(null)} className="modal-close">×</button>
            </div>

            <form onSubmit={submitWonConversion} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="alert alert-success" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
                Customer: {wonModalLead.display_name} ({wonModalLead.phone_number})
              </div>

              <div className="form-group">
                <label className="form-label">Chosen Membership Plan *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <label
                    style={{
                      padding: 'var(--space-3)',
                      border: `2px solid ${wonPlan === 'Basic' ? 'var(--clr-brand)' : 'var(--clr-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-1)',
                      background: wonPlan === 'Basic' ? 'var(--clr-neutral-bg)' : 'transparent',
                      fontWeight: wonPlan === 'Basic' ? 700 : 400,
                    }}
                  >
                    <input
                      type="radio"
                      name="plan"
                      checked={wonPlan === 'Basic'}
                      onChange={() => setWonPlan('Basic')}
                      className="sr-only"
                    />
                    <span>Basic (₹8,400)</span>
                    <span className="text-caption" style={{ color: 'var(--clr-text-secondary)', fontWeight: 400 }}>1 Shake + 1 Afresh daily</span>
                  </label>
                  <label
                    style={{
                      padding: 'var(--space-3)',
                      border: `2px solid ${wonPlan === 'Elite' ? 'var(--clr-brand)' : 'var(--clr-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-1)',
                      background: wonPlan === 'Elite' ? 'var(--clr-neutral-bg)' : 'transparent',
                      fontWeight: wonPlan === 'Elite' ? 700 : 400,
                    }}
                  >
                    <input
                      type="radio"
                      name="plan"
                      checked={wonPlan === 'Elite'}
                      onChange={() => setWonPlan('Elite')}
                      className="sr-only"
                    />
                    <span>Elite / Pro (₹12,070)</span>
                    <span className="text-caption" style={{ color: 'var(--clr-text-secondary)', fontWeight: 400 }}>2 Shake + 2 Afresh daily</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Formula 1 Shake Flavors ({wonPlan === 'Elite' ? '3 Flavors' : '2 Flavors'})</label>
                <input
                  type="text"
                  value={wonF1}
                  onChange={(e) => setWonF1(e.target.value)}
                  placeholder="e.g. Kulfi, Rose Kheer, Mango"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Afresh Energy Flavors ({wonPlan === 'Elite' ? '2 Flavors' : '1 Flavor'})</label>
                <input
                  type="text"
                  value={wonAfresh}
                  onChange={(e) => setWonAfresh(e.target.value)}
                  placeholder="e.g. Lemon, Peach"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Customer Goals &amp; Notes</label>
                <textarea
                  rows={2}
                  value={wonGoals}
                  onChange={(e) => setWonGoals(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setWonModalLead(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={converting} className="btn btn-primary">
                  {converting ? 'Converting...' : 'Complete Customer Conversion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
