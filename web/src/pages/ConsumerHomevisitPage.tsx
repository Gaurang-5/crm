import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ConsumerHomevisitModal } from '../components/forms/ConsumerHomevisitModal';
import { Icons } from '../components/ui/Icons';
import { useToast } from '../hooks/useToast';

export function ConsumerHomevisitPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewDetail, setViewDetail] = useState<any | null>(null);

  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await api.getConsumerHomevisits();
      setVisits(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast.error('Failed to load homevisit records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = visits.filter((item) => {
    const q = search.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(q) ||
      (item.phone_number || '').includes(q) ||
      (item.purpose_of_joining || '').toLowerCase().includes(q) ||
      (item.health_challenges || '').toLowerCase().includes(q)
    );
  });

  const totalCount = visits.length;
  const weightLossCount = visits.filter((v) =>
    (v.purpose_of_joining || '').toLowerCase().includes('weight')
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Consumer Data (Home Visits)"
        subtitle="Comprehensive client lifestyle evaluations, dietary habits and wellness logs"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <Icons.Plus size={16} />
            <span>New Home Visit</span>
          </button>
        }
      />

      {/* Metrics Row (Single Line Compact Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--space-3)' }}>
        <StatCard
          icon={<Icons.HomeVisit size={18} />}
          label="Total Home Visits"
          value={totalCount}
          subtitle="Detailed consumer profiles logged"
          variant="primary"
        />
        <StatCard
          icon={<Icons.Campaigns size={18} />}
          label="Weight Loss Goals"
          value={weightLossCount}
          subtitle="Clients aiming for weight management"
          variant="success"
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ padding: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{
              position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--clr-text-tertiary)', display: 'flex', alignItems: 'center', pointerEvents: 'none',
            }}>
              <Icons.Search size={15} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, purpose or health challenges..."
              className="form-input"
              style={{ paddingLeft: 'var(--space-8)', height: '36px' }}
            />
          </div>

          <button
            type="button"
            onClick={loadData}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', height: '36px' }}
          >
            <Icons.Refresh size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Evaluations Data Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: 'var(--space-12)' }}>
            <LoadingSpinner message="Loading homevisit evaluations..." />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Icons.HomeVisit size={32} color="var(--clr-text-tertiary)" />}
            title="No Home Visit evaluations found"
            message={search ? 'No records match your search criteria.' : 'Click "+ New Home Visit" to log your first comprehensive client evaluation.'}
            action={
              !search ? (
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                  Add First Home Visit
                </button>
              ) : undefined
            }
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Client Name & Phone</th>
                <th>Age / Height</th>
                <th>Weight / Target</th>
                <th>Purpose of Joining</th>
                <th>Health Challenges</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-secondary)', whiteSpace: 'nowrap' }}>
                    {item.date || (item.created_at ? item.created_at.split('T')[0] : '—')}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--clr-text-primary)' }}>
                      {item.name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-tertiary)' }}>
                      {item.phone_number || '—'}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 'var(--font-size-sm)' }}>
                      {item.age ? `${item.age} yrs` : '—'} / {item.height || '—'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.weight ? `${item.weight} kg` : '—'}</div>
                    {item.ideal_weight && (
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--clr-brand)' }}>
                        Target: {item.ideal_weight} kg
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--font-size-sm)' }}>
                      {item.purpose_of_joining || '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--font-size-sm)', color: '#dc2626' }}>
                      {item.health_challenges || '—'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
                      <button
                        type="button"
                        onClick={() => setViewDetail(item)}
                        className="btn btn-secondary btn-sm"
                      >
                        View Details
                      </button>
                      <a
                        href={`https://wa.me/${(item.phone_number || '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm"
                        title="WhatsApp Chat"
                      >
                        <Icons.Message size={15} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Home Visit Modal */}
      {showModal && (
        <ConsumerHomevisitModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {/* View Detail Modal */}
      {viewDetail && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">Home Visit Profile: {viewDetail.name}</h2>
              <button className="modal-close" onClick={() => setViewDetail(null)}>
                <Icons.Close size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="card card-flat space-y-2">
                <h4 className="text-subheading border-b pb-1">Personal & Physical Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><strong>Phone:</strong> {viewDetail.phone_number}</div>
                  <div><strong>Date:</strong> {viewDetail.date}</div>
                  <div><strong>Age:</strong> {viewDetail.age} yrs</div>
                  <div><strong>Height:</strong> {viewDetail.height}</div>
                  <div><strong>Current Weight:</strong> {viewDetail.weight} kg</div>
                  <div><strong>Ideal Weight:</strong> {viewDetail.ideal_weight} kg</div>
                  <div><strong>Family Members:</strong> {viewDetail.family_members || '—'}</div>
                  <div><strong>Water Intake:</strong> {viewDetail.water_intake || '—'}</div>
                </div>
              </div>

              <div className="card card-flat space-y-2">
                <h4 className="text-subheading border-b pb-1">Health & Wellness Assessment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><strong>Purpose of Joining:</strong> {viewDetail.purpose_of_joining}</div>
                  <div><strong>Health Challenges:</strong> {viewDetail.health_challenges}</div>
                  <div><strong>Energy Levels:</strong> {viewDetail.energy}</div>
                  <div><strong>Digestion:</strong> {viewDetail.digestion}</div>
                  <div><strong>Sleep Quality:</strong> {viewDetail.sleep}</div>
                  <div><strong>Exercise:</strong> {viewDetail.exercise}</div>
                </div>
              </div>

              <div className="card card-flat space-y-2">
                <h4 className="text-subheading border-b pb-1">Daily Meal & Sleep Routine</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div><strong>Wake Up Time:</strong> {viewDetail.wake_up_time}</div>
                  <div><strong>Sleeping Time:</strong> {viewDetail.sleeping_time}</div>
                  <div><strong>Breakfast:</strong> {viewDetail.breakfast_time}</div>
                  <div><strong>Mid Meal 1:</strong> {viewDetail.mid_meal_1}</div>
                  <div><strong>Lunch:</strong> {viewDetail.lunch}</div>
                  <div><strong>Mid Meal 2:</strong> {viewDetail.mid_meal_2}</div>
                  <div><strong>Dinner:</strong> {viewDetail.dinner}</div>
                  <div><strong>Tea / Coffee:</strong> {viewDetail.tea || '—'}</div>
                  <div><strong>Fruit / Salad:</strong> {viewDetail.fruit_salad || '—'}</div>
                  <div><strong>Non-Veg Diet:</strong> {viewDetail.non_veg || '—'}</div>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--space-3)' }}>
                <button type="button" onClick={() => setViewDetail(null)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
