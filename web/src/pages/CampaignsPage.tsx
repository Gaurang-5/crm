import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

function getStatusVariant(status: string): 'success' | 'neutral' | 'danger' | 'info' {
  switch (status?.toLowerCase()) {
    case 'active':  return 'success';
    case 'draft':   return 'neutral';
    case 'paused':  return 'danger';
    default:        return 'info';
  }
}

function getChannelLabel(channel: string): string {
  switch (channel) {
    case 'whatsapp':      return 'WhatsApp Direct';
    case 'web_form':      return 'Website Form';
    case 'meta_lead_ad':  return 'Meta / Instagram Ads';
    default:              return 'Manual Walk-in';
  }
}

export function CampaignsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getCampaigns()
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const { channels, campaigns, summary } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Campaigns"
        subtitle="WhatsApp broadcast and automation campaigns"
      />

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="stat-card stat-card--info">
          <span className="stat-label">Total Leads Captured</span>
          <span className="stat-value">{summary?.totalLeads || 0}</span>
        </div>
        <div className="stat-card stat-card--success">
          <span className="stat-label">Customers Converted (Won)</span>
          <span className="stat-value">{summary?.totalCustomers || 0}</span>
        </div>
        <div className="stat-card stat-card--purple">
          <span className="stat-label">Overall Conversion Rate</span>
          <span className="stat-value">{summary?.overallConversionRate || 0}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Revenue Generated</span>
          <span className="stat-value">₹{(summary?.totalRevenue || 0).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Channel Attribution Breakdown */}
      <div className="card">
        <div className="section-header">
          <span className="section-title">Acquisition by Channel</span>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading campaign stats..." />
        ) : !channels?.length ? (
          <EmptyState
            icon=""
            title="No campaigns yet"
            message="Create your first WhatsApp campaign."
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Channel Source</th>
                  <th>Leads Acquired</th>
                  <th>Customers Won</th>
                  <th>Channel Revenue</th>
                  <th>Conversion %</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((ch: any) => (
                  <tr key={ch.channel}>
                    <td style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)' }}>
                      {getChannelLabel(ch.channel)}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>{ch.totalLeads}</td>
                    <td style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--clr-brand)' }}>{ch.wonCustomers}</td>
                    <td style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>₹{ch.totalRevenue?.toLocaleString('en-IN')}</td>
                    <td>
                      <Badge variant="info">
                        {ch.totalLeads > 0 ? Math.round((ch.wonCustomers / ch.totalLeads) * 100) : 0}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Meta Ad Campaigns Performance */}
      <div className="card">
        <div className="section-header">
          <span className="section-title">Active Ad Campaigns &amp; ROI</span>
        </div>

        {!campaigns?.length && !loading ? (
          <EmptyState
            icon=""
            title="No campaigns yet"
            message="Create your first WhatsApp campaign."
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Source</th>
                  <th>Ad Spend</th>
                  <th>Leads</th>
                  <th>Won Members</th>
                  <th>CPA (Cost / Won Lead)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {campaigns?.map((c: any) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)' }}>{c.name}</td>
                    <td style={{ fontSize: 'var(--font-size-xs)' }}>{c.source}</td>
                    <td style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: '#e11d48' }}>
                      ₹{c.ad_spend?.toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)' }}>{c.leadsCount}</td>
                    <td style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--clr-brand)' }}>{c.wonCustomers}</td>
                    <td style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700 }}>
                      ₹{c.costPerAcquisition?.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <Badge variant={getStatusVariant(c.status)}>{c.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
