import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const categoryLabels = {
    ANNOUNCEMENT: 'Announcement',
    BILL: 'Bill',
    INVOICE: 'Invoice',
    PAYMENT: 'Payment',
    REPORT: 'Report',
    SYSTEM: 'System',
};

const priorityConfig = {
    LOW: { label: 'Low', class: 'badge--secondary' },
    NORMAL: { label: 'Normal', class: 'badge--info' },
    HIGH: { label: 'High', class: 'badge--danger' },
};

/** Map each raw backend type to a simplified category key + display config */
const typeToCategory = {
    ANNOUNCEMENT:          { label: 'Announcement',  class: 'badge--primary', icon: '📢' },
    URGENT_ANNOUNCEMENT:   { label: 'Announcement',  class: 'badge--danger',  icon: '🚨' },
    BILL_CREATED:          { label: 'Bill',           class: 'badge--warning', icon: '📄' },
    BILL_CANCELLED:        { label: 'Bill',           class: 'badge--danger',  icon: '❌' },
    BILL_AMOUNT_UPDATED:   { label: 'Bill',           class: 'badge--warning', icon: '💰' },
    BILL_DUE_DATE_UPDATED: { label: 'Bill',           class: 'badge--warning', icon: '📅' },
    INVOICE_EXPIRED:       { label: 'Invoice',        class: 'badge--danger',  icon: '⏰' },
    PAYMENT_SUCCESS:       { label: 'Payment',        class: 'badge--success', icon: '✅' },
    PAYMENT_ACCEPTED:      { label: 'Payment',        class: 'badge--success', icon: '💳' },
    REPORT_CREATED:        { label: 'Report',         class: 'badge--info',    icon: '📝' },
    REPORT_UPDATED:        { label: 'Report',         class: 'badge--info',    icon: '📝' },
    REPORT_APPROVED:       { label: 'Report',         class: 'badge--success', icon: '✅' },
    REPORT_REJECTED:       { label: 'Report',         class: 'badge--danger',  icon: '❌' },
    SYSTEM_ERROR:          { label: 'System',         class: 'badge--secondary', icon: '⚙️' },
};

const getTypeConfig = (type) => typeToCategory[type] || { label: type, class: 'badge--secondary', icon: '🔔' };

