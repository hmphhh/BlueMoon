import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function AdminPage({ user }) {
    const navigate = useNavigate();
    const toast = useToast();
    const [stats, setStats] = useState({ users: 0, apartments: 0, admins: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [usersRes, apartmentsRes] = await Promise.all([
                axios.get(`${API_BASE}/api/users`),
                axios.get(`${API_BASE}/api/apartments`)
            ]);

            const users = usersRes.data.content || [];
            const apartments = apartmentsRes.data || [];

            setStats({
                users: usersRes.data.totalElements || 0,
                apartments: apartments.length,
                admins: users.filter(u => u.role === 'ADMIN').length
            });
        } catch (err) {
            console.error('Failed to fetch stats', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Dashboard</h1>
                <p className="page-header__subtitle">Welcome back, {user.fullName}</p>
            </div>

            {/* Stats */}
            <div className="stats-grid stagger">
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--accent-bg)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <div className="stat-card__value">{stats.users}</div>
                    <div className="stat-card__label">Total Accounts</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--success-bg)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    </div>
                    <div className="stat-card__value">{stats.apartments}</div>
                    <div className="stat-card__label">Apartments</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'rgba(139,92,246,0.12)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    </div>
                    <div className="stat-card__value">{stats.admins}</div>
                    <div className="stat-card__label">Admins</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h2 style={{ marginBottom: '20px' }}>Quick Actions</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <button
                        className="btn btn--primary"
                        style={{ height: '48px', fontSize: '16px' }}
                        onClick={() => navigate('/accounts')}
                    >
                        Create Account
                    </button>
                    <button
                        className="btn btn--secondary"
                        style={{ height: '48px', fontSize: '16px' }}
                        onClick={() => navigate('/accounts')}
                    >
                        Manage Accounts
                    </button>
                </div>
            </div>
        </>
    );
}