import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { SkeletonRows } from '../components/LoadingSkeleton';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const formatCurrency = (amount) => {
    if (amount == null) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const billStatusBadge = (status) => {
    switch (status) {
        case 'UNPAID': return 'badge--warning';
        case 'OVERDUE': return 'badge--danger';
        case 'PAID': return 'badge--success';
        case 'CANCELLED': return 'badge--secondary';
        default: return 'badge--info';
    }
};

export default function AdminApartmentBillsPage() {
    const { apartmentId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [billStatusFilter, setBillStatusFilter] = useState('');
    const [billingSummary, setBillingSummary] = useState(null);
    const [apartmentNumber, setApartmentNumber] = useState('');

    useEffect(() => {
        fetchApartmentDetails();
    }, [apartmentId]);

    useEffect(() => {
        fetchBills();
    }, [apartmentId, billStatusFilter]);

    const fetchApartmentDetails = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/apartments/${apartmentId}`);
            setBillingSummary(res.data?.billingSummary || null);
            setApartmentNumber(res.data?.apartmentNumber || '');
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBills = async () => {
        setLoading(true);
        try {
            const params = {};
            if (billStatusFilter) params.status = billStatusFilter;
            const res = await axios.get(`${API_BASE}/api/apartments/${apartmentId}/bills`, { params });
            setBills(res.data || []);
        } catch (err) {
            console.error(err);
            toast('Failed to load bills', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">
                    {apartmentNumber ? `Apartment ${apartmentNumber} - Bills` : 'Apartment Bills'}
                </h1>
                <p className="page-header__subtitle">Billing and payment history</p>
            </div>

            {/* Billing Summary Cards */}
            {billingSummary && (
                <div className="stats-grid" style={{ marginBottom: '24px' }}>
                    <div className="stat-card">
                        <div className="stat-card__value" style={{ fontSize: '20px', color: 'var(--warning)' }}>{billingSummary.unpaidCount || 0}</div>
                        <div className="stat-card__label">Unpaid</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card__value" style={{ fontSize: '20px', color: 'var(--danger)' }}>{billingSummary.overdueCount || 0}</div>
                        <div className="stat-card__label">Overdue</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card__value" style={{ fontSize: '16px' }}>{formatCurrency(billingSummary.totalOutstanding || 0)}</div>
                        <div className="stat-card__label">Outstanding</div>
                    </div>
                </div>
            )}

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                    <select
                        className="form-input"
                        style={{ width: '160px' }}
                        value={billStatusFilter}
                        onChange={e => setBillStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="UNPAID">Unpaid</option>
                        <option value="OVERDUE">Overdue</option>
                        <option value="PAID">Paid</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                {loading ? (
                    <SkeletonRows count={4} />
                ) : bills.length > 0 ? (
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
                                            <span className={`badge ${billStatusBadge(bill.status)}`}>
                                                {bill.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn--primary btn--sm"
                                                onClick={() => navigate(`/admin-bill/${bill.id}`)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)' }}>
                        No bills for this apartment.
                    </p>
                )}
            </div>

            <div style={{ marginTop: '24px' }}>
                <button className="btn btn--secondary" onClick={() => navigate(`/apartment/${apartmentId}`)}>
                    Back to Apartment
                </button>
            </div>
        </>
    );
}
