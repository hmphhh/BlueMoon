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
    const [showCreateResidentModal, setShowCreateResidentModal] = useState(false);
    const [apartments, setApartments] = useState([]);
    const [newResident, setNewResident] = useState({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        relationship: 'OWNER',
        apartmentId: null,
    });

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

    const handleUnlinkResident = async () => {
        if (window.confirm('Are you sure you want to unlink this resident? The resident profile will be deleted.')) {
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

    const handleShowCreateResident = async () => {
        try {
            const VALID_ROOMS = ['101','102','103','201','202','203','301','302','303','401','402','403'];
            const res = await axios.get(`${API_BASE}/api/apartments`);
            const validApts = (res.data || []).filter(apt =>
                VALID_ROOMS.includes(apt.number || apt.apartmentNumber)
            );
            setApartments(validApts);
            setNewResident({
                fullName: '',
                dateOfBirth: '',
                gender: '',
                relationship: 'OWNER',
                apartmentId: null,
            });
            setShowCreateResidentModal(true);
        } catch (err) {
            console.error(err);
            toast('Failed to load apartments', 'error');
        }
    };

    const handleCreateAndLinkResident = async () => {
        if (!newResident.fullName || !newResident.dateOfBirth || !newResident.gender || !newResident.apartmentId) {
            toast('Please fill in all required fields', 'error');
            return;
        }

        try {
            // Step 1: Create the resident (phone & idNumber are auto-filled from the user account)
            const residentRes = await axios.post(`${API_BASE}/api/residents`, {
                fullName: newResident.fullName,
                phone: accountData.phoneNumber || accountData.username,
                idNumber: accountData.identityCardNumber,
                dateOfBirth: newResident.dateOfBirth,
                gender: newResident.gender,
                relationship: newResident.relationship,
                apartmentId: newResident.apartmentId,
            });

            // Step 2: Link the new resident to the user
            const userRes = await axios.put(`${API_BASE}/api/users/${userId}`, {
                residentId: residentRes.data.id,
            });

            setAccountData(userRes.data);
            setShowCreateResidentModal(false);
            toast('Resident created and linked successfully!', 'success');
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.error || 'Failed to create and link resident', 'error');
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
                <p className="page-header__subtitle">{accountData.phoneNumber || accountData.username}</p>
            </div>

            <div className="card profile-card">
                <div className="profile-avatar">
                    <span>{(accountData.phoneNumber || accountData.username || 'A')[0].toUpperCase()}</span>
                </div>

                <div className="profile-meta">
                    <strong>{accountData.phoneNumber || accountData.username}</strong> ·{' '}
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
                    <label className="form-label form-label--with-badge">
                        Phone Number <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly" value={accountData.phoneNumber || accountData.username || ''} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">
                        ID Number (CCCD) <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly" value={accountData.identityCardNumber || ''} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input form-input--readonly" value={accountData.email || '—'} readOnly disabled />
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
                            Resident Profile
                        </div>
                        <p style={{ color: '#666', marginBottom: '16px' }}>
                            No resident profile linked to this account.
                        </p>
                        {accountData.role === 'USER' && (
                            <button className="btn btn--primary" onClick={handleShowCreateResident}>
                                + Create New Resident
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

            {/* Create & Link New Resident Modal */}
            {showCreateResidentModal && (
                <div className="modal-overlay" onClick={() => setShowCreateResidentModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create & Link New Resident</h2>
                            <button className="modal-close" onClick={() => setShowCreateResidentModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                ⓘ Phone and CCCD will be automatically inherited from the user account.
                            </p>

                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input className="form-input" placeholder="Full Name"
                                    value={newResident.fullName}
                                    onChange={e => setNewResident(prev => ({ ...prev, fullName: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Date of Birth</label>
                                <input className="form-input" type="date"
                                    value={newResident.dateOfBirth}
                                    onChange={e => setNewResident(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Gender</label>
                                <select className="form-input" value={newResident.gender}
                                    onChange={e => setNewResident(prev => ({ ...prev, gender: e.target.value }))}>
                                    <option value="">Select</option>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Relationship</label>
                                <select className="form-input" value={newResident.relationship}
                                    onChange={e => setNewResident(prev => ({ ...prev, relationship: e.target.value }))}>
                                    <option value="OWNER">Owner</option>
                                    <option value="SPOUSE">Spouse</option>
                                    <option value="CHILD">Child</option>
                                    <option value="PARENT">Parent</option>
                                    <option value="SIBLING">Sibling</option>
                                    <option value="RELATIVE">Relative</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Apartment</label>
                                <select className="form-input" value={newResident.apartmentId || ''}
                                    onChange={e => setNewResident(prev => ({ ...prev, apartmentId: e.target.value ? Number(e.target.value) : null }))}>
                                    <option value="">Select Apartment</option>
                                    {[...apartments]
                                        .sort((a, b) => (a.floor - b.floor) || (a.number || a.apartmentNumber || '').localeCompare(b.number || b.apartmentNumber || ''))
                                        .map(apt => (
                                        <option key={apt.id} value={apt.id}>
                                            Room {apt.number || apt.apartmentNumber} (Floor {apt.floor})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowCreateResidentModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn--primary" onClick={handleCreateAndLinkResident}>
                                Create & Link
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
