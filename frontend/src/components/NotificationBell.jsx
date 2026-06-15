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
    SYSTEM_ERROR: '⚙️',
};

export default function NotificationBell({ user }) {
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(false);
    const dropdownRef = useRef(null);

    const isAdmin = user?.role === 'ADMIN';
    const notifPagePath = isAdmin ? '/admin-notifications' : '/my-notifications';

    // Fetch unread count on mount and every 30 minutes (per spec)
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30 * 60 * 1000);

        // Listen for manual update events
        const handleUpdate = () => fetchUnreadCount();
        window.addEventListener('notification-update', handleUpdate);

        return () => {
            clearInterval(interval);
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
                        background: 'linear-gradient(135deg, #ff4757, #ff6b81)',
                        color: '#fff',
                        borderRadius: '10px',
                        padding: '1px 6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        lineHeight: '16px',
                        minWidth: '18px',
                        textAlign: 'center',
                        boxShadow: '0 2px 6px rgba(255, 71, 87, 0.4)',
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
                    background: 'var(--card-bg, #1a1a2e)',
                    border: '1px solid var(--border-color, #333)',
                    borderRadius: '14px',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    animation: 'notif-dropdown-enter 0.2s ease',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 18px',
                        borderBottom: '1px solid var(--border-color, #333)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <div style={{ fontWeight: 700, fontSize: '16px' }}>
                            Notifications
                            {unreadCount > 0 && (
                                <span style={{
                                    marginLeft: '8px',
                                    background: 'var(--primary, #7c6ef0)',
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
                                    color: 'var(--primary, #7c6ef0)',
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
                                        borderBottom: '1px solid var(--border-color, #333)',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s',
                                        background: n.read ? 'transparent' : 'rgba(124, 110, 240, 0.05)',
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'flex-start',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(124, 110, 240, 0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(124, 110, 240, 0.05)'}
                                >
                                    <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>
                                        {typeIcons[n.type] || '🔔'}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontWeight: n.read ? 400 : 700,
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
                                            color: 'var(--text-secondary, #aaa)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {n.message}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted, #666)', marginTop: '4px' }}>
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
                                                background: 'var(--primary, #7c6ef0)',
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
                        borderTop: '1px solid var(--border-color, #333)',
                        textAlign: 'center',
                    }}>
                        <button
                            onClick={handleViewAll}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary, #7c6ef0)',
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
