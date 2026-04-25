import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { SkeletonProfile } from '../components/LoadingSkeleton';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function ProfilePage({ user, setUser }) {
    const toast = useToast();
    const [profile, setProfile] = useState({
        fullName: '', email: '', phoneNumber: '',
        identityCardNumber: '', apartmentNumber: '', avatarUrl: '',
    });
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/users/me`);
            const data = res.data;
            setProfile({
                fullName: data.fullName || '', email: data.email || '',
                phoneNumber: data.phoneNumber || '', identityCardNumber: data.identityCardNumber || '',
                apartmentNumber: data.apartmentNumber || '', avatarUrl: data.avatarUrl || '',
            });
            setIsVerified(data.isVerified || data.verified || false);
        } catch (err) {
            console.error('Failed to fetch profile', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`${API_BASE}/api/users/profile`, {
                fullName: profile.fullName, email: profile.email, avatarUrl: profile.avatarUrl,
            });
            const data = res.data;
            setIsVerified(data.isVerified || data.verified || false);
            toast('Profile updated successfully!', 'success');
            setUser(prev => ({ ...prev, fullName: profile.fullName }));
        } catch (err) {
            toast('Failed to update profile', 'error');
        }
    };

    const handleSendVerification = async () => {
        if (!profile.email) {
            toast('Please enter your email first', 'error');
            return;
        }
        setVerifying(true);
        try {
            await axios.put(`${API_BASE}/api/users/profile`, {
                fullName: profile.fullName, email: profile.email, avatarUrl: profile.avatarUrl,
            });
            setIsVerified(false);
            const res = await axios.post(`${API_BASE}/api/users/send-verification`);
            toast(res.data.message || 'Verification email sent! Check your inbox.', 'success');
        } catch (err) {
            toast(err.response?.data?.error || 'Failed to send verification email', 'error');
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return <SkeletonProfile />;
    }

    const initial = (profile.fullName || user?.username || '?')[0].toUpperCase();

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">My Profile</h1>
                <p className="page-header__subtitle">Manage your personal information</p>
            </div>

            <div className="card profile-card">
                {/* Avatar */}
                <div className="profile-avatar">
                    {profile.avatarUrl
                        ? <img src={profile.avatarUrl} alt="avatar" />
                        : <span>{initial}</span>
                    }
                </div>

                <div className="profile-meta">
                    @{user?.username} ·{' '}
                    <span className={`badge ${isVerified ? 'badge--success' : 'badge--danger'}`}>
                        {isVerified ? '✓ Verified' : '✗ Not Verified'}
                    </span>
                </div>

                {/* Read-only section */}
                <div className="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Identity Information
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">Phone Number <span className="badge badge--lock">locked</span></label>
                    <input className="form-input form-input--readonly" value={profile.phoneNumber} readOnly disabled />
                </div>
                <div className="form-group">
                    <label className="form-label form-label--with-badge">Identity Card (CCCD) <span className="badge badge--lock">locked</span></label>
                    <input className="form-input form-input--readonly" value={profile.identityCardNumber} readOnly disabled />
                </div>
                {profile.apartmentNumber && (
                    <div className="form-group">
                        <label className="form-label form-label--with-badge">Apartment <span className="badge badge--lock">locked</span></label>
                        <input className="form-input form-input--readonly"
                            value={`Room ${profile.apartmentNumber} (Floor ${profile.apartmentNumber[0]})`} readOnly disabled />
                    </div>
                )}

                {/* Editable section */}
                <div className="section-title" style={{ marginTop: '28px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Editable Information
                </div>

                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-input" value={profile.fullName}
                            onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                            placeholder="Enter your full name" />
                    </div>
                    <div className="form-group">
                        <label className="form-label form-label--with-badge">
                            Email
                            {!isVerified && profile.email && (
                                <button type="button" className="btn btn--warning btn--sm"
                                    onClick={handleSendVerification} disabled={verifying}>
                                    {verifying ? 'Sending…' : 'Verify Email'}
                                </button>
                            )}
                        </label>
                        <input className="form-input" type="email" value={profile.email}
                            onChange={e => setProfile({ ...profile, email: e.target.value })}
                            placeholder="Enter your email" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Avatar URL</label>
                        <input className="form-input" value={profile.avatarUrl}
                            onChange={e => setProfile({ ...profile, avatarUrl: e.target.value })}
                            placeholder="Paste an image URL" />
                    </div>
                    <button type="submit" className="btn btn--primary">Save Changes</button>
                </form>
            </div>
        </>
    );
}
