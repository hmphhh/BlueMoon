export default function UserPage({ user }) {
    const features = [
        {
            title: 'View Bills',
            desc: 'Check your monthly bills and payment history',
            color: '#3b82f6',
            bg: 'rgba(59,130,246,0.12)',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
        },
        {
            title: 'Pay Rent',
            desc: 'Make your rent payment online securely',
            color: '#10b981',
            bg: 'rgba(16,185,129,0.12)',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
        },
        {
            title: 'Report Problem',
            desc: 'Submit maintenance requests and issues',
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.12)',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
        },
    ];

    return (
        <>
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
                <h1 className="page-header__title">Quick Actions</h1>
                <p className="page-header__subtitle">Manage your apartment services</p>
            </div>

            <div className="features-grid stagger">
                {features.map(f => (
                    <div key={f.title} className="feature-card card--interactive"
                        style={{ '--hover-color': f.color }}>
                        <span className="badge badge--coming-soon">Coming Soon</span>
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