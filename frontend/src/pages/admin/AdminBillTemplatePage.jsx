import { useState, useEffect } from 'react';
import { isDigitsOnly } from '../../utils/inputFormatters';
import axios from 'axios';
import { useToast } from '../../components/ui/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const formatCurrency = (amount) => {
    if (amount == null) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function AdminBillTemplatePage() {
    const toast = useToast();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', defaultAmount: '' });

    // Detail view
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/bill-templates`);
            setTemplates(res.data || []);
        } catch (err) {
            console.error(err);
            toast('Failed to load templates', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplateDetail = async (id) => {
        try {
            const res = await axios.get(`${API_BASE}/api/bill-templates/${id}`);
            setSelectedTemplate(res.data);
        } catch (err) {
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

    if (loading) {
        return <div className="page-header"><h1>Loading...</h1></div>;
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Bill Templates</h1>
                <p className="page-header__subtitle">Manage reusable bill definitions</p>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Templates ({templates.length})</h2>
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
            </div>

            {/* Template Detail Card */}
            {selectedTemplate && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ margin: 0 }}>Template Detail</h2>
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

            {/* Create / Edit Modal */}
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
                                <input className="form-input" type="text" inputMode="numeric" value={form.defaultAmount} onChange={e => { if (isDigitsOnly(e.target.value)) setForm(p => ({ ...p, defaultAmount: e.target.value })); }} placeholder="500000" />
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
