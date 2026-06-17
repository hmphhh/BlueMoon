import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { SkeletonProfile } from '../../components/ui/LoadingSkeleton';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function AdminResidentDetailPage() {
    const { residentId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [residentData, setResidentData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResidentDetails();
    }, [residentId]);

    const fetchResidentDetails = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/residents/${residentId}`);
            setResidentData(res.data);
        } catch (err) {
            console.error(err);
            toast('Failed to load resident details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE':
                return 'badge--success';
            case 'TEMPORARILY_ABSENT':
                return 'badge--warning';
            case 'MOVED_OUT':
                return 'badge--danger';
            default:
                return '';
        }
    };

    if (loading) {
        return <SkeletonProfile />;
    }

    if (!residentData) {
        return (
            <div className="card">
                <p>Resident not found</p>
                <button className="btn btn--primary" onClick={() => navigate('/apartments')}>
                    Back to Apartments
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Resident Details</h1>
                <p className="page-header__subtitle">{residentData.id}</p>
            </div>

            <div className="card profile-card">
                <div className="profile-avatar">
                    <span>{(residentData.fullName || 'R')[0].toUpperCase()}</span>
                </div>

                <div className="profile-meta">
                    <strong>{residentData.fullName}</strong> ·{' '}
                    <span className={`badge ${getStatusBadge(residentData.status)}`}>
                        {residentData.status}
                    </span>
                    {residentData.relationship && (
                        <>
                            {' '}· <span className="badge">{residentData.relationship}</span>
                        </>
                    )}
                </div>

                {/* Personal Information */}
                <div className="section-title" style={{ marginTop: '28px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    Personal Information
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">
                        Full Name <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly" value={residentData.fullName} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">
                        ID Number <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly" value={residentData.idNumber} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">
                        Phone <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly" value={residentData.phone} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">
                        Gender <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly" value={residentData.gender} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">
                        Relationship <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly" value={residentData.relationship} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">
                        Status <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly" value={residentData.status} readOnly disabled />
                </div>

                {/* Apartment Information */}
                {residentData.apartment && (
                    <>
                        <div className="section-title" style={{ marginTop: '28px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                                <path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/>
                                <path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/>
                            </svg>
                            Apartment Information
                        </div>

                        <div className="form-group">
                            <label className="form-label form-label--with-badge">
                                Apartment Number <span className="badge badge--lock">locked</span>
                            </label>
                            <input className="form-input form-input--readonly"
                                value={residentData.apartment.apartmentNumber} readOnly disabled />
                        </div>

                        <div style={{ marginTop: '12px' }}>
                            <button className="btn btn--ghost btn--sm" onClick={() => navigate(`/apartment/${residentData.apartment.id}`)}>
                                View Apartment
                            </button>
                        </div>
                    </>
                )}

                {/* Linked Account */}
                {residentData.account ? (
                    <>
                        <div className="section-title" style={{ marginTop: '28px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="1"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                            </svg>
                            Linked Account
                        </div>

                        <div className="form-group">
                            <label className="form-label form-label--with-badge">
                                Username <span className="badge badge--lock">locked</span>
                            </label>
                            <input className="form-input form-input--readonly" value={residentData.account.username} readOnly disabled />
                        </div>

                        <div className="form-group">
                            <label className="form-label form-label--with-badge">
                                Email <span className="badge badge--lock">locked</span>
                            </label>
                            <input className="form-input form-input--readonly" value={residentData.account.email} readOnly disabled />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Verified</label>
                            <span className={`badge ${residentData.account.verified ? 'badge--success' : 'badge--danger'}`}>
                                {residentData.account.verified ? '✓ Verified' : '✗ Not Verified'}
                            </span>
                        </div>

                        <div style={{ marginTop: '12px' }}>
                            <button className="btn btn--ghost btn--sm" onClick={() => navigate(`/account/${residentData.account.id}`)}>
                                View Account
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="section-title" style={{ marginTop: '28px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="1"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                            </svg>
                            Linked Account
                        </div>
                        <p style={{ color: 'var(--text-muted)' }}>
                            No account linked to this resident.
                        </p>
                    </>
                )}

                <div style={{ marginTop: '28px' }}>
                    <button className="btn btn--secondary" onClick={() => navigate(-1)}>
                        Back
                    </button>
                </div>
            </div>
        </>
    );
}
