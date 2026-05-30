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
    const [formData, setFormData] = useState({
        phoneNumber: '',
        identityCardNumber: '',
        role: 'USER',
        fullName: '',
        dateOfBirth: '',
        gender: '',
        relationship: 'OWNER',
        apartmentId: null
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/users`);
            setUsers(res.data || []);
        } catch (err) {
            console.error(err);
            toast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Valid room numbers for the current 4×3 building layout
    const VALID_ROOMS = ['101','102','103','201','202','203','301','302','303','401','402','403'];

    const fetchApartments = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/apartments`);
            // Filter out stale apartments from old configurations
            const validApts = (res.data || []).filter(apt =>
                VALID_ROOMS.includes(apt.number || apt.apartmentNumber)
            );
            setApartments(validApts);
        } catch (err) {
            console.error('Failed to fetch apartments:', err);
        }
    };

    const handleCreateClick = async () => {
        await fetchApartments();
        setFormData({
            phoneNumber: '',
            identityCardNumber: '',
            role: 'USER',
            fullName: '',
            dateOfBirth: '',
            gender: '',
            relationship: 'OWNER',
            apartmentId: null
        });
        setShowCreateModal(true);
    };

    const handleSelectRole = (role) => {
        setFormData(prev => ({ ...prev, role }));
    };

    const handleCreateAccount = async () => {
        if (!formData.phoneNumber || !formData.identityCardNumber) {
            toast('Please fill in Phone Number and ID Number (CCCD)', 'error');
            return;
        }

        if (formData.role === 'USER') {
            if (!formData.fullName || !formData.dateOfBirth || !formData.gender || !formData.apartmentId) {
                toast('Please fill in all resident information fields', 'error');
                return;
            }
        }

        try {
            const payload = {
                phoneNumber: formData.phoneNumber,
                identityCardNumber: formData.identityCardNumber,
                role: formData.role
            };

            // Include resident fields only for USER role
            if (formData.role === 'USER') {
                payload.fullName = formData.fullName;
                payload.dateOfBirth = formData.dateOfBirth;
                payload.gender = formData.gender;
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
                    <h2>Accounts</h2>
                    <button className="btn btn--primary" onClick={handleCreateClick}>
                        + Create Account
                    </button>
                </div>

                {users.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Phone</th>
                                <th>CCCD</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Linked</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td><strong>{user.phoneNumber || user.username}</strong></td>
                                    <td>{user.identityCardNumber || '—'}</td>
                                    <td>{user.email || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                    <td><span className="badge">{user.role}</span></td>
                                    <td>
                                        <span className={`badge ${user.verified ? 'badge--success' : 'badge--warning'}`}>
                                            {user.verified ? 'Verified' : 'Unverified'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.linked ? 'badge--info' : 'badge--secondary'}`}>
                                            {user.linked ? 'Linked' : 'Not Linked'}
                                        </span>
                                    </td>
                                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
                                    <td>
                                        <button
                                            className="btn btn--primary btn--sm"
                                            onClick={() => navigate(`/account/${user.id}`)}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No accounts found.</p>
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
                                    value={formData.phoneNumber}
                                    onChange={e => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">ID Number (CCCD)</label>
                                <input className="form-input" placeholder="e.g. 001204012345"
                                    value={formData.identityCardNumber}
                                    onChange={e => setFormData(prev => ({ ...prev, identityCardNumber: e.target.value }))}
                                />
                            </div>

                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '-4px', marginBottom: '16px' }}>
                                ⓘ Password will be automatically set to the CCCD value above.
                            </p>

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
                                                .sort((a, b) => (a.floor - b.floor) || (a.number || a.apartmentNumber || '').localeCompare(b.number || b.apartmentNumber || ''))
                                                .map(apt => (
                                                <option key={apt.id} value={apt.id}>
                                                    Room {apt.number || apt.apartmentNumber} (Floor {apt.floor})
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
