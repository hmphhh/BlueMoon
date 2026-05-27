import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { SkeletonProfile } from '../components/LoadingSkeleton';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function AdminAccountDetailPage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [accountData, setAccountData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showResidentLinkModal, setShowResidentLinkModal] = useState(false);
    const [residents, setResidents] = useState([]);

    useEffect(() => {
        fetchAccountDetails();
    }, [userId]);

    const fetchAccountDetails = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/users/${userId}`);
            setAccountData(res.data);
        } catch (err) {
            console.error(err);
            toast('Failed to load account details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleShowResidentLink = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/residents`);
            setResidents(res.data || []);
            setShowResidentLinkModal(true);
        } catch (err) {
            console.error(err);
            toast('Failed to load residents', 'error');
        }
    };

    const handleLinkResident = async (residentId) => {
        try {
            const res = await axios.put(`${API_BASE}/api/users/${userId}`, { residentId });
            setAccountData(res.data);
            setShowResidentLinkModal(false);
            toast('Resident linked successfully!', 'success');
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.message || 'Failed to link resident', 'error');
        }
    };

    const handleUnlinkResident = async () => {
        if (window.confirm('Are you sure you want to unlink this resident?')) {
            try {
                const res = await axios.put(`${API_BASE}/api/users/${userId}`, { residentId: null });
                setAccountData(res.data);
                toast('Resident unlinked successfully!', 'success');
            } catch (err) {
                console.error(err);
                toast('Failed to unlink resident', 'error');
            }
        }
    };

    if (loading) {
        return <SkeletonProfile />;
    }

    if (!accountData) {
        return (
            <div className="card">
                <p>Account not found</p>
                <button className="btn btn--primary" onClick={() => navigate('/accounts')}>
                    Back to Accounts
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Account Details</h1>
                <p className="page-header__subtitle">{accountData.id}</p>
            </div>

            <div className="card profile-card">
                <div className="profile-avatar">
                    <span>{(accountData.email || 'A')[0].toUpperCase()}</span>
                </div>

                <div className="profile-meta">
                    <strong>{accountData.id}</strong> ·{' '}
                    <span className={`badge ${accountData.verified ? 'badge--success' : 'badge--danger'}`}>
                        {accountData.verified ? '✓ Verified' : '✗ Not Verified'}
                    </span>
                    {accountData.role && (
                        <>
                            {' '}· <span className="badge">{accountData.role}</span>
                        </>
                    )}
                </div>

                {/* Account Information */}
                <div className="section-title" style={{ marginTop: '28px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                    </svg>
                    Account Information
                </div>

                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input form-input--readonly" value={accountData.email} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">
                        Role <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly" value={accountData.role} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">
                        Created <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly"
                        value={new Date(accountData.createdAt).toLocaleString()} readOnly disabled />
                </div>

                {/* Resident Information */}
                {accountData.resident ? (
                    <>
                        <div className="section-title" style={{ marginTop: '28px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            Resident Profile
                        </div>

                        <div className="form-group">
                            <label className="form-label form-label--with-badge">
                                Full Name <span className="badge badge--lock">locked</span>
                            </label>
                            <input className="form-input form-input--readonly" value={accountData.resident.fullName} readOnly disabled />
                        </div>

                        <div className="form-group">
                            <label className="form-label form-label--with-badge">
                                ID Number <span className="badge badge--lock">locked</span>
                            </label>
                            <input className="form-input form-input--readonly" value={accountData.resident.idNumber} readOnly disabled />
                        </div>

                        <div className="form-group">
                            <label className="form-label form-label--with-badge">
                                Phone <span className="badge badge--lock">locked</span>
                            </label>
                            <input className="form-input form-input--readonly" value={accountData.resident.phone} readOnly disabled />
                        </div>

                        <div className="form-group">
                            <label className="form-label form-label--with-badge">
                                Gender <span className="badge badge--lock">locked</span>
                            </label>
                            <input className="form-input form-input--readonly" value={accountData.resident.gender} readOnly disabled />
                        </div>

                        <div className="form-group">
                            <label className="form-label form-label--with-badge">
                                Relationship <span className="badge badge--lock">locked</span>
                            </label>
                            <input className="form-input form-input--readonly" value={accountData.resident.relationship} readOnly disabled />
                        </div>

                        <div className="form-group">
                            <label className="form-label form-label--with-badge">
                                Status <span className="badge badge--lock">locked</span>
                            </label>
                            <input className="form-input form-input--readonly" value={accountData.resident.status} readOnly disabled />
                        </div>

                        {accountData.resident.apartment && (
                            <div className="form-group">
                                <label className="form-label form-label--with-badge">
                                    Apartment <span className="badge badge--lock">locked</span>
                                </label>
                                <input className="form-input form-input--readonly"
                                    value={`Room ${accountData.resident.apartment.apartmentNumber}`} readOnly disabled />
                            </div>
                        )}

                        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                            <button className="btn btn--danger" onClick={handleUnlinkResident}>
                                Unlink Resident
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="section-title" style={{ marginTop: '28px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14"/>
                            </svg>
                            Link Resident Profile
                        </div>
                        <p style={{ color: '#666', marginBottom: '16px' }}>
                            No resident profile linked to this account.
                        </p>
                        {accountData.role === 'USER' && (
                            <button className="btn btn--primary" onClick={handleShowResidentLink}>
                                Link Resident
                            </button>
                        )}
                    </>
                )}

                <div style={{ marginTop: '28px' }}>
                    <button className="btn btn--secondary" onClick={() => navigate('/accounts')}>
                        Back to Accounts
                    </button>
                </div>
            </div>

            {/* Resident Linking Modal */}
            {showResidentLinkModal && (
                <div className="modal-overlay" onClick={() => setShowResidentLinkModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Link Resident Profile</h2>
                            <button className="modal-close" onClick={() => setShowResidentLinkModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {residents.filter(r => !r.linked).length > 0 ? (
                                <div className="residents-list">
                                    {residents.filter(r => !r.linked).map(resident => (
                                        <div key={resident.id} className="resident-item" style={{
                                            padding: '12px', borderBottom: '1px solid #eee',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <div>
                                                <strong>{resident.fullName}</strong><br />
                                                <small style={{ color: '#666' }}>ID: {resident.idNumber}</small>
                                            </div>
                                            <button className="btn btn--primary btn--sm" onClick={() => handleLinkResident(resident.id)}>
                                                Link
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No available residents to link.</p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowResidentLinkModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
