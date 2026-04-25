import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { SkeletonRows } from '../components/LoadingSkeleton';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function AdminPage({ user }) {
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [newUser, setNewUser] = useState({ phoneNumber: '', identityCardNumber: '', apartmentNumber: '', role: 'USER' });

    useEffect(() => {
        Promise.all([fetchUsers(), fetchApartments()]).finally(() => setLoading(false));
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/users`);
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
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

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/api/auth/register`, newUser);
            toast('User created successfully!', 'success');
            setNewUser({ phoneNumber: '', identityCardNumber: '', apartmentNumber: '', role: 'USER' });
            fetchUsers();
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to create user';
            toast(errorMsg, 'error');
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteTarget) return;
        try {
            await axios.delete(`${API_BASE}/api/users/${deleteTarget.id}`);
            toast('User deleted successfully', 'success');
            fetchUsers();
        } catch (err) {
            toast('Failed to delete user', 'error');
        } finally {
            setDeleteTarget(null);
        }
    };

    const filteredUsers = users.filter(u => {
        const q = search.toLowerCase();
        return !q ||
            (u.phoneNumber || '').toLowerCase().includes(q) ||
            (u.username || '').toLowerCase().includes(q) ||
            (u.fullName || '').toLowerCase().includes(q) ||
            (u.apartmentNumber || '').toLowerCase().includes(q);
    });

    const isUserRole = newUser.role === 'USER';
    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    const userCount = users.filter(u => u.role === 'USER').length;

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Dashboard</h1>
                <p className="page-header__subtitle">Welcome back, {user?.fullName || user?.username}</p>
            </div>

            {/* Stats */}
            <div className="stats-grid stagger">
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--accent-bg)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div className="stat-card__value">{users.length}</div>
                    <div className="stat-card__label">Total Users</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--success-bg)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>
                    <div className="stat-card__value">{apartments.length}</div>
                    <div className="stat-card__label">Apartments</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'var(--warning-bg)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div className="stat-card__value">{userCount}</div>
                    <div className="stat-card__label">Residents</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: 'rgba(139,92,246,0.12)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div className="stat-card__value">{adminCount}</div>
                    <div className="stat-card__label">Admins</div>
                </div>
            </div>

            {/* Create User */}
            <div className="card" style={{ marginBottom: '28px' }}>
                <div className="card__title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                    Create New Account
                </div>
                <form onSubmit={handleCreateUser}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Phone Number (= username)</label>
                            <input className="form-input" placeholder="e.g. 0912345678"
                                value={newUser.phoneNumber}
                                onChange={e => setNewUser({ ...newUser, phoneNumber: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">CCCD (= password)</label>
                            <input className="form-input" placeholder="e.g. 001204012345"
                                value={newUser.identityCardNumber}
                                onChange={e => setNewUser({ ...newUser, identityCardNumber: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select className="form-select" value={newUser.role}
                                onChange={e => setNewUser({ ...newUser, role: e.target.value, apartmentNumber: '' })}>
                                <option value="USER">USER (Resident)</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                        </div>
                        {isUserRole && (
                            <div className="form-group">
                                <label className="form-label">Apartment Number</label>
                                <select className="form-select" value={newUser.apartmentNumber}
                                    onChange={e => setNewUser({ ...newUser, apartmentNumber: e.target.value })} required>
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
                        )}
                    </div>
                    <button type="submit" className="btn btn--primary">Create Account</button>
                </form>
            </div>

            {/* Users Table */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div className="card__title" style={{ margin: 0 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        All Users
                        <span className="badge badge--admin" style={{ marginLeft: '4px' }}>{filteredUsers.length}</span>
                    </div>
                    <div className="search-bar">
                        <svg className="search-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input className="search-bar__input" placeholder="Search users…"
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                {loading ? (
                    <SkeletonRows count={5} />
                ) : filteredUsers.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>
                        {search ? 'No users match your search.' : 'No users found.'}
                    </p>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Phone</th>
                                    <th>Full Name</th>
                                    <th>Apartment</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u.id}>
                                        <td style={{ color: 'var(--text-muted)' }}>{u.id}</td>
                                        <td style={{ fontWeight: 600 }}>{u.phoneNumber || u.username}</td>
                                        <td>{u.fullName || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                        <td>
                                            {u.apartmentNumber
                                                ? <span className="badge badge--warning">{u.apartmentNumber}</span>
                                                : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                        </td>
                                        <td><span className={`badge ${u.role === 'ADMIN' ? 'badge--admin' : 'badge--user'}`}>{u.role}</span></td>
                                        <td>
                                            <button
                                                className="btn btn--danger btn--sm"
                                                disabled={u.username === user?.username}
                                                title={u.username === user?.username ? "You can't delete yourself" : "Delete user"}
                                                onClick={() => setDeleteTarget(u)}
                                            >Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {deleteTarget && (
                <Modal
                    title="Delete User"
                    onConfirm={handleDeleteUser}
                    onCancel={() => setDeleteTarget(null)}
                    confirmText="Delete"
                >
                    Are you sure you want to delete <strong>{deleteTarget.fullName || deleteTarget.username}</strong>?
                    This action cannot be undone.
                </Modal>
            )}
        </>
    );
}