import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import usePagination from '../../hooks/usePagination';
import PaginationControls from '../../components/ui/PaginationControls';

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
    const navigate = useNavigate();
    const toast = useToast();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedBill, setSelectedBill] = useState(null);
    const [selectedBillIds, setSelectedBillIds] = useState([]);
    const [creatingInvoice, setCreatingInvoice] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [billStats, setBillStats] = useState({});

    const {
        currentPage, apiPage, pageSize,
        setCurrentPage, setPageSize, resetPage,
        getAbortSignal,
    } = usePagination({ initialPageSize: 10 });

    const fetchBills = useCallback(async () => {
        const signal = getAbortSignal();
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', apiPage);
            params.set('size', pageSize);
            if (statusFilter) params.set('status', statusFilter);
            
            const res = await axios.get(`${API_BASE}/api/bills/me?${params.toString()}`, { signal });
            setBills(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
        } catch (err) {
            if (axios.isCancel(err)) return;
            console.error(err);
            toast('Failed to load bills', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiPage, pageSize, statusFilter]);

    useEffect(() => { fetchBills(); }, [fetchBills]);

    useEffect(() => {
        axios.get(`${API_BASE}/api/bills/me/stats`)
            .then(res => setBillStats(res.data || {}))
            .catch(err => console.error('Failed to load bill stats', err));
    }, []);

    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
        resetPage();
    };

    const fetchBillDetail = async (billId) => {
        try {
            const res = await axios.get(`${API_BASE}/api/bills/${billId}`);
            setSelectedBill(res.data);
        } catch (err) {
            toast('Failed to load bill details', 'error');
        }
    };

    // Selection logic - only UNPAID/OVERDUE bills can be selected
    const payableBills = bills.filter(b => b.status === 'UNPAID' || b.status === 'OVERDUE');

    const toggleBillSelection = (billId) => {
        setSelectedBillIds(prev =>
            prev.includes(billId)
                ? prev.filter(id => id !== billId)
                : [...prev, billId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedBillIds.length === payableBills.length) {
            setSelectedBillIds([]);
        } else {
            setSelectedBillIds(payableBills.map(b => b.id));
        }
    };

    const selectedTotal = bills
        .filter(b => selectedBillIds.includes(b.id))
        .reduce((sum, b) => sum + (b.amount || 0), 0);

    const handleCreateInvoice = async () => {
        if (selectedBillIds.length === 0) {
            toast('Please select at least one bill', 'error');
            return;
        }
        setCreatingInvoice(true);
        try {
            const res = await axios.post(`${API_BASE}/api/invoices/bill`, {
                billIds: selectedBillIds
            });
            toast('Invoice created successfully!', 'success');
            setSelectedBillIds([]);
            navigate(`/my-invoice/${res.data.id}`);
        } catch (err) {
            toast(err.response?.data?.error || err.response?.data?.message || 'Failed to create invoice', 'error');
        } finally {
            setCreatingInvoice(false);
        }
    };

    const unpaidCount = billStats['UNPAID'] ?? '—';
    const overdueCount = billStats['OVERDUE'] ?? '—';
    const totalOutstanding = null; // Cannot calculate total amount efficiently from counts alone. Assuming this requires a custom endpoint if needed.

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
                    <div className="stat-card__value">{unpaidCount}</div>
                    <div className="stat-card__label">Unpaid</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div className="stat-card__value">{overdueCount}</div>
                    <div className="stat-card__label">Overdue</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <div className="stat-card__value">{totalElements || '—'}</div>
                    <div className="stat-card__label">Total Bills</div>
                </div>
            </div>

            <div className="card">
                {/* Filter + Create Invoice bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 style={{ margin: 0 }}>Bills</h2>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                            className="form-input"
                            style={{ width: '160px' }}
                            value={statusFilter}
                            onChange={handleStatusFilterChange}
                        >
                            <option value="">All Status</option>
                            <option value="UNPAID">Unpaid</option>
                            <option value="OVERDUE">Overdue</option>
                            <option value="PAID">Paid</option>
                        </select>
                    </div>
                </div>

                {/* Selection toolbar - only visible when bills are selected */}
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
                            {selectedBillIds.length} bill(s) selected — Total: {formatCurrency(selectedTotal)}
                        </span>
                        <button
                            className="btn btn--primary"
                            onClick={handleCreateInvoice}
                            disabled={creatingInvoice}
                        >
                            {creatingInvoice ? 'Creating...' : '💳 Create Invoice'}
                        </button>
                    </div>
                )}

                {bills.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    {payableBills.length > 0 && (
                                        <th style={{ width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                checked={payableBills.length > 0 && selectedBillIds.length === payableBills.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                    )}
                                    <th style={{ width: '50px' }}>STT</th>
                                    <th>Title</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map((bill, index) => {
                                    const isPayable = bill.status === 'UNPAID' || bill.status === 'OVERDUE';
                                    const isSelected = selectedBillIds.includes(bill.id);
                                    return (
                                        <tr key={bill.id} style={isSelected ? { background: 'var(--accent-bg)' } : {}}>
                                            {payableBills.length > 0 && (
                                                <td>
                                                    {isPayable && (
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleBillSelection(bill.id)}
                                                        />
                                                    )}
                                                </td>
                                            )}
                                            <td>{index + 1}</td>
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
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <p>No bills found. You're all caught up!</p>
                    </div>
                )}
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={totalElements}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                />
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
