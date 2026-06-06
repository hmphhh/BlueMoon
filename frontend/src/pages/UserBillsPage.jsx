import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast';

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
        default: return 'badge--info';
    }
};

export default function UserBillsPage() {
    const toast = useToast();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedBill, setSelectedBill] = useState(null);

    useEffect(() => {
        fetchBills();
    }, [statusFilter]);

    const fetchBills = async () => {
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            const res = await axios.get(`${API_BASE}/api/bills/me`, { params });
            setBills(res.data || []);
        } catch (err) {
            console.error(err);
            toast('Failed to load bills', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchBillDetail = async (billId) => {
        try {
            const res = await axios.get(`${API_BASE}/api/bills/${billId}`);
            setSelectedBill(res.data);
        } catch (err) {
            toast('Failed to load bill details', 'error');
        }
    };

    const unpaidBills = bills.filter(b => b.status === 'UNPAID');
    const overdueBills = bills.filter(b => b.status === 'OVERDUE');
    const totalOutstanding = [...unpaidBills, ...overdueBills].reduce((sum, b) => sum + (b.amount || 0), 0);

    if (loading) {
        return <div className="page-header"><h1>Loading...</h1></div>;
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">My Bills</h1>
                <p className="page-header__subtitle">View your apartment's billing history</p>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    </div>
                    <div className="stat-card__value">{unpaidBills.length}</div>
                    <div className="stat-card__label">Unpaid</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div className="stat-card__value">{overdueBills.length}</div>
                    <div className="stat-card__label">Overdue</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <div className="stat-card__value">{formatCurrency(totalOutstanding)}</div>
                    <div className="stat-card__label">Total Outstanding</div>
                </div>
            </div>

            <div className="card">
                {/* Filter */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Bills</h2>
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
                    </select>
                </div>

                {bills.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map(bill => (
                                    <tr key={bill.id}>
                                        <td><strong>{bill.title}</strong></td>
                                        <td>{formatCurrency(bill.amount)}</td>
                                        <td>{bill.dueDate || '—'}</td>
                                        <td>
                                            <span className={`badge ${statusBadge(bill.status)}`}>
                                                {bill.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn--primary btn--sm" onClick={() => fetchBillDetail(bill.id)}>
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <p>No bills found. You're all caught up!</p>
                    </div>
                )}
            </div>

            {/* Bill Detail Modal */}
            {selectedBill && (
                <div className="modal-overlay" onClick={() => setSelectedBill(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Bill Details</h2>
                            <button className="modal-close" onClick={() => setSelectedBill(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                <span className={`badge ${statusBadge(selectedBill.status)}`} style={{ fontSize: '13px', padding: '5px 16px' }}>
                                    {selectedBill.status}
                                </span>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input className="form-input form-input--readonly" value={selectedBill.title || ''} readOnly disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input className="form-input form-input--readonly" value={selectedBill.description || 'No description'} readOnly disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Amount</label>
                                <input className="form-input form-input--readonly" value={formatCurrency(selectedBill.amount)} readOnly disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Due Date</label>
                                <input className="form-input form-input--readonly" value={selectedBill.dueDate || 'No due date'} readOnly disabled />
                            </div>
                            {selectedBill.paidAt && (
                                <div className="form-group">
                                    <label className="form-label">Paid At</label>
                                    <input className="form-input form-input--readonly" value={new Date(selectedBill.paidAt).toLocaleString()} readOnly disabled />
                                </div>
                            )}

                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setSelectedBill(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
