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
    const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'table'
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [cancellingAppointment, setCancellingAppointment] = useState(null);

    const appointmentsList = Array.isArray(appointments) ? appointments : (appointments.data || []);

    // Filter Form
    const filterForm = useForm({
        date: filters.date || new Date().toISOString().split('T')[0],
        shift: filters.shift || '',
        status: filters.status || '',
        search: filters.search || '',
    });

    const handleFilterChange = (field, value) => {
        const updated = { ...filterForm.data, [field]: value };
        filterForm.setData(field, value);
        router.get(route('admin.appointments.index'), updated, { preserveState: true, replace: true });
    };

    // Create Form
    const createForm = useForm({
        patient_id: '',
        appointment_date: filters.date || new Date().toISOString().split('T')[0],
        shift: 'pagi',
        bed_number: '1',
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
        createForm.setData({
            ...createForm.data,
            shift: shift,
            bed_number: String(bedNum),
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
        setEditingAppointment(app);
        editForm.setData({
            appointment_date: app.appointment_date ? String(app.appointment_date).substring(0, 10) : '',
            shift: app.shift || 'pagi',
            bed_number: app.bed_number ? String(app.bed_number).replace('Bed ', '') : '1',
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

    const getStatusLabel = (statusKey) => {
        switch (statusKey) {
            case 'pending':
            case 'pending_approval':
                return 'Menunggu Persetujuan';
            case 'confirmed':
            case 'scheduled':
            case 'approved':
                return 'Terjadwal / Disetujui';
            case 'arrived':
            case 'checked-in':
                return 'Hadir / Checked-In';
            case 'in_progress':
            case 'in-progress':
                return 'Sedang Tindakan';
            case 'completed':
                return 'Selesai';
            case 'no_show':
            case 'no-show':
                return 'Tidak Hadir';
            case 'cancelled':
                return 'Dibatalkan';
            default:
                return statusKey || 'Semua Status';
        }
    };

    return (
        <AdminLayout title="Penjadwalan Janji Temu & Shift Grid">
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
                        <p className="text-2xl font-black text-amber-700 mt-1">{stats.pagi_count || 0} <span className="text-xs text-slate-500 font-semibold">/ 10 Bed</span></p>
                    </div>
                    <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-extrabold uppercase">Shift Siang (12:00-16:00)</p>
                        <p className="text-2xl font-black text-indigo-700 mt-1">{stats.siang_count || 0} <span className="text-xs text-slate-500 font-semibold">/ 10 Bed</span></p>
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

            {/* Filter & View Switcher Bar */}
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

                    {/* Status Filter */}
                    <select
                        value={filterForm.data.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-slate-900 text-sm font-bold cursor-pointer hover:border-slate-400 focus:outline-none focus:border-blue-600 shadow-xs min-w-[170px]"
                    >
                        <option value="">Semua Status</option>
                        <option value="pending_approval">Pending Approval</option>
                        <option value="approved">Approved</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="checked-in">Checked-In / Arrived</option>
                        <option value="in-progress">In-Progress</option>
                        <option value="completed">Completed</option>
                        <option value="no-show">No-Show</option>
                        <option value="cancelled">Cancelled</option>
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
                    {/* Mode View Switcher */}
                    <div className="flex items-center space-x-1 border border-slate-300 rounded-xl p-1 bg-slate-100">
                        <button
                            type="button"
                            onClick={() => setActiveTab('grid')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1.5 ${
                                activeTab === 'grid' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Grid Bed</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('table')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1.5 ${
                                activeTab === 'table' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <ListFilter className="w-3.5 h-3.5" />
                            <span>Daftar Tabel ({appointmentsList.length})</span>
                        </button>
                    </div>

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

            {/* CONTENT AREA: GRID VIEW OR TABLE VIEW */}
            {activeTab === 'grid' ? (
                <div className="space-y-6">
                    {/* Shift Pagi Grid */}
                    {(!filterForm.data.shift || filterForm.data.shift === 'pagi') && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                                <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                                    <Bed className="w-5 h-5 text-amber-600" />
                                    <span>Shift Pagi (07:00 - 11:00 WIB)</span>
                                </h3>
                                <span className="text-xs font-mono font-bold text-slate-500">Total 10 Bed Utama</span>
                            </div>

                            {filterForm.data.status && shiftGrid.pagi.filter(i => i.is_occupied).length === 0 && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 flex items-center space-x-2">
                                    <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>Info: Tidak ada pasien dengan status <strong>"{getStatusLabel(filterForm.data.status)}"</strong> pada Shift Pagi untuk tanggal <strong>{filterForm.data.date}</strong>.</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {shiftGrid.pagi.map((item) => (
                                    <div
                                        key={`pagi-bed-${item.bed_number}`}
                                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all min-h-[110px] ${
                                            item.is_occupied
                                                ? (item.appointment?.emergency_override ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-xs' : 'bg-amber-50 border-amber-300 text-amber-950')
                                                : 'bg-slate-50 border-slate-200 hover:border-blue-500 cursor-pointer'
                                        }`}
                                        onClick={() => !item.is_occupied && openCreateForBed('pagi', item.bed_number)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-700">
                                                {item.bed_number ? (item.bed_number.startsWith('Bed') ? item.bed_number : `Bed ${item.bed_number}`) : 'Bed ?'}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                item.is_occupied 
                                                    ? (item.appointment?.emergency_override ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-200 text-amber-900') 
                                                    : 'bg-emerald-100 text-emerald-800'
                                            }`}>
                                                {item.is_occupied ? (item.appointment?.emergency_override ? 'EMERGENCY' : 'Terisi') : 'Kosong'}
                                            </span>
                                        </div>

                                        {item.is_occupied && item.appointment ? (
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-1">
                                                    <p className="text-xs font-black text-slate-900 truncate" title={item.appointment.patient_name}>
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
                                                <span className={`inline-block text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                    getStatusBadgeClass(item.appointment.status)
                                                }`}>
                                                    {item.appointment.status}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="text-center py-2">
                                                <span className="text-xs text-slate-500 font-bold block">+ Kosong</span>
                                                <span className="text-[9px] text-blue-600 font-extrabold">Klik Booking</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
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
                                <span className="text-xs font-mono font-bold text-slate-500">Total 10 Bed Utama</span>
                            </div>

                            {filterForm.data.status && shiftGrid.siang.filter(i => i.is_occupied).length === 0 && (
                                <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 flex items-center space-x-2">
                                    <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <span>Info: Tidak ada pasien dengan status <strong>"{getStatusLabel(filterForm.data.status)}"</strong> pada Shift Siang untuk tanggal <strong>{filterForm.data.date}</strong>.</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {shiftGrid.siang.map((item) => (
                                    <div
                                        key={`siang-bed-${item.bed_number}`}
                                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all min-h-[110px] ${
                                            item.is_occupied
                                                ? (item.appointment?.emergency_override ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-xs' : 'bg-indigo-50 border-indigo-300 text-indigo-950')
                                                : 'bg-slate-50 border-slate-200 hover:border-blue-500 cursor-pointer'
                                        }`}
                                        onClick={() => !item.is_occupied && openCreateForBed('siang', item.bed_number)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-700">
                                                {item.bed_number ? (item.bed_number.startsWith('Bed') ? item.bed_number : `Bed ${item.bed_number}`) : 'Bed ?'}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                item.is_occupied 
                                                    ? (item.appointment?.emergency_override ? 'bg-rose-600 text-white animate-pulse' : 'bg-indigo-200 text-indigo-900') 
                                                    : 'bg-emerald-100 text-emerald-800'
                                            }`}>
                                                {item.is_occupied ? (item.appointment?.emergency_override ? 'EMERGENCY' : 'Terisi') : 'Kosong'}
                                            </span>
                                        </div>

                                        {item.is_occupied && item.appointment ? (
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-1">
                                                    <p className="text-xs font-black text-slate-900 truncate" title={item.appointment.patient_name}>
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
                                                <span className={`inline-block text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                    getStatusBadgeClass(item.appointment.status)
                                                }`}>
                                                    {item.appointment.status}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="text-center py-2">
                                                <span className="text-xs text-slate-500 font-bold block">+ Kosong</span>
                                                <span className="text-[9px] text-blue-600 font-extrabold">Klik Booking</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* TABEL DAFTAR JANJI TEMU */
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                            Hasil Filter Tabel ({appointmentsList.length} Record)
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-xs uppercase font-extrabold text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="px-5 py-3.5">ID</th>
                                    <th className="px-5 py-3.5">Tanggal & Shift</th>
                                    <th className="px-5 py-3.5">Pasien & No. RM</th>
                                    <th className="px-5 py-3.5">Nomor Bed</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                {appointmentsList.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12 text-slate-400 font-bold">
                                            Tidak ada data janji temu yang sesuai dengan kriteria filter saat ini.
                                        </td>
                                    </tr>
                                ) : (
                                    appointmentsList.map((app) => (
                                        <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-5 py-4 font-mono text-xs font-bold text-slate-500">
                                                #{app.id}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="font-bold text-slate-900 block">
                                                    {app.appointment_date ? String(app.appointment_date).substring(0, 10) : '-'}
                                                </span>
                                                <span className="text-xs font-semibold text-blue-600 capitalize">
                                                    Shift {app.shift} ({app.shift === 'pagi' ? '07:00-11:00' : '12:00-16:00'})
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="font-extrabold text-slate-900 block">
                                                    {app.patient?.user?.name || 'Pasien'}
                                                </span>
                                                <span className="font-mono text-xs font-bold text-slate-500">
                                                    {app.patient?.medical_record_number || '-'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">
                                                    Bed {app.bed_number ? String(app.bed_number).replace('Bed ', '') : '-'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${getStatusBadgeClass(app.status)}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => openEditModal(app)}
                                                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title="Edit Janji Temu"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setCancellingAppointment(app)}
                                                    className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                                                    title="Batalkan"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(app.id)}
                                                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                        <option key={num} value={String(num)}>Bed {num}</option>
                                    ))}
                                </select>
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
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                            <option key={num} value={String(num)}>Bed {num}</option>
                                        ))}
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
                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PEMBATALAN JANJI TEMU */}
            {cancellingAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                            <h3 className="text-lg font-black text-rose-600 flex items-center space-x-2">
                                <AlertTriangle className="w-5 h-5 text-rose-600" />
                                <span>Pembatalan Janji Temu</span>
                            </h3>
                            <button onClick={() => setCancellingAppointment(null)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCancelSubmit} className="space-y-4">
                            <p className="text-sm font-semibold text-slate-700">
                                Anda akan membatalkan janji temu pasien <strong className="text-slate-900 font-black">{cancellingAppointment.patient?.user?.name}</strong> pada {cancellingAppointment.appointment_date ? String(cancellingAppointment.appointment_date).substring(0, 10) : ''} shift {cancellingAppointment.shift}.
                            </p>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Alasan Pembatalan *</label>
                                <textarea
                                    value={cancelForm.data.cancellation_reason}
                                    onChange={(e) => cancelForm.setData('cancellation_reason', e.target.value)}
                                    rows="3"
                                    placeholder="Contoh: Pasien berhalangan hadir / Rujukan rumah sakit lain..."
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm rounded-xl p-3 focus:border-rose-600 focus:outline-none"
                                    required
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setCancellingAppointment(null)}
                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold"
                                >
                                    Kembali
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancelForm.processing}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-600/30"
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
