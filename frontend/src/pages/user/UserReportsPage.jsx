import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function UserReportsPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', content: '' });
    const [submitting, setSubmitting] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        fetchReports();
    }, [activeTab]);

    // Auto-open create modal if navigated with ?create=true
    useEffect(() => {
        if (searchParams.get('create') === 'true') {
            setShowCreateModal(true);
            // Clean up the URL param so refreshing doesn't re-open
            searchParams.delete('create');
            setSearchParams(searchParams, { replace: true });
        }
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            let url = `${API_BASE}/api/reports/me`;
            if (activeTab !== 'ALL') {
                url += `?status=${activeTab}`;
            }
            const res = await axios.get(url);
            setReports(res.data || []);
        } catch (err) {
            console.error(err);
            toast('Failed to load reports', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            toast('Please fill in both title and content', 'error');
            return;
        }
        try {
            setSubmitting(true);
            await axios.post(`${API_BASE}/api/reports`, formData);
            toast('Report submitted successfully!', 'success');
            setShowCreateModal(false);
            setFormData({ title: '', content: '' });
            fetchReports();
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.error || 'Failed to submit report', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const tabs = [
        { key: 'ALL', label: 'All' },
        { key: 'PENDING', label: 'Pending' },
        { key: 'APPROVED', label: 'Approved' },
        { key: 'REJECTED', label: 'Rejected' },
    ];

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'APPROVED': return 'badge--success';
            case 'REJECTED': return 'badge--danger';
            case 'PENDING': return 'badge--warning';
            default: return 'badge--secondary';
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">My Reports</h1>
                <p className="page-header__subtitle">Submit and track your reports</p>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>Reports ({reports.length})</h2>
                    <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
                        + New Report
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid var(--border-color, #333)' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                padding: '10px 24px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                                border: 'none', background: 'none',
                                color: activeTab === tab.key ? 'var(--primary, #7c6ef0)' : 'var(--text-muted, #888)',
                                borderBottom: activeTab === tab.key ? '2px solid var(--primary, #7c6ef0)' : '2px solid transparent',
                                marginBottom: '-2px', transition: 'all 0.2s ease'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Reports List */}
                {loading ? (
                    <div className="empty-state"><p>Loading...</p></div>
                ) : reports.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map(r => (
                                <tr key={r.id}>
                                    <td><strong>{r.title}</strong></td>
                                    <td>
                                        <span className={`badge ${getStatusBadgeClass(r.status)}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{formatDate(r.createdAt)}</td>
                                    <td>
                                        <button
                                            className="btn btn--primary btn--sm"
                                            onClick={() => navigate(`/report/${r.id}`)}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        <p>No reports found. Click "New Report" to create one.</p>
                    </div>
                )}
            </div>

            {/* Create Report Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>New Report</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. Water leakage in bathroom"
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    placeholder="Describe the issue in detail..."
                                    rows={5}
                                    value={formData.content}
                                    onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                    style={{ resize: 'vertical', minHeight: '120px' }}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn--primary" onClick={handleCreate} disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
