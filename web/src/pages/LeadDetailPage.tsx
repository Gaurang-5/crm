import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

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
    return <div className="p-8 text-center text-slate-500">Loading lead profile...</div>;
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
    <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-6)" }}>
      {/* Back and Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/crm/leads" className="btn btn-secondary btn-sm">
            ← Leads
          </Link>
          <h2 className="text-heading">{lead.display_name || 'Lead Profile'}</h2>
          <span className="badge badge-info">{lead.funnel_state}</span>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Info & Touchpoints */}
        <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-6)" }}>
          {/* Contact Details Card */}
          <div className="card space-y-3">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Lead Information</h3>
            <div className="text-sm space-y-1.5">
              <p><span className="text-slate-500 font-medium">Phone:</span> {lead.phone_number}</p>
              <p><span className="text-slate-500 font-medium">Gender:</span> {lead.gender === 'F' ? 'Female' : 'Male'}</p>
              <p><span className="text-slate-500 font-medium">Goal/Interest:</span> {lead.interest_topic || 'Wellness'}</p>
              <p><span className="text-slate-500 font-medium">Lead Score:</span> {lead.lead_score || 50}</p>
              <p><span className="text-slate-500 font-medium">Next Action:</span> {lead.next_action || 'Follow up'}</p>
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
          <div className="card space-y-3">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Acquisition Attribution ({sources?.length || 0})</h3>
            {sources?.length === 0 ? (
              <p className="text-xs text-slate-400">No source records logged.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {sources.map((src: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded border border-slate-200">
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
          <div className="card space-y-3">
            <h3 className="font-bold text-sm text-slate-800">Log Interaction / Coach Note</h3>
            <form onSubmit={handleAddActivity} className="space-y-3">
              <div className="flex gap-2">
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
              <div className="flex justify-end">
                <button type="submit" disabled={addingNote} className="btn btn-primary btn-sm">
                  {addingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>

          {/* Combined Timeline: Stage Changes & Activities */}
          <div className="card" style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)" }}>
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2">History & Timeline</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {activities?.map((act: any) => (
                <div key={act.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{act.type}: {act.summary}</span>
                    <span className="text-slate-400">{new Date(act.created_at).toLocaleDateString()}</span>
                  </div>
                  {act.details && <p className="text-slate-600">{act.details}</p>}
                </div>
              ))}

              {stageHistory?.map((hist: any) => (
                <div key={hist.id} className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
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
