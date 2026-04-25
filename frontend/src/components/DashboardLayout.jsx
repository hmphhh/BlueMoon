import { useState } from 'react';
import Sidebar from './Sidebar';

export default function DashboardLayout({ user, setUser, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar
        user={user}
        setUser={setUser}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="layout__main">
        <button
          className="mobile-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="layout__content">
          {children}
        </div>
      </main>
    </div>
  );
}
