import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

const typeIcons = {
    ANNOUNCEMENT: '📢',
    URGENT_ANNOUNCEMENT: '🚨',
    BILL_CREATED: '📄',
    BILL_CANCELLED: '❌',
    BILL_AMOUNT_UPDATED: '💰',
    BILL_DUE_DATE_UPDATED: '📅',
    INVOICE_EXPIRED: '⏰',
    PAYMENT_SUCCESS: '✅',
    PAYMENT_ACCEPTED: '💳',
    REPORT_CREATED: '📝',
    REPORT_UPDATED: '📝',
    REPORT_APPROVED: '✅',
    REPORT_REJECTED: '❌',
    CAMPAIGN_LAUNCHED: '🚀',
    CAMPAIGN_COMPLETED: '✅',
    CONTRIBUTION_PAID: '💝',
    SYSTEM_ERROR: '⚙️',
};

export default function NotificationBell({ user }) {
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(false);
    const dropdownRef = useRef(null);
    const [tick, setTick] = useState(0);

    const isAdmin = user?.role === 'ADMIN';
    const notifPagePath = isAdmin ? '/admin-notifications' : '/my-notifications';

    // Fetch unread count on mount and every 30 minutes (per spec)
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30 * 60 * 1000);
        const tickTimer = setInterval(() => setTick(t => t + 1), 60000);

        // Listen for manual update events
        const handleUpdate = () => fetchUnreadCount();
        window.addEventListener('notification-update', handleUpdate);

        return () => {
            clearInterval(interval);
            clearInterval(tickTimer);
            window.removeEventListener('notification-update', handleUpdate);
        };
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/notifications/me/unread-count`);
            setUnreadCount(res.data.unreadCount || 0);
        } catch {
            // Silently fail
        }
    };

    const fetchRecent = async () => {
        try {
            setLoadingRecent(true);
            const res = await axios.get(`${API_BASE}/api/notifications/me?page=0&size=5`);
            setRecentNotifications(res.data.content || []);
        } catch {
            // Silently fail
        } finally {
            setLoadingRecent(false);
        }
    };

    const handleToggle = () => {
        if (!showDropdown) {
            fetchRecent();
        }
        setShowDropdown(!showDropdown);
    };

    const handleMarkAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await axios.patch(`${API_BASE}/api/notifications/${id}/read`);
            fetchUnreadCount();
            fetchRecent();
        } catch {
            // Silently fail
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.patch(`${API_BASE}/api/notifications/me/read-all`);
            fetchUnreadCount();
            fetchRecent();
        } catch {
            // Silently fail
        }
    };

    const handleViewAll = () => {
        setShowDropdown(false);
        navigate(notifPagePath);
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={handleToggle}
                className="notification-bell-btn"
                aria-label="Notifications"
                style={{
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    color: 'var(--text-primary)',
                }}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        background: 'var(--danger)',
                        color: '#fff',
                        borderRadius: '10px',
                        padding: '1px 6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        lineHeight: '16px',
                        minWidth: '18px',
                        textAlign: 'center',
                        boxShadow: 'var(--shadow-sm)',
                        animation: 'notification-pulse 2s infinite',
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: '0',
                    width: '380px',
                    maxHeight: '480px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    animation: 'notif-dropdown-enter 0.2s ease',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 18px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
                            Notifications
                            {unreadCount > 0 && (
                                <span style={{
                                    marginLeft: '8px',
                                    background: 'var(--accent)',
                                    color: '#fff',
                                    borderRadius: '12px',
                                    padding: '2px 10px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                }}>
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--accent)',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                        {loadingRecent ? (
                            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                        ) : recentNotifications.length > 0 ? (
                            recentNotifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => { setShowDropdown(false); navigate(notifPagePath); }}
                                    style={{
                                        padding: '14px 18px',
                                        borderBottom: '1px solid var(--border)',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s',
                                        background: n.read ? 'transparent' : 'var(--accent-bg)',
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'flex-start',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'var(--accent-bg)'}
                                >
                                    <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>
                                        {typeIcons[n.type] || '🔔'}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontWeight: n.read ? 400 : 600,
                                            color: 'var(--text-primary)',
                                            fontSize: '14px',
                                            marginBottom: '3px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {n.title}
                                        </div>
                                        <div style={{
                                            fontSize: '13px',
                                            color: 'var(--text-secondary)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {n.message}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            {formatTimeAgo(n.createdAt)}
                                        </div>
                                    </div>
                                    {!n.read && (
                                        <button
                                            onClick={(e) => handleMarkAsRead(n.id, e)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                borderRadius: '50%',
                                                flexShrink: 0,
                                            }}
                                            title="Mark as read"
                                        >
                                            <div style={{
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                background: 'var(--accent)',
                                            }} />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</div>
                                No notifications yet
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '12px 18px',
                        borderTop: '1px solid var(--border)',
                        textAlign: 'center',
                    }}>
                        <button
                            onClick={handleViewAll}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--accent)',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '14px',
                            }}
                        >
                            View all notifications →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
