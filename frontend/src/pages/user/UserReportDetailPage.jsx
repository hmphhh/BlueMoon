import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function UserReportDetailPage() {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({ title: '', content: '' });
    const [saving, setSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [reportId]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/reports/${reportId}`);
            setReport(res.data);
            setEditData({ title: res.data.title, content: res.data.content });
        } catch (err) {
            console.error(err);
            toast('Failed to load report', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editData.title.trim() || !editData.content.trim()) {
            toast('Title and content cannot be empty', 'error');
            return;
        }
        try {
            setSaving(true);
            const res = await axios.patch(`${API_BASE}/api/reports/${reportId}`, editData);
            setReport(res.data);
            setEditing(false);
            toast('Report updated successfully!', 'success');
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.error || 'Failed to update report', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`${API_BASE}/api/reports/${reportId}`);
            toast('Report deleted successfully!', 'success');
            navigate('/reports');
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.error || 'Failed to delete report', 'error');
        } finally {
            setShowDeleteModal(false);
        }
    };

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

    if (loading) {
        return <div className="page-header"><h1>Loading...</h1></div>;
    }

    if (!report) {
        return <div className="page-header"><h1>Report not found</h1></div>;
    }

    const isPending = report.status === 'PENDING';

    return (
        <>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => navigate('/reports')}
                        style={{ padding: '6px 10px' }}
                    >
                        ← Back
                    </button>
                    <h1 className="page-header__title" style={{ marginBottom: 0 }}>Report Details</h1>
                </div>
                <p className="page-header__subtitle">Report #{report.id}</p>
            </div>

            <div className="card" style={{ maxWidth: '800px' }}>
                {/* Header with status and actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <span className={`badge ${getStatusBadgeClass(report.status)}`} style={{ fontSize: '13px', padding: '5px 14px' }}>
                        {report.status}
                    </span>
                    {isPending && !editing && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn--primary btn--sm" onClick={() => setEditing(true)}>
                                Edit
                            </button>
                            <button className="btn btn--danger btn--sm" onClick={() => setShowDeleteModal(true)}>
                                Delete
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                {editing ? (
                    <>
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input
                                className="form-input"
                                value={editData.title}
                                onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-input"
                                rows={6}
                                value={editData.content}
                                onChange={e => setEditData(prev => ({ ...prev, content: e.target.value }))}
                                style={{ resize: 'vertical', minHeight: '120px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button className="btn btn--secondary btn--sm" onClick={() => {
                                setEditing(false);
                                setEditData({ title: report.title, content: report.content });
                            }}>
                                Cancel
                            </button>
                            <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="section-title" style={{ marginTop: 0 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            Report Information
                        </div>

                        <div className="detail-grid" style={{ marginBottom: '24px' }}>
                            <div>
                                <div className="form-label">Title</div>
                                <div style={{ fontWeight: 600 }}>{report.title}</div>
                            </div>
                            <div>
                                <div className="form-label">Created At</div>
                                <div style={{ color: 'var(--text-secondary)' }}>{formatDate(report.createdAt)}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div className="form-label">Description</div>
                            <div style={{
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '14px',
                                lineHeight: '1.7',
                                color: 'var(--text-secondary)',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {report.content}
                            </div>
                        </div>

                        {/* Review information (shown when reviewed) */}
                        {report.status !== 'PENDING' && (
                            <>
                                <div className="section-title">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 11l3 3L22 4"/>
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                                    </svg>
                                    Review Information
                                </div>

                                <div className="detail-grid" style={{ marginBottom: '16px' }}>
                                    <div>
                                        <div className="form-label">Reviewed At</div>
                                        <div style={{ color: 'var(--text-secondary)' }}>{formatDate(report.reviewedAt)}</div>
                                    </div>
                                </div>

                                {report.reviewNote && (
                                    <div>
                                        <div className="form-label">Review Note</div>
                                        <div style={{
                                            background: report.status === 'APPROVED'
                                                ? 'var(--success-bg)'
                                                : 'var(--danger-bg)',
                                            border: `1px solid ${report.status === 'APPROVED' ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
                                            borderRadius: 'var(--radius-sm)',
                                            padding: '14px',
                                            lineHeight: '1.7',
                                            color: report.status === 'APPROVED' ? 'var(--success)' : 'var(--danger)',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {report.reviewNote}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__title">Delete Report</div>
                        <div className="modal__body">
                            Are you sure you want to delete this report? This action cannot be undone.
                        </div>
                        <div className="modal__actions">
                            <button className="btn btn--ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="btn btn--danger" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
