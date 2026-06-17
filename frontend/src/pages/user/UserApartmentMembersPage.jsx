import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { SkeletonRows } from '../../components/ui/LoadingSkeleton';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function UserApartmentMembersPage() {
    const navigate = useNavigate();
    const toast = useToast();

    const [users, setUsers] = useState([]);
    const [apartmentNumber, setApartmentNumber] = useState('');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE': return 'badge--success';
            case 'TEMPORARILY_ABSENT': return 'badge--warning';
            case 'MOVED_OUT': return 'badge--danger';
            default: return 'badge--info';
        }
    };

    useEffect(() => {
        fetchApartmentInfo();
        fetchMembers();
    }, []);

    const fetchApartmentInfo = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/apartments/me`);
            setApartmentNumber(res.data?.apartmentNumber || '');
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/apartments/me/users`);
            setUsers(res.data || []);
        } catch (err) {
            console.error(err);
            toast('Failed to load apartment members', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        let result = users;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(u =>
                (u.fullName && u.fullName.toLowerCase().includes(q)) ||
                (u.phone && u.phone.toLowerCase().includes(q))
            );
        }
        if (statusFilter) {
            result = result.filter(u => u.status === statusFilter);
        }
        return result;
    }, [users, search, statusFilter]);

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">
                    {apartmentNumber ? `Apartment ${apartmentNumber} - Members` : 'Apartment Members'}
                </h1>
                <p className="page-header__subtitle">People living in your apartment</p>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <input
                        className="form-input"
                        style={{ width: '220px' }}
                        type="text"
                        placeholder="Search by name or phone..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <select
                        className="form-input"
                        style={{ width: '180px' }}
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="TEMPORARILY_ABSENT">Temporarily Absent</option>
                        <option value="MOVED_OUT">Moved Out</option>
                    </select>
                </div>

                {loading ? (
                    <SkeletonRows count={4} />
                ) : filteredUsers.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Full Name</th>
                                    <th>Phone</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td><strong>{user.fullName || '—'}</strong></td>
                                        <td>{user.phone || '—'}</td>
                                        <td><span className="badge">{user.role}</span></td>
                                        <td>
                                            {user.status ? (
                                                <span className={`badge ${getStatusBadge(user.status)}`}>
                                                    {user.status}
                                                </span>
                                            ) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)' }}>
                        {users.length > 0 ? 'No members match your filters.' : 'No members found.'}
                    </p>
                )}
            </div>

            <div style={{ marginTop: '24px' }}>
                <button className="btn btn--secondary" onClick={() => navigate('/my-apartment')}>
                    Back to My Apartment
                </button>
            </div>
        </>
    );
}
