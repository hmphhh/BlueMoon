import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { SkeletonProfile } from '../components/LoadingSkeleton';
import OtpVerification from '../components/OtpVerification';
import ChangePasswordModal from '../components/ChangePasswordModal';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function ProfilePage({ user, setUser }) {
    const toast = useToast();
    const [accountInfo, setAccountInfo] = useState({
        username: '', phoneNumber: '', identityCardNumber: '',
        email: '', verified: false
    });
    const [personalInfo, setPersonalInfo] = useState({
        fullName: '', idNumber: '', dateOfBirth: '', gender: '', phone: '', relationship: '', status: ''
    });
    const [apartment, setApartment] = useState(null);
    const [resident, setResident] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/me`);
            const data = res.data;
            
            setAccountInfo({
                username: data.username || '',
                phoneNumber: data.phoneNumber || '',
                identityCardNumber: data.identityCardNumber || '',
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

    const handleSaveEmail = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                email: accountInfo.email,
                resident: null
            };
            
            const res = await axios.put(`${API_BASE}/api/me`, payload);
            const data = res.data;
            
            setAccountInfo(prev => ({
                ...prev,
                email: data.email || '',
                verified: data.verified || false
            }));
            
            toast('Email updated successfully!', 'success');
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.message || 'Failed to update email', 'error');
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

    if (loading) {
        return <SkeletonProfile />;
    }

    const initial = (personalInfo.fullName || user?.username || '?')[0].toUpperCase();

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">My Profile</h1>
                <p className="page-header__subtitle">View your account and personal information</p>
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

                {/* Account Information Section — Read-Only except Email */}
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
                    <input className="form-input form-input--readonly"
                        value={accountInfo.phoneNumber || accountInfo.username}
                        readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">
                        ID Number (CCCD) <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly"
                        value={accountInfo.identityCardNumber}
                        readOnly disabled />
                </div>

                <form onSubmit={handleSaveEmail}>
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
                    <button type="submit" className="btn btn--primary">Save Email</button>
                </form>

                {/* Personal Information Section — ALL Read-Only */}
                {resident ? (
                    <>
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
                            <input className="form-input form-input--readonly" value={personalInfo.fullName}
                                readOnly disabled />
                        </div>

                        <div className="form-group">
                            <label className="form-label form-label--with-badge">
                                Date of Birth <span className="badge badge--lock">locked</span>
                            </label>
                            <input className="form-input form-input--readonly" value={personalInfo.dateOfBirth}
                                readOnly disabled />
                        </div>

                        <div className="form-group">
                            <label className="form-label form-label--with-badge">
                                Gender <span className="badge badge--lock">locked</span>
                            </label>
                            <input className="form-input form-input--readonly" value={personalInfo.gender}
                                readOnly disabled />
                        </div>

                        <div className="form-group">
                            <label className="form-label form-label--with-badge">
                                Relationship <span className="badge badge--lock">locked</span>
                            </label>
                            <input className="form-input form-input--readonly" value={personalInfo.relationship}
                                readOnly disabled />
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
                    </>
                ) : (
                    <>
                        <div className="section-title" style={{ marginTop: '28px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            Personal Information
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                            No resident profile linked to this account.
                        </p>
                    </>
                )}

                {/* Bottom Actions */}
                <div style={{ marginTop: '28px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <button type="button" className="btn btn--secondary" onClick={() => setShowChangePasswordModal(true)}>
                        Change Password
                    </button>
                </div>
            </div>

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
