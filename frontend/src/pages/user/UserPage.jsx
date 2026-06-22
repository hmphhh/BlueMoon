import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const formatCurrency = (amount) => {
    if (amount == null) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function UserPage({ user }) {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUnpaidAmount: 0,
        unpaidBillsCount: 0,
        totalContribution: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [billsRes, contributionsRes] = await Promise.all([
                    axios.get(`${API_BASE}/api/bills/me`),
                    axios.get(`${API_BASE}/api/apartment-contributions/me`)
                ]);
                
                const bills = billsRes.data || [];
                const contributions = contributionsRes.data || [];

                const unpaidBills = bills.filter(b => b.status === 'UNPAID' || b.status === 'OVERDUE');
                const totalUnpaidAmount = unpaidBills.reduce((sum, b) => sum + (b.amount || 0), 0);
                const unpaidBillsCount = unpaidBills.length;

                const totalContribution = contributions.reduce((sum, c) => sum + (c.collectedAmount || 0), 0);

                setStats({ totalUnpaidAmount, unpaidBillsCount, totalContribution });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const features = [
        {
            title: 'View Bills',
            desc: 'Check your monthly bills and payment history',
            color: 'var(--accent)',
            bg: 'var(--accent-bg)',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
            action: () => navigate('/my-bills'),
        },
        {
            title: 'Pay Rent',
            desc: 'Make your rent payment online securely',
            color: 'var(--success)',
            bg: 'var(--success-bg)',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
            action: () => navigate('/my-invoices'),
        },
        {
            title: 'Report Problem',
            desc: 'Submit maintenance requests and issues',
            color: 'var(--warning)',
            bg: 'var(--warning-bg)',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
            action: () => navigate('/reports?create=true'),
        },
    ];

    return (
        <>
            <div className="dashboard-page-bg" />
            {/* Welcome hero */}
            <div className="welcome-hero">
                <div className="welcome-hero__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                </div>
                <div className="welcome-hero__text">
                    <h2>Welcome home, {user?.fullName || user?.username}!</h2>
                    <p>
                        {user?.apartmentNumber
                            ? `Room ${user.apartmentNumber} · Floor ${user.apartmentNumber[0]}`
                            : 'Your resident portal'}
                    </p>
                </div>
            </div>

            <div className="page-header">
                <h1 className="page-header__title">Dashboard Overview</h1>
                <p className="page-header__subtitle">Your financial summary</p>
            </div>

            {!loading && (
                <div className="stats-grid stagger" style={{ marginBottom: '32px' }}>
                    <div className="stat-card">
                        <div className="stat-card__icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        </div>
                        <div className="stat-card__value">{formatCurrency(stats.totalUnpaidAmount)}</div>
                        <div className="stat-card__label">Total Unpaid Amount</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card__icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div className="stat-card__value">{stats.unpaidBillsCount}</div>
                        <div className="stat-card__label">Unpaid Bills</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card__icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        </div>
                        <div className="stat-card__value">{formatCurrency(stats.totalContribution)}</div>
                        <div className="stat-card__label">Total Contribution Amount</div>
                    </div>
                </div>
            )}

            <div className="page-header">
                <h1 className="page-header__title">Quick Actions</h1>
                <p className="page-header__subtitle">Manage your apartment services</p>
            </div>

            <div className="features-grid stagger">
                {features.map(f => (
                    <div key={f.title} className="feature-card card--interactive"
                        style={{ '--hover-color': f.color, cursor: f.action ? 'pointer' : 'default' }}
                        onClick={f.action || undefined}>
                        {!f.action && <span className="badge badge--coming-soon">Coming Soon</span>}
                        <div className="feature-card__icon" style={{ background: f.bg, color: f.color }}>
                            {f.icon}
                        </div>
                        <div className="feature-card__title">{f.title}</div>
                        <div className="feature-card__desc">{f.desc}</div>
                    </div>
                ))}
            </div>
        </>
    );
}