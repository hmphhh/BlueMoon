import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const formatCurrency = (amount) => {
    if (amount == null) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */
export default function AdminPage({ user }) {
    const navigate = useNavigate();
    const toast = useToast();
    const [stats, setStats] = useState({ users: 0, apartments: 0, admins: 0, overdueBills: 0, unpaidBills: 0, pendingReports: 0, totalRevenue: 0 });
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [usersRes, apartmentsRes, billsRes, paymentsRes, reportsRes] = await Promise.all([
                axios.get(`${API_BASE}/api/users`),
                axios.get(`${API_BASE}/api/apartments`),
                axios.get(`${API_BASE}/api/bills`),
                axios.get(`${API_BASE}/api/payments`),
                axios.get(`${API_BASE}/api/reports?size=100`),
            ]);

            const users = usersRes.data.content || [];
            const apartments = apartmentsRes.data || [];
            const bills = billsRes.data || [];
            const payments = paymentsRes.data || [];
            const reports = reportsRes.data.content || [];

            const totalRevenue = payments
                .filter(p => p.status === 'SUCCESS')
                .reduce((sum, p) => sum + (p.amount || 0), 0);

            setStats({
                users: usersRes.data.totalElements || 0,
                apartments: apartments.length,
                admins: users.filter(u => u.role === 'ADMIN').length,
                overdueBills: bills.filter(b => b.status === 'OVERDUE').length,
                unpaidBills: bills.filter(b => b.status === 'UNPAID').length,
                pendingReports: reports.filter(r => r.status === 'PENDING').length,
                totalRevenue,
            });

            // Build recent activity from real data
            const activities = [];

            // Recent successful payments
            payments
                .filter(p => p.status === 'SUCCESS')
                .sort((a, b) => new Date(b.transactionTime || b.createdAt) - new Date(a.transactionTime || a.createdAt))
                .slice(0, 3)
                .forEach(p => {
                    activities.push({
                        type: 'payment',
                        text: `Payment received: ${formatCurrency(p.amount)}`,
                        time: p.transactionTime || p.createdAt,
                    });
                });

            // Recent pending reports
            reports
                .filter(r => r.status === 'PENDING')
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 2)
                .forEach(r => {
                    activities.push({
                        type: 'report',
                        text: `New report: ${r.title}`,
                        time: r.createdAt,
                    });
                });

            // Recent overdue bills
            bills
                .filter(b => b.status === 'OVERDUE')
                .slice(0, 2)
                .forEach(b => {
                    activities.push({
                        type: 'overdue',
                        text: `Overdue: ${b.title || 'Bill'} – Apt ${b.apartmentNumber || '?'}`,
                        time: b.dueDate || b.createdAt,
                    });
                });

            // Sort all by time desc, take top 5
            activities.sort((a, b) => new Date(b.time) - new Date(a.time));
            setRecentActivities(activities.slice(0, 5));

        } catch (err) {
            console.error('Failed to fetch stats', err);
        } finally {
            setLoading(false);
        }
    };

    /* ── Quick Action handlers ── */
    const handleGenerateBills = () => {
        navigate('/admin-bills');
    };

    const handleSendNotification = () => {
        navigate('/admin-notifications');
    };

    const handleReviewReports = () => {
        navigate('/admin-reports');
    };

    /* ── Activity icon helper ── */
    const getActivityIcon = (type) => {
        switch (type) {
            case 'payment':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                );
            case 'report':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                );
            case 'overdue':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                    </svg>
                );
            default:
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                );
        }
    };

    return (
        <>
            <div className="dashboard-page-bg" />
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-header__title">Dashboard</h1>
                <p className="page-header__subtitle">Welcome back, {user.fullName}</p>
            </div>

            {/* ══════════ Stat Cards ══════════ */}
            <div className="admin-stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '28px',
            }}>
                <style>{`
                    @media (max-width: 1100px) {
                        .admin-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    }
                    @media (max-width: 600px) {
                        .admin-stats-grid { grid-template-columns: 1fr !important; }
                    }
                `}</style>

                {/* — Total Accounts — */}
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="stat-card__icon" style={{ background: 'var(--accent-bg)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className="stat-card__value">{stats.users}</div>
                    <div className="stat-card__label">Total Accounts</div>
                </div>

                {/* — Apartments — */}
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="stat-card__icon" style={{ background: 'var(--success-bg)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    </div>
                    <div className="stat-card__value">{stats.apartments}</div>
                    <div className="stat-card__label">Apartments</div>
                </div>

                {/* — Admins — */}
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="stat-card__icon" style={{ background: 'var(--accent-bg)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                    <div className="stat-card__value">{stats.admins}</div>
                    <div className="stat-card__label">Admins</div>
                </div>

                {/* — Total Revenue — */}
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="stat-card__icon" style={{ background: 'var(--success-bg)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <div className="stat-card__value">{formatCurrency(stats.totalRevenue)}</div>
                    <div className="stat-card__label">Total Revenue</div>
                </div>

                {/* — Overdue Bills — */}
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="stat-card__icon" style={{ background: 'var(--danger-bg)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                        </svg>
                    </div>
                    <div className="stat-card__value" style={{ color: 'var(--danger)' }}>{stats.overdueBills}</div>
                    <div className="stat-card__label" style={{ color: 'var(--danger)', opacity: 0.8 }}>Overdue Bills</div>
                </div>

                {/* — Unpaid Bills — */}
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="stat-card__icon" style={{ background: 'var(--warning-bg)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2">
                            <rect x="2" y="5" width="20" height="14" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                    </div>
                    <div className="stat-card__value">{stats.unpaidBills}</div>
                    <div className="stat-card__label">Unpaid Bills</div>
                </div>

                {/* — Pending Reports — */}
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="stat-card__icon" style={{ background: 'var(--warning-bg)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                    </div>
                    <div className="stat-card__value">{stats.pendingReports}</div>
                    <div className="stat-card__label">Pending Reports</div>
                </div>
            </div>

            {/* ══════════ Two-Column Content ══════════ */}
            <div className="admin-dashboard-main" style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '20px',
                marginBottom: '28px',
            }}>
                <style>{`
                    @media (max-width: 900px) {
                        .admin-dashboard-main { grid-template-columns: 1fr !important; }
                    }
                `}</style>

                {/* ── Left Column: Recent Activity ── */}
                <div>
                    <div className="card">
                        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                            Recent Activity
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {recentActivities.length > 0 ? (
                                recentActivities.map((activity, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '14px',
                                            padding: '14px 0',
                                            borderBottom: i < recentActivities.length - 1 ? '1px solid var(--border)' : 'none',
                                        }}
                                    >
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: 'var(--radius-sm)',
                                            background: 'var(--bg-input)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <div style={{ width: '18px', height: '18px' }}>
                                                {getActivityIcon(activity.type)}
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                                {activity.text}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {timeAgo(activity.time)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                                    No recent activity
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right Column: Quick Actions ── */}
                <div>
                    <div className="card" style={{ position: 'sticky', top: '80px' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                            Quick Actions
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Generate Bills from Templates */}
                            <button
                                className="btn btn--ghost"
                                style={{
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    padding: '14px 16px',
                                    fontSize: '14px',
                                    borderRadius: 'var(--radius-md)',
                                    gap: '12px',
                                }}
                                onClick={handleGenerateBills}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="12" y1="18" x2="12" y2="12" />
                                    <line x1="9" y1="15" x2="15" y2="15" />
                                </svg>
                                Generate Bills from Templates
                            </button>

                            {/* Send Global Notification */}
                            <button
                                className="btn btn--ghost"
                                style={{
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    padding: '14px 16px',
                                    fontSize: '14px',
                                    borderRadius: 'var(--radius-md)',
                                    gap: '12px',
                                }}
                                onClick={handleSendNotification}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                                Send Global Notification
                            </button>

                            {/* Review Pending Reports */}
                            <button
                                className="btn btn--ghost"
                                style={{
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    padding: '14px 16px',
                                    fontSize: '14px',
                                    borderRadius: 'var(--radius-md)',
                                    gap: '12px',
                                }}
                                onClick={handleReviewReports}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                                Review Pending Reports
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}