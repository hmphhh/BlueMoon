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

const invoiceStatusBadge = (status) => {
    switch (status) {
        case 'PENDING': return 'badge--warning';
        case 'PAID': return 'badge--success';
        case 'EXPIRED': return 'badge--secondary';
        case 'CANCELLED': return 'badge--danger';
        default: return 'badge--info';
    }
};

export default function UserInvoicesPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [invoiceStats, setInvoiceStats] = useState({});

    const {
        currentPage, apiPage, pageSize,
        setCurrentPage, setPageSize, resetPage,
        getAbortSignal,
    } = usePagination({ initialPageSize: 10 });

    const fetchInvoices = useCallback(async () => {
        const signal = getAbortSignal();
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', apiPage);
            params.set('size', pageSize);
            if (statusFilter) params.set('status', statusFilter);
            const res = await axios.get(`${API_BASE}/api/invoices/me?${params.toString()}`, { signal });
            setInvoices(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
        } catch (err) {
            if (axios.isCancel(err)) return;
            console.error(err);
            toast('Failed to load invoices', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiPage, pageSize, statusFilter]);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    useEffect(() => {
        axios.get(`${API_BASE}/api/invoices/me/stats`)
            .then(res => setInvoiceStats(res.data || {}))
            .catch(err => console.error('Failed to load invoice stats', err));
    }, []);

    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
        resetPage();
    };

    const pendingCount = invoiceStats['PENDING'] ?? '—';
    const paidCount = invoiceStats['PAID'] ?? '—';
    const totalPending = null; // Requires aggregate endpoint if amount is needed

    if (loading) {
        return <div className="page-header"><h1>Loading...</h1></div>;
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">My Invoices</h1>
                <p className="page-header__subtitle">View your payment invoices</p>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    </div>
                    <div className="stat-card__value">{pendingCount}</div>
                    <div className="stat-card__label">Pending</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div className="stat-card__value">{paidCount}</div>
                    <div className="stat-card__label">Paid</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <div className="stat-card__value">{totalElements || '—'}</div>
                    <div className="stat-card__label">Total Invoices</div>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Invoices</h2>
                    <select
                        className="form-input"
                        style={{ width: '160px' }}
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                    >
                        <option value="">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="PAID">Paid</option>
                    </select>
                </div>

                {invoices.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Invoice Code</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(inv => (
                                    <tr key={inv.id}>
                                        <td><strong>{inv.invoiceCode}</strong></td>
                                        <td>{formatCurrency(inv.totalAmount)}</td>
                                        <td>
                                            <span className={`badge ${invoiceStatusBadge(inv.status)}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td>{inv.createdAt ? new Date(inv.createdAt).toLocaleString() : '—'}</td>
                                        <td>
                                            <button className="btn btn--primary btn--sm" onClick={() => navigate(`/my-invoice/${inv.id}`)}>
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
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <p>No invoices found. Create one from your bills page!</p>
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
        </>
    );
}
