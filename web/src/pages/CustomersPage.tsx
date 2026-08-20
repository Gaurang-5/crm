import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const STATUS_TABS = ['ALL', 'ACTIVE', 'RENEWAL_DUE', 'INACTIVE', 'COMPLETED'] as const;

export function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadCustomers = () => {
    setLoading(true);
    api.getCustomers()
      .then((data) => setCustomers(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = customers.filter((c) => {
    const matchesSearch =
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone_number || '').includes(search) ||
      (c.current_plan || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Customers"
        subtitle="Active wellness members, compliance, renewals"
        action={
          <Link to="/pipeline" className="btn btn-secondary">
            + Convert Lead
          </Link>
        }
      />

      {/* Filters: Search + Status Tabs */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Search */}
        <div className="search-input">
          <span className="search-input__icon"></span>
          <input
            type="text"
            placeholder="Search customers by name, phone, or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Status Tabs */}
        <div className="tabs-nav" style={{ overflowX: 'auto' }}>
          {STATUS_TABS.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`tab-btn${statusFilter === st ? ' active' : ''}`}
            >
              {st.replace('_', ' ')}{' '}
              <span style={{ opacity: 0.7 }}>
                ({st === 'ALL' ? customers.length : customers.filter((c) => c.status === st).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: 'var(--space-8)' }}>
            <LoadingSpinner message="Loading customers..." />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon=""
            title="No customers yet"
            message="Convert leads from the Pipeline."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer / Member</th>
                <th>Plan &amp; Start Date</th>
                <th>Renewal Date</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link
                      to={`/customers/${c.id}`}
                      style={{ fontWeight: 600, color: 'var(--clr-text-primary)' }}
                    >
                      {c.name}
                    </Link>
                    <p className="text-caption" style={{ marginTop: 'var(--space-1)' }}>
                      {c.phone_number}
                    </p>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--clr-text-primary)' }}>
                      {c.current_plan} Plan
                    </span>
                    <p className="text-caption" style={{ marginTop: 'var(--space-1)' }}>
                      Started: {c.start_date}
                    </p>
                  </td>
                  <td>
                    <span className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                      {c.renewal_date || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 700,
                        color: c.outstandingBalance > 0 ? 'var(--clr-brand)' : 'var(--clr-text-secondary)',
                      }}
                    >
                      {c.outstandingBalance > 0
                        ? `₹${c.outstandingBalance?.toLocaleString('en-IN')}`
                        : 'Paid In Full '}
                    </span>
                  </td>
                  <td>
                    <Badge status={c.status}>{c.status.replace('_', ' ')}</Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <a
                        href={`https://wa.me/${c.phone_number}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        title="WhatsApp"
                      >
                        WhatsApp
                      </a>
                      <Link to={`/customers/${c.id}`} className="btn btn-primary btn-sm">
                        Wellness Hub →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
