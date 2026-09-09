import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Lead Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState('F');
  const [newInterest, setNewInterest] = useState('');
  const [newChannel, setNewChannel] = useState('manual');
  const [newCampaign, setNewCampaign] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadLeads = () => {
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
    loadLeads();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;
    setSubmitting(true);
    try {
      await api.createLead({
        name: newName,
        phone: newPhone,
        gender: newGender,
        interest_topic: newInterest,
        channel: newChannel,
        campaign_name: newCampaign,
      });
      setIsAddModalOpen(false);
      setNewName('');
      setNewPhone('');
      loadLeads();
    } catch (err: any) {
      console.error(err.message || 'Failed to create lead');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      (lead.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (lead.phone_number || '').includes(search) ||
      (lead.interest_topic || '').toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === 'ALL' || lead.funnel_state === stageFilter;
    return matchesSearch && matchesStage;
  });

  const getStageBadgeVariant = (code: string): React.ComponentProps<typeof Badge>['variant'] => {
    switch (code) {
      case 'NEW':                  return 'info';
      case 'CONTACTED':            return 'purple';
      case 'QUALIFIED':            return 'purple';
      case 'CONSULTATION_BOOKED': return 'warning';
      case 'ATTENDED':             return 'warning';
      case 'PLAN_OFFERED':         return 'info';
      case 'WON':                  return 'success';
      case 'LOST':                 return 'danger';
      default:                     return 'neutral';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <PageHeader
        title="Leads"
        subtitle="Inbound prospects and manual entries"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Link to="/crm/pipeline" className="btn btn-secondary">
              View Pipeline Kanban
            </Link>
            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
              + Add Lead
            </button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' }}>
          {/* Search */}
          <div className="search-input" style={{ flex: '1', minWidth: '200px', maxWidth: '420px' }}>
            <span className="search-input__icon"></span>
            <input
              type="text"
              placeholder="Search by name, phone, or goal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Stage Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span className="text-secondary" style={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: 'var(--font-size-sm)' }}>Stage:</span>
            <button
              onClick={() => setStageFilter('ALL')}
              className={`tab-btn${stageFilter === 'ALL' ? ' active' : ''}`}
            >
              All ({leads.length})
            </button>
            {stages.map((st) => (
              <button
                key={st.code}
                onClick={() => setStageFilter(st.code)}
                className={`tab-btn${stageFilter === st.code ? ' active' : ''}`}
              >
                {st.name} ({leads.filter((l) => l.funnel_state === st.code).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="table-container">
        {loading ? (
          <LoadingSpinner message="Loading leads..." />
        ) : filteredLeads.length === 0 ? (
          <EmptyState
            icon=""
            title="No leads found"
            message="Add your first lead or adjust the filters."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Lead / Contact</th>
                <th>Channel &amp; Campaign</th>
                <th>Interest / Goal</th>
                <th>Pipeline Stage</th>
                <th>Next Action</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const source = lead.sources && lead.sources.length > 0 ? lead.sources[0] : null;
                return (
                  <tr key={lead.phone_number}>
                    <td>
                      <div>
                        <Link
                          to={`/crm/leads/${lead.phone_number}`}
                          style={{ fontWeight: 700, color: 'var(--clr-text-primary)' }}
                        >
                          {lead.display_name || 'Wellness Lead'}
                        </Link>
                        <p className="text-caption" style={{ marginTop: 'var(--space-1)' }}>
                          {lead.phone_number}
                        </p>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                        <Badge variant="neutral">
                          {source?.channel ? source.channel.toUpperCase() : 'WHATSAPP'}
                        </Badge>
                        <p className="text-caption" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {source?.campaign_name || 'Organic Inbound'}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className="text-body">{lead.interest_topic || 'Weight Loss'}</span>
                    </td>
                    <td>
                      <Badge variant={getStageBadgeVariant(lead.funnel_state)}>
                        {lead.funnel_state}
                      </Badge>
                    </td>
                    <td>
                      <p className="text-body" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.next_action || 'Follow up'}
                      </p>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <a
                          href={`https://wa.me/${lead.phone_number}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="Open in WhatsApp"
                        >
                          WhatsApp
                        </a>
                        <Link to={`/crm/leads/${lead.phone_number}`} className="btn btn-primary btn-sm">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add New Lead</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="modal-close">×</button>
            </div>

            <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (with or without 91) *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select value={newGender} onChange={(e) => setNewGender(e.target.value)} className="form-select">
                    <option value="F">Female (Woman)</option>
                    <option value="M">Male (Man)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Acquisition Channel</label>
                  <select value={newChannel} onChange={(e) => setNewChannel(e.target.value)} className="form-select">
                    <option value="manual">Manual Direct Entry</option>
                    <option value="web_form">Website Form</option>
                    <option value="meta_lead_ad">Meta / Instagram Ads</option>
                    <option value="whatsapp">WhatsApp Direct Inbound</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Campaign / Referral Tag</label>
                <input
                  type="text"
                  value={newCampaign}
                  onChange={(e) => setNewCampaign(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Primary Interest / Goal</label>
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Adding...' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
