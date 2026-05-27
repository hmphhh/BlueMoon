import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function AdminApartmentManagementPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [apartments, setApartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        number: '',
        floor: '',
        area: '',
        type: 'STUDIO'
    });

    const formatType = (type) => {
        const map = { STUDIO: 'Studio', ONE_BEDROOM: '1 Bedroom', TWO_BEDROOM: '2 Bedroom', THREE_BEDROOM: '3 Bedroom', PENTHOUSE: 'Penthouse' };
        return map[type] || type;
    };

    useEffect(() => {
        fetchApartments();
    }, []);

    const fetchApartments = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/apartments`);
            setApartments(res.data || []);
        } catch (err) {
            console.error(err);
            toast('Failed to load apartments', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this apartment?')) return;
        try {
            await axios.delete(`${API_BASE}/api/apartments/${id}`);
            toast('Apartment deleted successfully!', 'success');
            fetchApartments();
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.message || 'Failed to delete apartment', 'error');
        }
    };

    const handleCreateApartment = async () => {
        if (!formData.number || !formData.floor || !formData.area) {
            toast('Please fill in all required fields', 'error');
            return;
        }

        try {
            await axios.post(`${API_BASE}/api/apartments`, {
                number: formData.number,
                floor: Number(formData.floor),
                area: Number(formData.area),
                type: formData.type
            });
            toast('Apartment created successfully!', 'success');
            setShowCreateModal(false);
            setFormData({
                number: '',
                floor: '',
                area: '',
                type: 'STUDIO'
            });
            fetchApartments();
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.message || 'Failed to create apartment', 'error');
        }
    };

    const filteredApartments = apartments.filter(apt =>
        apt.number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="page-header"><h1>Loading...</h1></div>;
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Apartment Management</h1>
                <p className="page-header__subtitle">Manage building apartments</p>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div className="search-bar">
                        <span className="search-bar__icon">🔍</span>
                        <input
                            className="search-bar__input"
                            type="text"
                            placeholder="Search by apartment number..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
                        + Create Apartment
                    </button>
                </div>

                {filteredApartments.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Apartment Number</th>
                                <th>Floor</th>
                                <th>Area (m²)</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Residents</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredApartments.map(apt => (
                                <tr key={apt.id}>
                                    <td><strong>{apt.number}</strong></td>
                                    <td>{apt.floor}</td>
                                    <td>{apt.area} m²</td>
                                    <td><span className="badge">{formatType(apt.type)}</span></td>
                                    <td>
                                        <span className={`badge ${apt.status === 'OCCUPIED' ? 'badge--success' : 'badge--warning'}`}>
                                            {apt.status === 'OCCUPIED' ? 'Occupied' : 'Vacant'}
                                        </span>
                                    </td>
                                    <td>{apt.residentCount}</td>
                                    <td>
                                        <button
                                            className="btn btn--primary btn--sm"
                                            onClick={() => navigate(`/apartment/${apt.id}`)}
                                        >
                                            View Details
                                        </button>
                                        <button
                                            className="btn btn--danger btn--sm"
                                            style={{ marginLeft: '8px' }}
                                            onClick={() => handleDelete(apt.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No apartments found.</p>
                )}
            </div>

            {/* Create Apartment Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create Apartment</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Apartment Number</label>
                                <input className="form-input" placeholder="Apartment Number"
                                    value={formData.number}
                                    onChange={e => setFormData(prev => ({ ...prev, number: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Floor</label>
                                <input className="form-input" type="number" placeholder="Floor"
                                    value={formData.floor}
                                    onChange={e => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Area (m²)</label>
                                <input className="form-input" type="number" placeholder="Area in m²"
                                    value={formData.area}
                                    onChange={e => setFormData(prev => ({ ...prev, area: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select className="form-input" value={formData.type}
                                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}>
                                    <option value="STUDIO">Studio</option>
                                    <option value="ONE_BEDROOM">1 Bedroom</option>
                                    <option value="TWO_BEDROOM">2 Bedroom</option>
                                    <option value="THREE_BEDROOM">3 Bedroom</option>
                                    <option value="PENTHOUSE">Penthouse</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn--primary" onClick={handleCreateApartment}>
                                Create Apartment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
