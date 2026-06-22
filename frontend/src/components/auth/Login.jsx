import { useState, useEffect, useRef } from 'react';
import { isDigitsOnly } from '../../utils/inputFormatters';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login({ setUser }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();
    const googleBtnRef = useRef(null);
    // Stable ref so GSI always invokes the latest version of the callback
    // without needing to re-initialize the library on every render.
    const credentialCallbackRef = useRef(null);

    // ─── Load Google Identity Services script and render the button ───────────
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return;

        const scriptId = 'google-identity-services';
        if (document.getElementById(scriptId)) {
            // Script already loaded (e.g. hot-reload), just re-render the button
            if (window.google?.accounts?.id) initGoogleButton();
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://accounts.google.com/gsi/client?hl=en';
        script.async = true;
        script.defer = true;
        script.onload = initGoogleButton;
        document.body.appendChild(script);

        return () => {
            // Cancel any pending credential prompt when component unmounts
            window.google?.accounts?.id?.cancel();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    function initGoogleButton() {
        if (!window.google?.accounts?.id || !googleBtnRef.current) return;

        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            // Wrap in a stable ref so GSI never holds a stale closure
            callback: (response) => credentialCallbackRef.current?.(response),
            ux_mode: 'popup',       // Always use popup; never redirect (redirect causes full page reload)
            cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 336,
            locale: 'en',
        });
    }

    // ─── Handle Google credential callback ────────────────────────────────────
    // Keep the ref in sync on every render so the stable GSI wrapper always
    // calls the latest function that closes over current state and setters.
    const handleGoogleCredential = async (response) => {
        setError('');
        setGoogleLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/api/auth/google-login`, {
                idToken: response.credential,
            });
            const userData = res.data;
            const serverRole = userData.role ? userData.role.trim().toUpperCase() : 'USER';

            if (userData.token) {
                localStorage.setItem('token', userData.token);
            }
            setUser({ ...userData, role: serverRole });

            if (serverRole === 'ADMIN') {
                navigate('/admin-panel');
            } else {
                navigate('/resident-home');
            }
        } catch (err) {
            const msg =
                err.response?.data?.error ||
                'Google Sign-In failed. Please try again or use your password.';
            setError(msg);
            // Prevent GSI from auto-retrying with the same cached credential
            window.google?.accounts?.id?.disableAutoSelect();
        } finally {
            setGoogleLoading(false);
        }
    };
    // Update the ref every render
    credentialCallbackRef.current = handleGoogleCredential;

    // ─── Normal password login ─────────────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/api/auth/login`, { username, password });
            const userData = res.data;
            const serverRole = userData.role ? userData.role.trim().toUpperCase() : 'USER';

            if (userData.token) {
                localStorage.setItem('token', userData.token);
            }

            setUser({ ...userData, role: serverRole });

            if (serverRole === 'ADMIN') {
                navigate('/admin-panel');
            } else {
                navigate('/resident-home');
            }
        } catch (err) {
            const msg = err.response?.data?.error || 'Invalid username or password';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <ThemeToggle className="login-theme-toggle" />
            <div className="login-card">
                <div className="login-card__logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                </div>
                <h1 className="login-card__title">BlueMoon</h1>
                <p className="login-card__subtitle">Sign in to your account</p>

                {error && (
                    <div className="login-error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <input
                        className="form-input"
                        type="text"
                        inputMode="numeric"
                        placeholder="Username"
                        value={username}
                        onChange={e => { if (isDigitsOnly(e.target.value)) setUsername(e.target.value); }}
                        required
                        autoComplete="username"
                    />
                    <input
                        className="form-input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />
                    <div className="login-form__footer">
                        <button
                            type="button"
                            className="btn btn--link"
                            onClick={() => navigate('/forgot-password')}
                        >
                            Forgot password?
                        </button>
                    </div>
                    <button className="btn btn--primary" type="submit" disabled={loading || googleLoading}>
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                {/* Google Sign-In — only shown when Client ID is configured */}
                {GOOGLE_CLIENT_ID && (
                    <>
                        <div className="login-divider">
                            <span className="login-divider__text">or</span>
                        </div>
                        <div
                            className="login-google-btn"
                            ref={googleBtnRef}
                            aria-label="Sign in with Google"
                        />
                    </>
                )}
            </div>
        </div>
    );
}