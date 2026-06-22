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

export default function UserInvoiceDetailPage() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        fetchInvoice();
    }, [invoiceId]);

    const fetchInvoice = async () => {
        try {
            const invRes = await axios.get(`${API_BASE}/api/invoices/${invoiceId}`);
            setInvoice(invRes.data);
        } catch (err) {
            console.error(err);
            toast('Failed to load invoice details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel this invoice? The bills will be released.')) return;
        setCancelling(true);
        try {
            await axios.delete(`${API_BASE}/api/invoices/${invoiceId}`);
            toast('Invoice cancelled successfully!', 'success');
            fetchInvoice();
        } catch (err) {
            toast(err.response?.data?.error || err.response?.data?.message || 'Failed to cancel invoice', 'error');
        } finally {
            setCancelling(false);
        }
    };

    if (loading) return <SkeletonProfile />;

    if (!invoice) {
        return (
            <div className="card">
                <p>Invoice not found</p>
                <button className="btn btn--primary" onClick={() => navigate('/my-invoices')}>Back to Invoices</button>
            </div>
        );
    }

    const isPending = invoice.status === 'PENDING';
    const isPaid = invoice.status === 'PAID';

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Invoice Details</h1>
                {/* <p className="page-header__subtitle">{invoice.invoiceCode}</p> */}
            </div>

            <div className="card profile-card">
                {/* Status Header */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <span className={`badge ${invoiceStatusBadge(invoice.status)}`} style={{ fontSize: '14px', padding: '6px 20px' }}>
                        {invoice.status}
                    </span>
                </div>

                {/* QR Code for PENDING invoices */}
                {isPending && invoice.qrCodeUrl && (
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '28px',
                        padding: '24px',
                        background: 'var(--card-bg)',
                        borderRadius: 'var(--radius-lg)',
                        border: '2px dashed var(--accent)',
                    }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
                            Scan this QR code to pay via bank transfer
                        </p>
                        <div style={{
                            background: '#fff',
                            display: 'inline-block',
                            padding: '16px',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}>
                            <img
                                src={invoice.qrCodeUrl}
                                alt="Payment QR Code"
                                style={{ width: '220px', height: '220px', display: 'block' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '20px', margin: '8px 0' }}>
                                {formatCurrency(invoice.totalAmount)}
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                Reference: <strong style={{ color: 'var(--text-primary)' }}>{invoice.referenceCode}</strong>
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>
                                Expires at: {invoice.expiresAt ? new Date(invoice.expiresAt).toLocaleString() : '—'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Paid success banner */}
                {isPaid && (
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '28px',
                        padding: '20px',
                        background: 'var(--success-bg)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--success)',
                    }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" style={{ width: '48px', height: '48px', margin: '0 auto 12px' }}>
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: '16px', margin: 0 }}>
                            Payment Successful
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                            Paid at: {invoice.paidAt ? new Date(invoice.paidAt).toLocaleString() : '—'}
                        </p>
                    </div>
                )}

                {/* Invoice Information */}
                <div className="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
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
                        <label className="form-label">Type</label>
                        <input className="form-input form-input--readonly" value={invoice.invoiceType === 'CONTRIBUTION' ? 'Contribution' : 'Bill Payment'} readOnly disabled />
                    </div>
                </div>

                {/* Timeline */}
                <div className="section-title" style={{ marginTop: '28px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
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

                {/* Bills (for BILL invoices) */}
                {invoice.billTitles && invoice.billTitles.length > 0 && (
                    <>
                        <div className="section-title" style={{ marginTop: '28px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                            Bills Included ({invoice.billTitles.length})
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {invoice.billIds.map((billId, index) => (
                                <span key={billId} className="badge badge--info" style={{ fontSize: '13px', padding: '4px 12px' }}>
                                    {invoice.billTitles[index] || `Bill #${billId}`}
                                </span>
                            ))}
                        </div>
                    </>
                )}

                {/* Campaign (for CONTRIBUTION invoices) */}
                {invoice.invoiceType === 'CONTRIBUTION' && invoice.campaignTitle && (
                    <>
                        <div className="section-title" style={{ marginTop: '28px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                            Campaign
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span
                                className="badge badge--info"
                                style={{ fontSize: '13px', padding: '4px 12px' }}
                            >
                                {invoice.campaignTitle}
                            </span>
                        </div>
                    </>
                )}

                {/* Actions */}
                <div style={{ marginTop: '28px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {isPending && (
                        <button
                            className="btn btn--danger"
                            onClick={handleCancel}
                            disabled={cancelling}
                        >
                            {cancelling ? 'Cancelling...' : 'Cancel Invoice'}
                        </button>
                    )}
                    <button className="btn btn--secondary" onClick={() => navigate('/my-invoices')}>Back to Invoices</button>
                </div>
            </div>
        </>
    );
}
