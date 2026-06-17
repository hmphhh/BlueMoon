import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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

export default function AdminCampaignManagementPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Create/Edit modal
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        title: '', description: '', contributionType: 'MANDATORY',
        startDate: '', endDate: '', requiredAmount: '', targetAmount: ''
    });

    useEffect(() => {
        fetchCampaigns();
    }, [statusFilter, typeFilter]);

    const fetchCampaigns = async () => {
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (typeFilter) params.contributionType = typeFilter;
            const res = await axios.get(`${API_BASE}/api/contribution-campaigns`, { params });
            setCampaigns(res.data || []);
        } catch (err) {
            console.error(err);
            toast('Failed to load campaigns', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingId(null);
        setForm({
            title: '', description: '', contributionType: 'MANDATORY',
            startDate: '', endDate: '', requiredAmount: '', targetAmount: ''
        });
        setShowModal(true);
    };

    const openEditModal = async (id) => {
        try {
            const res = await axios.get(`${API_BASE}/api/contribution-campaigns/${id}`);
            const c = res.data;
            setEditingId(id);
            setForm({
                title: c.title || '',
                description: c.description || '',
                contributionType: c.contributionType || 'MANDATORY',
                startDate: c.startDate || '',
                endDate: c.endDate || '',
                requiredAmount: c.requiredAmount ?? '',
                targetAmount: c.targetAmount ?? ''
            });
            setShowModal(true);
        } catch (err) {
            toast('Failed to load campaign details', 'error');
        }
    };

    const handleSave = async () => {
        if (!form.title || !form.startDate || !form.endDate) {
            toast('Please fill in title, start date, and end date', 'error');
            return;
        }
        const payload = {
            title: form.title,
            description: form.description || null,
            startDate: form.startDate,
            endDate: form.endDate,
            requiredAmount: form.requiredAmount ? Number(form.requiredAmount) : null,
            targetAmount: form.targetAmount ? Number(form.targetAmount) : null
        };

        try {
            if (editingId) {
                await axios.put(`${API_BASE}/api/contribution-campaigns/${editingId}`, payload);
                toast('Campaign updated successfully!', 'success');
            } else {
                payload.contributionType = form.contributionType;
                await axios.post(`${API_BASE}/api/contribution-campaigns`, payload);
                toast('Campaign created successfully!', 'success');
            }
            setShowModal(false);
            fetchCampaigns();
        } catch (err) {
            toast(err.response?.data?.error || err.response?.data?.message || 'Failed to save campaign', 'error');
        }
    };

    const handleLaunch = async (id) => {
        if (!window.confirm('Launch this campaign? ApartmentContribution records will be generated for all apartments. This cannot be undone.')) return;
        try {
            await axios.post(`${API_BASE}/api/contribution-campaigns/${id}/launch`);
            toast('Campaign launched successfully!', 'success');
            fetchCampaigns();
        } catch (err) {
            toast(err.response?.data?.error || err.response?.data?.message || 'Failed to launch campaign', 'error');
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this campaign?')) return;
        try {
            await axios.post(`${API_BASE}/api/contribution-campaigns/${id}/cancel`);
            toast('Campaign cancelled successfully!', 'success');
            fetchCampaigns();
        } catch (err) {
            toast(err.response?.data?.error || err.response?.data?.message || 'Failed to cancel campaign', 'error');
        }
    };

    const handleComplete = async (id) => {
        if (!window.confirm('Complete this campaign? No new contribution invoices will be allowed.')) return;
        try {
            await axios.post(`${API_BASE}/api/contribution-campaigns/${id}/complete`);
            toast('Campaign completed successfully!', 'success');
            fetchCampaigns();
        } catch (err) {
            toast(err.response?.data?.error || err.response?.data?.message || 'Failed to complete campaign', 'error');
        }
    };

    const draftCount = campaigns.filter(c => c.status === 'DRAFT').length;
    const activeCount = campaigns.filter(c => c.status === 'ACTIVE').length;
    const completedCount = campaigns.filter(c => c.status === 'COMPLETED').length;

    if (loading) {
        return <div className="page-header"><h1>Loading...</h1></div>;
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Campaign Management</h1>
                <p className="page-header__subtitle">Manage contribution campaigns</p>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--info-bg, rgba(59,130,246,0.1))', color: 'var(--info, #3b82f6)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </div>
                    <div className="stat-card__value">{draftCount}</div>
                    <div className="stat-card__label">Draft</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div className="stat-card__value">{activeCount}</div>
                    <div className="stat-card__label">Active</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    </div>
                    <div className="stat-card__value">{completedCount}</div>
                    <div className="stat-card__label">Completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <div className="stat-card__value">{campaigns.length}</div>
                    <div className="stat-card__label">Total</div>
                </div>
            </div>

            <div className="card">
                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select className="form-input" style={{ width: '160px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="DRAFT">Draft</option>
                            <option value="ACTIVE">Active</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELED">Canceled</option>
                        </select>
                        <select className="form-input" style={{ width: '160px' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                            <option value="">All Types</option>
                            <option value="MANDATORY">Mandatory</option>
                            <option value="VOLUNTARY">Voluntary</option>
                        </select>
                    </div>
                    <button className="btn btn--primary" onClick={openCreateModal}>
                        + Create Campaign
                    </button>
                </div>

                {/* Table */}
                {campaigns.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>STT</th>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Period</th>
                                    <th>Required</th>
                                    <th>Target</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((c, i) => (
                                    <tr key={c.id}>
                                        <td>{i + 1}</td>
                                        <td><strong>{c.title}</strong></td>
                                        <td><span className={`badge ${typeBadge(c.contributionType)}`}>{c.contributionType}</span></td>
                                        <td style={{ fontSize: '13px' }}>{c.startDate} → {c.endDate}</td>
                                        <td>{formatCurrency(c.requiredAmount)}</td>
                                        <td>{formatCurrency(c.targetAmount)}</td>
                                        <td><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                <button className="btn btn--primary btn--sm" onClick={() => navigate(`/admin-campaign/${c.id}`)}>
                                                    View
                                                </button>
                                                {c.status === 'DRAFT' && (
                                                    <>
                                                        <button className="btn btn--sm" style={{ background: 'var(--info-bg, rgba(59,130,246,0.1))', color: 'var(--info, #3b82f6)' }} onClick={() => openEditModal(c.id)}>
                                                            Edit
                                                        </button>
                                                        <button className="btn btn--success btn--sm" onClick={() => handleLaunch(c.id)}>
                                                            🚀 Launch
                                                        </button>
                                                        <button className="btn btn--danger btn--sm" onClick={() => handleCancel(c.id)}>
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {c.status === 'ACTIVE' && (
                                                    <button className="btn btn--sm" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }} onClick={() => handleComplete(c.id)}>
                                                        ✓ Complete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <p>No campaigns found</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? 'Edit Campaign' : 'Create Campaign'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input className="form-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Elevator Renovation Fund" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input className="form-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
                            </div>
                            {!editingId && (
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select className="form-input" value={form.contributionType} onChange={e => setForm(p => ({ ...p, contributionType: e.target.value, requiredAmount: e.target.value === 'VOLUNTARY' ? '' : p.requiredAmount }))}>
                                        <option value="MANDATORY">Mandatory</option>
                                        <option value="VOLUNTARY">Voluntary</option>
                                    </select>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Start Date</label>
                                    <input className="form-input" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">End Date</label>
                                    <input className="form-input" type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                                </div>
                            </div>
                            {(form.contributionType === 'MANDATORY' || editingId) && (
                                <div className="form-group">
                                    <label className="form-label">Required Amount per Apartment (VND)</label>
                                    <input className="form-input" type="number" value={form.requiredAmount} onChange={e => setForm(p => ({ ...p, requiredAmount: e.target.value }))} placeholder="500000" />
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Target Amount (VND) — Optional</label>
                                <input className="form-input" type="number" value={form.targetAmount} onChange={e => setForm(p => ({ ...p, targetAmount: e.target.value }))} placeholder="50000000" />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleSave}>{editingId ? 'Update' : 'Create'}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
