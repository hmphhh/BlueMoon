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
        case 'NOT_STARTED': return 'badge--warning';
        case 'STARTED': return 'badge--info';
        case 'COMPLETED': return 'badge--success';
        default: return 'badge--info';
    }
};

export default function AdminContributionDetailPage() {
    const { contributionId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetail();
    }, [contributionId]);

    const fetchDetail = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/apartment-contributions/${contributionId}`);
            setDetail(res.data);
        } catch (err) {
            toast('Failed to load contribution details', 'error');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !detail) {
        return <div className="page-header"><h1>Loading...</h1></div>;
    }

    const progress = detail.requiredAmount
        ? Math.min(100, Math.round((detail.collectedAmount / detail.requiredAmount) * 100))
        : null;

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">
                    Room {detail.apartment?.apartmentNumber} — {detail.campaign?.title}
                </h1>
                <p className="page-header__subtitle">
                    <span className={`badge ${statusBadge(detail.status)}`}>{detail.status?.replace('_', ' ')}</span>
                </p>
            </div>

            {/* Overview Card */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h2 style={{ marginTop: 0 }}>Contribution Overview</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="form-group">
                        <label className="form-label">Campaign</label>
                        <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>{detail.campaign?.title}</div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <div><span className={`badge ${detail.campaign?.type === 'MANDATORY' ? 'badge--warning' : 'badge--info'}`}>{detail.campaign?.type}</span></div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Period</label>
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

                <button className="btn btn--secondary" onClick={() => navigate(-1)}>← Back</button>
            </div>

            {/* Contributors Table */}
            <div className="card">
                <h2 style={{ marginTop: 0 }}>Contributors</h2>
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
                        <p>No contributions yet</p>
                    </div>
                )}
            </div>
        </>
    );
}
