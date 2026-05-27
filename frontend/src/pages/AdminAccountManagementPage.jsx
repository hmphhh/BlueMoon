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

    const handleSelectRole = (role) => {
        setFormData(prev => ({ ...prev, role }));
        if (role === 'ADMIN') {
            setFormData(prev => ({ ...prev, residentId: null }));
            setShowResidentList(false);
            setCreateNewResident(false);
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
                                    <div className="form-group">
                                        <label className="form-label">Resident Profile</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                className={`btn ${!createNewResident ? 'btn--primary' : 'btn--secondary'}`}
                                                onClick={() => setCreateNewResident(false)}
                                            >
                                                Link Existing
                                            </button>
                                            <button
                                                className={`btn ${createNewResident ? 'btn--primary' : 'btn--secondary'}`}
                                                onClick={() => setCreateNewResident(true)}
                                            >
                                                Create New
                                            </button>
                                        </div>
                                    </div>

                                    {!createNewResident ? (
                                        <div className="form-group">
                                            <label className="form-label">Select Resident</label>
                                            <div style={{
                                                border: '1px solid #ddd', borderRadius: '6px', maxHeight: '200px',
                                                overflowY: 'auto'
                                            }}>
                                                {residents.filter(r => !r.linked).map(resident => (
                                                    <button
                                                        key={resident.id}
                                                        className={`btn btn--ghost ${formData.residentId === resident.id ? 'selected' : ''}`}
                                                        onClick={() => handleSelectResident(resident.id)}
                                                        style={{
                                                            width: '100%', textAlign: 'left', padding: '10px',
                                                            borderBottom: '1px solid #eee', justifyContent: 'flex-start',
                                                            backgroundColor: formData.residentId === resident.id ? '#f0f0f0' : 'transparent'
                                                        }}
                                                    >
                                                        {resident.fullName} ({resident.idNumber})
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
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
                                                <label className="form-label">ID Number</label>
                                                <input className="form-input" placeholder="ID Number"
                                                    value={newResidentData.idNumber}
                                                    onChange={e => setNewResidentData(prev => ({ ...prev, idNumber: e.target.value }))}
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
