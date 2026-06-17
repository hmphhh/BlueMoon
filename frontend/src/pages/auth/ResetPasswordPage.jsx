import { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

/**
 * Reset Password Page - Final step of forgot password flow
 * Receives resetToken from ForgotPasswordPage state
 */
export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();

    // Get reset token from navigation state
    const resetToken = location.state?.resetToken;

    // Redirect to forgot-password if no token
    if (!resetToken) {
        navigate('/forgot-password');
        return null;
    }

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await axios.post(`${API_BASE}/api/auth/forgot-password/reset`, {
                resetToken,
                newPassword
            });
            toast('Password reset successfully', 'success');
            navigate('/login');
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || 'Failed to reset password';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/forgot-password');
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-card__logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                </div>
                <h1 className="login-card__title">BlueMoon</h1>
                <p className="login-card__subtitle">Set your new password</p>

                {error && (
                    <div className="login-error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleReset}>
                    <div className="form-group">
                        <label htmlFor="new-password" className="form-label">New Password</label>
                        <div className="password-input-wrapper">
                            <input
                                id="new-password"
                                className="form-input"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                        <p className="form-hint">Must be at least 8 characters</p>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirm-password" className="form-label">Confirm Password</label>
                        <input
                            id="confirm-password"
                            className="form-input"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn--primary"
                            disabled={loading || !newPassword || !confirmPassword}
                        >
                            {loading ? 'Resetting…' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
