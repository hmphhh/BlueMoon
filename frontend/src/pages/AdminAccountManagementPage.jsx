import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function AdminAccountManagementPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [apartments, setApartments] = useState([]);

    // Pagination
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Search and filters
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('USER');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterApartmentId, setFilterApartmentId] = useState('');

    // Create form
    const [formData, setFormData] = useState({
        role: 'USER',
        phone: '', idNumber: '', fullName: '',
        dateOfBirth: '', gender: '',
        relationship: 'OTHER', apartmentId: null
    });

    useEffect(() => {
        fetchUsers();
    }, [page, search, filterRole, filterStatus, filterApartmentId]);

    const fetchUsers = async () => {
        try {
            const params = new URLSearchParams();
            params.set('page', page);
            params.set('size', size);
            if (search) params.set('search', search);
            if (filterRole) params.set('role', filterRole);
            if (filterStatus) params.set('status', filterStatus);
            if (filterApartmentId) params.set('apartmentId', filterApartmentId);

            const res = await axios.get(`${API_BASE}/api/users?${params.toString()}`);
            const data = res.data;
            setUsers(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (err) {
            console.error(err);
            toast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchApartments = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/apartments`);
            setApartments(res.data || []);
        } catch (err) {
            console.error('Failed to fetch apartments:', err);
        }
    };

    const handleCreateClick = async () => {
        await fetchApartments();
        setFormData({
            role: 'USER',
            phone: '', idNumber: '', fullName: '',
            dateOfBirth: '', gender: '',
            relationship: 'OTHER', apartmentId: null
        });
        setShowCreateModal(true);
    };

    const handleSelectRole = (role) => {
        setFormData(prev => ({ ...prev, role }));
    };

    const handleCreateAccount = async () => {
        if (!formData.phone || !formData.idNumber || !formData.fullName || !formData.dateOfBirth || !formData.gender) {
            toast('Please fill in all account information fields', 'error');
            return;
        }

        if (formData.role === 'USER') {
            if (!formData.apartmentId) {
                toast('Please select an apartment', 'error');
                return;
            }
        }

        try {
            const payload = {
                phone: formData.phone,
                idNumber: formData.idNumber,
                fullName: formData.fullName,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                role: formData.role
            };

            if (formData.role === 'USER') {
                payload.relationship = formData.relationship;
                payload.apartmentId = formData.apartmentId;
            }

            await axios.post(`${API_BASE}/api/users`, payload);
            toast('Account created successfully!', 'success');
            setShowCreateModal(false);
            fetchUsers();
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.error || 'Failed to create account', 'error');
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

    const [activeTab, setActiveTab] = useState('USER');

    // Split users by role for display
    const adminUsers = users.filter(u => u.role === 'ADMIN');
    const regularUsers = users.filter(u => u.role === 'USER');

    if (loading) {
        return <div className="page-header"><h1>Loading...</h1></div>;
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Account Management</h1>
                <p className="page-header__subtitle">Manage user accounts</p>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>Accounts ({totalElements})</h2>
                    <button className="btn btn--primary" onClick={handleCreateClick}>
                        + Create Account
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid var(--border-color, #333)' }}>
                    <button
                        onClick={() => { setActiveTab('USER'); setFilterRole('USER'); setFilterStatus(''); setPage(0); }}
                        style={{
                            padding: '10px 24px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                            border: 'none', background: 'none',
                            color: activeTab === 'USER' ? 'var(--primary, #7c6ef0)' : 'var(--text-muted, #888)',
                            borderBottom: activeTab === 'USER' ? '2px solid var(--primary, #7c6ef0)' : '2px solid transparent',
                            marginBottom: '-2px', transition: 'all 0.2s ease'
                        }}
                    >
                        User Accounts
                    </button>
                    <button
                        onClick={() => { setActiveTab('ADMIN'); setFilterRole('ADMIN'); setFilterStatus(''); setPage(0); }}
                        style={{
                            padding: '10px 24px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                            border: 'none', background: 'none',
                            color: activeTab === 'ADMIN' ? 'var(--primary, #7c6ef0)' : 'var(--text-muted, #888)',
                            borderBottom: activeTab === 'ADMIN' ? '2px solid var(--primary, #7c6ef0)' : '2px solid transparent',
                            marginBottom: '-2px', transition: 'all 0.2s ease'
                        }}
                    >
                        Admin Accounts
                    </button>
                </div>

                {/* Search and Filters */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <input
                        className="form-input"
                        style={{ flex: '1', minWidth: '200px' }}
                        placeholder="Search by name, phone, ID..."
                        value={search}
                        onChange={handleSearchChange}
                    />
                    {activeTab === 'USER' && (
                        <select className="form-input" style={{ width: '180px' }} value={filterStatus}
                            onChange={e => { setFilterStatus(e.target.value); setPage(0); }}>
                            <option value="">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="TEMPORARILY_ABSENT">Temporarily Absent</option>
                            <option value="MOVED_OUT">Moved Out</option>
                        </select>
                    )}
                </div>

                {/* Admin Accounts Table */}
                {activeTab === 'ADMIN' && (
                    <>
                        {users.length > 0 ? (
                            <>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Full Name</th>
                                            <th>ID Number</th>
                                            <th>Phone</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id}>
                                                <td><strong>{u.fullName || '—'}</strong></td>
                                                <td>{u.idNumber || '—'}</td>
                                                <td>{u.phone || '—'}</td>
                                                <td>
                                                    <button
                                                        className="btn btn--primary btn--sm"
                                                        onClick={() => navigate(`/account/${u.id}`)}
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
                            <p>No admin accounts found.</p>
                        )}
                    </>
                )}

                {/* User Accounts Table */}
                {activeTab === 'USER' && (
                    <>
                        {users.length > 0 ? (
                            <>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Full Name</th>
                                            <th>ID Number</th>
                                            <th>Phone</th>
                                            <th>Status</th>
                                            <th>Apartment</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id}>
                                                <td><strong>{u.fullName || '—'}</strong></td>
                                                <td>{u.idNumber || '—'}</td>
                                                <td>{u.phone || '—'}</td>
                                                <td>
                                                    {u.status ? (
                                                        <span className={`badge ${u.status === 'ACTIVE' ? 'badge--success' : u.status === 'MOVED_OUT' ? 'badge--danger' : 'badge--warning'}`}>
                                                            {u.status}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                <td>{u.apartmentNumber || '—'}</td>
                                                <td>
                                                    <button
                                                        className="btn btn--primary btn--sm"
                                                        onClick={() => navigate(`/account/${u.id}`)}
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
                            <p>No user accounts found.</p>
                        )}
                    </>
                )}
            </div>

            {/* Create Account Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Account</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* Account Information Section */}
                            <div className="section-title" style={{ marginTop: 0 }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="1"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                                </svg>
                                Account Information
                            </div>

                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        className={`btn ${formData.role === 'USER' ? 'btn--primary' : 'btn--secondary'}`}
                                        onClick={() => handleSelectRole('USER')}
                                    >
                                        User
                                    </button>
                                    <button
                                        className={`btn ${formData.role === 'ADMIN' ? 'btn--primary' : 'btn--secondary'}`}
                                        onClick={() => handleSelectRole('ADMIN')}
                                    >
                                        Admin
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input className="form-input" placeholder="e.g. 0912345678"
                                    value={formData.phone}
                                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                />
                                <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Used as the login account</small>
                            </div>

                            <div className="form-group">
                                <label className="form-label">ID Number (CCCD)</label>
                                <input className="form-input" placeholder="e.g. 001204012345"
                                    value={formData.idNumber}
                                    onChange={e => setFormData(prev => ({ ...prev, idNumber: e.target.value }))}
                                />
                                <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Used as the default login password</small>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input className="form-input" placeholder="Full Name"
                                    value={formData.fullName}
                                    onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Date of Birth</label>
                                <input className="form-input" type="date"
                                    value={formData.dateOfBirth}
                                    onChange={e => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Gender</label>
                                <select className="form-input" value={formData.gender}
                                    onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}>
                                    <option value="">Select</option>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            {/* Resident Information Section — only for USER role */}
                            {formData.role === 'USER' && (
                                <>
                                    <div className="section-title" style={{ marginTop: '24px' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                        </svg>
                                        Resident Information
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Relationship</label>
                                        <select className="form-input" value={formData.relationship}
                                            onChange={e => setFormData(prev => ({ ...prev, relationship: e.target.value }))}>
                                            <option value="OWNER">Owner</option>
                                            <option value="SPOUSE">Spouse</option>
                                            <option value="CHILD">Child</option>
                                            <option value="PARENT">Parent</option>
                                            <option value="SIBLING">Sibling</option>
                                            <option value="RELATIVE">Relative</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Apartment</label>
                                        <select className="form-input" value={formData.apartmentId || ''}
                                            onChange={e => setFormData(prev => ({ ...prev, apartmentId: e.target.value ? Number(e.target.value) : null }))}>
                                            <option value="">Select Apartment</option>
                                            {[...apartments]
                                                .sort((a, b) => (a.floor - b.floor) || (a.apartmentNumber || '').localeCompare(b.apartmentNumber || ''))
                                                .map(apt => (
                                                <option key={apt.id} value={apt.id}>
                                                    Room {apt.apartmentNumber} (Floor {apt.floor})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn--primary" onClick={handleCreateAccount}>
                                Create Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
