import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    Calendar as CalendarIcon, 
    Plus, 
    Search, 
    Filter, 
    Clock, 
    User, 
    AlertTriangle, 
    Repeat, 
    QrCode, 
    X, 
    CheckCircle2, 
    XCircle, 
    Bed, 
    Layers, 
    Edit, 
    Trash2,
    ShieldAlert,
    ChevronDown,
    ListFilter
} from 'lucide-react';

export default function Index({ appointments = [], patients = [], availableBeds = [], shiftGrid = { pagi: [], siang: [] }, stats = {}, filters = {} }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [cancellingAppointment, setCancellingAppointment] = useState(null);

    const appointmentsList = Array.isArray(appointments) ? appointments : (appointments.data || []);
    const safePagiGrid = Array.isArray(shiftGrid?.pagi) ? shiftGrid.pagi : [];
    const safeSiangGrid = Array.isArray(shiftGrid?.siang) ? shiftGrid.siang : [];
    const totalBeds = stats?.total_beds || shiftGrid?.total_beds || availableBeds?.length || 12;

    // Filter Form
    const filterForm = useForm({
        date: filters.date || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }),
        shift: filters.shift || '',
        status: filters.status || '',
        search: filters.search || '',
    });

    const handleFilterChange = (field, value) => {
        const updated = { ...filterForm.data, [field]: value };
        filterForm.setData(field, value);
        router.get(route('admin.appointments.index'), updated, { preserveState: true, replace: true });
    };

    const getFirstAvailableBedNum = (preferredBed = '1') => {
        let bedList = [];
        if (Array.isArray(availableBeds) && availableBeds.length > 0) {
            bedList = availableBeds;
        } else if (safePagiGrid.length > 0) {
            bedList = safePagiGrid.map(g => ({ bed_number: g.bed_number, status: g.operational_status || g.master_bed_status, is_usable: g.is_usable }));
        }

        const cleanPref = String(preferredBed).replace(/^Bed\s*/i, '');
        const prefObj = bedList.find(b => String(b.bed_number).replace(/^Bed\s*/i, '') === cleanPref);

        if (prefObj) {
            const st = (prefObj.status || prefObj.operational_status || '').toLowerCase();
            const isUsable = prefObj.is_usable !== false && st !== 'rusak' && st !== 'maintenance' && st !== 'damaged' && st !== 'perbaikan';
            if (isUsable) {
                return cleanPref;
            }
        }

        const firstAvail = bedList.find(b => {
            const st = (b.status || b.operational_status || '').toLowerCase();
            return b.is_usable !== false && st !== 'rusak' && st !== 'maintenance' && st !== 'damaged' && st !== 'perbaikan';
        });

        if (firstAvail) {
            return String(firstAvail.bed_number).replace(/^Bed\s*/i, '');
        }

        return '1';
    };

    const renderBedOptions = () => {
        let list = [];
        if (Array.isArray(availableBeds) && availableBeds.length > 0) {
            list = availableBeds.map(b => {
                const cleanNum = String(b.bed_number || '').replace(/^Bed\s*/i, '');
                const st = (b.status || 'available').toLowerCase();
                const isUsable = b.is_usable !== false && st !== 'rusak' && st !== 'maintenance' && st !== 'damaged' && st !== 'perbaikan';
                return { cleanNum, status: st, isUsable, label: b.label };
            });
        } else {
            const gridList = safePagiGrid.length > 0 ? safePagiGrid : safeSiangGrid;
            if (gridList.length > 0) {
                list = gridList.map(g => {
                    const cleanNum = String(g.bed_number || '').replace(/^Bed\s*/i, '');
                    const st = (g.operational_status || g.master_bed_status || 'available').toLowerCase();
                    const isUsable = g.is_usable !== false && st !== 'rusak' && st !== 'maintenance' && st !== 'damaged' && st !== 'perbaikan';
                    return { cleanNum, status: st, isUsable, label: null };
                });
            } else {
                list = Array.from({ length: 12 }, (_, i) => ({
                    cleanNum: String(i + 1),
                    status: 'available',
                    isUsable: true,
                    label: null
                }));
            }
        }

        return list.map(b => {
            let badgeText = ' (Tersedia)';
            if (!b.isUsable) {
                if (b.status === 'rusak' || b.status === 'damaged') {
                    badgeText = ' (RUSAK - Tidak Tersedia)';
                } else if (b.status === 'maintenance' || b.status === 'perbaikan') {
                    badgeText = ' (MAINTENANCE - Tidak Tersedia)';
                } else {
                    badgeText = ` (${b.status.toUpperCase()} - Tidak Tersedia)`;
                }
            }

            return (
                <option
                    key={`bed-option-${b.cleanNum}`}
                    value={b.cleanNum}
                    disabled={!b.isUsable}
                    className={!b.isUsable ? 'text-slate-400 bg-slate-100 font-semibold' : 'text-slate-900 font-bold'}
                >
                    Bed {b.cleanNum}{badgeText}
                </option>
            );
        });
    };

    // Create Form
    const createForm = useForm({
        patient_id: '',
        appointment_date: filters.date || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }),
        shift: 'pagi',
        bed_number: getFirstAvailableBedNum('1'),
        is_recurring: false,
        recurring_weeks: 4,
        emergency_override: false,
    });

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createForm.post(route('admin.appointments.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const openCreateForBed = (shift, bedNum) => {
        const safeBedNum = getFirstAvailableBedNum(bedNum);
        createForm.setData({
            ...createForm.data,
            shift: shift,
            bed_number: safeBedNum,
            appointment_date: filterForm.data.date,
        });
        setIsCreateOpen(true);
    };

    // Edit Form
    const editForm = useForm({
        appointment_date: '',
        shift: 'pagi',
        bed_number: '',
        status: 'scheduled',
        emergency_override: false,
    });

    const openEditModal = (app) => {
        if (!app) return;
        setEditingAppointment(app);
        const rawBed = app.bed_number ? String(app.bed_number).replace(/^Bed\s*/i, '') : '1';
        const safeBedNum = getFirstAvailableBedNum(rawBed);
        editForm.setData({
            appointment_date: app.appointment_date ? String(app.appointment_date).substring(0, 10) : '',
            shift: app.shift || 'pagi',
            bed_number: safeBedNum,
            status: app.status || 'scheduled',
            emergency_override: app.emergency_override || false,
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        editForm.put(route('admin.appointments.update', editingAppointment.id), {
            onSuccess: () => setEditingAppointment(null),
        });
    };

    // Cancel Form
    const cancelForm = useForm({
        cancellation_reason: '',
    });

    const handleCancelSubmit = (e) => {
        e.preventDefault();
        cancelForm.post(route('admin.appointments.cancel', cancellingAppointment.id), {
            onSuccess: () => {
                setCancellingAppointment(null);
                cancelForm.reset();
            },
        });
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus data janji temu ini?')) {
            router.delete(route('admin.appointments.destroy', id));
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'scheduled':
            case 'approved':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'checked-in':
            case 'arrived':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'in-progress':
            case 'in_progress':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'completed':
                return 'bg-teal-100 text-teal-800 border-teal-200';
            case 'no-show':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'cancelled':
                return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'pending_approval':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const renderBedCard = (item, shift) => {
        const cleanBedNum = item.bed_number ? String(item.bed_number).replace(/^Bed\s*/i, '') : '?';
        const bedTitle = `Bed ${cleanBedNum}`;
        const opStatus = (item.operational_status || item.master_bed_status || '').toLowerCase();
        const isUnusable = item.is_usable === false || opStatus === 'rusak' || opStatus === 'damaged' || opStatus === 'maintenance' || opStatus === 'perbaikan';
        const isDamaged = opStatus === 'rusak' || opStatus === 'damaged';

        if (isUnusable && !item.is_occupied) {
            return (
                <div
                    key={`${shift}-bed-${cleanBedNum}`}
                    className="p-3 rounded-xl border flex flex-col justify-between transition-all min-h-[125px] bg-slate-100 border-slate-300 opacity-80 cursor-not-allowed"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-500">
                            {bedTitle}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                            {isDamaged ? 'RUSAK' : 'MAINTENANCE'}
                        </span>
                    </div>
                    <div className="text-center py-2">
                        <span className="text-xs font-black block uppercase text-rose-700">
                            {isDamaged ? '🚫 RUSAK' : '🔧 MAINTENANCE'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500">Tidak Siap Pakai</span>
                    </div>
                </div>
            );
        }

        const isShiftPagi = shift === 'pagi';
        const occupiedBgClass = item.appointment?.emergency_override 
            ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-xs' 
            : (isShiftPagi ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-indigo-50 border-indigo-300 text-indigo-950');

        return (
            <div
                key={`${shift}-bed-${cleanBedNum}`}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all min-h-[125px] ${
                    item.is_occupied
                        ? occupiedBgClass
                        : 'bg-slate-50 border-slate-200 hover:border-blue-500 cursor-pointer'
                }`}
                onClick={() => !item.is_occupied && !isUnusable && openCreateForBed(shift, cleanBedNum)}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-700">
                        {bedTitle}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        item.is_occupied 
                            ? (item.appointment?.emergency_override ? 'bg-rose-600 text-white animate-pulse' : (isShiftPagi ? 'bg-amber-200 text-amber-900' : 'bg-indigo-200 text-indigo-900')) 
                            : 'bg-emerald-100 text-emerald-800'
                    }`}>
                        {item.is_occupied ? (item.appointment?.emergency_override ? 'EMERGENCY' : 'Terisi') : 'Kosong'}
                    </span>
                </div>

                {item.is_occupied && item.appointment ? (
                    <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-slate-900 truncate max-w-[110px]" title={item.appointment.patient_name}>
                                {item.appointment.patient_name}
                            </p>
                            {item.appointment.emergency_override && (
                                <span className="px-1 py-0.2 text-[8px] font-black bg-rose-600 text-white rounded shrink-0">
                                    DARURAT
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] font-mono font-bold text-blue-700">
                            {item.appointment.medical_record_number}
                        </p>

                        <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-200/80">
                            <span className={`inline-block text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${getStatusBadgeClass(item.appointment.status)}`}>
                                {item.appointment.status}
                            </span>

                            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                    type="button"
                                    onClick={() => openEditModal(item.appointment)}
                                    className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                    title="Edit Janji Temu"
                                >
                                    <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCancellingAppointment(item.appointment)}
                                    className="p-1 text-slate-600 hover:text-amber-600 hover:bg-amber-100 rounded transition-colors"
                                    title="Batalkan"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(item.appointment.id)}
                                    className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-100 rounded transition-colors"
                                    title="Hapus"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-2">
                        <span className="text-xs text-slate-500 font-bold block">+ Kosong</span>
                        <span className="text-[9px] text-blue-600 font-extrabold">Klik Booking</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <AdminLayout title="Penjadwalan Janji Temu & Shift Grid Bed">
            <Head title="Janji Temu - Admin" />

            {/* Header Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-extrabold uppercase">Total Terjadwal</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{stats.total_today || 0}</p>
                    </div>
                    <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-extrabold uppercase">Shift Pagi (07:00-11:00)</p>
                        <p className="text-2xl font-black text-amber-700 mt-1">{stats.pagi_count || 0} <span className="text-xs text-slate-500 font-semibold">/ {totalBeds} Bed</span></p>
                    </div>
                    <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-extrabold uppercase">Shift Siang (12:00-16:00)</p>
                        <p className="text-2xl font-black text-indigo-700 mt-1">{stats.siang_count || 0} <span className="text-xs text-slate-500 font-semibold">/ {totalBeds} Bed</span></p>
                    </div>
                    <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-extrabold uppercase">Dibatalkan</p>
                        <p className="text-2xl font-black text-rose-700 mt-1">{stats.cancelled_count || 0}</p>
                    </div>
                    <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
                        <XCircle className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xs">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                    {/* Date Picker */}
                    <input
                        type="date"
                        value={filterForm.data.date}
                        onChange={(e) => handleFilterChange('date', e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-sm focus:outline-none focus:border-blue-600 shadow-xs cursor-pointer"
                        title="Filter Tanggal Janji Temu"
                    />

                    {/* Shift Filter */}
                    <select
                        value={filterForm.data.shift}
                        onChange={(e) => handleFilterChange('shift', e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-slate-900 text-sm font-bold cursor-pointer hover:border-slate-400 focus:outline-none focus:border-blue-600 shadow-xs min-w-[150px]"
                    >
                        <option value="">Semua Shift</option>
                        <option value="pagi">Pagi (07:00 - 11:00)</option>
                        <option value="siang">Siang (12:00 - 16:00)</option>
                    </select>

                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[220px] flex items-center">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Cari Pasien / No RM..."
                            value={filterForm.data.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 shadow-xs"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Create Button */}
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-extrabold rounded-xl transition-all shadow-md shadow-blue-600/20 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Buat Janji Temu</span>
                    </button>
                </div>
            </div>

            {/* BED GRID DISPLAY */}
            <div className="space-y-6">
                {/* Shift Pagi Grid */}
                {(!filterForm.data.shift || filterForm.data.shift === 'pagi') && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                                <Bed className="w-5 h-5 text-amber-600" />
                                <span>Shift Pagi (07:00 - 11:00 WIB)</span>
                            </h3>
                            <span className="text-xs font-mono font-bold text-slate-500">
                                {safePagiGrid.filter(i => i.is_occupied).length} / {totalBeds} Bed Terisi
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {safePagiGrid.map((item) => renderBedCard(item, 'pagi'))}
                        </div>
                    </div>
                )}

                {/* Shift Siang Grid */}
                {(!filterForm.data.shift || filterForm.data.shift === 'siang') && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                                <Bed className="w-5 h-5 text-indigo-600" />
                                <span>Shift Siang (12:00 - 16:00 WIB)</span>
                            </h3>
                            <span className="text-xs font-mono font-bold text-slate-500">
                                {safeSiangGrid.filter(i => i.is_occupied).length} / {totalBeds} Bed Terisi
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {safeSiangGrid.map((item) => renderBedCard(item, 'siang'))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL PEMBUATAN JANJI TEMU */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
                            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                                <Plus className="w-5 h-5 text-blue-600" />
                                <span>Buat Janji Temu Baru</span>
                            </h3>
                            <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Pilih Pasien *</label>
                                <select
                                    value={createForm.data.patient_id}
                                    onChange={(e) => createForm.setData('patient_id', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:border-blue-600 focus:outline-none"
                                    required
                                >
                                    <option value="">-- Pilih Pasien --</option>
                                    {patients.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.user?.name} ({p.medical_record_number})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Tanggal Janji Temu *</label>
                                    <input
                                        type="date"
                                        value={createForm.data.appointment_date}
                                        onChange={(e) => createForm.setData('appointment_date', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:border-blue-600 focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Shift Operasional *</label>
                                    <select
                                        value={createForm.data.shift}
                                        onChange={(e) => createForm.setData('shift', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:border-blue-600 focus:outline-none"
                                        required
                                    >
                                        <option value="pagi">Pagi (07:00 - 11:00 WIB)</option>
                                        <option value="siang">Siang (12:00 - 16:00 WIB)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Nomor Bed / Mesin</label>
                                <select
                                    value={createForm.data.bed_number}
                                    onChange={(e) => createForm.setData('bed_number', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-xl p-3 focus:border-blue-600 focus:outline-none"
                                >
                                    {renderBedOptions()}
                                </select>
                            </div>

                            {/* Checkbox Emergency Override */}
                            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                                <div>
                                    <label htmlFor="create_emergency_override" className="text-xs font-black text-rose-900 cursor-pointer flex items-center gap-1.5">
                                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                        <span>Emergency Override (Kasus Darurat Medis)</span>
                                    </label>
                                    <p className="text-[11px] text-rose-700 font-medium mt-0.5">
                                        Mengabaikan kuota penuh & memindahkan pasien reguler otomatis jika Bed terisi.
                                    </p>
                                </div>
                                <input
                                    id="create_emergency_override"
                                    type="checkbox"
                                    checked={createForm.data.emergency_override}
                                    onChange={(e) => createForm.setData('emergency_override', e.target.checked)}
                                    className="w-5 h-5 text-rose-600 rounded border-rose-300 focus:ring-rose-500 cursor-pointer"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-blue-600/30"
                                >
                                    Simpan Janji Temu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL EDIT JANJI TEMU */}
            {editingAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
                            <h3 className="text-lg font-black text-slate-900">Edit Janji Temu #{editingAppointment.id}</h3>
                            <button onClick={() => setEditingAppointment(null)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tanggal</label>
                                <input
                                    type="date"
                                    value={editForm.data.appointment_date}
                                    onChange={(e) => editForm.setData('appointment_date', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm rounded-xl p-3"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Shift</label>
                                    <select
                                        value={editForm.data.shift}
                                        onChange={(e) => editForm.setData('shift', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm rounded-xl p-3"
                                    >
                                        <option value="pagi">Pagi</option>
                                        <option value="siang">Siang</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bed</label>
                                    <select
                                        value={editForm.data.bed_number}
                                        onChange={(e) => editForm.setData('bed_number', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm rounded-xl p-3"
                                    >
                                        {renderBedOptions()}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                                <select
                                    value={editForm.data.status}
                                    onChange={(e) => editForm.setData('status', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm rounded-xl p-3"
                                >
                                    <option value="scheduled">Scheduled</option>
                                    <option value="checked-in">Checked-In</option>
                                    <option value="in-progress">In-Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="no-show">No-Show</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setEditingAppointment(null)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PEMBATALAN */}
            {cancellingAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                            <h3 className="text-lg font-black text-rose-700 flex items-center space-x-2">
                                <AlertTriangle className="w-5 h-5 text-rose-600" />
                                <span>Batalkan Janji Temu</span>
                            </h3>
                            <button onClick={() => setCancellingAppointment(null)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-600 font-semibold mb-4">
                            Apakah Anda yakin ingin membatalkan janji temu untuk pasien <strong className="text-slate-900">{cancellingAppointment.patient_name}</strong> pada tanggal {cancellingAppointment.appointment_date}?
                        </p>

                        <form onSubmit={handleCancelSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Alasan Pembatalan *</label>
                                <textarea
                                    value={cancelForm.data.cancellation_reason}
                                    onChange={(e) => cancelForm.setData('cancellation_reason', e.target.value)}
                                    placeholder="Alasan pembatalan..."
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-rose-600"
                                    rows="3"
                                    required
                                ></textarea>
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setCancellingAppointment(null)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancelForm.processing}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs"
                                >
                                    Konfirmasi Pembatalan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
