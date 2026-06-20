import { useState, useEffect } from 'react';
import { isDigitsOnly } from '../../utils/inputFormatters';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const formatCurrency = (amount) => {
    if (amount == null) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const statusBadge = (status) => {
    switch (status) {
        case 'NOT_STARTED': return 'badge--warning';
        case 'STARTED': return 'badge--info';
        case 'COMPLETED': return 'badge--success';
        default: return 'badge--info';
    }
};

export default function UserContributionDetailPage() {
    const { contributionId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);

    // Pay modal
    const [showPayModal, setShowPayModal] = useState(false);
    const [payAmount, setPayAmount] = useState('');
    const [creatingInvoice, setCreatingInvoice] = useState(false);

    useEffect(() => {
        fetchDetail();
    }, [contributionId]);

    const fetchDetail = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/apartment-contributions/${contributionId}`);
            setDetail(res.data);
        } catch (err) {
            toast('Failed to load contribution details', 'error');
            navigate('/my-contributions');
        } finally {
            setLoading(false);
        }
    };

    const openPayModal = () => {
        if (detail.requiredAmount) {
            const remaining = Math.max(0, detail.requiredAmount - (detail.collectedAmount || 0));
            setPayAmount(remaining > 0 ? String(remaining) : '');
        } else {
            setPayAmount('');
        }
        setShowPayModal(true);
    };

    const handleCreateContributionInvoice = async () => {
        if (!payAmount || Number(payAmount) <= 0) {
            toast('Please enter a valid amount', 'error');
            return;
        }
        setCreatingInvoice(true);
        try {
            const res = await axios.post(`${API_BASE}/api/invoices/contribution`, {
                apartmentContributionId: detail.id,
                amount: Number(payAmount)
            });
            toast('Contribution invoice created!', 'success');
            setShowPayModal(false);
            navigate(`/my-invoice/${res.data.id}`);
        } catch (err) {
            toast(err.response?.data?.error || err.response?.data?.message || 'Failed to create invoice', 'error');
        } finally {
            setCreatingInvoice(false);
        }
    };

    if (loading || !detail) {
        return <div className="page-header"><h1>Loading...</h1></div>;
    }

    const progress = detail.requiredAmount
        ? Math.min(100, Math.round(((detail.collectedAmount || 0) / detail.requiredAmount) * 100))
        : null;

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">{detail.campaign?.title}</h1>
                <p className="page-header__subtitle">
                    <span className={`badge ${statusBadge(detail.status)}`}>{detail.status?.replace('_', ' ')}</span>
                    <span className={`badge ${detail.campaign?.type === 'MANDATORY' ? 'badge--warning' : 'badge--info'}`} style={{ marginLeft: '8px' }}>{detail.campaign?.type}</span>
                </p>
            </div>

            {/* Overview Card */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h2 style={{ marginTop: 0 }}>Contribution Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="form-group">
                        <label className="form-label">Campaign Period</label>
                        <div style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{detail.campaign?.startDate} → {detail.campaign?.endDate}</div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Apartment</label>
                        <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>Room {detail.apartment?.apartmentNumber}</div>
                    </div>
                </div>

                {/* Progress */}
                <div style={{ margin: '20px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Collected</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatCurrency(detail.collectedAmount)}
                            {detail.requiredAmount ? ` / ${formatCurrency(detail.requiredAmount)}` : ''}
                        </span>
                    </div>
                    {progress !== null && (
                        <div style={{ height: '10px', borderRadius: '5px', background: 'var(--border)', overflow: 'hidden' }}>
                            <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                borderRadius: '5px',
                                background: progress >= 100
                                    ? 'var(--success)'
                                    : 'linear-gradient(90deg, var(--accent), var(--accent-hover, var(--accent)))',
                                transition: 'width 0.5s ease'
                            }} />
                        </div>
                    )}
                    {progress !== null && (
                        <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {progress}% complete
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button className="btn btn--secondary" onClick={() => navigate('/my-contributions')}>← Back</button>
                    {detail.status !== 'COMPLETED' && detail.campaign?.status === 'ACTIVE' && (
                        <button className="btn btn--success" onClick={openPayModal}>💳 Contribute</button>
                    )}
                </div>
            </div>

            {/* Contributors Table */}
            <div className="card">
                <h2 style={{ marginTop: 0 }}>Apartment Members' Contributions</h2>
                {detail.contributors && detail.contributors.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>STT</th>
                                    <th>Name</th>
                                    <th>Total Paid</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detail.contributors.map((c, i) => (
                                    <tr key={c.userId}>
                                        <td>{i + 1}</td>
                                        <td><strong>{c.fullName}</strong></td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(c.totalPaid)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                        <p>No contributions yet. Be the first to contribute!</p>
                    </div>
                )}
            </div>

            {/* Pay Modal */}
            {showPayModal && (
                <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create Contribution Invoice</h2>
                            <button className="modal-close" onClick={() => setShowPayModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Campaign</label>
                                <input className="form-input form-input--readonly" value={detail.campaign?.title} readOnly disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Currently Collected</label>
                                <input className="form-input form-input--readonly" value={formatCurrency(detail.collectedAmount)} readOnly disabled />
                            </div>
                            {detail.requiredAmount && (
                                <div className="form-group">
                                    <label className="form-label">Required Amount</label>
                                    <input className="form-input form-input--readonly" value={formatCurrency(detail.requiredAmount)} readOnly disabled />
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Amount to Contribute (VND)</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    inputMode="numeric"
                                    value={payAmount}
                                    onChange={e => { if (isDigitsOnly(e.target.value)) setPayAmount(e.target.value); }}
                                    placeholder="Enter amount"
                                />
                            </div>
                            {detail.requiredAmount && (
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '-8px' }}>
                                    Remaining: {formatCurrency(Math.max(0, detail.requiredAmount - (detail.collectedAmount || 0)))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleCreateContributionInvoice} disabled={creatingInvoice}>
                                {creatingInvoice ? 'Creating...' : '💳 Create Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