export default function UserNotificationsPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [readFilter, setReadFilter] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, [page, categoryFilter, readFilter]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            let url = `${API_BASE}/api/notifications/me?page=${page}&size=15`;
            if (categoryFilter) {
                url += `&category=${categoryFilter}`;
            }
            if (readFilter !== null) {
                url += `&read=${readFilter}`;
            }
            const res = await axios.get(url);
            setNotifications(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
        } catch (err) {
            console.error(err);
            toast('Failed to load notifications', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await axios.patch(`${API_BASE}/api/notifications/${id}/read`);
            fetchNotifications();
            // Dispatch event to update badge
            window.dispatchEvent(new Event('notification-update'));
        } catch (err) {
            toast('Failed to mark as read', 'error');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.patch(`${API_BASE}/api/notifications/me/read-all`);
            toast('All notifications marked as read', 'success');
            fetchNotifications();
            window.dispatchEvent(new Event('notification-update'));
        } catch (err) {
            toast('Failed to mark all as read', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this notification?')) return;
        try {
            await axios.delete(`${API_BASE}/api/notifications/${id}`);
            toast('Notification deleted', 'success');
            if (selectedNotification?.id === id) setSelectedNotification(null);
            fetchNotifications();
            window.dispatchEvent(new Event('notification-update'));
        } catch (err) {
            toast('Failed to delete notification', 'error');
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('Delete all your notifications? This cannot be undone.')) return;
        try {
            const res = await axios.delete(`${API_BASE}/api/notifications/me`);
            toast(`Deleted ${res.data.deletedCount} notifications`, 'success');
            setSelectedNotification(null);
            fetchNotifications();
            window.dispatchEvent(new Event('notification-update'));
        } catch (err) {
            toast('Failed to delete notifications', 'error');
        }
    };

    const handleViewDetail = async (notification) => {
        setSelectedNotification(notification);
        if (!notification.read) {
            // Auto mark as read when opening detail
            try {
                await axios.patch(`${API_BASE}/api/notifications/${notification.id}/read`);
                fetchNotifications();
                window.dispatchEvent(new Event('notification-update'));
            } catch (err) {
                // Silently fail — not critical
            }
        }
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">My Notifications</h1>
                <p className="page-header__subtitle">Stay updated with your latest notifications</p>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 style={{ margin: 0 }}>Notifications ({totalElements})</h2>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className="btn btn--primary btn--sm" onClick={handleMarkAllAsRead}>
                            ✓ Mark All Read
                        </button>
                        <button className="btn btn--danger btn--sm" onClick={handleDeleteAll}>
                            🗑 Delete All
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                        className="form-input"
                        value={categoryFilter}
                        onChange={e => { setCategoryFilter(e.target.value); setPage(0); }}
                        style={{ width: 'auto', minWidth: '160px' }}
                    >
                        <option value="">All Types</option>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <select
                        className="form-input"
                        value={readFilter === null ? '' : String(readFilter)}
                        onChange={e => {
                            const v = e.target.value;
                            setReadFilter(v === '' ? null : v === 'true');
                            setPage(0);
                        }}
                        style={{ width: 'auto', minWidth: '160px' }}
                    >
                        <option value="">All Status</option>
                        <option value="true">Read</option>
                        <option value="false">Unread</option>
                    </select>
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="empty-state"><p>Loading...</p></div>
                ) : notifications.length > 0 ? (
                    <div className="notification-list">
                        {notifications.map(n => (
                            <div
                                key={n.id}
                                className="notification-item"
                                style={{
                                    padding: '16px',
                                    borderRadius: '10px',
                                    marginBottom: '10px',
                                    border: `1px solid ${n.read ? 'var(--border-color, #333)' : 'var(--primary, #7c6ef0)'}`,
                                    background: n.read ? 'var(--card-bg, #1a1a2e)' : 'rgba(124, 110, 240, 0.06)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                }}
                                onClick={() => handleViewDetail(n)}
                            >
                                {!n.read && (
                                    <div style={{
                                        position: 'absolute', top: '18px', left: '8px',
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: 'var(--primary, #7c6ef0)',
                                    }} />
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingLeft: n.read ? '0' : '14px' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                                            <span className={`badge ${getTypeConfig(n.type).class}`} style={{ fontSize: '11px' }}>
                                                {getTypeConfig(n.type).icon} {getTypeConfig(n.type).label}
                                            </span>
                                            {n.priority === 'HIGH' && (
                                                <span className="badge badge--danger" style={{ fontSize: '11px' }}>🔴 High</span>
                                            )}
                                        </div>
                                        <div style={{ fontWeight: n.read ? 400 : 700, fontSize: '15px', marginBottom: '4px' }}>
                                            {n.title}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary, #aaa)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {n.message}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                                        <span style={{ color: 'var(--text-muted, #666)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                            {formatDate(n.createdAt)}
                                        </span>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {!n.read && (
                                                <button
                                                    className="btn btn--primary btn--sm"
                                                    style={{ fontSize: '11px', padding: '3px 8px' }}
                                                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id); }}
                                                >
                                                    Read
                                                </button>
                                            )}
                                            <button
                                                className="btn btn--danger btn--sm"
                                                style={{ fontSize: '11px', padding: '3px 8px' }}
                                                onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <p>No notifications found.</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                        <button
                            className="btn btn--secondary btn--sm"
                            disabled={page === 0}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                        >
                            ← Prev
                        </button>
                        <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Page {page + 1} of {totalPages}
                        </span>
                        <button
                            className="btn btn--secondary btn--sm"
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>

            {/* Notification Detail Modal */}
            {selectedNotification && (
                <div className="modal-overlay" onClick={() => setSelectedNotification(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>{getTypeConfig(selectedNotification.type).icon}</span>
                                Notification Detail
                            </h2>
                            <button className="modal-close" onClick={() => setSelectedNotification(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <span className={`badge ${getTypeConfig(selectedNotification.type).class}`}>
                                    {getTypeConfig(selectedNotification.type).label}
                                </span>
                                <span className={`badge ${priorityConfig[selectedNotification.priority]?.class || 'badge--secondary'}`}>
                                    {priorityConfig[selectedNotification.priority]?.label || selectedNotification.priority}
                                </span>
                                {selectedNotification.read
                                    ? <span className="badge badge--success">Read</span>
                                    : <span className="badge badge--warning">Unread</span>
                                }
                            </div>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input className="form-input form-input--readonly" value={selectedNotification.title} readOnly disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Message</label>
                                <div style={{
                                    padding: '14px',
                                    borderRadius: '8px',
                                    background: 'var(--bg-secondary, #16162a)',
                                    border: '1px solid var(--border-color, #333)',
                                    color: 'var(--text-primary)',
                                    lineHeight: '1.6',
                                    whiteSpace: 'pre-wrap',
                                    fontSize: '14px',
                                }}>
                                    {selectedNotification.message}
                                </div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Created</label>
                                    <input className="form-input form-input--readonly" value={formatDate(selectedNotification.createdAt)} readOnly disabled />
                                </div>
                                {selectedNotification.readAt && (
                                    <div className="form-group">
                                        <label className="form-label">Read At</label>
                                        <input className="form-input form-input--readonly" value={formatDate(selectedNotification.readAt)} readOnly disabled />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setSelectedNotification(null)}>Close</button>
                            {!selectedNotification.read && (
                                <button className="btn btn--primary" onClick={() => {
                                    handleMarkAsRead(selectedNotification.id);
                                    setSelectedNotification(prev => prev ? { ...prev, read: true } : null);
                                }}>
                                    Mark as Read
                                </button>
                            )}
                            <button className="btn btn--danger" onClick={() => handleDelete(selectedNotification.id)}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
