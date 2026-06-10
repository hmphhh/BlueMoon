import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { SkeletonProfile } from '../components/LoadingSkeleton';

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

export default function AdminBillDetailPage() {
    const { billId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', description: '', amount: '', dueDate: '', note: '' });

    useEffect(() => {
        fetchBill();
    }, [billId]);

    const fetchBill = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/bills/${billId}`);
            setBill(res.data);
        } catch (err) {
            console.error(err);
            toast('Failed to load bill details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEdit = () => {
        if (!bill) return;
        setEditForm({
            title: bill.title || '',
            description: bill.description || '',
            amount: bill.amount || '',
            dueDate: bill.dueDate || '',
            note: bill.note || ''
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        try {
            await axios.patch(`${API_BASE}/api/bills/${billId}`, {
                title: editForm.title || null,
                description: editForm.description || null,
                amount: editForm.amount ? Number(editForm.amount) : null,
                dueDate: editForm.dueDate || null,
                note: editForm.note || null
            });
            toast('Bill updated successfully!', 'success');
            setShowEditModal(false);
            fetchBill();
        } catch (err) {
            toast(err.response?.data?.error || 'Failed to update bill', 'error');
        }
    };

    const handleMarkPaid = async () => {
        try {
            await axios.patch(`${API_BASE}/api/bills/paid`, { billIds: [Number(billId)] });
            toast('Bill marked as paid!', 'success');
            fetchBill();
        } catch (err) {
            toast(err.response?.data?.error || err.response?.data?.message || 'Failed to mark bill as paid', 'error');
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel this bill?')) return;
        try {
            await axios.patch(`${API_BASE}/api/bills/cancel`, { billIds: [Number(billId)] });
            toast('Bill cancelled!', 'success');
            fetchBill();
        } catch (err) {
            toast(err.response?.data?.error || err.response?.data?.message || 'Failed to cancel bill', 'error');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to permanently delete this bill?')) return;
        try {
            await axios.delete(`${API_BASE}/api/bills/${billId}`);
            toast('Bill deleted successfully!', 'success');
            navigate('/admin-bills');
        } catch (err) {
            toast(err.response?.data?.error || 'Failed to delete bill', 'error');
        }
    };

    if (loading) return <SkeletonProfile />;

    if (!bill) {
        return (
            <div className="card">
                <p>Bill not found</p>
                <button className="btn btn--primary" onClick={() => navigate('/admin-bills')}>Back to Bills</button>
            </div>
        );
    }

    const isModifiable = bill.status === 'UNPAID' || bill.status === 'OVERDUE';

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Bill Details</h1>
                <p className="page-header__subtitle">#{bill.id}</p>
            </div>

            <div className="card profile-card">
                {/* Status Header */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <span className={`badge ${statusBadge(bill.status)}`} style={{ fontSize: '14px', padding: '6px 20px' }}>
                        {bill.status}
                    </span>
                </div>

                {/* Bill Information */}
                <div className="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    Bill Information
                </div>

                <div className="form-group">
                    <label className="form-label">Title</label>
                    <input className="form-input form-input--readonly" value={bill.title || ''} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <input className="form-input form-input--readonly" value={bill.description || 'No description'} readOnly disabled />
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Amount</label>
                        <input className="form-input form-input--readonly" value={formatCurrency(bill.amount)} readOnly disabled />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Due Date</label>
                        <input className="form-input form-input--readonly" value={bill.dueDate || 'No due date'} readOnly disabled />
                    </div>
                </div>

                {/* Apartment Info */}
                <div className="section-title" style={{ marginTop: '28px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/>
                    </svg>
                    Apartment
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Apartment</label>
                        <input className="form-input form-input--readonly" value={bill.apartmentNumber || '—'} readOnly disabled />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Apartment ID</label>
                        <input className="form-input form-input--readonly" value={bill.apartmentId || '—'} readOnly disabled />
                    </div>
                </div>

                {/* Payment Info */}
                <div className="section-title" style={{ marginTop: '28px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    Payment & Timeline
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Created At</label>
                        <input className="form-input form-input--readonly" value={bill.createdAt ? new Date(bill.createdAt).toLocaleString() : '—'} readOnly disabled />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Paid At</label>
                        <input className="form-input form-input--readonly" value={bill.paidAt ? new Date(bill.paidAt).toLocaleString() : 'Not paid yet'} readOnly disabled />
                    </div>
                </div>

                {/* Actions */}
                <div style={{ marginTop: '28px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {isModifiable && (
                        <>
                            <button className="btn btn--primary" onClick={handleOpenEdit}>Edit Bill</button>
                            <button className="btn" style={{ background: 'var(--success-bg)', color: 'var(--success)' }} onClick={handleMarkPaid}>
                                ✓ Mark as Paid
                            </button>
                            <button className="btn btn--warning" onClick={handleCancel}>Cancel Bill</button>
                        </>
                    )}
                    {bill.status === 'CANCELLED' && (
                        <button className="btn btn--danger" onClick={handleDelete}>Delete Bill</button>
                    )}
                    <button className="btn btn--secondary" onClick={() => navigate('/admin-bills')}>Back to Bills</button>
                </div>
            </div>

            {/* Edit Bill Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Bill</h2>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input className="form-input" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input className="form-input" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Amount (VND)</label>
                                <input className="form-input" type="number" value={editForm.amount} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Due Date</label>
                                <input className="form-input" type="date" value={editForm.dueDate} onChange={e => setEditForm(p => ({ ...p, dueDate: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Note</label>
                                <input className="form-input" value={editForm.note} onChange={e => setEditForm(p => ({ ...p, note: e.target.value }))} placeholder="Optional note" />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleSaveEdit}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
