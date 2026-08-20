import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function RevenueProfitPage() {
  const [profitSheets, setProfitSheets] = useState<any[]>([]);
  const [currentSheetId, setCurrentSheetId] = useState('');
  const [sheetDetails, setSheetDetails] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Log Expense Dialog
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('MARKETING');
  const [expAmount, setExpAmount] = useState('');
  const [expNotes, setExpNotes] = useState('');

  const loadSheets = () => {
    setLoading(true);
    api.getProfitSheets()
      .then((data) => {
        setProfitSheets(data.sheets || []);
        const activeSheet = data.currentSheet || 'August 2026';
        setCurrentSheetId(activeSheet);
        return Promise.all([api.getProfitSheet(activeSheet), api.getExpenses()]);
      })
      .then(([details, expData]) => {
        setSheetDetails(details);
        setExpenses(expData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSheets();
  }, []);

  const handleSelectSheet = (sId: string) => {
    setCurrentSheetId(sId);
    api.getProfitSheet(sId)
      .then((details) => setSheetDetails(details))
      .catch((err) => console.error(err));
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return;
    try {
      await api.createExpense({
        title: expTitle,
        category: expCategory,
        amount: Number(expAmount),
        notes: expNotes,
      });
      setIsExpenseModalOpen(false);
      setExpTitle('');
      setExpAmount('');
      loadSheets();
    } catch (err: any) {
      console.error(err.message || 'Failed to log expense');
    }
  };

  const { totals, entries } = sheetDetails || {};

  return (
    <div className="page-section">
      {/* Page Header */}
      <PageHeader
        title="Revenue & Profit"
        subtitle="Financial health and commission tracking"
        action={
          <button onClick={() => setIsExpenseModalOpen(true)} className="btn btn-secondary">
            + Log Expense
          </button>
        }
      />

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--space-3)' }}>
        <StatCard
          label={`${currentSheetId} Net Cash Profit`}
          value={`₹${(totals?.netCashProfit || totals?.totalGrossProfit || 0).toLocaleString('en-IN')}`}
          variant="success"
        />
        <StatCard
          label="Total Amount Received"
          value={`₹${(totals?.totalReceived || 0).toLocaleString('en-IN')}`}
          variant="info"
        />
        <StatCard
          label="Cost of Product Kits"
          value={`-₹${(totals?.totalKit || 0).toLocaleString('en-IN')}`}
          variant="danger"
        />
        <StatCard
          label="Operating Expenses"
          value={`-₹${(totals?.totalExpenses || 0).toLocaleString('en-IN')}`}
          variant="warning"
        />
      </div>

      {/* Sheet Selector & Details */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            paddingBottom: 'var(--space-3)',
            borderBottom: '1px solid var(--clr-border)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className="text-secondary" style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
              Select Month:
            </span>
            <select
              value={currentSheetId}
              onChange={(e) => handleSelectSheet(e.target.value)}
              className="form-select"
              style={{ width: '12rem', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}
            >
              {profitSheets.map((s: any) => (
                <option key={s.sheet_id} value={s.sheet_id}>
                  {s.sheet_id}
                </option>
              ))}
            </select>
          </div>
          <Badge variant="success">Audited &amp; Verified</Badge>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading profit sheet…" />
        ) : !entries || entries.length === 0 ? (
          <EmptyState
            icon=""
            title="No entries yet"
            message="No profit entries logged for this month yet."
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Member Name</th>
                  <th>Plan</th>
                  <th>Type</th>
                  <th>Amount Received</th>
                  <th>Coach Amount</th>
                  <th>Cost of Kit</th>
                  <th>Cash Profit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e: any) => (
                  <tr key={e.id}>
                    <td style={{ fontSize: 'var(--font-size-xs)' }}>{e.payment_date}</td>
                    <td style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-primary)' }}>
                      {e.member_name}
                    </td>
                    <td>
                      <Badge variant="neutral">{e.membership_type}</Badge>
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)' }}>{e.transaction_type}</td>
                    <td style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>
                      ₹{Number(e.amount_received || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)' }}>
                      ₹{Number(e.coach_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--clr-danger, #e11d48)' }}>
                      ₹{Number(e.cost_of_kit || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--clr-success, #059669)' }}>
                      ₹{Number(e.cash_profit || 0).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <Badge variant="success">{e.payment_status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expenses Log */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 'var(--space-3)',
            borderBottom: '1px solid var(--clr-border)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <h3 className="text-subheading">Operating &amp; Marketing Expenses</h3>
          <span className="text-caption" style={{ fontWeight: 600 }}>
            {expenses.length} Records
          </span>
        </div>

        {expenses.length === 0 ? (
          <EmptyState
            icon=""
            title="No expenses logged"
            message="No expenses have been recorded yet. Use the Log Expense button to add one."
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Expense Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp: any) => (
                  <tr key={exp.id}>
                    <td style={{ fontSize: 'var(--font-size-xs)' }}>{exp.expense_date}</td>
                    <td style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-primary)' }}>
                      {exp.title}
                    </td>
                    <td>
                      <Badge variant="neutral">{exp.category}</Badge>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'var(--clr-danger, #e11d48)' }}>
                      ₹{exp.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                      {exp.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Log Operating Expense</h3>
              <button className="modal-close" onClick={() => setIsExpenseModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meta Ads Campaign / Zoom Pro Subscription"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="form-input"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="form-select">
                    <option value="MARKETING">Marketing &amp; Advertising</option>
                    <option value="ZOOM_SOFTWARE">Zoom &amp; Software Tools</option>
                    <option value="CLUB_RENT">Club Space &amp; Rent</option>
                    <option value="SHIPPING">Courier &amp; Shipping</option>
                    <option value="OTHER">Other Operating Expense</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
