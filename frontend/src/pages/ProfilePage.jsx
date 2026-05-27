import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { SkeletonProfile } from '../components/LoadingSkeleton';
import OtpVerification from '../components/OtpVerification';
import ChangePasswordModal from '../components/ChangePasswordModal';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function ProfilePage({ user, setUser }) {
    const toast = useToast();
    const [accountInfo, setAccountInfo] = useState({ email: '', verified: false });
    const [personalInfo, setPersonalInfo] = useState({
        fullName: '', idNumber: '', dateOfBirth: '', gender: '', phone: '', relationship: '', status: ''
    });
    const [apartment, setApartment] = useState(null);
    const [resident, setResident] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showResidentLinkModal, setShowResidentLinkModal] = useState(false);
    const [residents, setResidents] = useState([]);
    const [showCreateResidentForm, setShowCreateResidentForm] = useState(false);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/me`);
            const data = res.data;
            
            setAccountInfo({
                email: data.email || '',
                verified: data.verified || false
            });

            if (data.resident) {
                setPersonalInfo({
                    fullName: data.resident.fullName || '',
                    idNumber: data.resident.idNumber || '',
                    dateOfBirth: data.resident.dateOfBirth || '',
                    gender: data.resident.gender || '',
                    phone: data.resident.phone || '',
                    relationship: data.resident.relationship || '',
                    status: data.resident.status || ''
                });
                if (data.resident.apartment) {
                    setApartment(data.resident.apartment);
                }
                setResident(data.resident);
            }
        } catch (err) {
            console.error('Failed to fetch profile', err);
            toast('Failed to load profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAccountInfo = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                email: accountInfo.email,
                resident: resident ? {
                    fullName: personalInfo.fullName,
                    dateOfBirth: personalInfo.dateOfBirth,
                    phone: personalInfo.phone,
                    gender: personalInfo.gender
                } : null
            };
            
            const res = await axios.put(`${API_BASE}/api/me`, payload);
            const data = res.data;
            
            setAccountInfo({
                email: data.email || '',
                verified: data.verified || false
            });
            
            toast('Account information updated successfully!', 'success');
        } catch (err) {
            console.error(err);
            toast('Failed to update account information', 'error');
        }
    };

    const handleSavePersonalInfo = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`${API_BASE}/api/me`, {
                email: accountInfo.email,
                resident: {
                    fullName: personalInfo.fullName,
                    dateOfBirth: personalInfo.dateOfBirth,
                    phone: personalInfo.phone,
                    gender: personalInfo.gender
                }
            });
            
            const data = res.data;
            if (data.resident) {
                setPersonalInfo({
                    fullName: data.resident.fullName || '',
                    idNumber: data.resident.idNumber || '',
                    dateOfBirth: data.resident.dateOfBirth || '',
                    gender: data.resident.gender || '',
                    phone: data.resident.phone || '',
                    relationship: data.resident.relationship || '',
                    status: data.resident.status || ''
                });
            }
            
            toast('Personal information updated successfully!', 'success');
        } catch (err) {
            console.error(err);
            toast('Failed to update personal information', 'error');
        }
    };

    const handleSendVerification = async () => {
        setVerifying(true);
        try {
            await axios.post(`${API_BASE}/api/me/send-verification`);
            toast('Verification code sent! Check your inbox.', 'success');
            setShowOtpModal(true);
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.error || 'Failed to send verification code', 'error');
        } finally {
            setVerifying(false);
        }
    };

    const handleOtpVerified = () => {
        setShowOtpModal(false);
        setAccountInfo(prev => ({ ...prev, verified: true }));
    };

    const handlePasswordChangeSuccess = () => {
        setShowChangePasswordModal(false);
    };

    // const handleShowResidentLink = async () => {
    //     try {
    //         const res = await axios.get(`${API_BASE}/api/residents`);
    //         setResidents(res.data || []);
    //         setShowResidentLinkModal(true);
    //     } catch (err) {
    //         console.error(err);
    //         toast('Failed to load residents', 'error');
    //     }
    // };

    // const handleLinkResident = async (residentId) => {
    //     try {
    //         const res = await axios.put(`${API_BASE}/api/me`, { residentId });
    //         const data = res.data;
            
    //         if (data.resident) {
    //             setPersonalInfo({
    //                 fullName: data.resident.fullName || '',
    //                 idNumber: data.resident.idNumber || '',
    //                 dateOfBirth: data.resident.dateOfBirth || '',
    //                 gender: data.resident.gender || '',
    //                 phone: data.resident.phone || '',
    //                 relationship: data.resident.relationship || '',
    //                 status: data.resident.status || ''
    //             });
    //             setResident(data.resident);
    //         }
            
    //         setShowResidentLinkModal(false);
    //         toast('Resident linked successfully!', 'success');
    //     } catch (err) {
    //         console.error(err);
    //         toast('Failed to link resident', 'error');
    //     }
    // };

    // const handleUnlinkResident = async () => {
    //     if (window.confirm('Are you sure you want to unlink your resident profile?')) {
    //         try {
    //             const res = await axios.put(`${API_BASE}/api/me`, { residentId: null });
    //             setPersonalInfo({
    //                 fullName: '', idNumber: '', dateOfBirth: '', gender: '', phone: '', relationship: '', status: ''
    //             });
    //             setResident(null);
    //             setApartment(null);
    //             toast('Resident unlinked successfully!', 'success');
    //         } catch (err) {
    //             console.error(err);
    //             toast('Failed to unlink resident', 'error');
    //         }
    //     }
    // };

    if (loading) {
        return <SkeletonProfile />;
    }

    const initial = (personalInfo.fullName || user?.username || '?')[0].toUpperCase();

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">My Profile</h1>
                <p className="page-header__subtitle">Manage your account and personal information</p>
            </div>

            <div className="card profile-card">
                {/* Avatar */}
                <div className="profile-avatar">
                    {personalInfo.fullName && resident
                        ? <span>{initial}</span>
                        : <span>{(user?.username || '?')[0].toUpperCase()}</span>
                    }
                </div>

                <div className="profile-meta">
                    @{user?.username} ·{' '}
                    <span className={`badge ${accountInfo.verified ? 'badge--success' : 'badge--danger'}`}>
                        {accountInfo.verified ? '✓ Verified' : '✗ Not Verified'}
                    </span>
                </div>

                {/* Account Information Section */}
                <div className="section-title" style={{ marginTop: '28px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                    </svg>
                    Account Information
                </div>

                <form onSubmit={handleSaveAccountInfo}>
                    <div className="form-group">
                        <label className="form-label form-label--with-badge">
                            Email
                            {!accountInfo.verified && accountInfo.email && (
                                <button type="button" className="btn btn--warning btn--sm"
                                    onClick={handleSendVerification} disabled={verifying}>
                                    {verifying ? 'Sending…' : 'Verify Email'}
                                </button>
                            )}
                        </label>
                        <input className="form-input" type="email" value={accountInfo.email}
                            onChange={e => setAccountInfo({ ...accountInfo, email: e.target.value })}
                            placeholder="Enter your email" />
                    </div>
                    <button type="submit" className="btn btn--primary">Save Account Info</button>
                </form>

                {/* Personal Information Section */}
                {resident ? (
                    <>
                        <div className="section-title" style={{ marginTop: '28px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            Personal Information
                        </div>

                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" value={personalInfo.fullName}
                                onChange={e => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                                placeholder="Enter your full name" />
                        </div>

                        <div className="form-group">
                            <label className="form-label form-label--with-badge">
                                ID Number <span className="badge badge--lock">locked</span>
                            </label>
                            <input className="form-input form-input--readonly" value={personalInfo.idNumber} readOnly disabled />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Date of Birth</label>
                            <input className="form-input" type="date" value={personalInfo.dateOfBirth}
                                onChange={e => setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Gender</label>
                            <select className="form-input" value={personalInfo.gender}
                                onChange={e => setPersonalInfo({ ...personalInfo, gender: e.target.value })}>
                                <option value="">Select gender</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input className="form-input" value={personalInfo.phone}
                                onChange={e => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                                placeholder="Enter your phone number" />
                        </div>

                        {apartment && (
                            <div className="form-group">
                                <label className="form-label form-label--with-badge">
                                    Apartment <span className="badge badge--lock">locked</span>
                                </label>
                                <input className="form-input form-input--readonly"
                                    value={`Room ${apartment.apartmentNumber}`} readOnly disabled />
                            </div>
                        )}

                        <button type="button" onClick={handleSavePersonalInfo} className="btn btn--primary">
                            Save Personal Info
                        </button>
                        {/* <button type="button" onClick={handleUnlinkResident} className="btn btn--danger" style={{ marginLeft: '8px' }}>
                            Unlink Resident Profile
                        </button> */}
                    </>
                ) : (
                    <>
                        <div className="section-title" style={{ marginTop: '28px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            Personal Information
                        </div>
                        {/* <div className="section-title" style={{ marginTop: '28px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14"/>
                            </svg>
                            Link Resident Profile
                        </div>
                        <p style={{ color: '#666', marginBottom: '16px' }}>
                            No resident profile linked. Link an existing resident profile or create a new one.
                        </p>
                        <button type="button" onClick={handleShowResidentLink} className="btn btn--primary">
                            Link Existing Resident
                        </button> */}
                    </>
                )}

                {/* Bottom Actions */}
                <div style={{ marginTop: '28px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <button type="button" className="btn btn--secondary" onClick={() => setShowChangePasswordModal(true)}>
                        Change Password
                    </button>
                </div>
            </div>

            {/* Resident Linking Modal
            {showResidentLinkModal && (
                <div className="modal-overlay" onClick={() => setShowResidentLinkModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Link Resident Profile</h2>
                            <button className="modal-close" onClick={() => setShowResidentLinkModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {residents.length > 0 ? (
                                <div className="residents-list">
                                    {residents.map(res => (
                                        <div key={res.id} className="resident-item" style={{
                                            padding: '12px', borderBottom: '1px solid #eee',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <div>
                                                <strong>{res.fullName}</strong><br />
                                                <small style={{ color: '#666' }}>ID: {res.idNumber}</small>
                                            </div>
                                            {!res.linked ? (
                                                <button className="btn btn--primary btn--sm" onClick={() => handleLinkResident(res.id)}>
                                                    Link
                                                </button>
                                            ) : (
                                                <span className="badge badge--info">Already Linked</span>
                                            )}
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
            )} */}

            {/* Change Password Modal */}
            {showChangePasswordModal && (
                <ChangePasswordModal
                    onSuccess={handlePasswordChangeSuccess}
                    onCancel={() => setShowChangePasswordModal(false)}
                    toast={toast}
                />
            )}

            {/* OTP Verification Modal */}
            {showOtpModal && (
                <OtpVerification
                    onVerified={handleOtpVerified}
                    onCancel={() => setShowOtpModal(false)}
                />
            )}
        </>
    );
}
