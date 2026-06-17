import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../components/ui/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const formatCurrency = (amount) => {
    if (amount == null) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const paymentStatusBadge = (status) => {
    switch (status) {
        case 'SUCCESS': return 'badge--success';
        case 'FAILED': return 'badge--danger';
        default: return 'badge--info';
    }
};

export default function AdminPaymentManagementPage() {
    const toast = useToast();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/payments`);
            setPayments(res.data || []);
        } catch (err) {
            console.error(err);
            toast('Failed to load payments', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentDetail = async (paymentId) => {
        setDetailLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/payments/${paymentId}`);
            setSelectedPayment(res.data);
        } catch (err) {
            toast('Failed to load payment details', 'error');
        } finally {
            setDetailLoading(false);
        }
    };

    const successCount = payments.filter(p => p.status === 'SUCCESS').length;
    const failedCount = payments.filter(p => p.status === 'FAILED').length;
    const totalSuccess = payments
        .filter(p => p.status === 'SUCCESS')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    if (loading) {
        return <div className="page-header"><h1>Loading...</h1></div>;
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Payment Management</h1>
                <p className="page-header__subtitle">View all payment transactions</p>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div className="stat-card__value">{successCount}</div>
                    <div className="stat-card__label">Successful</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    </div>
                    <div className="stat-card__value">{failedCount}</div>
                    <div className="stat-card__label">Failed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <div className="stat-card__value">{formatCurrency(totalSuccess)}</div>
                    <div className="stat-card__label">Total Collected</div>
                </div>
            </div>

            <div className="card">
                <h2 style={{ margin: '0 0 20px 0' }}>Transactions</h2>

                {payments.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Transaction Code</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Status</th>
                                    <th>Time</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(pay => (
                                    <tr key={pay.id}>
                                        <td><strong>{pay.transactionCode}</strong></td>
                                        <td>{formatCurrency(pay.amount)}</td>
                                        <td>{pay.method || '—'}</td>
                                        <td>
                                            <span className={`badge ${paymentStatusBadge(pay.status)}`}>
                                                {pay.status}
                                            </span>
                                        </td>
                                        <td>{pay.transactionTime ? new Date(pay.transactionTime).toLocaleString() : '—'}</td>
                                        <td>
                                            <button className="btn btn--primary btn--sm" onClick={() => fetchPaymentDetail(pay.id)}>
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                        <p>No payment transactions found</p>
                    </div>
                )}
            </div>

            {/* Payment Detail Modal */}
            {selectedPayment && (
                <div className="modal-overlay" onClick={() => setSelectedPayment(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Payment Details</h2>
                            <button className="modal-close" onClick={() => setSelectedPayment(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            {detailLoading ? (
                                <p>Loading...</p>
                            ) : (
                                <>
                                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                        <span className={`badge ${paymentStatusBadge(selectedPayment.status)}`} style={{ fontSize: '13px', padding: '5px 16px' }}>
                                            {selectedPayment.status}
                                        </span>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Transaction Code</label>
                                        <input className="form-input form-input--readonly" value={selectedPayment.transactionCode || ''} readOnly disabled />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Invoice ID</label>
                                        <input className="form-input form-input--readonly" value={selectedPayment.invoiceId || ''} readOnly disabled />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Amount</label>
                                        <input className="form-input form-input--readonly" value={formatCurrency(selectedPayment.amount)} readOnly disabled />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Method</label>
                                        <input className="form-input form-input--readonly" value={selectedPayment.method || '—'} readOnly disabled />
                                    </div>
                                    {selectedPayment.failureReason && (
                                        <div className="form-group">
                                            <label className="form-label">Failure Reason</label>
                                            <input className="form-input form-input--readonly" value={selectedPayment.failureReason} readOnly disabled style={{ color: 'var(--danger)' }} />
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label className="form-label">Transaction Time</label>
                                        <input className="form-input form-input--readonly" value={selectedPayment.transactionTime ? new Date(selectedPayment.transactionTime).toLocaleString() : '—'} readOnly disabled />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Recorded At</label>
                                        <input className="form-input form-input--readonly" value={selectedPayment.createdAt ? new Date(selectedPayment.createdAt).toLocaleString() : '—'} readOnly disabled />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setSelectedPayment(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
