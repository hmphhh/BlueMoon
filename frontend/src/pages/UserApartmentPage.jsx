import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { SkeletonProfile } from '../components/LoadingSkeleton';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function UserApartmentPage() {
    const toast = useToast();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const formatType = (type) => {
        const map = {
            STUDIO: 'Studio',
            ONE_BEDROOM: '1 Bedroom',
            TWO_BEDROOM: '2 Bedroom',
            THREE_BEDROOM: '3 Bedroom',
            PENTHOUSE: 'Penthouse'
        };
        return map[type] || type || 'N/A';
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE': return 'badge--success';
            case 'TEMPORARILY_ABSENT': return 'badge--warning';
            case 'MOVED_OUT': return 'badge--danger';
            case 'OCCUPIED': return 'badge--success';
            case 'VACANT': return 'badge--warning';
            default: return 'badge--info';
        }
    };

    useEffect(() => {
        fetchApartment();
    }, []);

    const fetchApartment = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/apartments/me`);
            setData(res.data);
        } catch (err) {
            console.error(err);
            toast('Failed to load apartment information', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <SkeletonProfile />;

    if (!data) {
        return (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>You are not assigned to any apartment.</p>
            </div>
        );
    }

    const avatarChar = data.apartmentNumber?.charAt(0)?.toUpperCase() || 'A';

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">My Apartment</h1>
                <p className="page-header__subtitle">View your apartment details and members</p>
            </div>

            <div className="card profile-card">
                <div className="profile-avatar">
                    <span>{avatarChar}</span>
                </div>

                <div className="profile-meta">
                    <strong>{data.apartmentNumber}</strong> ·{' '}
                    <span className={`badge ${getStatusBadge(data.status)}`}>
                        {data.status}
                    </span>
                    {data.type && (
                        <>
                            {' '}· <span className="badge badge--info">{formatType(data.type)}</span>
                        </>
                    )}
                </div>

                {/* Apartment Information Section */}
                <div className="section-title" style={{ marginTop: '28px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Apartment Information
                </div>

                <div className="form-group">
                    <label className="form-label">Apartment Number</label>
                    <input className="form-input form-input--readonly" value={data.apartmentNumber || ''} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label">Floor</label>
                    <input className="form-input form-input--readonly" value={data.floor || ''} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label">Area</label>
                    <input className="form-input form-input--readonly" value={`${data.area || 0} m²`} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label">Type</label>
                    <input className="form-input form-input--readonly" value={formatType(data.type)} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label">Status</label>
                    <input className="form-input form-input--readonly" value={data.status || ''} readOnly disabled />
                </div>

                {/* Members Section */}
                <div className="section-title" style={{ marginTop: '28px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    Members ({data.userCount || 0})
                </div>

                {data.users?.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Full Name</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.users.map(user => (
                                    <tr key={user.id}>
                                        <td><strong>{user.fullName || '—'}</strong></td>
                                        <td>{user.phone || '—'}</td>
                                        <td>
                                            {user.status ? (
                                                <span className={`badge ${getStatusBadge(user.status)}`}>
                                                    {user.status}
                                                </span>
                                            ) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                        No members found.
                    </p>
                )}
            </div>
        </>
    );
}
