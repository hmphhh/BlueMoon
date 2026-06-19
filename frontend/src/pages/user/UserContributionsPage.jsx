import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import usePagination from '../../hooks/usePagination';
import PaginationControls from '../../components/ui/PaginationControls';

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

const typeBadge = (type) => {
    switch (type) {
        case 'MANDATORY': return 'badge--warning';
        case 'VOLUNTARY': return 'badge--info';
        default: return 'badge--info';
    }
};

export default function UserContributionsPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [contributionStats, setContributionStats] = useState({});

    const {
        currentPage, apiPage, pageSize,
        setCurrentPage, setPageSize,
        getAbortSignal,
    } = usePagination({ initialPageSize: 10 });

    // Pay modal
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedContribution, setSelectedContribution] = useState(null);
    const [payAmount, setPayAmount] = useState('');
    const [creatingInvoice, setCreatingInvoice] = useState(false);

    const fetchContributions = useCallback(async () => {
        const signal = getAbortSignal();
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', apiPage);
            params.set('size', pageSize);
            const res = await axios.get(`${API_BASE}/api/apartment-contributions/me?${params.toString()}`, { signal });
            setContributions(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
        } catch (err) {
            if (axios.isCancel(err)) return;
            console.error(err);
            toast('Failed to load contributions', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiPage, pageSize]);

    useEffect(() => { fetchContributions(); }, [fetchContributions]);

    useEffect(() => {
        axios.get(`${API_BASE}/api/apartment-contributions/me/stats`)
            .then(res => setContributionStats(res.data || {}))
            .catch(err => console.error('Failed to load contribution stats', err));
    }, []);

    const openPayModal = (contribution) => {
        setSelectedContribution(contribution);
        // Pre-fill with remaining amount for mandatory campaigns
        if (contribution.type === 'MANDATORY' && contribution.requiredAmount) {
            const remaining = Math.max(0, contribution.requiredAmount - (contribution.collectedAmount || 0));
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
                apartmentContributionId: selectedContribution.id,
                amount: Number(payAmount)
            });
            toast('Contribution invoice created!', 'success');
            setShowPayModal(false);
            setSelectedContribution(null);
            setPayAmount('');
            navigate(`/my-invoice/${res.data.id}`);
        } catch (err) {
            toast(err.response?.data?.error || err.response?.data?.message || 'Failed to create invoice', 'error');
        } finally {
            setCreatingInvoice(false);
        }
    };

    const activeCount = (contributionStats['NOT_STARTED'] || 0) + (contributionStats['STARTED'] || 0);
    const completedCount = contributionStats['COMPLETED'] || 0;

    if (loading) {
        return <div className="page-header"><h1>Loading...</h1></div>;
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">My Contributions</h1>
                <p className="page-header__subtitle">View and pay your apartment's contribution campaigns</p>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    </div>
                    <div className="stat-card__value">{activeCount || '—'}</div>
                    <div className="stat-card__label">Active</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div className="stat-card__value">{completedCount || '—'}</div>
                    <div className="stat-card__label">Completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <div className="stat-card__value">{totalElements || '—'}</div>
                    <div className="stat-card__label">Total</div>
                </div>
            </div>

            {/* Contributions List */}
            <div className="card">
                <h2 style={{ marginTop: 0 }}>Contribution Campaigns</h2>

                {contributions.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>STT</th>
                                    <th>Campaign</th>
                                    <th>Type</th>
                                    <th>Collected</th>
                                    <th>Required</th>
                                    <th>Progress</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contributions.map((c, i) => {
                                    const progress = c.type === 'MANDATORY' && c.requiredAmount
                                        ? Math.min(100, Math.round(((c.collectedAmount || 0) / c.requiredAmount) * 100))
                                        : null;
                                    return (
                                        <tr key={c.id}>
                                            <td>{i + 1}</td>
                                            <td><strong>{c.campaignTitle}</strong></td>
                                            <td><span className={`badge ${typeBadge(c.type)}`}>{c.type}</span></td>
                                            <td style={{ fontWeight: 600 }}>{formatCurrency(c.collectedAmount)}</td>
                                            <td>{formatCurrency(c.requiredAmount)}</td>
                                            <td style={{ minWidth: '120px' }}>
                                                {progress !== null ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--border)', overflow: 'hidden' }}>
                                                            <div style={{ width: `${progress}%`, height: '100%', borderRadius: '3px', background: progress >= 100 ? 'var(--success)' : 'var(--accent)', transition: 'width 0.3s ease' }} />
                                                        </div>
                                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '36px' }}>{progress}%</span>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>—</span>
                                                )}
                                            </td>
                                            <td><span className={`badge ${statusBadge(c.status)}`}>{c.status?.replace('_', ' ')}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button className="btn btn--primary btn--sm" onClick={() => navigate(`/my-contribution/${c.id}`)}>
                                                        Details
                                                    </button>
                                                    {c.status !== 'COMPLETED' && c.campaignStatus === 'ACTIVE' && (
                                                        <button className="btn btn--success btn--sm" onClick={() => openPayModal(c)}>
                                                            💳 Pay
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <p>No contribution campaigns found for your apartment</p>
                    </div>
                )}
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={totalElements}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                />
            </div>

            {/* Pay Modal */}
            {showPayModal && selectedContribution && (
                <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Contribute to Campaign</h2>
                            <button className="modal-close" onClick={() => setShowPayModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                <span className={`badge ${typeBadge(selectedContribution.type)}`} style={{ fontSize: '13px', padding: '5px 16px' }}>
                                    {selectedContribution.type}
                                </span>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Campaign</label>
                                <input className="form-input form-input--readonly" value={selectedContribution.campaignTitle} readOnly disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Currently Collected</label>
                                <input className="form-input form-input--readonly" value={formatCurrency(selectedContribution.collectedAmount)} readOnly disabled />
                            </div>
                            {selectedContribution.requiredAmount && (
                                <div className="form-group">
                                    <label className="form-label">Required Amount</label>
                                    <input className="form-input form-input--readonly" value={formatCurrency(selectedContribution.requiredAmount)} readOnly disabled />
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Amount to Contribute (VND)</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    value={payAmount}
                                    onChange={e => setPayAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    min="1"
                                />
                            </div>
                            {selectedContribution.type === 'MANDATORY' && selectedContribution.requiredAmount && (
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '-8px' }}>
                                    Remaining: {formatCurrency(Math.max(0, selectedContribution.requiredAmount - (selectedContribution.collectedAmount || 0)))}
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
