import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import './lead-detail.css';

export function LeadDetailPage() {
  const { phone } = useParams<{ phone: string }>();
  const [data, setData] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState('NOTE');
  const [addingNote, setAddingNote] = useState(false);
  const navigate = useNavigate();

  const loadLeadDetails = () => {
    if (!phone) return;
    setLoading(true);
    Promise.all([api.getLead(phone), api.getPipelineStages()])
      .then(([leadData, stagesData]) => {
        setData(leadData);
        setStages(stagesData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLeadDetails();
  }, [phone]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote || !phone) return;
    setAddingNote(true);
    try {
      await api.createActivity({
        phone_number: phone,
        type: newNoteType,
        summary: newNote,
      });
      setNewNote('');
      loadLeadDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to add activity');
    } finally {
      setAddingNote(false);
    }
  };

  const handleStageChange = async (newStage: string) => {
    if (!phone) return;
    if (newStage === 'LOST') {
      const reason = prompt('Please enter the reason for marking this lead as Lost:');
      if (!reason) return;
      await api.updateLeadStage(phone, { stage: 'LOST', reason });
      loadLeadDetails();
      return;
    }
    if (newStage === 'WON') {
      navigate('/crm/pipeline');
      return;
    }
    try {
      await api.updateLeadStage(phone, { stage: newStage });
      loadLeadDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to update stage');
    }
  };

  if (loading && !data) {
    return <div className="profile-loading" role="status" aria-label="Loading person’s profile" aria-busy="true">
      <div className="profile-loading-header" aria-hidden="true"><span className="profile-placeholder profile-placeholder-avatar"/><div><span className="profile-placeholder profile-placeholder-name"/><span className="profile-placeholder profile-placeholder-caption"/></div></div>
      <div className="profile-loading-grid" aria-hidden="true">{[0, 1].map(card => <div className="card profile-loading-card" key={card}><span className="profile-placeholder profile-placeholder-title"/>{[0, 1, 2, 3].map(row => <div className="profile-loading-row" key={row}><span className="profile-placeholder"/><span className="profile-placeholder"/></div>)}</div>)}</div>
    </div>;
  }

  if (!data?.lead) {
    return (
      <div className="card text-center p-8 space-y-3">
        <p className="text-lg font-bold">Lead Not Found</p>
        <Link to="/crm/leads" className="btn btn-secondary">
          Back to Leads Directory
        </Link>
      </div>
    );
  }

  const { lead, stageHistory, sources, activities, analyses, orders } = data;

  return (
    <div className="lead-detail-page" style={{ display:"flex", flexDirection:"column", gap:"var(--space-6)" }}>
      {/* Back and Header */}
      <header className="lead-detail-header">
        <div className="lead-detail-identity">
          <Link to="/crm/leads" className="btn btn-secondary btn-sm">
            <span aria-hidden="true">←</span> People
          </Link>
          <div className="lead-detail-title">
            <h2 className="text-heading">{lead.display_name || 'Lead Profile'}</h2>
            <span className="badge badge-info">{lead.funnel_state.replaceAll('_', ' ')}</span>
          </div>
        </div>
        <div className="lead-detail-actions">
          <a
            href={`https://wa.me/${lead.phone_number}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
          >
            WhatsApp Chat
          </a>
          <button
            onClick={() => navigate('/crm/pipeline')}
            className="btn btn-primary bg-emerald-700 hover:bg-emerald-800"
          >
            Convert to Customer →
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Info & Touchpoints */}
        <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-6)" }}>
          {/* Contact Details Card */}
          <div className="card space-y-3 lead-info-card">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Lead Information</h3>
            <div className="lead-facts">
              <p><span>Phone</span><strong>{lead.phone_number}</strong></p>
              <p><span>Gender</span><strong>{lead.gender === 'F' ? 'Female' : 'Male'}</strong></p>
              <p><span>Goal / Interest</span><strong>{lead.interest_topic || 'Wellness'}</strong></p>
              <p><span>Lead Score</span><strong>{lead.lead_score || 50}</strong></p>
              <p><span>Next Action</span><strong>{lead.next_action || 'Follow up'}</strong></p>
            </div>

            <div className="pt-2 border-t">
              <label className="form-label text-xs">Update Stage:</label>
              <select
                value={lead.funnel_state}
                onChange={(e) => handleStageChange(e.target.value)}
                className="form-select text-sm mt-1"
              >
                {stages.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Acquisition Touchpoints */}
          <div className="card space-y-3 acquisition-card">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Acquisition Attribution ({sources?.length || 0})</h3>
            {sources?.length === 0 ? (
              <p className="text-xs text-slate-400">No source records logged.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {sources.map((src: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded border border-slate-200 source-entry">
                    <p className="font-bold text-slate-800 uppercase">{src.channel}</p>
                    <p className="text-slate-600">Campaign: {src.campaign_name || 'Direct / Organic'}</p>
                    <p className="text-slate-400 text-[11px]">
                      Consent Given: {src.consent_given ? 'Yes' : 'No'} • {new Date(src.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Activity Timeline & Interaction Logger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Activity / Note */}
          <div className="card space-y-3 interaction-card">
            <h3 className="font-bold text-sm text-slate-800">Log Interaction / Coach Note</h3>
            <form onSubmit={handleAddActivity} className="space-y-3">
              <div className="interaction-types">
                {['NOTE', 'CALL', 'WHATSAPP', 'MEETING'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewNoteType(type)}
                    className={`btn btn-sm ${newNoteType === type ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                required
                placeholder="Log discussion points, member questions, next follow-up agreement..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="form-textarea text-sm"
              />
              <div className="interaction-submit">
                <button type="submit" disabled={addingNote} className="btn btn-primary btn-sm">
                  {addingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>

          {/* Combined Timeline: Stage Changes & Activities */}
          <div className="card" style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)" }}>
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2">History & Timeline</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 lead-timeline">
              {activities?.map((act: any) => (
                <div key={act.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 timeline-entry">
                  <div className="timeline-entry-header">
                    <span className="font-bold text-slate-800">{act.type}: {act.summary}</span>
                    <span className="text-slate-400">{new Date(act.created_at).toLocaleDateString()}</span>
                  </div>
                  {act.details && <p className="text-slate-600">{act.details}</p>}
                </div>
              ))}

              {stageHistory?.map((hist: any) => (
                <div key={hist.id} className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg text-xs space-y-1 timeline-entry">
                  <div className="timeline-entry-header">
                    <span className="font-bold text-blue-900">
                      Stage Transition: {hist.from_stage || 'START'} → {hist.to_stage}
                    </span>
                    <span className="text-slate-400">{new Date(hist.created_at).toLocaleDateString()}</span>
                  </div>
                  {hist.reason && <p className="text-rose-700 font-medium">Reason: {hist.reason}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
