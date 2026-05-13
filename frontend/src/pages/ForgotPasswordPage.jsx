import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import OtpVerification from '../components/OtpVerification';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

/**
 * Forgot Password Page - Handles email request and OTP verification
 * After OTP verification, navigates to reset password page with reset token
 */
export default function ForgotPasswordPage() {
    const [step, setStep] = useState('email'); // 'email' or 'otp'
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const toast = useToast();

    // Step 1: Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await axios.post(`${API_BASE}/api/auth/forgot-password/request`, { email });
            toast('OTP sent to your email', 'success');
            setStep('otp'); // Move to OTP verification
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || 'Failed to send OTP. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Handle OTP verification and navigate to reset password
    const handleOtpVerified = (resetToken) => {
        toast('Email verified. Proceed to reset password.', 'success');
        // Navigate to reset password page with reset token
        navigate('/reset-password', { state: { resetToken } });
    };

    const handleCancel = () => {
        if (step === 'email') {
            navigate('/login');
        } else {
            setStep('email');
            setError('');
        }
    };

    // Step 1: Email Request Form
    if (step === 'email') {
        return (
            <div className="login-page">
                <div className="login-card">
                    <div className="login-card__logo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        </svg>
                    </div>
                    <h1 className="login-card__title">BlueMoon</h1>
                    <p className="login-card__subtitle">Reset your password</p>

                    {error && (
                        <div className="login-error">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSendOtp}>
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                            id="email"
                            className="form-input"
                            type="email"
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                        <p className="form-hint">
                            Enter the email address associated with your account. We'll send you a verification code.
                        </p>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={handleCancel}
                            >
                                Go Back
                            </button>
                            <button
                                className="btn btn--primary"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Sending OTP…' : 'Send OTP'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Step 2: OTP Verification Modal
    if (step === 'otp') {
        return (
            <OtpVerification
                type="forgot-password"
                email={email}
                onVerified={handleOtpVerified}
                onCancel={handleCancel}
            />
        );
    }
}
