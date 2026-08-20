import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatCard } from '../components/ui/StatCard';

export function OrdersPaymentsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Record Payment Dialog
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [referenceNo, setReferenceNo] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const loadCommerceData = () => {
    setLoading(true);
    Promise.all([
      api.getOrders(),
      api.getPayments(),
      api.getBalances(),
      api.getCustomers(),
    ])
      .then(([ordersData, paymentsData, balancesData, customersData]) => {
        setOrders(ordersData);
        setPayments(paymentsData);
        setBalances(balancesData);
        setCustomers(customersData);
        if (customersData.length > 0) {
          setSelectedCustomerId(customersData[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCommerceData();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !paymentAmount) return;
    setSubmittingPayment(true);
    try {
      await api.createPayment({
        customer_id: selectedCustomerId,
        amount: Number(paymentAmount),
        payment_method: paymentMethod,
        reference_no: referenceNo,
        notes: paymentNotes,
      });
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      setReferenceNo('');
      loadCommerceData();
    } catch (err: any) {
      console.error(err.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, nextStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, nextStatus);
      loadCommerceData();
    } catch (err: any) {
      console.error(err.message || 'Failed to update status');
    }
  };

  const totalOutstanding = balances.reduce((sum, b) => sum + Number(b.outstandingBalance || 0), 0);
  const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  if (loading) {
    return <LoadingSpinner message="Loading orders & payments…" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <PageHeader
        title="Orders & Payments"
        subtitle="Transaction ledger and payment tracking"
        action={
          <button onClick={() => setIsPaymentModalOpen(true)} className="btn btn-primary">
            Record Payment
          </button>
        }
      />

      {/* KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-3)' }}>
        <StatCard label="Total Outstanding Balance" value={`₹${totalOutstanding.toLocaleString('en-IN')}`} variant="danger" />
        <StatCard label="Total Cash Collected" value={`₹${totalReceived.toLocaleString('en-IN')}`} variant="success" />
        <StatCard label="Total Orders Placed" value={orders.length} variant="info" />
      </div>

      {/* Customer Balances Ledger */}
      <div className="card">
        <div className="section-header">
          <h3 className="section-title">Customer Balances &amp; Receivables Ledger</h3>
          <span className="text-caption">{balances.length} Accounts</span>
        </div>

        {balances.length === 0 ? (
          <EmptyState
            icon=""
            title="No Balance Accounts"
            message="No customer balance accounts logged yet."
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Order Value</th>
                  <th>Payments Received</th>
                  <th>Balance Due</th>
                  <th>Cash Profit</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b) => (
                  <tr key={b.customerId}>
                    <td>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--clr-text-primary)', margin: 0 }}>{b.customerName}</p>
                        <p className="text-caption" style={{ margin: 0 }}>{b.phone}</p>
                      </div>
                    </td>
                    <td><Badge variant="neutral">{b.plan}</Badge></td>
                    <td style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>₹{b.totalOrdersAmount?.toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--clr-brand)' }}>₹{b.totalPaymentsReceived?.toLocaleString('en-IN')}</td>
                    <td>
                      {b.outstandingBalance > 0 ? (
                        <Badge variant="warning">₹{b.outstandingBalance?.toLocaleString('en-IN')}</Badge>
                      ) : (
                        <Badge variant="success">Settled </Badge>
                      )}
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--clr-brand)' }}>₹{b.cashProfit?.toLocaleString('en-IN')}</td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedCustomerId(b.customerId);
                          setPaymentAmount(String(b.outstandingBalance || ''));
                          setIsPaymentModalOpen(true);
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        + Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="section-header">
          <h3 className="section-title">Recent Orders History</h3>
          <span className="text-caption">{orders.length} Orders</span>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon=""
            title="No Orders Yet"
            message="No orders have been recorded yet."
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer Phone</th>
                  <th>Membership / Plan</th>
                  <th>Amount</th>
                  <th>Kit Cost</th>
                  <th>Cash Profit</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)' }}>#{o.order_number || o.id}</td>
                    <td className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>{o.phone_number || '-'}</td>
                    <td><Badge variant="info">{o.membership_type}</Badge></td>
                    <td style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>₹{o.amount_received?.toLocaleString('en-IN')}</td>
                    <td className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>₹{o.cost_of_kit?.toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--clr-brand)' }}>₹{o.cash_profit?.toLocaleString('en-IN')}</td>
                    <td>
                      <Badge
                        variant={
                          o.order_status === 'DELIVERED'
                            ? 'success'
                            : o.order_status === 'CANCELLED'
                            ? 'danger'
                            : o.order_status === 'SHIPPED'
                            ? 'info'
                            : 'warning'
                        }
                      >
                        {o.order_status}
                      </Badge>
                    </td>
                    <td>
                      <select
                        value={o.order_status}
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        className="form-select"
                        style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-2)' }}
                      >
                        <option value="PLACED">PLACED</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Record Payment</h3>
              <button className="modal-close" onClick={() => setIsPaymentModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Customer Account *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="form-select"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone_number}) - {c.current_plan}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Amount Received (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="form-select"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CASH">Cash in hand</option>
                    <option value="BANK_TRANSFER">Bank IMPS / NEFT</option>
                    <option value="CARD">Credit / Debit Card</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Reference #</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-1234567890"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingPayment} className="btn btn-primary">
                  {submittingPayment ? 'Recording…' : 'Record Payment '}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
