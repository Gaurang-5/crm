import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Icons } from '../components/ui/Icons';

export function TodayPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboardData = await api.getToday();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleSendRenewalReminder = async (customer: any) => {
    try {
      setActionSuccess(`Renewal reminder generated for ${customer.name}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to send reminder');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Today Dashboard..." fullPage={true} />;
  }

  if (error) {
    return (
      <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Icons.AlertCircle size={16} />
        <span>{error}</span>
      </div>
    );
  }

  const { overdueTasks, appointmentsToday, newLeads, pendingPayments, renewalsDue, missedCheckins } = data || {};
  const dateString = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader 
        title="Today's Focus" 
        subtitle={dateString} 
        action={
          <>
            {actionSuccess && (
              <div className="alert alert-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Icons.Check size={14} />
                <span>{actionSuccess}</span>
              </div>
            )}
            <button onClick={loadDashboard} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Icons.Refresh size={14} />
              <span>Refresh</span>
            </button>
          </>
        }
      />

      {/* Overview Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--space-3)' }}>
        <StatCard variant="danger" icon={<Icons.AlertCircle size={18} />} label="Overdue Tasks" value={overdueTasks?.length || 0} />
        <StatCard variant="warning" icon={<Icons.FollowUps size={18} />} label="Appointments Today" value={appointmentsToday?.length || 0} />
        <StatCard variant="info" icon={<Icons.Leads size={18} />} label="New Leads" value={newLeads?.length || 0} />
        <StatCard variant="purple" icon={<Icons.Orders size={18} />} label="Pending Payments" value={pendingPayments?.length || 0} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 'var(--space-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          {/* Overdue Tasks */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="section-header" style={{ marginBottom: 0 }}>
              <h3 className="section-title">Action Required: Overdue Tasks ({overdueTasks?.length || 0})</h3>
              <Link to="/crm/followups" className="section-link">Manage Tasks →</Link>
            </div>
            {overdueTasks?.length === 0 ? (
              <EmptyState title="All caught up" message="No overdue tasks for today." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 300, overflowY: 'auto' }}>
                {overdueTasks?.map((task: any) => (
                  <div key={task.id} className="list-item list-item--danger">
                    <div>
                      <p className="text-body" style={{ fontWeight: 600 }}>{task.title}</p>
                      <p className="text-caption">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                    </div>
                    {task.phone_number && (
                      <a href={`https://wa.me/${task.phone_number}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm bg-white" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <Icons.Message size={13} />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Appointments */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="section-header" style={{ marginBottom: 0 }}>
              <h3 className="section-title">Today's Appointments ({appointmentsToday?.length || 0})</h3>
              <Link to="/crm/followups" className="section-link">View Schedule →</Link>
            </div>
            {appointmentsToday?.length === 0 ? (
              <EmptyState title="Free schedule" message="No appointments booked for today." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 300, overflowY: 'auto' }}>
                {appointmentsToday?.map((app: any) => (
                  <div key={app.id} className="list-item list-item--warning">
                    <div>
                      <p className="text-body" style={{ fontWeight: 600 }}>{app.title}</p>
                      <p className="text-caption">{new Date(app.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({app.duration_mins} mins)</p>
                    </div>
                    {app.zoom_link && (
                      <a href={app.zoom_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                        Start Video Call
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          {/* New Leads */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="section-header" style={{ marginBottom: 0 }}>
              <h3 className="section-title">Inbound Leads ({newLeads?.length || 0})</h3>
              <Link to="/crm/leads" className="section-link">All Leads →</Link>
            </div>
            {newLeads?.length === 0 ? (
              <EmptyState title="No new leads" message="No new inbound leads right now." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 300, overflowY: 'auto' }}>
                {newLeads?.map((lead: any) => (
                  <div key={lead.phone_number} className="list-item list-item--info">
                    <div style={{ minWidth: 0 }}>
                      <p className="text-body truncate" style={{ fontWeight: 600 }}>{lead.display_name || 'New Lead'}</p>
                      <p className="text-caption truncate">{lead.phone_number} • {lead.interest_topic || 'Wellness'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-1)', flexShrink: 0 }}>
                      <a href={`https://wa.me/${lead.phone_number}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm bg-white" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <Icons.Message size={13} />
                        <span>WhatsApp</span>
                      </a>
                      <Link to={`/crm/leads/${lead.phone_number}`} className="btn btn-primary btn-sm">View</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Payments */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="section-header" style={{ marginBottom: 0 }}>
              <h3 className="section-title">Pending Balances ({pendingPayments?.length || 0})</h3>
              <Link to="/crm/orders" className="section-link">Orders Ledger →</Link>
            </div>
            {pendingPayments?.length === 0 ? (
              <EmptyState title="All clear" message="All customer balances are clear." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 300, overflowY: 'auto' }}>
                {pendingPayments?.map((p: any) => (
                  <div key={p.customerId} className="list-item list-item--purple">
                    <div>
                      <p className="text-body" style={{ fontWeight: 600 }}>{p.customerName}</p>
                      <p className="text-caption" style={{ color: 'var(--clr-purple-text)' }}>
                        Due: ₹{p.outstandingBalance?.toLocaleString('en-IN')} (Paid: ₹{p.totalPaymentsReceived?.toLocaleString('en-IN')})
                      </p>
                    </div>
                    <Link to="/crm/orders" className="btn btn-primary btn-sm">Record Payment</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          {/* Renewals Due */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="section-header" style={{ marginBottom: 0 }}>
              <h3 className="section-title">Upcoming Renewals ({renewalsDue?.length || 0})</h3>
              <Link to="/crm/customers?status=RENEWAL_DUE" className="section-link">Manage Customers →</Link>
            </div>
            {renewalsDue?.length === 0 ? (
              <EmptyState title="No renewals" message="No renewals due within the next 15 days." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 300, overflowY: 'auto' }}>
                {renewalsDue?.map((c: any) => (
                  <div key={c.id} className="list-item list-item--neutral bg-white">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <p className="text-body" style={{ fontWeight: 600 }}>{c.name}</p>
                        <Badge variant={c.urgency === 'CRITICAL' ? 'danger' : c.urgency === 'HIGH' ? 'warning' : 'info'}>
                          {c.daysLeft <= 0 ? 'Due Today' : `${c.daysLeft}d Left`}
                        </Badge>
                      </div>
                      <p className="text-caption">Plan: {c.current_plan} • Renewal Date: {c.renewal_date}</p>
                    </div>
                    <button onClick={() => handleSendRenewalReminder(c)} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <span>Send Reminder</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missed Check-ins */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="section-header" style={{ marginBottom: 0 }}>
              <h3 className="section-title">Missed Routine Check-ins ({missedCheckins?.length || 0})</h3>
              <Link to="/crm/customers" className="section-link">Customers Hub →</Link>
            </div>
            {missedCheckins?.length === 0 ? (
              <EmptyState title="All active" message="All active members are submitting check-ins regularly." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 300, overflowY: 'auto' }}>
                {missedCheckins?.map((m: any, idx: number) => (
                  <div key={idx} className="list-item list-item--neutral">
                    <div>
                      <p className="text-body" style={{ fontWeight: 600 }}>{m.customer.name}</p>
                      <p className="text-caption">Last Check-in: {m.lastCheckin} {m.daysMissed ? `(${m.daysMissed} days ago)` : ''}</p>
                    </div>
                    <a href={`https://wa.me/${m.customer.phone_number}?text=Namaste%20${encodeURIComponent(m.customer.name)}%20ji,%20how%20is%20your%20routine%20going?`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <Icons.Message size={13} />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
