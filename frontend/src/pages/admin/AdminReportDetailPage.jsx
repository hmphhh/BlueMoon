import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function AdminReportDetailPage() {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewAction, setReviewAction] = useState('');
    const [reviewNote, setReviewNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [reportId]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/reports/${reportId}`);
            setReport(res.data);
        } catch (err) {
            console.error(err);
            toast('Failed to load report', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openReview = (action) => {
        setReviewAction(action);
        setReviewNote('');
        setShowReviewModal(true);
    };

    const handleReview = async () => {
        try {
            setSubmitting(true);
            const res = await axios.patch(`${API_BASE}/api/reports/${reportId}/review`, {
                status: reviewAction,
                reviewNote: reviewNote
            });
            setReport(res.data);
            setShowReviewModal(false);
            toast(`Report ${reviewAction.toLowerCase()} successfully!`, 'success');
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.error || 'Failed to review report', 'error');
        } finally {
            setSubmitting(false);
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
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
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
                        onClick={() => navigate('/admin-reports')}
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
                    {isPending && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn--success btn--sm" style={{ background: 'var(--success-bg)', color: 'var(--success)' }} onClick={() => openReview('APPROVED')}>
                                ✓ Approve
                            </button>
                            <button className="btn btn--danger btn--sm" onClick={() => openReview('REJECTED')}>
                                ✕ Reject
                            </button>
                        </div>
                    )}
                </div>

                {/* Reporter Information */}
                <div className="section-title" style={{ marginTop: 0 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Reporter Information
                </div>

                <div className="detail-grid" style={{ marginBottom: '24px' }}>
                    <div>
                        <div className="form-label">Name</div>
                        <div style={{ fontWeight: 600 }}>{report.createdBy?.fullName || '—'}</div>
                        {report.createdByApartmentNumber && (
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Room {report.createdByApartmentNumber}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="form-label">Created At</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{formatDate(report.createdAt)}</div>
                    </div>
                </div>

                {/* Report Content */}
                <div className="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    Report Content
                </div>

                <div style={{ marginBottom: '8px' }}>
                    <div className="form-label">Title</div>
                    <div style={{ fontWeight: 600, fontSize: '16px' }}>{report.title}</div>
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
                                <div className="form-label">Reviewed By</div>
                                <div>{report.reviewedBy?.fullName || '—'}</div>
                            </div>
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
            </div>

            {/* Review Modal */}
            {showReviewModal && (
                <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{reviewAction === 'APPROVED' ? 'Approve' : 'Reject'} Report</h2>
                            <button className="modal-close" onClick={() => setShowReviewModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                                You are about to {reviewAction === 'APPROVED' ? 'approve' : 'reject'} this report:
                                <strong style={{ display: 'block', marginTop: '8px', color: 'var(--text-primary)' }}>
                                    "{report.title}"
                                </strong>
                            </p>
                            <div className="form-group">
                                <label className="form-label">Review Note (optional)</label>
                                <textarea
                                    className="form-input"
                                    placeholder="Add a note about your decision..."
                                    rows={4}
                                    value={reviewNote}
                                    onChange={e => setReviewNote(e.target.value)}
                                    style={{ resize: 'vertical', minHeight: '100px' }}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowReviewModal(false)}>
                                Cancel
                            </button>
                            <button
                                className={`btn ${reviewAction === 'APPROVED' ? 'btn--primary' : 'btn--danger'}`}
                                onClick={handleReview}
                                disabled={submitting}
                            >
                                {submitting ? 'Processing...' : (reviewAction === 'APPROVED' ? 'Approve' : 'Reject')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
