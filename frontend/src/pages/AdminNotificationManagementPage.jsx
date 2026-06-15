import { useState, useEffect } from 'react';
import axios from 'axios';
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

export default function AdminNotificationManagementPage() {
    const toast = useToast();

    // === Notification Templates State ===
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [isEditingTemplate, setIsEditingTemplate] = useState(false);
    const [editTemplateId, setEditTemplateId] = useState(null);
    const [templateForm, setTemplateForm] = useState({ title: '', message: '' });

    // === Send Notification State ===
    const [showSendModal, setShowSendModal] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [sending, setSending] = useState(false);
    const [selectAll, setSelectAll] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);

    // === Notifications List State ===
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);
    const [notifPage, setNotifPage] = useState(0);
    const [notifTotalPages, setNotifTotalPages] = useState(0);
    const [notifTotalElements, setNotifTotalElements] = useState(0);
    const [notifCategoryFilter, setNotifCategoryFilter] = useState('');
    const [notifDeletedFilter, setNotifDeletedFilter] = useState(null);
    const [notifReadFilter, setNotifReadFilter] = useState(null);
    const [selectedNotifIds, setSelectedNotifIds] = useState([]);

    // === Active Tab ===
    const [activeSection, setActiveSection] = useState('notifications');

    useEffect(() => {
        fetchTemplates();
    }, []);

    useEffect(() => {
        if (activeSection === 'notifications') {
            fetchNotifications();
        }
    }, [activeSection, notifPage, notifCategoryFilter, notifDeletedFilter, notifReadFilter]);

    // ── Templates ──
    const fetchTemplates = async () => {
        try {
            setLoadingTemplates(true);
            const res = await axios.get(`${API_BASE}/api/admin/notification-templates`);
            setTemplates(res.data || []);
        } catch (err) {
            toast('Failed to load templates', 'error');
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleOpenCreateTemplate = () => {
        setIsEditingTemplate(false);
        setEditTemplateId(null);
        setTemplateForm({ title: '', message: '' });
        setShowTemplateModal(true);
    };

    const handleOpenEditTemplate = (t) => {
        setIsEditingTemplate(true);
        setEditTemplateId(t.id);
        setTemplateForm({ title: t.title || '', message: t.message || '' });
        setShowTemplateModal(true);
    };

    const handleSaveTemplate = async () => {
        if (!templateForm.title.trim() || !templateForm.message.trim()) {
            toast('Please fill in title and message', 'error');
            return;
        }
        try {
            if (isEditingTemplate) {
                await axios.put(`${API_BASE}/api/admin/notification-templates/${editTemplateId}`, templateForm);
                toast('Template updated!', 'success');
            } else {
                await axios.post(`${API_BASE}/api/admin/notification-templates`, templateForm);
                toast('Template created!', 'success');
            }
            setShowTemplateModal(false);
            fetchTemplates();
        } catch (err) {
            toast(err.response?.data?.error || 'Failed to save template', 'error');
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm('Delete this template? Previously sent notifications are NOT affected.')) return;
        try {
            await axios.delete(`${API_BASE}/api/admin/notification-templates/${id}`);
            toast('Template deleted!', 'success');
            fetchTemplates();
        } catch (err) {
            toast('Failed to delete template', 'error');
        }
    };

    // ── Send Notification ──
    const handleOpenSend = (templateId) => {
        setSelectedTemplateId(templateId || '');
        setSelectedUserIds([]);
        setUserSearch('');
        setSelectAll(false);
        setIsUrgent(false);
        setShowSendModal(true);
        fetchUsers('');
    };

    const fetchUsers = async (search) => {
        try {
            setLoadingUsers(true);
            const res = await axios.get(`${API_BASE}/api/users?page=0&size=200${search ? `&search=${encodeURIComponent(search)}` : ''}`);
            const userData = res.data.content || res.data || [];
            setUsers(userData);
        } catch (err) {
            toast('Failed to load users', 'error');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleToggleUser = (userId) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(users.map(u => u.id));
        }
        setSelectAll(!selectAll);
    };

    const handleSend = async () => {
        if (!selectedTemplateId) {
            toast('Please select a template', 'error');
            return;
        }
        if (selectedUserIds.length === 0) {
            toast('Please select at least one user', 'error');
            return;
        }
        try {
            setSending(true);
            const res = await axios.post(`${API_BASE}/api/admin/notifications`, {
                templateId: Number(selectedTemplateId),
                userIds: selectedUserIds,
                urgent: isUrgent,
            });
            toast(`Sent ${res.data.sentCount} notification(s)!`, 'success');
            setShowSendModal(false);
            if (activeSection === 'notifications') fetchNotifications();
        } catch (err) {
            toast(err.response?.data?.error || 'Failed to send notifications', 'error');
        } finally {
            setSending(false);
        }
    };

    // ── Notifications ──
    const fetchNotifications = async () => {
        try {
            setLoadingNotifications(true);
            let url = `${API_BASE}/api/admin/notifications?page=${notifPage}&size=15`;
            if (notifCategoryFilter) url += `&category=${notifCategoryFilter}`;
            if (notifDeletedFilter !== null) url += `&deleted=${notifDeletedFilter}`;
            if (notifReadFilter !== null) url += `&read=${notifReadFilter}`;
            const res = await axios.get(url);
            setNotifications(res.data.content || []);
            setNotifTotalPages(res.data.totalPages || 0);
            setNotifTotalElements(res.data.totalElements || 0);
            setSelectedNotifIds([]);
        } catch (err) {
            toast('Failed to load notifications', 'error');
        } finally {
            setLoadingNotifications(false);
        }
    };

    const handleAdminDelete = async (id) => {
        if (!window.confirm('Withdraw/delete this notification? The recipient will no longer see it.')) return;
        try {
            await axios.delete(`${API_BASE}/api/admin/notifications/${id}`);
            toast('Notification deleted!', 'success');
            fetchNotifications();
        } catch (err) {
            toast('Failed to delete notification', 'error');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedNotifIds.length === 0) {
            toast('Select notifications first', 'error');
            return;
        }
        if (!window.confirm(`Delete ${selectedNotifIds.length} notification(s)?`)) return;
        try {
            await axios.delete(`${API_BASE}/api/admin/notifications?ids=${selectedNotifIds.join(',')}`);
            toast('Notifications deleted!', 'success');
            fetchNotifications();
        } catch (err) {
            toast('Failed to bulk delete', 'error');
        }
    };

    const handleToggleNotifSelect = (id) => {
        setSelectedNotifIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const sectionTabs = [
        { key: 'templates', label: '📝 Templates' },
        { key: 'notifications', label: '🔔 All Notifications' },
    ];

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Notification Management</h1>
                <p className="page-header__subtitle">Manage templates and send notifications to residents</p>
            </div>

            {/* Section Tabs */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid var(--border-color, #333)' }}>
                {sectionTabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveSection(tab.key)}
                        style={{
                            padding: '12px 24px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                            border: 'none', background: 'none',
                            color: activeSection === tab.key ? 'var(--primary, #7c6ef0)' : 'var(--text-muted, #888)',
                            borderBottom: activeSection === tab.key ? '2px solid var(--primary, #7c6ef0)' : '2px solid transparent',
                            marginBottom: '-2px', transition: 'all 0.2s ease'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═════ TEMPLATES SECTION ═════ */}
            {activeSection === 'templates' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                        <h2 style={{ margin: 0 }}>Templates ({templates.length})</h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn--primary" onClick={handleOpenCreateTemplate}>
                                + New Template
                            </button>
                            <button className="btn btn--info" onClick={() => handleOpenSend('')}>
                                📤 Send Notification
                            </button>
                        </div>
                    </div>

                    {loadingTemplates ? (
                        <div className="empty-state"><p>Loading...</p></div>
                    ) : templates.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Message (preview)</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templates.map(t => (
                                        <tr key={t.id}>
                                            <td><strong>{t.title}</strong></td>
                                            <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                                                {t.message}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(t.createdAt)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button className="btn btn--info btn--sm" onClick={() => handleOpenSend(t.id)}>Send</button>
                                                    <button className="btn btn--primary btn--sm" onClick={() => handleOpenEditTemplate(t)}>Edit</button>
                                                    <button className="btn btn--danger btn--sm" onClick={() => handleDeleteTemplate(t.id)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <p>No templates yet. Create one to start sending notifications.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ═════ NOTIFICATIONS SECTION ═════ */}
            {activeSection === 'notifications' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                        <h2 style={{ margin: 0 }}>All Notifications ({notifTotalElements})</h2>
                        {selectedNotifIds.length > 0 && (
                            <button className="btn btn--danger btn--sm" onClick={handleBulkDelete}>
                                🗑 Delete Selected ({selectedNotifIds.length})
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <select
                            className="form-input"
                            value={notifCategoryFilter}
                            onChange={e => { setNotifCategoryFilter(e.target.value); setNotifPage(0); }}
                            style={{ width: 'auto', minWidth: '160px' }}
                        >
                            <option value="">All Types</option>
                            {Object.entries(categoryLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <select
                            className="form-input"
                            value={notifDeletedFilter === null ? '' : String(notifDeletedFilter)}
                            onChange={e => {
                                const v = e.target.value;
                                setNotifDeletedFilter(v === '' ? null : v === 'true');
                                setNotifPage(0);
                            }}
                            style={{ width: 'auto', minWidth: '160px' }}
                        >
                            <option value="">All Status</option>
                            <option value="false">Active</option>
                            <option value="true">Admin Deleted</option>
                        </select>
                        <select
                            className="form-input"
                            value={notifReadFilter === null ? '' : String(notifReadFilter)}
                            onChange={e => {
                                const v = e.target.value;
                                setNotifReadFilter(v === '' ? null : v === 'true');
                                setNotifPage(0);
                            }}
                            style={{ width: 'auto', minWidth: '160px' }}
                        >
                            <option value="">All Read Status</option>
                            <option value="true">Read</option>
                            <option value="false">Unread</option>
                        </select>
                    </div>

                    {loadingNotifications ? (
                        <div className="empty-state"><p>Loading...</p></div>
                    ) : notifications.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '30px' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedNotifIds.length === notifications.length && notifications.length > 0}
                                                onChange={() => {
                                                    if (selectedNotifIds.length === notifications.length) {
                                                        setSelectedNotifIds([]);
                                                    } else {
                                                        setSelectedNotifIds(notifications.map(n => n.id));
                                                    }
                                                }}
                                            />
                                        </th>
                                        <th>Type</th>
                                        <th>Title</th>
                                        <th>User</th>
                                        <th>Read</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notifications.map(n => (
                                        <tr key={n.id} style={{ opacity: n.deletedByAdmin ? 0.5 : 1 }}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedNotifIds.includes(n.id)}
                                                    onChange={() => handleToggleNotifSelect(n.id)}
                                                />
                                            </td>
                                            <td>
                                                <span className={`badge ${getTypeConfig(n.type).class}`} style={{ fontSize: '11px' }}>
                                                    {getTypeConfig(n.type).icon} {getTypeConfig(n.type).label}
                                                </span>
                                            </td>
                                            <td><strong>{n.title}</strong></td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{n.user?.fullName || '—'}</td>
                                            <td>
                                                {n.read
                                                    ? <span className="badge badge--success" style={{ fontSize: '11px' }}>Read</span>
                                                    : <span className="badge badge--warning" style={{ fontSize: '11px' }}>Unread</span>
                                                }
                                            </td>
                                            <td>
                                                {n.deletedByAdmin && <span className="badge badge--danger" style={{ fontSize: '11px' }}>Admin Del</span>}
                                                {n.deletedByUser && <span className="badge badge--secondary" style={{ fontSize: '11px' }}>User Del</span>}
                                                {!n.deletedByAdmin && !n.deletedByUser && <span className="badge badge--success" style={{ fontSize: '11px' }}>Active</span>}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '13px' }}>{formatDate(n.createdAt)}</td>
                                            <td>
                                                {!n.deletedByAdmin && (
                                                    <button className="btn btn--danger btn--sm" onClick={() => handleAdminDelete(n.id)}>
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                    {notifTotalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                            <button className="btn btn--secondary btn--sm" disabled={notifPage === 0} onClick={() => setNotifPage(p => p - 1)}>
                                ← Prev
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                Page {notifPage + 1} of {notifTotalPages}
                            </span>
                            <button className="btn btn--secondary btn--sm" disabled={notifPage >= notifTotalPages - 1} onClick={() => setNotifPage(p => p + 1)}>
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ═════ TEMPLATE CREATE/EDIT MODAL ═════ */}
            {showTemplateModal && (
                <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{isEditingTemplate ? 'Edit Template' : 'Create Template'}</h2>
                            <button className="modal-close" onClick={() => setShowTemplateModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input
                                    className="form-input"
                                    value={templateForm.title}
                                    onChange={e => setTemplateForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="e.g. Water Supply Maintenance"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Message</label>
                                <textarea
                                    className="form-input"
                                    value={templateForm.message}
                                    onChange={e => setTemplateForm(p => ({ ...p, message: e.target.value }))}
                                    placeholder="Notification content..."
                                    rows={5}
                                    style={{ resize: 'vertical', minHeight: '120px' }}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowTemplateModal(false)}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleSaveTemplate}>
                                {isEditingTemplate ? 'Save Changes' : 'Create Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═════ SEND NOTIFICATION MODAL ═════ */}
            {showSendModal && (
                <div className="modal-overlay" onClick={() => setShowSendModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h2>📤 Send Notification</h2>
                            <button className="modal-close" onClick={() => setShowSendModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Template</label>
                                <select
                                    className="form-input"
                                    value={selectedTemplateId}
                                    onChange={e => setSelectedTemplateId(e.target.value)}
                                >
                                    <option value="">Select a template...</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    cursor: 'pointer', padding: '10px 12px',
                                    borderRadius: '8px', border: '1px solid var(--border-color, #333)',
                                    background: isUrgent ? 'rgba(255, 71, 87, 0.1)' : 'transparent',
                                    transition: 'all 0.2s ease',
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={isUrgent}
                                        onChange={e => setIsUrgent(e.target.checked)}
                                    />
                                    <span style={{ fontWeight: 600, color: isUrgent ? '#ff4757' : 'var(--text-primary)' }}>
                                        🚨 Send as Urgent Announcement
                                    </span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Recipients ({selectedUserIds.length} selected)</label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <input
                                        className="form-input"
                                        placeholder="Search users..."
                                        value={userSearch}
                                        onChange={e => { setUserSearch(e.target.value); fetchUsers(e.target.value); }}
                                        style={{ flex: 1 }}
                                    />
                                    <button className="btn btn--secondary btn--sm" onClick={handleSelectAll}>
                                        {selectAll ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div style={{
                                    maxHeight: '250px', overflowY: 'auto',
                                    border: '1px solid var(--border-color, #333)',
                                    borderRadius: '8px', padding: '8px',
                                }}>
                                    {loadingUsers ? (
                                        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</p>
                                    ) : users.length > 0 ? (
                                        users.map(u => (
                                            <label
                                                key={u.id}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                    padding: '8px 10px', cursor: 'pointer',
                                                    borderRadius: '6px',
                                                    background: selectedUserIds.includes(u.id) ? 'rgba(124, 110, 240, 0.1)' : 'transparent',
                                                    transition: 'background 0.15s',
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUserIds.includes(u.id)}
                                                    onChange={() => handleToggleUser(u.id)}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{u.fullName || u.username}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        @{u.username} {u.apartmentNumber ? `• Apt ${u.apartmentNumber}` : ''}
                                                    </div>
                                                </div>
                                            </label>
                                        ))
                                    ) : (
                                        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No users found</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowSendModal(false)}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleSend} disabled={sending}>
                                {sending ? 'Sending...' : `Send to ${selectedUserIds.length} user(s)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
