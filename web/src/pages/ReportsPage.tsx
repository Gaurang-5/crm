import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function ReportsPage() {
  const [retention, setRetention] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getRetention()
      .then((data) => setRetention(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadReport = (type: string) => {
    window.open(`/api/reports/export?type=${type}&format=csv`, '_blank');
  };

  const exportReports = [
    {
      type: 'leads',
      title: 'Leads Directory',
      description: 'All prospective leads, sources, stages, scores',
      label: 'Export Leads CSV',
    },
    {
      type: 'customers',
      title: 'Customers Directory',
      description: 'Enrolled members, plans, start & renewal dates',
      label: 'Export Customers CSV',
    },
    {
      type: 'orders',
      title: 'Orders Ledger',
      description: 'Orders, kit costs, pricing snapshots',
      label: 'Export Orders CSV',
    },
    {
      type: 'payments',
      title: 'Payments Ledger',
      description: 'All received payments, methods & references',
      label: 'Export Payments CSV',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Reports"
        subtitle="Downloadable CSV audit reports, customer retention, and renewal projections"
      />

      {/* Retention Rate & Customer Lifecycle Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="section-header" style={{ borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--space-3)' }}>
          <h3 className="section-title">Customer Retention &amp; Lifecycle Breakdown</h3>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading retention data…" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
            <StatCard
              label="Active Retention Rate"
              value={`${retention?.retentionRate ?? 100}%`}
              variant="success"
            />
            <StatCard
              icon=""
              label="Active Members"
              value={retention?.activeCustomers ?? 0}
              variant="success"
            />
            <StatCard
              icon=""
              label="Inactive Members"
              value={retention?.inactiveCustomers ?? 0}
              variant="danger"
            />
            <StatCard
              icon=""
              label="Total Lifetime Members"
              value={retention?.totalCustomers ?? 0}
            />
          </div>
        )}
      </div>

      {/* Downloadable Reports Section */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="section-header" style={{ borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--space-3)' }}>
          <h3 className="section-title">Export Data Files (CSV)</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          {exportReports.map(({ type, title, description, label }) => (
            <div
              key={type}
              className="card card-flat"
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <p className="text-body" style={{ fontWeight: 600 }}>{title}</p>
                <p className="text-caption text-secondary">{description}</p>
              </div>
              <button
                onClick={() => handleDownloadReport(type)}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
              >
                {label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
