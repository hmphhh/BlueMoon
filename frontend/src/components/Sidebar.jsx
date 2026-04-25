import { useNavigate, useLocation } from 'react-router-dom';

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const navIcons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
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
        { path: '/profile', label: 'My Profile', icon: navIcons.profile },
      ]
    : [
        { path: '/resident-home', label: 'Home', icon: navIcons.home },
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
