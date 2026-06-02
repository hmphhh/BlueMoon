import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function AdminReportManagementPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');

    // Pagination
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    useEffect(() => {
        fetchReports();
    }, [page, activeTab]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', page);
            params.set('size', size);
            if (activeTab !== 'ALL') {
                params.set('status', activeTab);
            }

            const res = await axios.get(`${API_BASE}/api/reports?${params.toString()}`);
            const data = res.data;
            setReports(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (err) {
            console.error(err);
            toast('Failed to load reports', 'error');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { key: 'ALL', label: 'All' },
        { key: 'PENDING', label: 'Pending' },
        { key: 'APPROVED', label: 'Approved' },
        { key: 'REJECTED', label: 'Rejected' },
    ];

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'APPROVED': return 'badge--success';
            case 'REJECTED': return 'badge--danger';
            case 'PENDING': return 'badge--warning';
            default: return 'badge--secondary';
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading && reports.length === 0) {
        return <div className="page-header"><h1>Loading...</h1></div>;
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Report Management</h1>
                <p className="page-header__subtitle">Review and manage resident reports</p>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>Reports ({totalElements})</h2>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid var(--border-color, #333)' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setPage(0); }}
                            style={{
                                padding: '10px 24px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                                border: 'none', background: 'none',
                                color: activeTab === tab.key ? 'var(--primary, #7c6ef0)' : 'var(--text-muted, #888)',
                                borderBottom: activeTab === tab.key ? '2px solid var(--primary, #7c6ef0)' : '2px solid transparent',
                                marginBottom: '-2px', transition: 'all 0.2s ease'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Reports Table */}
                {reports.length > 0 ? (
                    <>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Reporter</th>
                                    <th>Apartment</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map(r => (
                                    <tr key={r.id}>
                                        <td><strong>{r.title}</strong></td>
                                        <td>{r.createdBy?.fullName || '—'}</td>
                                        <td>{r.createdBy?.apartmentNumber || '—'}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(r.status)}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{formatDate(r.createdAt)}</td>
                                        <td>
                                            <button
                                                className="btn btn--primary btn--sm"
                                                onClick={() => navigate(`/admin-report/${r.id}`)}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                                <button className="btn btn--secondary btn--sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                                    ← Previous
                                </button>
                                <span style={{ padding: '6px 12px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                    Page {page + 1} of {totalPages}
                                </span>
                                <button className="btn btn--secondary btn--sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        <p>No reports found.</p>
                    </div>
                )}
            </div>
        </>
    );
}
