import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { SkeletonRows } from '../components/LoadingSkeleton';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const BILL_TYPES = [
    { value: 'ELECTRICITY', label: 'Electricity', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { value: 'WATER', label: 'Water', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    { value: 'SERVICE', label: 'Service', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    { value: 'PARKING', label: 'Parking', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { value: 'OTHER', label: 'Other', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
];

const STATUS_MAP = {
    UNPAID: { label: 'Unpaid', className: 'badge--danger' },
    PAID: { label: 'Paid', className: 'badge--success' },
    OVERDUE: { label: 'Overdue', className: 'badge--warning' },
};

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function BillsPage({ user }) {
    const toast = useToast();
    const [bills, setBills] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [newBill, setNewBill] = useState({
        apartmentNumber: '',
        billType: 'ELECTRICITY',
        amount: '',
        description: '',
        dueDate: '',
    });

    useEffect(() => {
        Promise.all([fetchBills(), fetchApartments()]).finally(() => setLoading(false));
    }, []);

    const fetchBills = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/bills`);
            setBills(res.data);
        } catch (err) {
            console.error('Failed to fetch bills', err);
        }
    };

    const fetchApartments = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/apartments`);
            setApartments(res.data);
        } catch (err) {
            console.error('Failed to fetch apartments', err);
        }
    };

    const handleCreateBill = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/api/bills`, {
                ...newBill,
                amount: parseFloat(newBill.amount),
            });
            toast('Bill created successfully!', 'success');
            setNewBill({ apartmentNumber: '', billType: 'ELECTRICITY', amount: '', description: '', dueDate: '' });
            fetchBills();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Failed to create bill';
            toast(errorMsg, 'error');
        }
    };

    const handleStatusChange = async (billId, newStatus) => {
        try {
            await axios.patch(`${API_BASE}/api/bills/${billId}/status?status=${newStatus}`);
            toast(`Bill marked as ${newStatus.toLowerCase()}`, 'success');
            fetchBills();
        } catch (err) {
            console.error(err);
            toast('Failed to update status', 'error');
        }
    };

    const filteredBills = bills.filter(b => {
        const q = search.toLowerCase();
        const matchesSearch = !q ||
            (b.apartmentNumber || '').toLowerCase().includes(q) ||
            (b.description || '').toLowerCase().includes(q) ||
            (b.billType || '').toLowerCase().includes(q);
        const matchesType = !filterType || b.billType === filterType;
        const matchesStatus = !filterStatus || b.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    const totalUnpaid = bills.filter(b => b.status === 'UNPAID').length;
    const totalPaid = bills.filter(b => b.status === 'PAID').length;
    const totalOverdue = bills.filter(b => b.status === 'OVERDUE').length;
    const totalAmount = bills.reduce((sum, b) => sum + (b.status === 'UNPAID' ? b.amount : 0), 0);

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Bill Management</h1>
                <p className="page-header__subtitle">Create and manage apartment bills</p>
            </div>

            {/* Stats */}
            <div className="stats-grid stagger">
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--accent-bg)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div className="stat-card__value">{bills.length}</div>
                    <div className="stat-card__label">Total Bills</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--danger-bg)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <div className="stat-card__value">{totalUnpaid}</div>
                    <div className="stat-card__label">Unpaid</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--success-bg)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div className="stat-card__value">{totalPaid}</div>
                    <div className="stat-card__label">Paid</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--warning-bg)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    </div>
                    <div className="stat-card__value">{formatCurrency(totalAmount)}</div>
                    <div className="stat-card__label">Outstanding</div>
                </div>
            </div>

            {/* Create Bill */}
            <div className="card" style={{ marginBottom: '28px' }}>
                <div className="card__title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                    Create New Bill
                </div>
                <form onSubmit={handleCreateBill}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Apartment</label>
                            <select className="form-select" value={newBill.apartmentNumber}
                                onChange={e => setNewBill({ ...newBill, apartmentNumber: e.target.value })} required>
                                <option value="">-- Select Apartment --</option>
                                {apartments
                                    .sort((a, b) => a.apartmentNumber.localeCompare(b.apartmentNumber, undefined, { numeric: true }))
                                    .map(apt => (
                                        <option key={apt.id} value={apt.apartmentNumber}>
                                            Room {apt.apartmentNumber} (Floor {apt.apartmentNumber[0]})
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Bill Type</label>
                            <select className="form-select" value={newBill.billType}
                                onChange={e => setNewBill({ ...newBill, billType: e.target.value })}>
                                {BILL_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Amount (VND)</label>
                            <input className="form-input" type="number" step="1000" min="1" placeholder="e.g. 500000"
                                value={newBill.amount}
                                onChange={e => setNewBill({ ...newBill, amount: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Due Date</label>
                            <input className="form-input" type="date"
                                value={newBill.dueDate}
                                onChange={e => setNewBill({ ...newBill, dueDate: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Description (optional)</label>
                            <input className="form-input" placeholder="e.g. May 2026 electricity bill"
                                value={newBill.description}
                                onChange={e => setNewBill({ ...newBill, description: e.target.value })} />
                        </div>
                    </div>
                    <button type="submit" className="btn btn--primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Create Bill
                    </button>
                </form>
            </div>

            {/* Bills Table */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div className="card__title" style={{ margin: 0 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        All Bills
                        <span className="badge badge--admin" style={{ marginLeft: '4px' }}>{filteredBills.length}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <select className="form-select bill-filter-select" value={filterType}
                            onChange={e => setFilterType(e.target.value)}>
                            <option value="">All Types</option>
                            {BILL_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        <select className="form-select bill-filter-select" value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="UNPAID">Unpaid</option>
                            <option value="PAID">Paid</option>
                            <option value="OVERDUE">Overdue</option>
                        </select>
                        <div className="search-bar">
                            <svg className="search-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <input className="search-bar__input" placeholder="Search bills…"
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <SkeletonRows count={5} />
                ) : filteredBills.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>
                        {search || filterType || filterStatus ? 'No bills match your filters.' : 'No bills yet. Create one above!'}
                    </p>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Apartment</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBills.map(b => {
                                    const typeInfo = BILL_TYPES.find(t => t.value === b.billType) || BILL_TYPES[4];
                                    const statusInfo = STATUS_MAP[b.status] || STATUS_MAP.UNPAID;
                                    return (
                                        <tr key={b.id}>
                                            <td style={{ color: 'var(--text-muted)' }}>{b.id}</td>
                                            <td><span className="badge badge--warning">{b.apartmentNumber}</span></td>
                                            <td>
                                                <span className="bill-type-badge" style={{ background: typeInfo.bg, color: typeInfo.color }}>
                                                    {typeInfo.label}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{formatCurrency(b.amount)}</td>
                                            <td>{formatDate(b.dueDate)}</td>
                                            <td><span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span></td>
                                            <td style={{ color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {b.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    {b.status !== 'PAID' && (
                                                        <button className="btn btn--sm" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
                                                            onClick={() => handleStatusChange(b.id, 'PAID')}
                                                            title="Mark as Paid">
                                                            Paid
                                                        </button>
                                                    )}
                                                    {b.status === 'UNPAID' && (
                                                        <button className="btn btn--warning btn--sm"
                                                            onClick={() => handleStatusChange(b.id, 'OVERDUE')}
                                                            title="Mark as Overdue">
                                                            Overdue
                                                        </button>
                                                    )}
                                                    {b.status === 'PAID' && (
                                                        <button className="btn btn--danger btn--sm"
                                                            onClick={() => handleStatusChange(b.id, 'UNPAID')}
                                                            title="Mark as Unpaid">
                                                            Unpaid
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
                )}
            </div>
        </>
    );
}
