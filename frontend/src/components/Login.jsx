import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function Login({ setUser }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/api/auth/login`, { username, password });
            const userData = res.data;
            const serverRole = userData.role ? userData.role.trim().toUpperCase() : "USER";

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
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
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
                    <button className="btn btn--primary" type="submit" disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}