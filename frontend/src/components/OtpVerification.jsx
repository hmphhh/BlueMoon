import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from './Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
const RESEND_COOLDOWN = 15; // seconds

/**
 * Reusable OTP Verification Modal
 * @param {string} type - 'email-verification' or 'forgot-password'
 * @param {string} email - User email (required for forgot-password)
 * @param {function} onVerified - Callback when OTP is verified (receives token for forgot-password)
 * @param {function} onCancel - Callback when modal is cancelled
 */
export default function OtpVerification({ type = 'email-verification', email, onVerified, onCancel }) {
    const toast = useToast();
    const [otp, setOtp] = useState(Array(6).fill(''));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef([]);

    const isForgotPassword = type === 'forgot-password';
    const titleText = isForgotPassword ? 'Verify Your Email' : 'Check Your Email';
    const subtitleText = isForgotPassword
        ? `We've sent a 6-digit code to ${email || 'your email'}. Please enter it below.`
        : 'We\'ve sent a 6-digit verification code to your email address. Please enter it below.';
    const backText = isForgotPassword ? '← Go Back' : '← Back to Profile';

    // Auto-focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    // Countdown timer for resend
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
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

    const handleChange = (index, value) => {
        // Only allow single digits
        if (value && !/^\d$/.test(value)) return;

        setError('');
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input after entering a digit
        if (value && index < 5) {
            focusInput(index + 1);
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                // If current box is empty, go back and clear previous
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                focusInput(index - 1);
            } else {
                // Clear current box
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

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pastedData) return;

        const newOtp = [...otp];
        for (let i = 0; i < 6; i++) {
            newOtp[i] = pastedData[i] || '';
        }
        setOtp(newOtp);
        setError('');

        // Focus the next empty box or the last box
        const nextEmpty = newOtp.findIndex(d => !d);
        focusInput(nextEmpty === -1 ? 5 : nextEmpty);
    };

    const handleFocus = (index) => {
        inputRefs.current[index]?.select();
    };

    const handleSubmit = async () => {
        const code = otp.join('');
        if (code.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError('');
        try {
            if (isForgotPassword) {
                // Forgot password verification
                const res = await axios.post(`${API_BASE}/api/auth/forgot-password/verify`, {
                    email,
                    otp: code
                });
                toast('OTP verified successfully', 'success');
                onVerified?.(res.data.resetToken);
            } else {
                // Email verification
                await axios.post(`${API_BASE}/api/me/verify-otp`, { otp: code });
                toast('Email verified successfully!', 'success');
                onVerified?.();
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || err.response?.data?.message || 'Verification failed';
            setError(msg);
            setOtp(Array(6).fill(''));
            focusInput(0);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;

        setResendCooldown(RESEND_COOLDOWN);
        setError('');
        setOtp(Array(6).fill(''));

        try {
            if (isForgotPassword) {
                // Resend OTP for forgot password
                await axios.post(`${API_BASE}/api/auth/forgot-password/request`, { email });
                toast('New OTP sent to your email', 'success');
            } else {
                // Resend OTP for email verification
                await axios.post(`${API_BASE}/api/me/resend-otp`);
                toast('A new verification code has been sent', 'success');
            }
            focusInput(0);
        } catch (err) {
            console.error(err); 
            const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to resend code';
            setError(msg);
            setResendCooldown(0);
        }
    };

    const isComplete = otp.every(d => d !== '');

    return (
        <div className="otp-overlay" onClick={onCancel}>
            <div className="otp-modal" onClick={e => e.stopPropagation()}>
                {/* Header icon */}
                <div className="otp-modal__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <polyline points="3 7 12 13 21 7" />
                    </svg>
                </div>

                <h2 className="otp-modal__title">{titleText}</h2>
                <p className="otp-modal__subtitle">{subtitleText}</p>

                {/* OTP Input Strip */}
                <div className="otp-strip" onPaste={handlePaste}>
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => inputRefs.current[index] = el}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            className={`otp-strip__input ${digit ? 'otp-strip__input--filled' : ''} ${error ? 'otp-strip__input--error' : ''}`}
                            value={digit}
                            onChange={e => handleChange(index, e.target.value)}
                            onKeyDown={e => handleKeyDown(index, e)}
                            onFocus={() => handleFocus(index)}
                            autoComplete="one-time-code"
                            id={`otp-input-${index}`}
                        />
                    ))}
                </div>

                {/* Error message */}
                {error && (
                    <div className="otp-error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="m15 9-6 6M9 9l6 6" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Verify button */}
                <button
                    className="btn btn--primary otp-modal__verify-btn"
                    onClick={handleSubmit}
                    disabled={!isComplete || loading}
                    id="otp-verify-btn"
                >
                    {loading ? (
                        <span className="otp-spinner" />
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                            Verify Code
                        </>
                    )}
                </button>

                {/* Resend section */}
                <div className="otp-resend">
                    <span className="otp-resend__text">Didn't receive the code?</span>
                    <button
                        className="otp-resend__btn"
                        onClick={handleResend}
                        disabled={resendCooldown > 0}
                        id="otp-resend-btn"
                    >
                        {resendCooldown > 0
                            ? `Resend in ${resendCooldown}s`
                            : 'Resend Code'
                        }
                    </button>
                </div>

                {/* Cancel link */}
                <button className="otp-modal__cancel" onClick={onCancel} id="otp-cancel-btn">
                    {backText}
                </button>
            </div>
        </div>
    );
}
