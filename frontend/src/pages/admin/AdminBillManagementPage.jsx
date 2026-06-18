import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const formatCurrency = (amount) => {
    if (amount == null) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const statusBadge = (status) => {
    switch (status) {
        case 'UNPAID': return 'badge--warning';
        case 'OVERDUE': return 'badge--danger';
        case 'PAID': return 'badge--success';
        case 'CANCELLED': return 'badge--secondary';
        default: return 'badge--info';
    }
};

/* ─────────────────────────────────────────────
   Section: Bill Statistics
   ───────────────────────────────────────────── */
function BillStatsSection({ bills }) {
    const stats = [
        {
            label: 'Unpaid',
            count: bills.filter(b => b.status === 'UNPAID').length,
            iconBg: 'var(--warning-bg)',
            iconColor: 'var(--warning)',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
        },
        {
            label: 'Overdue',
            count: bills.filter(b => b.status === 'OVERDUE').length,
            iconBg: 'var(--danger-bg)',
            iconColor: 'var(--danger)',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
        },
        {
            label: 'Paid',
            count: bills.filter(b => b.status === 'PAID').length,
            iconBg: 'var(--success-bg)',
            iconColor: 'var(--success)',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
        },
        {
            label: 'Cancelled',
            count: bills.filter(b => b.status === 'CANCELLED').length,
            iconBg: 'rgba(255,255,255,0.06)',
            iconColor: 'var(--text-muted)',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
        },
    ];

    return (
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
            {stats.map(s => (
                <div className="stat-card" key={s.label}>
                    <div className="stat-card__icon" style={{ background: s.iconBg, color: s.iconColor }}>
                        {s.icon}
                    </div>
                    <div className="stat-card__value">{s.count}</div>
                    <div className="stat-card__label">{s.label}</div>
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Section: Bill Templates
   ───────────────────────────────────────────── */
function BillTemplatesSection({ templates, fetchTemplates, toast }) {
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', defaultAmount: '' });
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const fetchTemplateDetail = async (id) => {
        try {
            const res = await axios.get(`${API_BASE}/api/bill-templates/${id}`);
            setSelectedTemplate(res.data);
        } catch {
            toast('Failed to load template details', 'error');
        }
    };

    const handleOpenCreate = () => {
        setIsEditing(false);
        setEditId(null);
        setForm({ name: '', description: '', defaultAmount: '' });
        setShowModal(true);
    };

    const handleOpenEdit = (template) => {
        setIsEditing(true);
        setEditId(template.id);
        setForm({
            name: template.name || '',
            description: template.description || '',
            defaultAmount: template.defaultAmount || ''
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.defaultAmount) {
            toast('Please fill in name and default amount', 'error');
            return;
        }
        try {
            if (isEditing) {
                await axios.patch(`${API_BASE}/api/bill-templates/${editId}`, {
                    name: form.name,
                    description: form.description || null,
                    defaultAmount: Number(form.defaultAmount)
                });
                toast('Template updated successfully!', 'success');
            } else {
                await axios.post(`${API_BASE}/api/bill-templates`, {
                    name: form.name,
                    description: form.description || null,
                    defaultAmount: Number(form.defaultAmount)
                });
                toast('Template created successfully!', 'success');
            }
            setShowModal(false);
            fetchTemplates();
            if (selectedTemplate && isEditing && editId === selectedTemplate.id) {
                fetchTemplateDetail(editId);
            }
        } catch (err) {
            toast(err.response?.data?.error || 'Failed to save template', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template? This will NOT affect existing bills.')) return;
        try {
            await axios.delete(`${API_BASE}/api/bill-templates/${id}`);
            toast('Template deleted successfully!', 'success');
            if (selectedTemplate?.id === id) setSelectedTemplate(null);
            fetchTemplates();
        } catch (err) {
            toast(err.response?.data?.error || 'Failed to delete template', 'error');
        }
    };

    return (
        <>
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px' }}>Bill Templates</h2>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Manage reusable bill definitions</p>
                    </div>
                    <button className="btn btn--primary" onClick={handleOpenCreate}>
                        + New Template
                    </button>
                </div>

                {templates.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Default Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map(t => (
                                    <tr key={t.id}>
                                        <td><strong>{t.name}</strong></td>
                                        <td>{formatCurrency(t.defaultAmount)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button className="btn btn--primary btn--sm" onClick={() => fetchTemplateDetail(t.id)}>
                                                    View
                                                </button>
                                                <button className="btn btn--info btn--sm" onClick={() => handleOpenEdit(t)}>
                                                    Edit
                                                </button>
                                                <button className="btn btn--danger btn--sm" onClick={() => handleDelete(t.id)}>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <p>No templates yet. Create one to start generating bills.</p>
                    </div>
                )}

                {/* Template Detail inline */}
                {selectedTemplate && (
                    <div style={{ marginTop: '20px', padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary, rgba(255,255,255,0.03))' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>Template Detail</h3>
                            <button className="btn btn--secondary btn--sm" onClick={() => setSelectedTemplate(null)}>Close</button>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input className="form-input form-input--readonly" value={selectedTemplate.name} readOnly disabled />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <input className="form-input form-input--readonly" value={selectedTemplate.description || 'No description'} readOnly disabled />
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Default Amount</label>
                                <input className="form-input form-input--readonly" value={formatCurrency(selectedTemplate.defaultAmount)} readOnly disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Created At</label>
                                <input className="form-input form-input--readonly" value={selectedTemplate.createdAt ? new Date(selectedTemplate.createdAt).toLocaleString() : '—'} readOnly disabled />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create / Edit Template Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{isEditing ? 'Edit Template' : 'Create Template'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Monthly Management Fee" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input className="form-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Default Amount (VND)</label>
                                <input className="form-input" type="number" value={form.defaultAmount} onChange={e => setForm(p => ({ ...p, defaultAmount: e.target.value }))} placeholder="500000" />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleSave}>{isEditing ? 'Save Changes' : 'Create Template'}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ─────────────────────────────────────────────
   Section: Bills
   ───────────────────────────────────────────── */
function BillsSection({ bills, templates, apartments, fetchBills, toast }) {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBillIds, setSelectedBillIds] = useState([]);

    // Create bill modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ apartmentId: '', title: '', description: '', amount: '', dueDate: '' });

    // Generate bills modal
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generateForm, setGenerateForm] = useState({ templateId: '', apartmentIds: [], dueDate: '' });
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        fetchBills(statusFilter, searchQuery);
        setSelectedBillIds([]);
    }, [statusFilter, searchQuery]);

    const handleCreateBill = async () => {
        if (!createForm.apartmentId || !createForm.title || !createForm.amount) {
            toast('Please fill in apartment, title, and amount', 'error');
            return;
        }
        try {
            await axios.post(`${API_BASE}/api/bills`, {
                apartmentId: Number(createForm.apartmentId),
                title: createForm.title,
                description: createForm.description,
                amount: Number(createForm.amount),
                dueDate: createForm.dueDate || null
            });
            toast('Bill created successfully!', 'success');
            setShowCreateModal(false);
            setCreateForm({ apartmentId: '', title: '', description: '', amount: '', dueDate: '' });
            fetchBills(statusFilter, searchQuery);
        } catch (err) {
            toast(err.response?.data?.error || 'Failed to create bill', 'error');
        }
    };

    const handleOpenGenerate = () => {
        if (templates.length === 0) {
            toast('Please create a bill template first.', 'error');
            return;
        }
        setShowGenerateModal(true);
    };

    const handleGenerateBills = async () => {
        if (!generateForm.templateId || generateForm.apartmentIds.length === 0) {
            toast('Please select a template and at least one apartment', 'error');
            return;
        }
        try {
            const res = await axios.post(`${API_BASE}/api/bills/generate`, {
                templateId: Number(generateForm.templateId),
                apartmentIds: generateForm.apartmentIds.map(Number),
                dueDate: generateForm.dueDate || null
            });
            toast(`Generated ${res.data.generatedCount} bill(s) successfully!`, 'success');
            setShowGenerateModal(false);
            setGenerateForm({ templateId: '', apartmentIds: [], dueDate: '' });
            setSelectAll(false);
            fetchBills(statusFilter, searchQuery);
        } catch (err) {
            toast(err.response?.data?.error || 'Failed to generate bills', 'error');
        }
    };

    // Batch operations
    const modifiableBills = bills.filter(b => b.status === 'UNPAID' || b.status === 'OVERDUE');

    const toggleBillSelection = (billId) => {
        setSelectedBillIds(prev =>
            prev.includes(billId)
                ? prev.filter(id => id !== billId)
                : [...prev, billId]
        );
    };

    const toggleSelectAllBills = () => {
        if (selectedBillIds.length === modifiableBills.length) {
            setSelectedBillIds([]);
        } else {
            setSelectedBillIds(modifiableBills.map(b => b.id));
        }
    };

    const handleBatchMarkPaid = async () => {
        if (selectedBillIds.length === 0) return;
        if (!window.confirm(`Mark ${selectedBillIds.length} bill(s) as paid? This will create an Invoice and Payment record.`)) return;
        try {
            await axios.patch(`${API_BASE}/api/bills/paid`, { billIds: selectedBillIds });
            toast(`${selectedBillIds.length} bill(s) marked as paid!`, 'success');
            setSelectedBillIds([]);
            fetchBills(statusFilter, searchQuery);
        } catch (err) {
            toast(err.response?.data?.error || err.response?.data?.message || 'Failed to mark bills as paid', 'error');
        }
    };

    const handleBatchCancel = async () => {
        if (selectedBillIds.length === 0) return;
        if (!window.confirm(`Cancel ${selectedBillIds.length} bill(s)?`)) return;
        try {
            await axios.patch(`${API_BASE}/api/bills/cancel`, { billIds: selectedBillIds });
            toast(`${selectedBillIds.length} bill(s) cancelled!`, 'success');
            setSelectedBillIds([]);
            fetchBills(statusFilter, searchQuery);
        } catch (err) {
            toast(err.response?.data?.error || err.response?.data?.message || 'Failed to cancel bills', 'error');
        }
    };

    const handleDelete = async (billId) => {
        if (!window.confirm('Are you sure you want to delete this cancelled bill?')) return;
        try {
            await axios.delete(`${API_BASE}/api/bills/${billId}`);
            toast('Bill deleted successfully!', 'success');
            fetchBills(statusFilter, searchQuery);
        } catch (err) {
            toast(err.response?.data?.error || 'Failed to delete bill', 'error');
        }
    };

    const handleSelectAllApartments = (checked) => {
        setSelectAll(checked);
        if (checked) {
            setGenerateForm(prev => ({ ...prev, apartmentIds: apartments.map(a => a.id) }));
        } else {
            setGenerateForm(prev => ({ ...prev, apartmentIds: [] }));
        }
    };

    const handleToggleApartment = (id) => {
        setGenerateForm(prev => {
            const ids = prev.apartmentIds.includes(id)
                ? prev.apartmentIds.filter(a => a !== id)
                : [...prev.apartmentIds, id];
            setSelectAll(ids.length === apartments.length);
            return { ...prev, apartmentIds: ids };
        });
    };

    return (
        <>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px' }}>Bills</h2>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Create and manage apartment bills</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="search-bar">
                            <svg className="search-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <input
                                className="search-bar__input"
                                placeholder="Search bills..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            className="form-input"
                            style={{ width: '160px' }}
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="UNPAID">Unpaid</option>
                            <option value="OVERDUE">Overdue</option>
                            <option value="PAID">Paid</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn--primary" onClick={handleOpenGenerate}>
                            ⚡ Generate from Template
                        </button>
                        <button className="btn btn--info" onClick={() => setShowCreateModal(true)}>
                            + Create Bill
                        </button>
                    </div>
                </div>

                {/* Batch action toolbar */}
                {selectedBillIds.length > 0 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        background: 'var(--accent-bg)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--accent)',
                    }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '14px' }}>
                            {selectedBillIds.length} bill(s) selected
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn--sm" style={{ background: 'var(--success-bg)', color: 'var(--success)' }} onClick={handleBatchMarkPaid}>
                                ✓ Mark Paid
                            </button>
                            <button className="btn btn--warning btn--sm" onClick={handleBatchCancel}>
                                ✕ Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                {bills.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            checked={modifiableBills.length > 0 && selectedBillIds.length === modifiableBills.length}
                                            onChange={toggleSelectAllBills}
                                            disabled={modifiableBills.length === 0}
                                        />
                                    </th>
                                    <th style={{ width: '50px' }}>STT</th>
                                    <th>Apartment</th>
                                    <th>Title</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map((bill, index) => {
                                    const isModifiable = bill.status === 'UNPAID' || bill.status === 'OVERDUE';
                                    const isSelected = selectedBillIds.includes(bill.id);
                                    return (
                                        <tr key={bill.id} style={isSelected ? { background: 'var(--accent-bg)' } : {}}>
                                            <td>
                                                {isModifiable && (
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleBillSelection(bill.id)}
                                                    />
                                                )}
                                            </td>
                                            <td>{index + 1}</td>
                                            <td><strong>{bill.apartmentNumber ? `Room ${bill.apartmentNumber}` : '—'}</strong></td>
                                            <td>{bill.title}</td>
                                            <td>{formatCurrency(bill.amount)}</td>
                                            <td>{bill.dueDate || '—'}</td>
                                            <td>
                                                <span className={`badge ${statusBadge(bill.status)}`}>
                                                    {bill.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button className="btn btn--primary btn--sm" onClick={() => navigate(`/admin-bill/${bill.id}`)}>
                                                        View
                                                    </button>
                                                    {bill.status === 'CANCELLED' && (
                                                        <button className="btn btn--danger btn--sm" onClick={() => handleDelete(bill.id)}>
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <p>No bills found</p>
                    </div>
                )}
            </div>

            {/* Create Bill Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create Custom Bill</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Apartment</label>
                                <select className="form-input" value={createForm.apartmentId} onChange={e => setCreateForm(p => ({ ...p, apartmentId: e.target.value }))}>
                                    <option value="">Select Apartment</option>
                                    {[...apartments]
                                        .sort((a, b) => (a.floor - b.floor) || (a.apartmentNumber || '').localeCompare(b.apartmentNumber || ''))
                                        .map(a => (
                                        <option key={a.id} value={a.id}>Room {a.apartmentNumber} (Floor {a.floor})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input className="form-input" value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Repair Fee" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input className="form-input" value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Amount (VND)</label>
                                <input className="form-input" type="number" value={createForm.amount} onChange={e => setCreateForm(p => ({ ...p, amount: e.target.value }))} placeholder="500000" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Due Date</label>
                                <input className="form-input" type="date" value={createForm.dueDate} onChange={e => setCreateForm(p => ({ ...p, dueDate: e.target.value }))} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleCreateBill}>Create Bill</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Generate Bills Modal */}
            {showGenerateModal && (
                <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Generate Bills from Template</h2>
                            <button className="modal-close" onClick={() => setShowGenerateModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Template</label>
                                <select className="form-input" value={generateForm.templateId} onChange={e => setGenerateForm(p => ({ ...p, templateId: e.target.value }))}>
                                    <option value="">Select Template</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} — {formatCurrency(t.defaultAmount)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Due Date</label>
                                <input className="form-input" type="date" value={generateForm.dueDate} onChange={e => setGenerateForm(p => ({ ...p, dueDate: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Apartments</label>
                                <div style={{ marginBottom: '8px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={selectAll} onChange={e => handleSelectAllApartments(e.target.checked)} />
                                        Select All ({apartments.length})
                                    </label>
                                </div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px' }}>
                                    {[...apartments]
                                        .sort((a, b) => (a.floor - b.floor) || (a.apartmentNumber || '').localeCompare(b.apartmentNumber || ''))
                                        .map(a => (
                                        <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 4px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={generateForm.apartmentIds.includes(a.id)}
                                                onChange={() => handleToggleApartment(a.id)}
                                            />
                                            Room {a.apartmentNumber} (Floor {a.floor})
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowGenerateModal(false)}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleGenerateBills}>
                                Generate {generateForm.apartmentIds.length > 0 ? `(${generateForm.apartmentIds.length})` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ─────────────────────────────────────────────
   Main Page: Bill Management
   ───────────────────────────────────────────── */
export default function AdminBillManagementPage() {
    const toast = useToast();
    const [bills, setBills] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchBills(), fetchApartments(), fetchTemplates()])
            .finally(() => setLoading(false));
    }, []);

    const fetchBills = async (status, search) => {
        try {
            const params = {};
            if (status) params.status = status;
            if (search) params.search = search;
            const res = await axios.get(`${API_BASE}/api/bills`, { params });
            setBills(res.data || []);
        } catch (err) {
            console.error(err);
            toast('Failed to load bills', 'error');
        }
    };

    const fetchApartments = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/apartments`);
            setApartments(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTemplates = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/bill-templates`);
            setTemplates(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return <div className="page-header"><h1>Loading...</h1></div>;
    }

    return (
        <>
            {/* 1. Page Header */}
            <div className="page-header">
                <h1 className="page-header__title">Bill Management</h1>
                <p className="page-header__subtitle">Manage bills, templates, and bill generation for all apartments</p>
            </div>

            {/* 2. Statistics */}
            <BillStatsSection bills={bills} />

            {/* 3. Bill Templates Section */}
            <BillTemplatesSection
                templates={templates}
                fetchTemplates={fetchTemplates}
                toast={toast}
            />

            {/* 4. Bills Section */}
            <BillsSection
                bills={bills}
                templates={templates}
                apartments={apartments}
                fetchBills={fetchBills}
                toast={toast}
            />
        </>
    );
}
