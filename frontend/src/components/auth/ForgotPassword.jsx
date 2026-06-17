import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
const RESEND_COOLDOWN = 30; // seconds

export default function ForgotPassword() {
    const navigate = useNavigate();

    // Steps: 1 = enter username, 2 = enter OTP, 3 = new password, 4 = success
    const [step, setStep] = useState(1);
    const [username, setUsername] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');
    const [otp, setOtp] = useState(Array(6).fill(''));
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef([]);

    // Auto-focus first OTP input when entering step 2
    useEffect(() => {
        if (step === 2) {
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [step]);

    // Countdown timer for resend
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { clearInterval(timer); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const focusInput = useCallback((index) => {
        if (index >= 0 && index < 6) {
            inputRefs.current[index]?.focus();
            inputRefs.current[index]?.select();
        }
    }, []);

    // ── Step 1: Request OTP ──
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        if (!username.trim()) { setError('Please enter your username'); return; }

        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_BASE}/api/auth/forgot-password`, { username: username.trim() });
            // If response includes masked email, show it
            setMaskedEmail(res.data.maskedEmail || '');
            setResendCooldown(RESEND_COOLDOWN);
            setStep(2);
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to send reset code';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── OTP input handlers ──
    const handleOtpChange = (index, value) => {
        if (value && !/^\d$/.test(value)) return;
        setError('');
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) focusInput(index + 1);
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                focusInput(index - 1);
            } else {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
            e.preventDefault();
        } else if (e.key === 'ArrowLeft' && index > 0) {
            focusInput(index - 1);
            e.preventDefault();
        } else if (e.key === 'ArrowRight' && index < 5) {
            focusInput(index + 1);
            e.preventDefault();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pastedData) return;
        const newOtp = [...otp];
        for (let i = 0; i < 6; i++) newOtp[i] = pastedData[i] || '';
        setOtp(newOtp);
        setError('');
        const nextEmpty = newOtp.findIndex(d => !d);
        focusInput(nextEmpty === -1 ? 5 : nextEmpty);
    };

    // ── Step 2 → 3: Verify OTP + proceed to password ──
    const handleVerifyOtp = () => {
        const code = otp.join('');
        if (code.length !== 6) { setError('Please enter all 6 digits'); return; }
        setError('');
        setStep(3);
    };

    // ── Step 3: Reset password ──
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_BASE}/api/auth/reset-password`, {
                username: username.trim(),
                otp: otp.join(''),
                newPassword,
            });
            setStep(4);
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to reset password';
            setError(msg);
            // If OTP-related error, go back to step 2
            if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('code')) {
                setOtp(Array(6).fill(''));
                setStep(2);
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Resend OTP ──
    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setResendCooldown(RESEND_COOLDOWN);
        setError('');
        setOtp(Array(6).fill(''));
        try {
            await axios.post(`${API_BASE}/api/auth/forgot-password`, { username: username.trim() });
            focusInput(0);
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to resend code';
            setError(msg);
            setResendCooldown(0);
        }
    };

    const isOtpComplete = otp.every(d => d !== '');

    // ── Step indicators ──
    const steps = [
        { num: 1, label: 'Account' },
        { num: 2, label: 'Verify' },
        { num: 3, label: 'Reset' },
    ];

    return (
        <div className="login-page">
            <div className="forgot-card">
                {/* Logo */}
                <div className="login-card__logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                </div>

                {step < 4 && (
                    <>
                        <h1 className="login-card__title">Reset Password</h1>
                        <p className="login-card__subtitle">
                            {step === 1 && 'Enter your username to receive a reset code'}
                            {step === 2 && 'Enter the 6-digit code sent to your email'}
                            {step === 3 && 'Create your new password'}
                        </p>

                        {/* Step progress */}
                        <div className="forgot-steps">
                            {steps.map((s, i) => (
                                <div key={s.num} className="forgot-steps__item">
                                    <div className={`forgot-steps__circle ${step >= s.num ? 'forgot-steps__circle--active' : ''} ${step > s.num ? 'forgot-steps__circle--done' : ''}`}>
                                        {step > s.num ? (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <path d="M20 6L9 17l-5-5"/>
                                            </svg>
                                        ) : s.num}
                                    </div>
                                    <span className={`forgot-steps__label ${step >= s.num ? 'forgot-steps__label--active' : ''}`}>{s.label}</span>
                                    {i < steps.length - 1 && (
                                        <div className={`forgot-steps__line ${step > s.num ? 'forgot-steps__line--active' : ''}`}/>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Error */}
                {error && (
                    <div className="login-error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
                        </svg>
                        {error}
                    </div>
                )}

                {/* ── Step 1: Username ── */}
                {step === 1 && (
                    <form onSubmit={handleRequestOtp}>
                        <div className="forgot-input-group">
                            <div className="forgot-input-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                            <input
                                className="form-input forgot-input"
                                placeholder="Enter your username (phone number)"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                                autoFocus
                                id="forgot-username-input"
                            />
                        </div>
                        <button className="btn btn--primary forgot-btn" type="submit" disabled={loading} id="forgot-send-btn">
                            {loading ? (
                                <span className="otp-spinner"/>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                        <polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                    Send Reset Code
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* ── Step 2: OTP ── */}
                {step === 2 && (
                    <div className="forgot-otp-section">
                        {maskedEmail && (
                            <p className="forgot-email-hint">
                                Code sent to <strong>{maskedEmail}</strong>
                            </p>
                        )}

                        <div className="otp-strip" onPaste={handleOtpPaste}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => inputRefs.current[index] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className={`otp-strip__input ${digit ? 'otp-strip__input--filled' : ''} ${error ? 'otp-strip__input--error' : ''}`}
                                    value={digit}
                                    onChange={e => handleOtpChange(index, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(index, e)}
                                    onFocus={() => inputRefs.current[index]?.select()}
                                    autoComplete="one-time-code"
                                    id={`forgot-otp-input-${index}`}
                                />
                            ))}
                        </div>

                        <button
                            className="btn btn--primary forgot-btn"
                            onClick={handleVerifyOtp}
                            disabled={!isOtpComplete}
                            id="forgot-verify-btn"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5"/>
                            </svg>
                            Verify Code
                        </button>

                        <div className="otp-resend">
                            <span className="otp-resend__text">Didn't receive the code?</span>
                            <button
                                className="otp-resend__btn"
                                onClick={handleResend}
                                disabled={resendCooldown > 0}
                                id="forgot-resend-btn"
                            >
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 3: New Password ── */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword}>
                        <div className="forgot-input-group">
                            <div className="forgot-input-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                            </div>
                            <input
                                className="form-input forgot-input"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="New password (min. 6 characters)"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                autoFocus
                                id="forgot-new-password"
                            />
                            <button
                                type="button"
                                className="forgot-toggle-pw"
                                onClick={() => setShowPassword(v => !v)}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                        <path d="M1 1l22 22"/>
                                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                        <div className="forgot-input-group">
                            <div className="forgot-input-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 6L9 17l-5-5"/>
                                </svg>
                            </div>
                            <input
                                className="form-input forgot-input"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                id="forgot-confirm-password"
                            />
                        </div>

                        {/* Password strength indicator */}
                        {newPassword && (
                            <div className="forgot-pw-strength">
                                <div className="forgot-pw-strength__bar">
                                    <div className={`forgot-pw-strength__fill forgot-pw-strength--${getStrength(newPassword).level}`}
                                         style={{ width: `${getStrength(newPassword).percent}%` }}/>
                                </div>
                                <span className={`forgot-pw-strength__text forgot-pw-strength--${getStrength(newPassword).level}`}>
                                    {getStrength(newPassword).label}
                                </span>
                            </div>
                        )}

                        <button className="btn btn--primary forgot-btn" type="submit" disabled={loading} id="forgot-reset-btn">
                            {loading ? (
                                <span className="otp-spinner"/>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg>
                                    Reset Password
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* ── Step 4: Success ── */}
                {step === 4 && (
                    <div className="forgot-success">
                        <div className="forgot-success__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5"/>
                            </svg>
                        </div>
                        <h2 className="forgot-success__title">Password Reset!</h2>
                        <p className="forgot-success__text">
                            Your password has been successfully reset. You can now sign in with your new password.
                        </p>
                        <button
                            className="btn btn--primary forgot-btn"
                            onClick={() => navigate('/')}
                            id="forgot-go-login-btn"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                <polyline points="10 17 15 12 10 7"/>
                                <line x1="15" y1="12" x2="3" y2="12"/>
                            </svg>
                            Back to Sign In
                        </button>
                    </div>
                )}

                {/* Back to login link (except on success) */}
                {step < 4 && (
                    <button className="forgot-back" onClick={() => step === 1 ? navigate('/') : setStep(step - 1)} id="forgot-back-btn">
                        ← {step === 1 ? 'Back to Sign In' : 'Go Back'}
                    </button>
                )}
            </div>
        </div>
    );
}

/** Simple password strength calculator */
function getStrength(pw) {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { level: 'weak', label: 'Weak', percent: 20 };
    if (score <= 2) return { level: 'fair', label: 'Fair', percent: 40 };
    if (score <= 3) return { level: 'good', label: 'Good', percent: 65 };
    if (score <= 4) return { level: 'strong', label: 'Strong', percent: 85 };
    return { level: 'excellent', label: 'Excellent', percent: 100 };
}
