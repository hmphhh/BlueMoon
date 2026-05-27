import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { SkeletonProfile } from '../components/LoadingSkeleton';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export default function AdminApartmentDetailPage() {
    const { apartmentId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [apartmentData, setApartmentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ number: '', floor: '', area: '', type: '' });

    const formatType = (type) => {
        const map = { STUDIO: 'Studio', ONE_BEDROOM: '1 Bedroom', TWO_BEDROOM: '2 Bedroom', THREE_BEDROOM: '3 Bedroom', PENTHOUSE: 'Penthouse' };
        return map[type] || type;
    };

    useEffect(() => {
        fetchApartmentDetails();
    }, [apartmentId]);

    const fetchApartmentDetails = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/apartments/${apartmentId}`);
            setApartmentData(res.data);
        } catch (err) {
            console.error(err);
            toast('Failed to load apartment details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEditModal = () => {
        setEditForm({
            number: apartmentData.apartmentNumber || '',
            floor: apartmentData.floor || '',
            area: apartmentData.area || '',
            type: apartmentData.type || ''
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        try {
            await axios.put(`${API_BASE}/api/apartments/${apartmentId}`, {
                number: editForm.number,
                floor: editForm.floor,
                area: editForm.area,
                type: editForm.type
            });
            toast('Apartment updated successfully!', 'success');
            setShowEditModal(false);
            fetchApartmentDetails();
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.message || 'Failed to update apartment', 'error');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE': return 'badge--success';
            case 'TEMPORARILY_ABSENT': return 'badge--warning';
            case 'MOVED_OUT': return 'badge--danger';
            default: return '';
        }
    };

    if (loading) {
        return <SkeletonProfile />;
    }

    if (!apartmentData) {
        return (
            <div className="card">
                <p>Apartment not found</p>
                <button className="btn btn--primary" onClick={() => navigate('/apartments')}>
                    Back to Apartments
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Apartment Details</h1>
                <p className="page-header__subtitle">{apartmentData.apartmentNumber}</p>
            </div>

            <div className="card profile-card">
                <div className="profile-avatar">
                    <span>{(apartmentData.apartmentNumber || 'A')[0].toUpperCase()}</span>
                </div>

                <div className="profile-meta">
                    <strong>{apartmentData.apartmentNumber}</strong> ·{' '}
                    <span className={`badge ${apartmentData.status === 'OCCUPIED' ? 'badge--success' : apartmentData.status === 'VACANT' ? 'badge--warning' : 'badge--info'}`}>
                        {apartmentData.status}
                    </span>
                    {apartmentData.type && (
                        <>
                            {' '}· <span className="badge badge--info">{formatType(apartmentData.type)}</span>
                        </>
                    )}
                </div>

                {/* Apartment Information */}
                <div className="section-title" style={{ marginTop: '28px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    Apartment Information
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">
                        Apartment Number <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly" value={apartmentData.apartmentNumber} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">
                        Floor <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly" value={apartmentData.floor} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">
                        Area <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly" value={`${apartmentData.area} m²`} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">
                        Type <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly" value={formatType(apartmentData.type)} readOnly disabled />
                </div>

                <div className="form-group">
                    <label className="form-label form-label--with-badge">
                        Status <span className="badge badge--lock">locked</span>
                    </label>
                    <input className="form-input form-input--readonly" value={apartmentData.status} readOnly disabled />
                </div>

                <div style={{ marginTop: '20px' }}>
                    <button className="btn btn--primary" onClick={handleOpenEditModal}>
                        Edit Apartment
                    </button>
                </div>

                {/* Residents */}
                <div className="section-title" style={{ marginTop: '28px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    Residents
                </div>

                {apartmentData.residents && apartmentData.residents.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Full Name</th>
                                    <th>ID Number</th>
                                    <th>Phone</th>
                                    <th>Gender</th>
                                    <th>Relationship</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {apartmentData.residents.map(resident => (
                                    <tr key={resident.id}>
                                        <td><strong>{resident.fullName}</strong></td>
                                        <td>{resident.idNumber}</td>
                                        <td>{resident.phone}</td>
                                        <td>{resident.gender}</td>
                                        <td>{resident.relationship}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(resident.status)}`}>
                                                {resident.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn--primary btn--sm"
                                                onClick={() => navigate(`/resident/${resident.id}`)}
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
                    <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                        No residents in this apartment.
                    </p>
                )}

                <div style={{ marginTop: '28px' }}>
                    <button className="btn btn--secondary" onClick={() => navigate('/apartments')}>
                        Back to Apartments
                    </button>
                </div>
            </div>

            {/* Edit Apartment Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Apartment</h2>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Apartment Number</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    value={editForm.number}
                                    onChange={e => setEditForm({ ...editForm, number: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Floor</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    value={editForm.floor}
                                    onChange={e => setEditForm({ ...editForm, floor: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Area</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    value={editForm.area}
                                    onChange={e => setEditForm({ ...editForm, area: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select
                                    className="form-input"
                                    value={editForm.type}
                                    onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                                >
                                    <option value="STUDIO">Studio</option>
                                    <option value="ONE_BEDROOM">1 Bedroom</option>
                                    <option value="TWO_BEDROOM">2 Bedroom</option>
                                    <option value="THREE_BEDROOM">3 Bedroom</option>
                                    <option value="PENTHOUSE">Penthouse</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setShowEditModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn--primary" onClick={handleSaveEdit}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
