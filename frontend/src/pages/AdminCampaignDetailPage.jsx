import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const formatCurrency = (amount) => {
    if (amount == null) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const statusBadge = (status) => {
    switch (status) {
        case 'DRAFT': return 'badge--info';
        case 'ACTIVE': return 'badge--success';
        case 'COMPLETED': return 'badge--secondary';
        case 'CANCELED': return 'badge--danger';
        case 'NOT_STARTED': return 'badge--warning';
        case 'STARTED': return 'badge--info';
        default: return 'badge--info';
    }
};

export default function AdminCampaignDetailPage() {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [campaign, setCampaign] = useState(null);
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contributionStatusFilter, setContributionStatusFilter] = useState('');

    useEffect(() => {
        fetchCampaign();
    }, [campaignId]);

    useEffect(() => {
        if (campaign && campaign.status !== 'DRAFT' && campaign.status !== 'CANCELED') {
            fetchContributions();
        }
    }, [campaign, contributionStatusFilter]);

    const fetchCampaign = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/contribution-campaigns/${campaignId}`);
            setCampaign(res.data);
        } catch (err) {
            toast('Failed to load campaign', 'error');
            navigate('/admin-campaigns');
        } finally {
            setLoading(false);
        }
    };

    const fetchContributions = async () => {
        try {
            const params = { campaignId };
            if (contributionStatusFilter) params.status = contributionStatusFilter;
            const res = await axios.get(`${API_BASE}/api/apartment-contributions`, { params });
            setContributions(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLaunch = async () => {
        if (!window.confirm('Launch this campaign? This will generate apartment contribution records.')) return;
        try {
            await axios.post(`${API_BASE}/api/contribution-campaigns/${campaignId}/launch`);
            toast('Campaign launched!', 'success');
            fetchCampaign();
        } catch (err) {
            toast(err.response?.data?.error || err.response?.data?.message || 'Failed to launch', 'error');
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Cancel this campaign?')) return;
        try {
            await axios.post(`${API_BASE}/api/contribution-campaigns/${campaignId}/cancel`);
            toast('Campaign cancelled!', 'success');
            fetchCampaign();
        } catch (err) {
            toast(err.response?.data?.error || err.response?.data?.message || 'Failed to cancel', 'error');
        }
    };

    const handleComplete = async () => {
        if (!window.confirm('Complete this campaign?')) return;
        try {
            await axios.post(`${API_BASE}/api/contribution-campaigns/${campaignId}/complete`);
            toast('Campaign completed!', 'success');
            fetchCampaign();
        } catch (err) {
            toast(err.response?.data?.error || err.response?.data?.message || 'Failed to complete', 'error');
        }
    };

    if (loading || !campaign) {
        return <div className="page-header"><h1>Loading...</h1></div>;
    }

    const completedCount = contributions.filter(c => c.status === 'COMPLETED').length;
    const startedCount = contributions.filter(c => c.status === 'STARTED').length;
    const totalCollected = contributions.reduce((sum, c) => sum + (c.collectedAmount || 0), 0);

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">{campaign.title}</h1>
                <p className="page-header__subtitle">
                    <span className={`badge ${statusBadge(campaign.status)}`} style={{ marginRight: '8px' }}>{campaign.status}</span>
                    <span className={`badge ${campaign.contributionType === 'MANDATORY' ? 'badge--warning' : 'badge--info'}`}>{campaign.contributionType}</span>
                </p>
            </div>

            {/* Campaign Info */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h2 style={{ marginTop: 0 }}>Campaign Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <div style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{campaign.description || 'No description'}</div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Period</label>
                        <div style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{campaign.startDate} → {campaign.endDate}</div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Required Amount</label>
                        <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>{formatCurrency(campaign.requiredAmount)}</div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Target Amount</label>
                        <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>{formatCurrency(campaign.targetAmount)}</div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Created By</label>
                        <div style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{campaign.createdBy?.fullName || '—'}</div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Created At</label>
                        <div style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{campaign.createdAt ? new Date(campaign.createdAt).toLocaleString() : '—'}</div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                    <button className="btn btn--secondary" onClick={() => navigate('/admin-campaigns')}>← Back</button>
                    {campaign.status === 'DRAFT' && (
                        <>
                            <button className="btn btn--success" onClick={handleLaunch}>🚀 Launch Campaign</button>
                            <button className="btn btn--danger" onClick={handleCancel}>Cancel Campaign</button>
                        </>
                    )}
                    {campaign.status === 'ACTIVE' && (
                        <button className="btn btn--primary" onClick={handleComplete}>✓ Complete Campaign</button>
                    )}
                </div>
            </div>

            {/* Contributions Section - only for ACTIVE/COMPLETED campaigns */}
            {(campaign.status === 'ACTIVE' || campaign.status === 'COMPLETED') && (
                <>
                    {/* Contribution Stats */}
                    <div className="stats-grid" style={{ marginBottom: '24px' }}>
                        <div className="stat-card">
                            <div className="stat-card__icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/></svg>
                            </div>
                            <div className="stat-card__value">{contributions.length}</div>
                            <div className="stat-card__label">Total Apartments</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            </div>
                            <div className="stat-card__value">{completedCount}</div>
                            <div className="stat-card__label">Completed</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__icon" style={{ background: 'var(--info-bg, rgba(59,130,246,0.1))', color: 'var(--info, #3b82f6)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                            </div>
                            <div className="stat-card__value">{startedCount}</div>
                            <div className="stat-card__label">In Progress</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </div>
                            <div className="stat-card__value">{formatCurrency(totalCollected)}</div>
                            <div className="stat-card__label">Total Collected</div>
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                            <h2 style={{ margin: 0 }}>Apartment Contributions</h2>
                            <select className="form-input" style={{ width: '180px' }} value={contributionStatusFilter} onChange={e => setContributionStatusFilter(e.target.value)}>
                                <option value="">All Status</option>
                                <option value="NOT_STARTED">Not Started</option>
                                <option value="STARTED">Started</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>

                        {contributions.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '50px' }}>STT</th>
                                            <th>Apartment</th>
                                            <th>Collected</th>
                                            {campaign.contributionType === 'MANDATORY' && <th>Required</th>}
                                            {campaign.contributionType === 'MANDATORY' && <th>Progress</th>}
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contributions.map((ac, i) => {
                                            const progress = campaign.contributionType === 'MANDATORY' && ac.requiredAmount
                                                ? Math.min(100, Math.round((ac.collectedAmount / ac.requiredAmount) * 100))
                                                : null;
                                            return (
                                                <tr key={ac.id}>
                                                    <td>{i + 1}</td>
                                                    <td><strong>Room {ac.apartmentNumber}</strong></td>
                                                    <td style={{ fontWeight: 600 }}>{formatCurrency(ac.collectedAmount)}</td>
                                                    {campaign.contributionType === 'MANDATORY' && <td>{formatCurrency(ac.requiredAmount)}</td>}
                                                    {campaign.contributionType === 'MANDATORY' && (
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--border)', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${progress}%`, height: '100%', borderRadius: '3px', background: progress >= 100 ? 'var(--success)' : 'var(--accent)', transition: 'width 0.3s ease' }} />
                                                                </div>
                                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '36px' }}>{progress}%</span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td><span className={`badge ${statusBadge(ac.status)}`}>{ac.status?.replace('_', ' ')}</span></td>
                                                    <td>
                                                        <button className="btn btn--primary btn--sm" onClick={() => navigate(`/admin-contribution/${ac.id}`)}>
                                                            Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No contributions found</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
}
