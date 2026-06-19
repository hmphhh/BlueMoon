import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../components/ui/Toast';
import { SkeletonProfile } from '../../components/ui/LoadingSkeleton';
import OtpVerification from '../../components/auth/OtpVerification';
import ChangePasswordModal from '../../components/profile/ChangePasswordModal';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function ProfilePage({ user, setUser }) {
    const toast = useToast();
    const [profileData, setProfileData] = useState(null);
    const [editData, setEditData] = useState({
        email: '', fullName: '', phone: '', dateOfBirth: '', gender: '', relationship: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/users/me`);
            const data = res.data;
            setProfileData(data);
            setEditData({
                email: data.email || '',
                fullName: data.fullName || '',
                phone: data.phone || '',
                dateOfBirth: data.dateOfBirth || '',
                gender: data.gender || '',
                relationship: data.relationship || ''
            });
        } catch (err) {
            console.error('Failed to fetch profile', err);
            toast('Failed to load profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {};
            if (editData.email !== (profileData.email || '')) payload.email = editData.email;
            if (editData.fullName !== (profileData.fullName || '')) payload.fullName = editData.fullName;
            if (editData.phone !== (profileData.phone || '')) payload.phone = editData.phone;
            if (editData.dateOfBirth !== (profileData.dateOfBirth || '')) payload.dateOfBirth = editData.dateOfBirth;
            if (editData.gender !== (profileData.gender || '')) payload.gender = editData.gender;
            if (editData.relationship !== (profileData.relationship || '')) payload.relationship = editData.relationship;

            if (Object.keys(payload).length === 0) {
                toast('No changes to save', 'info');
                setSaving(false);
                return;
            }

            await axios.patch(`${API_BASE}/api/users/me`, payload);
            toast('Profile updated successfully!', 'success');
            fetchProfile(); // Refresh data
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.error || 'Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSendVerification = async () => {
        setVerifying(true);
        try {
            await axios.post(`${API_BASE}/api/users/me/send-verification`);
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
        setProfileData(prev => ({ ...prev, verified: true }));
    };

    const handlePasswordChangeSuccess = () => {
        setShowChangePasswordModal(false);
    };

    if (loading) {
        return <SkeletonProfile />;
    }

    const isAdmin = profileData?.role === 'ADMIN';
    const initial = (profileData?.fullName || profileData?.username || '?')[0].toUpperCase();

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">My Profile</h1>
            </div>

            <div className="card profile-card">
                {/* Avatar */}
                <div className="profile-avatar">
                    <span>{initial}</span>
                </div>

                <div className="profile-meta">
                    {/* {profileData?.phone || profileData?.username} ·{' '} */}
                    <span className={`badge ${profileData?.verified ? 'badge--success' : 'badge--danger'}`}>
                        {profileData?.verified ? '✓ Verified' : '✗ Not Verified'}
                    </span>
                    {/* {profileData?.role && (
                        <> · <span className="badge">{profileData.role}</span></>
                    )} */}
                </div>

                <form onSubmit={handleSaveProfile}>
                    {/* Account Information Section */}
                    <div className="section-title" style={{ marginTop: '28px' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="1" /><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                        </svg>
                        Account Information
                    </div>

                    <div className="form-group">
                        <label className="form-label form-label--with-badge">
                            Phone Number <span className="badge badge--lock">locked</span>
                        </label>
                        <input className="form-input form-input--readonly"
                            value={profileData?.phone || profileData?.username || ''} readOnly disabled />
                    </div>

                    <div className="form-group">
                        <label className="form-label form-label--with-badge">
                            ID Number (CCCD) <span className="badge badge--lock">locked</span>
                        </label>
                        <input className="form-input form-input--readonly"
                            value={profileData?.idNumber || '—'} readOnly disabled />
                    </div>

                    <div className="form-group">
                        <label className="form-label form-label--with-badge">
                            Email
                            {!profileData?.verified && profileData?.email && (
                                <button type="button" className="btn btn--warning btn--sm"
                                    onClick={handleSendVerification} disabled={verifying}>
                                    {verifying ? 'Sending…' : 'Verify Email'}
                                </button>
                            )}
                        </label>
                        <input className="form-input" type="email" value={editData.email}
                            onChange={e => setEditData({ ...editData, email: e.target.value })}
                            placeholder="Enter your email" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-input" value={editData.fullName}
                            onChange={e => setEditData({ ...editData, fullName: e.target.value })}
                            placeholder="Enter your full name" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <input className="form-input" type="date" value={editData.dateOfBirth}
                            onChange={e => setEditData({ ...editData, dateOfBirth: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select className="form-input" value={editData.gender}
                            onChange={e => setEditData({ ...editData, gender: e.target.value })}>
                            <option value="">Select</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    {!isAdmin && (
                        <>
                            {/* Resident Information Section */}
                            <div className="section-title" style={{ marginTop: '28px' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                </svg>
                                Resident Information
                            </div>

                            <div className="form-group">
                                <label className="form-label">Relationship</label>
                                <select className="form-input" value={editData.relationship}
                                    onChange={e => setEditData({ ...editData, relationship: e.target.value })}>
                                    <option value="">Select</option>
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
                                <label className="form-label form-label--with-badge">
                                    Status <span className="badge badge--lock">locked</span>
                                </label>
                                <input className="form-input form-input--readonly"
                                    value={profileData?.status || '—'} readOnly disabled />
                            </div>

                            {profileData?.apartment && (
                                <div className="form-group">
                                    <label className="form-label form-label--with-badge">
                                        Apartment <span className="badge badge--lock">locked</span>
                                    </label>
                                    <input className="form-input form-input--readonly"
                                        value={`Room ${profileData.apartment.number}`} readOnly disabled />
                                </div>
                            )}
                        </>
                    )}

                    <div style={{ marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button type="submit" className="btn btn--primary" disabled={saving}>
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button type="button" className="btn btn--secondary" onClick={() => setShowChangePasswordModal(true)}>
                            Change Password
                        </button>
                    </div>
                </form>
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
