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
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'USER',
        residentId: null
    });
    const [residents, setResidents] = useState([]);
    const [showResidentList, setShowResidentList] = useState(false);
    const [createNewResident, setCreateNewResident] = useState(false);
    const [residentOption, setResidentOption] = useState('none'); // 'none', 'link', 'create'
    const [newResidentData, setNewResidentData] = useState({
        fullName: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        idNumber: '',
        relationship: 'OWNER',
        status: 'ACTIVE',
        apartmentId: null
    });
    const [apartments, setApartments] = useState([]);

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

    const handleCreateClick = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/residents`);
            setResidents(res.data || []);
        } catch (err) {
            console.error(err);
        }
        setShowCreateModal(true);
    };

    const fetchApartments = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/apartments`);
            setApartments(res.data || []);
        } catch (err) {
            console.error('Failed to fetch apartments:', err);
        }
    };

    const handleSelectRole = (role) => {
        setFormData(prev => ({ ...prev, role }));
        if (role === 'ADMIN') {
            setFormData(prev => ({ ...prev, residentId: null }));
            setShowResidentList(false);
            setCreateNewResident(false);
            setResidentOption('none');
        }
    };

    const handleSelectResident = (residentId) => {
        setFormData(prev => ({ ...prev, residentId }));
        setShowResidentList(false);
    };

    const handleCreateAccount = async () => {
        if (!formData.username || !formData.email || !formData.password) {
            toast('Please fill in all required fields', 'error');
            return;
        }

        try {
            const payload = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                residentId: formData.residentId || null
            };

            if (createNewResident && formData.role === 'USER') {
                if (!newResidentData.apartmentId) {
                    toast('Please select an apartment', 'error');
                    return;
                }
                payload.resident = {
                    fullName: newResidentData.fullName,
                    phone: newResidentData.phone,
                    dateOfBirth: newResidentData.dateOfBirth,
                    gender: newResidentData.gender,
                    idNumber: newResidentData.idNumber,
                    relationship: newResidentData.relationship,
                    status: newResidentData.status,
                    apartmentId: newResidentData.apartmentId
                };
            }

            await axios.post(`${API_BASE}/api/users`, payload);
            toast('Account created successfully!', 'success');
            setShowCreateModal(false);
            setFormData({
                username: '',
                email: '',
                password: '',
                role: 'USER',
                residentId: null
            });
            setCreateNewResident(false);
            setResidentOption('none');
            setNewResidentData({
                fullName: '',
                phone: '',
                dateOfBirth: '',
                gender: '',
                idNumber: '',
                relationship: 'OWNER',
                status: 'ACTIVE',
                apartmentId: null
            });
            fetchUsers();
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.message || 'Failed to create account', 'error');
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
                                <th>Username</th>
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
                                    <td><strong>{user.username}</strong></td>
                                    <td>{user.email}</td>
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
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
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
                                <label className="form-label">Username</label>
                                <input className="form-input" placeholder="Username"
                                    value={formData.username}
                                    onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" type="email" placeholder="Email"
                                    value={formData.email}
                                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input className="form-input" type="password" placeholder="Password"
                                    value={formData.password}
                                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                />
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

                            {formData.role === 'USER' && (
                                <>
                                    {/* Resident Linking Section */}
                                    <div className="section-title" style={{ marginTop: '24px' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                        </svg>
                                        Resident Linking
                                    </div>

                                    <div className="form-group">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                                <input type="radio" name="residentOption" checked={residentOption === 'none'}
                                                    onChange={() => { setResidentOption('none'); setFormData(prev => ({ ...prev, residentId: null })); setCreateNewResident(false); }}
                                                    style={{ accentColor: 'var(--accent)' }}
                                                />
                                                No resident
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                                <input type="radio" name="residentOption" checked={residentOption === 'link'}
                                                    onChange={() => { setResidentOption('link'); setCreateNewResident(false); }}
                                                    style={{ accentColor: 'var(--accent)' }}
                                                />
                                                Link existing resident
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                                <input type="radio" name="residentOption" checked={residentOption === 'create'}
                                                    onChange={() => { setResidentOption('create'); setCreateNewResident(true); setFormData(prev => ({ ...prev, residentId: null })); fetchApartments(); }}
                                                    style={{ accentColor: 'var(--accent)' }}
                                                />
                                                Create new resident
                                            </label>
                                        </div>
                                    </div>

                                    {residentOption === 'link' && (
                                        <div className="form-group">
                                            <label className="form-label">Select Resident</label>
                                            <div style={{
                                                border: '1px solid var(--border)', borderRadius: '8px', maxHeight: '200px',
                                                overflowY: 'auto'
                                            }}>
                                                {residents.filter(r => !r.linked).length > 0 ? (
                                                    residents.filter(r => !r.linked).map(resident => (
                                                        <button
                                                            key={resident.id}
                                                            className={`btn btn--ghost`}
                                                            onClick={() => handleSelectResident(resident.id)}
                                                            style={{
                                                                width: '100%', textAlign: 'left', padding: '10px',
                                                                borderBottom: '1px solid var(--border)', justifyContent: 'flex-start',
                                                                borderRadius: 0,
                                                                backgroundColor: formData.residentId === resident.id ? 'var(--accent-bg)' : 'transparent',
                                                                color: formData.residentId === resident.id ? 'var(--accent-hover)' : 'var(--text-secondary)'
                                                            }}
                                                        >
                                                            {resident.fullName} ({resident.idNumber})
                                                        </button>
                                                    ))
                                                ) : (
                                                    <p style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>No unlinked residents available.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {residentOption === 'create' && (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label">Full Name</label>
                                                <input className="form-input" placeholder="Full Name"
                                                    value={newResidentData.fullName}
                                                    onChange={e => setNewResidentData(prev => ({ ...prev, fullName: e.target.value }))}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Phone</label>
                                                <input className="form-input" placeholder="Phone"
                                                    value={newResidentData.phone}
                                                    onChange={e => setNewResidentData(prev => ({ ...prev, phone: e.target.value }))}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Date of Birth</label>
                                                <input className="form-input" type="date"
                                                    value={newResidentData.dateOfBirth}
                                                    onChange={e => setNewResidentData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Gender</label>
                                                <select className="form-input" value={newResidentData.gender}
                                                    onChange={e => setNewResidentData(prev => ({ ...prev, gender: e.target.value }))}>
                                                    <option value="">Select</option>
                                                    <option value="MALE">Male</option>
                                                    <option value="FEMALE">Female</option>
                                                    <option value="OTHER">Other</option>
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">ID Number</label>
                                                <input className="form-input" placeholder="ID Number"
                                                    value={newResidentData.idNumber}
                                                    onChange={e => setNewResidentData(prev => ({ ...prev, idNumber: e.target.value }))}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Relationship</label>
                                                <select className="form-input" value={newResidentData.relationship}
                                                    onChange={e => setNewResidentData(prev => ({ ...prev, relationship: e.target.value }))}>
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
                                                <select className="form-input" value={newResidentData.apartmentId || ''}
                                                    onChange={e => setNewResidentData(prev => ({ ...prev, apartmentId: e.target.value ? Number(e.target.value) : null }))}>
                                                    <option value="">Select Apartment</option>
                                                    {apartments.map(apt => (
                                                        <option key={apt.id} value={apt.id}>
                                                            Room {apt.number || apt.apartmentNumber} (Floor {apt.floor})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    )}
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
