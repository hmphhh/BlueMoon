import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { SkeletonProfile } from '../../components/ui/LoadingSkeleton';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const formatCurrency = (amount) => {
    if (amount == null) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const invoiceStatusBadge = (status) => {
    switch (status) {
        case 'PENDING': return 'badge--warning';
        case 'PAID': return 'badge--success';
        case 'EXPIRED': return 'badge--secondary';
        case 'CANCELLED': return 'badge--danger';
        default: return 'badge--info';
    }
};

const paymentStatusBadge = (status) => {
    switch (status) {
        case 'SUCCESS': return 'badge--success';
        case 'FAILED': return 'badge--danger';
        default: return 'badge--info';
    }
};

export default function AdminInvoiceDetailPage() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [invoice, setInvoice] = useState(null);
    const [payments, setPayments] = useState([]);
    const [allBills, setAllBills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [invoiceId]);

    const fetchData = async () => {
        try {
            const [invRes, payRes, billsRes] = await Promise.all([
                axios.get(`${API_BASE}/api/invoices/${invoiceId}`),
                axios.get(`${API_BASE}/api/invoices/${invoiceId}/payments`),
                axios.get(`${API_BASE}/api/bills`),
            ]);
            setInvoice(invRes.data);
            setPayments(payRes.data || []);
            setAllBills(billsRes.data || []);
        } catch (err) {
            console.error(err);
            toast('Failed to load invoice details', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <SkeletonProfile />;

    if (!invoice) {
        return (
            <div className="card">
                <p>Invoice not found</p>
                <button className="btn btn--primary" onClick={() => navigate('/admin-invoices')}>Back to Invoices</button>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Invoice Details</h1>
                <p className="page-header__subtitle">{invoice.invoiceCode}</p>
            </div>

            <div className="card profile-card">
                {/* Status Header */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <span className={`badge ${invoiceStatusBadge(invoice.status)}`} style={{ fontSize: '14px', padding: '6px 20px' }}>
                        {invoice.status}
                    </span>
                </div>

                {/* QR Code for PENDING invoices */}
                {invoice.status === 'PENDING' && invoice.qrCodeUrl && (
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '28px',
                        padding: '20px',
                        background: 'var(--card-bg)',
                        borderRadius: 'var(--radius-lg)',
                        border: '2px dashed var(--accent)',
                    }}>
                        <div style={{
                            background: '#fff',
                            display: 'inline-block',
                            padding: '12px',
                            borderRadius: 'var(--radius-md)',
                        }}>
                            <img
                                src={invoice.qrCodeUrl}
                                alt="Payment QR Code"
                                style={{ width: '180px', height: '180px', display: 'block' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </div>
                        <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '18px', margin: '12px 0 0' }}>
                            {formatCurrency(invoice.totalAmount)}
                        </p>
                    </div>
                )}

                {/* Invoice Information */}
                <div className="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    Invoice Information
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Invoice Code</label>
                        <input className="form-input form-input--readonly" value={invoice.invoiceCode || ''} readOnly disabled />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Reference Code</label>
                        <input className="form-input form-input--readonly" value={invoice.referenceCode || ''} readOnly disabled />
                    </div>
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Total Amount</label>
                        <input className="form-input form-input--readonly" value={formatCurrency(invoice.totalAmount)} readOnly disabled />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Created By</label>
                        <input className="form-input form-input--readonly" value={invoice.createdBy?.fullName || '—'} readOnly disabled />
                    </div>
                </div>

                {/* Timeline */}
                <div className="section-title" style={{ marginTop: '28px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    Timeline
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Created At</label>
                        <input className="form-input form-input--readonly" value={invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : '—'} readOnly disabled />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Expires At</label>
                        <input className="form-input form-input--readonly" value={invoice.expiresAt ? new Date(invoice.expiresAt).toLocaleString() : '—'} readOnly disabled />
                    </div>
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Paid At</label>
                        <input className="form-input form-input--readonly" value={invoice.paidAt ? new Date(invoice.paidAt).toLocaleString() : 'Not paid yet'} readOnly disabled />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Cancelled At</label>
                        <input className="form-input form-input--readonly" value={invoice.cancelledAt ? new Date(invoice.cancelledAt).toLocaleString() : '—'} readOnly disabled />
                    </div>
                </div>

                {/* Bills */}
                {invoice.billIds && invoice.billIds.length > 0 && (
                    <>
                        <div className="section-title" style={{ marginTop: '28px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                            Bills Included ({invoice.billIds.length})
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {invoice.billIds.map(billId => {
                                const globalIndex = allBills.findIndex(b => b.id === billId);
                                const displayLabel = globalIndex !== -1 ? `Bill #${globalIndex + 1}` : `Bill (unknown)`;
                                return (
                                    <span
                                        key={billId}
                                        className="badge badge--info"
                                        style={{ fontSize: '13px', padding: '4px 12px', cursor: 'pointer' }}
                                        onClick={() => navigate(`/admin-bill/${billId}`)}
                                    >
                                        {displayLabel} →
                                    </span>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Payment Attempts */}
                <div className="section-title" style={{ marginTop: '28px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    Payment Attempts ({payments.length})
                </div>

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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No payment attempts recorded yet.</p>
                )}

                {/* Actions */}
                <div style={{ marginTop: '28px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button className="btn btn--secondary" onClick={() => navigate('/admin-invoices')}>Back to Invoices</button>
                </div>
            </div>
        </>
    );
}
