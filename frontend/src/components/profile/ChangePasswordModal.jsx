import { useState } from 'react';
import axios from 'axios';
import Modal from '../ui/Modal';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function ChangePasswordModal({ onSuccess, onCancel, toast }) {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.currentPassword.trim()) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!formData.newPassword.trim()) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'New password must be at least 6 characters';
        }

        if (!formData.confirmPassword.trim()) {
            newErrors.confirmPassword = 'Confirm password is required';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (formData.currentPassword === formData.newPassword) {
            newErrors.newPassword = 'New password must be different from current password';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await axios.patch(`${API_BASE}/api/users/me/change-password`, {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword,
            });

            toast('Password changed successfully!', 'success');
            onSuccess();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to change password';
            toast(errorMsg, 'error');
            console.error('Error changing password:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleCancel = () => {
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setErrors({});
        onCancel();
    };

    return (
        <Modal
            title="Change Password"
            onConfirm={handleSubmit}
            onCancel={handleCancel}
            confirmText={loading ? 'Changing...' : 'Confirm'}
            confirmVariant="btn--primary"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input
                        type="password"
                        className={`form-input ${errors.currentPassword ? 'form-input--error' : ''}`}
                        value={formData.currentPassword}
                        onChange={e => handleChange('currentPassword', e.target.value)}
                        placeholder="Enter your current password"
                        disabled={loading}
                    />
                    {errors.currentPassword && (
                        <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                            {errors.currentPassword}
                        </p>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                        type="password"
                        className={`form-input ${errors.newPassword ? 'form-input--error' : ''}`}
                        value={formData.newPassword}
                        onChange={e => handleChange('newPassword', e.target.value)}
                        placeholder="Enter your new password"
                        disabled={loading}
                    />
                    {errors.newPassword && (
                        <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                            {errors.newPassword}
                        </p>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input
                        type="password"
                        className={`form-input ${errors.confirmPassword ? 'form-input--error' : ''}`}
                        value={formData.confirmPassword}
                        onChange={e => handleChange('confirmPassword', e.target.value)}
                        placeholder="Confirm your new password"
                        disabled={loading}
                    />
                    {errors.confirmPassword && (
                        <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                            {errors.confirmPassword}
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    );
}
