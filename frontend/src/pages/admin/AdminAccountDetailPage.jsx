import { useState, useEffect } from 'react';
import { isEnglishTextOnly } from '../../utils/inputFormatters';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { SkeletonProfile } from '../../components/ui/LoadingSkeleton';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function AdminAccountDetailPage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [accountData, setAccountData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [apartments, setApartments] = useState([]);
    const [editForm, setEditForm] = useState({});
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');

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

    const handleStartEdit = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/apartments`);
            setApartments(res.data || []);
        } catch (err) {
            console.error(err);
        }
        setEditForm({
            email: accountData.email || '',
            fullName: accountData.fullName || '',
            phone: accountData.phone || '',
            dateOfBirth: accountData.dateOfBirth || '',
            gender: accountData.gender || '',
            relationship: accountData.relationship || '',
            status: accountData.status || '',
            apartmentId: accountData.apartment?.id || ''
        });
        setEditing(true);
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            const payload = {};
            if (editForm.email !== (accountData.email || '')) payload.email = editForm.email;
            if (editForm.fullName !== (accountData.fullName || '')) payload.fullName = editForm.fullName;
            if (editForm.phone !== (accountData.phone || '')) payload.phone = editForm.phone;
            if (editForm.dateOfBirth !== (accountData.dateOfBirth || '')) payload.dateOfBirth = editForm.dateOfBirth;
            if (editForm.gender !== (accountData.gender || '')) payload.gender = editForm.gender;
            if (editForm.relationship !== (accountData.relationship || '')) payload.relationship = editForm.relationship;
            if (editForm.status !== (accountData.status || '')) payload.status = editForm.status;
            if (editForm.apartmentId && editForm.apartmentId !== (accountData.apartment?.id || '')) {
                payload.apartmentId = Number(editForm.apartmentId);
            }

            if (Object.keys(payload).length === 0) {
                toast('No changes to save', 'info');
                setSaving(false);
                return;
            }

            await axios.patch(`${API_BASE}/api/users/${userId}`, payload);
            toast('User updated successfully!', 'success');
            setEditing(false);
            fetchAccountDetails();
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.error || 'Failed to update user', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to permanently delete this user?')) {
            try {
                await axios.delete(`${API_BASE}/api/users/${userId}`);
                toast('User deleted successfully!', 'success');
                navigate('/accounts');
            } catch (err) {
                console.error(err);
                toast(err.response?.data?.error || 'Failed to delete user', 'error');
            }
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword.trim()) {
            toast('Please enter a new password', 'error');
            return;
        }
        try {
            await axios.patch(`${API_BASE}/api/users/${userId}/reset-password`, { password: newPassword });
            toast('Password reset successfully!', 'success');
            setShowResetPasswordModal(false);
            setNewPassword('');
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.error || 'Failed to reset password', 'error');
        }
    };

    if (loading) return <SkeletonProfile />;

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

    const isUserRole = accountData.role === 'USER';
    const avatarChar = (accountData.fullName || accountData.username || 'A')[0].toUpperCase();

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Account Details</h1>
            </div>

            <div className="card profile-card">
                <div className="profile-avatar">
                    <span>{avatarChar}</span>
                </div>

                <div className="profile-meta">
                    {/* <strong>{accountData.username}</strong> ·{' '} */}
                    <span className={`badge ${accountData.verified ? 'badge--success' : 'badge--danger'}`}>
                        {accountData.verified ? '✓ Verified' : '✗ Not Verified'}
                    </span>
                    {/* {accountData.role && (
                        <> · <span className="badge">{accountData.role}</span></>
                    )} */}
                </div>

                {/* Account Information */}
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
                    <input className="form-input form-input--readonly" value={accountData.phone || accountData.username || ''} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">
                        ID Number (CCCD) <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly" value={accountData.idNumber || '—'} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label">Email</label>
                    {editing ? (
                        <input className="form-input" value={editForm.email}
                            onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                    ) : (
                        <input className="form-input form-input--readonly" value={accountData.email || '—'} readOnly disabled />
                    )}
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
                        value={accountData.createdAt ? new Date(accountData.createdAt).toLocaleString() : '—'} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label">Full Name</label>
                    {editing ? (
                        <input className="form-input" value={editForm.fullName}
                            onChange={e => { if (isEnglishTextOnly(e.target.value)) setEditForm({ ...editForm, fullName: e.target.value }); }} />
                    ) : (
                        <input className="form-input form-input--readonly" value={accountData.fullName || '—'} readOnly disabled />
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    {editing ? (
                        <input className="form-input" type="date" value={editForm.dateOfBirth}
                            onChange={e => setEditForm({ ...editForm, dateOfBirth: e.target.value })} />
                    ) : (
                        <input className="form-input form-input--readonly" value={accountData.dateOfBirth || '—'} readOnly disabled />
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label">Gender</label>
                    {editing ? (
                        <select className="form-input" value={editForm.gender}
                            onChange={e => setEditForm({ ...editForm, gender: e.target.value })}>
                            <option value="">Select</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                        </select>
                    ) : (
                        <input className="form-input form-input--readonly" value={accountData.gender || '—'} readOnly disabled />
                    )}
                </div>

                {/* Resident Information — only for USER role */}
                {isUserRole && (
                    <>
                        <div className="section-title" style={{ marginTop: '28px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                            Resident Information
                        </div>

                        <div className="form-group">
                            <label className="form-label">Relationship</label>
                            {editing ? (
                                <select className="form-input" value={editForm.relationship}
                                    onChange={e => setEditForm({ ...editForm, relationship: e.target.value })}>
                                    <option value="">Select</option>
                                    <option value="OWNER">Owner</option>
                                    <option value="SPOUSE">Spouse</option>
                                    <option value="CHILD">Child</option>
                                    <option value="PARENT">Parent</option>
                                    <option value="SIBLING">Sibling</option>
                                    <option value="RELATIVE">Relative</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            ) : (
                                <input className="form-input form-input--readonly" value={accountData.relationship || '—'} readOnly disabled />
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Status</label>
                            {editing ? (
                                <select className="form-input" value={editForm.status}
                                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                                    <option value="ACTIVE">Active</option>
                                    <option value="TEMPORARILY_ABSENT">Temporarily Absent</option>
                                    <option value="MOVED_OUT">Moved Out</option>
                                </select>
                            ) : (
                                <input className="form-input form-input--readonly" value={accountData.status || '—'} readOnly disabled />
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Apartment</label>
                            {editing ? (
                                <select className="form-input" value={editForm.apartmentId || ''}
                                    onChange={e => setEditForm({ ...editForm, apartmentId: e.target.value })}>
                                    <option value="">Select Apartment</option>
                                    {[...apartments]
                                        .sort((a, b) => (a.floor - b.floor) || (a.apartmentNumber || '').localeCompare(b.apartmentNumber || ''))
                                        .map(apt => (
                                            <option key={apt.id} value={apt.id}>
                                                Room {apt.apartmentNumber} (Floor {apt.floor})
                                            </option>
                                        ))}
                                </select>
                            ) : (
                                <input className="form-input form-input--readonly"
                                    value={accountData.apartment ? `Room ${accountData.apartment.number}` : '—'} readOnly disabled />
                            )}
                        </div>
                    </>
                )}

                {/* Action Buttons */}
                <div style={{ marginTop: '28px', display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    {editing ? (
                        <>
                            <button className="btn btn--primary" onClick={handleSaveEdit} disabled={saving}>
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                            <button className="btn btn--secondary" onClick={() => setEditing(false)}>
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn--primary" onClick={handleStartEdit}>
                                Edit User
                            </button>
                            <button className="btn btn--warning" onClick={() => setShowResetPasswordModal(true)}>
                                Reset Password
                            </button>
                            <button className="btn btn--danger" onClick={handleDelete}>
                                Delete User
                            </button>
                        </>
                    )}
                </div>

                <div style={{ marginTop: '16px' }}>
                    <button className="btn btn--secondary" onClick={() => navigate('/accounts')}>
                        Back to Accounts
                    </button>
                </div>
            </div>

            {/* Reset Password Modal */}
            {showResetPasswordModal && (
                <div className="modal-overlay" onClick={() => setShowResetPasswordModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Reset Password</h2>
                            <button className="modal-close" onClick={() => setShowResetPasswordModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                ⓘ Set a new password for user <strong>{accountData.username}</strong>.
                            </p>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input className="form-input" type="password" placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowResetPasswordModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn--primary" onClick={handleResetPassword}>
                                Reset Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
