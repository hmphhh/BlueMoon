import { useNavigate, useLocation } from 'react-router-dom';

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const navIcons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  accounts: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  apartments: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>,
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  reports: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  bills: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  invoices: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  payments: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  notifications: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

export default function Sidebar({ user, setUser, isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const handleNav = (path) => {
    navigate(path);
    onClose?.();
  };

  const links = isAdmin
    ? [
        { path: '/admin-panel', label: 'Dashboard', icon: navIcons.dashboard },
        { path: '/accounts', label: 'Accounts', icon: navIcons.accounts },
        { path: '/apartments', label: 'Apartments', icon: navIcons.apartments },
        { path: '/admin-bills', label: 'Bills', icon: navIcons.bills },
        { path: '/admin-bill-templates', label: 'Bill Templates', icon: navIcons.bills },
        { path: '/admin-invoices', label: 'Invoices', icon: navIcons.invoices },
        { path: '/admin-payments', label: 'Payments', icon: navIcons.payments },
        { path: '/admin-reports', label: 'Reports', icon: navIcons.reports },
        { path: '/admin-notifications', label: 'Notifications', icon: navIcons.notifications },
        { path: '/profile', label: 'My Profile', icon: navIcons.profile },
      ]
    : [
        { path: '/resident-home', label: 'Home', icon: navIcons.home },
        { path: '/my-apartment', label: 'My Apartment', icon: navIcons.apartments },
        { path: '/my-bills', label: 'My Bills', icon: navIcons.bills },
        { path: '/my-invoices', label: 'My Invoices', icon: navIcons.invoices },
        { path: '/reports', label: 'Reports', icon: navIcons.reports },
        { path: '/my-notifications', label: 'Notifications', icon: navIcons.notifications },
        { path: '/profile', label: 'My Profile', icon: navIcons.profile },
      ];

  const initial = (user?.fullName || user?.username || '?')[0].toUpperCase();

  return (
    <>
      <div className={`mobile-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`layout__sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__logo"><MoonIcon /></div>
          <span className="sidebar__title">BlueMoon</span>
        </div>

        <nav className="sidebar__nav">
          {links.map(link => (
            <button
              key={link.path}
              className={`sidebar__link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => handleNav(link.path)}
            >
              {link.icon}
              {link.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button className="sidebar__link" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
            {navIcons.logout}
            Logout
          </button>
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__avatar">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="avatar" />
              : initial
            }
          </div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{user?.fullName || user?.username}</div>
            <div className="sidebar__user-role">{user?.role}</div>
          </div>
        </div>
      </aside>
    </>
  );
}
