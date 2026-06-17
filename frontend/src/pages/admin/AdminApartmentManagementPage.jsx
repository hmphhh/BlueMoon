import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

// Fixed building layout: 4 floors × 3 rooms = 12 apartments
const FLOORS = [1, 2, 3, 4];
const ROOM_LIST = [
    { number: '101', floor: 1 }, { number: '102', floor: 1 }, { number: '103', floor: 1 },
    { number: '201', floor: 2 }, { number: '202', floor: 2 }, { number: '203', floor: 2 },
    { number: '301', floor: 3 }, { number: '302', floor: 3 }, { number: '303', floor: 3 },
    { number: '401', floor: 4 }, { number: '402', floor: 4 }, { number: '403', floor: 4 },
];

const VALID_ROOM_NUMBERS = ROOM_LIST.map(r => r.number);

const formatType = (type) => {
    const map = { STUDIO: 'Studio', ONE_BEDROOM: '1 Bedroom', TWO_BEDROOM: '2 Bedroom', THREE_BEDROOM: '3 Bedroom', PENTHOUSE: 'Penthouse' };
    return map[type] || type;
};

/* ── Accordion styles ── */
const styles = {
    floorAccordion: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    floorHeader: (isOpen) => ({
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: isOpen ? 'var(--primary, #4f46e5)' : 'var(--bg-secondary, #f8f9fa)',
        color: isOpen ? '#fff' : 'inherit',
        borderRadius: isOpen ? '12px 12px 0 0' : '12px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        border: isOpen ? 'none' : '1px solid var(--border, #e5e7eb)',
        userSelect: 'none',
    }),
    floorBadge: (isOpen) => ({
        fontSize: '13px',
        padding: '6px 16px',
        borderRadius: '20px',
        background: isOpen ? 'rgba(255,255,255,0.2)' : 'var(--primary, #4f46e5)',
        color: '#fff',
        fontWeight: 500,
    }),
    chevron: (isOpen) => ({
        transition: 'transform 0.25s ease',
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        opacity: 0.9,
    }),
    floorBody: (isOpen) => ({
        maxHeight: isOpen ? '1000px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
        borderRadius: '0 0 12px 12px',
        border: isOpen ? '1px solid var(--border, #e5e7eb)' : 'none',
        borderTop: 'none',
    }),
    roomRow: {
        display: 'grid',
        // Thiết lập kích thước cố định để gom thông tin về bên trái
        gridTemplateColumns: '100px 160px 150px 180px 1fr 140px',
        alignItems: 'center',
        padding: '18px 24px',
        borderBottom: '1px solid var(--border, #e5e7eb)',
    },
    roomNumber: {
        fontWeight: 700,
        fontSize: '16px',
    },
    roomActions: {
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end',
    },
};

export default function AdminApartmentManagementPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [apartments, setApartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedFloor, setExpandedFloor] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        selectedRoom: '',
        area: '',
        type: 'STUDIO'
    });

    useEffect(() => {
        fetchApartments();
    }, []);

    const fetchApartments = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/apartments`);
            const validApartments = (res.data || []).filter(apt =>
                VALID_ROOM_NUMBERS.includes(apt.apartmentNumber)
            );
            setApartments(validApartments);
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
            toast(err.response?.data?.error || 'Failed to delete apartment', 'error');
        }
    };

    const availableRooms = ROOM_LIST.filter(
        room => !apartments.some(apt => apt.apartmentNumber === room.number)
    );

    const handleCreateApartment = async () => {
        if (!formData.selectedRoom || !formData.area) {
            toast('Please select a room and fill in the area', 'error');
            return;
        }

        const room = ROOM_LIST.find(r => r.number === formData.selectedRoom);
        if (!room) return;

        try {
            await axios.post(`${API_BASE}/api/apartments`, {
                number: room.number,
                floor: room.floor,
                area: Number(formData.area),
                type: formData.type
            });
            toast('Apartment created successfully!', 'success');
            setShowCreateModal(false);
            setFormData({ selectedRoom: '', area: '', type: 'STUDIO' });
            fetchApartments();
        } catch (err) {
            console.error(err);
            toast(err.response?.data?.error || 'Failed to create apartment', 'error');
        }
    };

    const toggleFloor = (floor) => {
        setExpandedFloor(prev => prev === floor ? null : floor);
    };

    const getFloorApartments = (floor) => {
        return apartments
            .filter(apt => apt.floor === floor)
            .sort((a, b) => (a.apartmentNumber || '').localeCompare(b.apartmentNumber || ''));
    };

    const getFloorStats = (floor) => {
        const floorApts = getFloorApartments(floor);
        const created = floorApts.length;
        const occupied = floorApts.filter(a => a.status === 'OCCUPIED').length;
        const totalUsers = floorApts.reduce((sum, a) => sum + (a.userCount || 0), 0);
        return { created, occupied, totalUsers };
    };

    if (loading) {
        return <div className="page-header"><h1>Loading...</h1></div>;
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Apartment Management</h1>
                <p className="page-header__subtitle">Manage building apartments (4 floors × 3 rooms)</p>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0 }}>Building Overview</h2>
                    <button
                        className="btn btn--primary"
                        onClick={() => setShowCreateModal(true)}
                        disabled={availableRooms.length === 0}
                    >
                        {availableRooms.length > 0 ? '+ Create Apartment' : 'All 12 rooms created'}
                    </button>
                </div>

                <div style={styles.floorAccordion}>
                    {FLOORS.map(floor => {
                        const isOpen = expandedFloor === floor;
                        const floorApts = getFloorApartments(floor);
                        const stats = getFloorStats(floor);

                        return (
                            <div key={floor}>
                                {/* Floor Header */}
                                <div style={styles.floorHeader(isOpen)} onClick={() => toggleFloor(floor)}>

                                    {/* Nhóm Bên Trái: Đã tăng gap lên 48px để giãn chữ Floor 4 và Badges */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
                                        {/* Tên Tầng */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '100px' }}>
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                                                <path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" />
                                                <path d="M8 10h.01" /><path d="M16 10h.01" />
                                            </svg>
                                            <span style={{ fontWeight: 600, fontSize: '16px' }}>Floor {floor}</span>
                                        </div>

                                        {/* Stats Badges: Đã tăng gap lên 20px để 2 badge giãn xa nhau ra */}
                                        <div style={{ display: 'flex', gap: '48px' }}>
                                            <span style={styles.floorBadge(isOpen)}>
                                                {stats.occupied}/{stats.created} occupied
                                            </span>
                                            {stats.totalUsers > 0 && (
                                                <span style={styles.floorBadge(isOpen)}>
                                                    {stats.totalUsers} user{stats.totalUsers !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bên Phải: Icon Mũi Tên */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <svg style={styles.chevron(isOpen)} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </div>

                                </div>

                                {/* Floor Body (Rooms) */}
                                <div style={styles.floorBody(isOpen)}>
                                    {floorApts.length > 0 ? (
                                        floorApts.map((apt, idx) => (
                                            <div
                                                key={apt.id}
                                                style={{
                                                    ...styles.roomRow,
                                                    borderBottom: idx === floorApts.length - 1 ? 'none' : styles.roomRow.borderBottom,
                                                }}
                                            >
                                                {/* 1. Số Phòng */}
                                                <span style={styles.roomNumber}>{apt.apartmentNumber}</span>

                                                {/* 2. Loại Phòng */}
                                                <div>
                                                    <span className="badge badge--info">{formatType(apt.type)}</span>
                                                </div>

                                                {/* 3. Diện Tích */}
                                                <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                                                    {apt.area} m²
                                                </div>

                                                {/* 4. Trạng Thái */}
                                                <div>
                                                    <span className={`badge ${apt.status === 'OCCUPIED' ? 'badge--success' : 'badge--warning'}`}>
                                                        {apt.status === 'OCCUPIED' ? 'OCCUPIED' : 'VACANT'}
                                                    </span>
                                                </div>

                                                {/* 5. Số người ở - Chiếm 1fr để đẩy các nút về sát phải */}
                                                <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                                                    {apt.userCount > 0 ? `👤 ${apt.userCount}` : ''}
                                                </div>

                                                {/* 6. Các nút hành động */}
                                                <div style={styles.roomActions}>
                                                    <button
                                                        className="btn btn--primary btn--sm"
                                                        onClick={() => navigate(`/apartment/${apt.id}`)}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        className="btn btn--danger btn--sm"
                                                        onClick={() => handleDelete(apt.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No rooms created on this floor yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
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
                                <label className="form-label">Room</label>
                                <select className="form-input" value={formData.selectedRoom}
                                    onChange={e => setFormData(prev => ({ ...prev, selectedRoom: e.target.value }))}>
                                    <option value="">Select Room</option>
                                    {availableRooms.map(room => (
                                        <option key={room.number} value={room.number}>
                                            Room {room.number} (Floor {room.floor})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {formData.selectedRoom && (
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '-4px', marginBottom: '16px' }}>
                                    ⓘ Floor is automatically set to {ROOM_LIST.find(r => r.number === formData.selectedRoom)?.floor} based on room number.
                                </p>
                            )}

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