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
    ChevronDown
} from 'lucide-react';

export default function Index({ appointments, patients, shiftGrid, stats, filters }) {
    const [activeTab, setActiveTab] = useState('table'); // 'table' | 'grid'
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [cancellingAppointment, setCancellingAppointment] = useState(null);

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
            appointment_date: app.appointment_date ? app.appointment_date.substring(0, 10) : '',
            shift: app.shift || 'pagi',
            bed_number: app.bed_number || '',
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

    const openCreateForBed = (shift, bedNum) => {
        createForm.setData({
            ...createForm.data,
            shift: shift,
            bed_number: String(bedNum),
            appointment_date: filterForm.data.date,
        });
        setIsCreateOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus data janji temu ini?')) {
            router.delete(route('admin.appointments.destroy', id));
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
                        <p className="text-2xl font-black text-slate-900 mt-1">{stats.total_today}</p>
                    </div>
                    <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-extrabold uppercase">Shift Pagi (07:00-11:00)</p>
                        <p className="text-2xl font-black text-amber-700 mt-1">{stats.pagi_count} <span className="text-xs text-slate-500 font-semibold">/ 10 Bed</span></p>
                    </div>
                    <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-extrabold uppercase">Shift Siang (12:00-16:00)</p>
                        <p className="text-2xl font-black text-indigo-700 mt-1">{stats.siang_count} <span className="text-xs text-slate-500 font-semibold">/ 10 Bed</span></p>
                    </div>
                    <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-extrabold uppercase">Dibatalkan</p>
                        <p className="text-2xl font-black text-rose-700 mt-1">{stats.cancelled_count}</p>
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
                    />

                    {/* Shift Filter */}
                    <select
                        value={filterForm.data.shift}
                        onChange={(e) => handleFilterChange('shift', e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-slate-900 text-sm font-bold cursor-pointer hover:border-slate-400 focus:outline-none focus:border-blue-600 shadow-xs min-w-[150px]"
                    >
                        <option value="">Semua Shift</option>
                        <option value="pagi">Pagi (07:00-11:00)</option>
                        <option value="siang">Siang (12:00-16:00)</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={filterForm.data.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-slate-900 text-sm font-bold cursor-pointer hover:border-slate-400 focus:outline-none focus:border-blue-600 shadow-xs min-w-[160px]"
                    >
                        <option value="">Semua Status</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="checked-in">Checked-In</option>
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
                    {/* View Switcher Tabs */}
                    <div className="inline-flex items-center p-1.5 bg-slate-100 border border-slate-200 rounded-xl gap-1 shadow-xs">
                        <button
                            onClick={() => setActiveTab('table')}
                            className={`px-4 py-2 text-sm font-extrabold rounded-lg transition-all whitespace-nowrap ${
                                activeTab === 'table' 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                            }`}
                        >
                            Tabel Daftar
                        </button>
                        <button
                            onClick={() => setActiveTab('grid')}
                            className={`px-4 py-2 text-sm font-extrabold rounded-lg transition-all whitespace-nowrap ${
                                activeTab === 'grid' 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                            }`}
                        >
                            Kalender & Grid Shift
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

            {/* TAB CONTENT: TABEL DAFTAR */}
            {activeTab === 'table' && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    {appointments.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                            <p className="text-base font-bold text-slate-700">Tidak ada janji temu ditemukan</p>
                            <p className="text-xs text-slate-500 mt-1">Silakan sesuaikan tanggal atau filter pencarian Anda.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-800">
                                <thead className="text-xs uppercase bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                                    <tr>
                                        <th className="py-3.5 px-4">Tanggal & Jam</th>
                                        <th className="py-3.5 px-4">Shift & Bed</th>
                                        <th className="py-3.5 px-4">Pasien</th>
                                        <th className="py-3.5 px-4">Atribut</th>
                                        <th className="py-3.5 px-4">Status</th>
                                        <th className="py-3.5 px-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {appointments.map((app) => (
                                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-4 font-mono">
                                                <span className="block font-black text-slate-900">{app.appointment_date ? app.appointment_date.substring(0, 10) : ''}</span>
                                                <span className="text-xs font-bold text-slate-600">{app.start_time.substring(0, 5)} - {app.end_time.substring(0, 5)} WIB</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                                                        app.shift === 'pagi' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                                    }`}>
                                                        Shift {app.shift}
                                                    </span>
                                                    <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-1 text-xs font-black rounded-md font-mono">
                                                        {app.bed_number ? (app.bed_number.startsWith('Bed') ? app.bed_number : `Bed ${app.bed_number}`) : 'Unassigned'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="block font-black text-slate-900">{app.patient?.user?.name || 'Pasien N/A'}</span>
                                                <span className="text-xs font-mono font-bold text-blue-700">{app.patient?.medical_record_number || '-'}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {app.emergency_override && (
                                                        <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 shadow-xs">
                                                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                                            <span>Darurat</span>
                                                        </span>
                                                    )}
                                                    {app.is_recurring && (
                                                        <span className="px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-300 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 shadow-xs">
                                                            <Repeat className="w-3.5 h-3.5 text-purple-600" />
                                                            <span>Rutin</span>
                                                        </span>
                                                    )}
                                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 shadow-xs">
                                                        <QrCode className="w-3.5 h-3.5 text-blue-600" />
                                                        <span>HMAC Token</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                                    app.status === 'checked-in' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                                    app.status === 'completed' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' :
                                                    app.status === 'cancelled' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                                    app.status === 'no-show' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                                                    'bg-blue-100 text-blue-800 border border-blue-300'
                                                }`}>
                                                    {app.status}
                                                </span>
                                                {app.status === 'cancelled' && app.cancellation_reason && (
                                                    <p className="text-[11px] text-rose-700 italic font-semibold mt-1 max-w-xs truncate" title={app.cancellation_reason}>
                                                        Ket: {app.cancellation_reason}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(app)}
                                                        className="p-2 text-blue-700 hover:bg-blue-100 rounded-xl transition-all border border-slate-200"
                                                        title="Edit Janji Temu"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>

                                                    {app.status !== 'cancelled' && (
                                                        <button
                                                            onClick={() => setCancellingAppointment(app)}
                                                            className="p-2 text-amber-700 hover:bg-amber-100 rounded-xl transition-all border border-slate-200"
                                                            title="Batalkan Janji Temu"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleDelete(app.id)}
                                                        className="p-2 text-rose-700 hover:bg-rose-100 rounded-xl transition-all border border-slate-200"
                                                        title="Hapus Janji Temu"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: KALENDER & SHIFT GRID (T-208) */}
            {activeTab === 'grid' && (
                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                                <Bed className="w-5 h-5 text-amber-600" />
                                <span>Shift Pagi (07:00 - 11:00 WIB)</span>
                            </h3>
                            <span className="text-xs font-mono font-bold text-slate-500">Total 10 Bed Utama</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {shiftGrid.pagi.map((item) => (
                                <div
                                    key={`pagi-bed-${item.bed_number}`}
                                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all min-h-[110px] ${
                                        item.is_occupied
                                            ? 'bg-amber-50 border-amber-300 text-amber-950'
                                            : 'bg-slate-50 border-slate-200 hover:border-blue-500 cursor-pointer'
                                    }`}
                                    onClick={() => !item.is_occupied && openCreateForBed('pagi', item.bed_number)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black font-mono uppercase text-slate-600">Bed {item.bed_number}</span>
                                        <span className={`w-2.5 h-2.5 rounded-full ${item.is_occupied ? 'bg-amber-600 animate-pulse' : 'bg-slate-300'}`} />
                                    </div>

                                    {item.is_occupied ? (
                                        <div>
                                            <p className="text-xs font-black text-slate-900 line-clamp-1">{item.appointment.patient_name}</p>
                                            <p className="text-[10px] font-mono font-bold text-amber-800">{item.appointment.medical_record_number}</p>
                                            <span className="inline-block mt-2 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-black uppercase">
                                                Terisi
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

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                                <Bed className="w-5 h-5 text-indigo-600" />
                                <span>Shift Siang (12:00 - 16:00 WIB)</span>
                            </h3>
                            <span className="text-xs font-mono font-bold text-slate-500">Total 10 Bed Utama</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {shiftGrid.siang.map((item) => (
                                <div
                                    key={`siang-bed-${item.bed_number}`}
                                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all min-h-[110px] ${
                                        item.is_occupied
                                            ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
                                            : 'bg-slate-50 border-slate-200 hover:border-blue-500 cursor-pointer'
                                    }`}
                                    onClick={() => !item.is_occupied && openCreateForBed('siang', item.bed_number)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black font-mono uppercase text-slate-600">Bed {item.bed_number}</span>
                                        <span className={`w-2.5 h-2.5 rounded-full ${item.is_occupied ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`} />
                                    </div>

                                    {item.is_occupied ? (
                                        <div>
                                            <p className="text-xs font-black text-slate-900 line-clamp-1">{item.appointment.patient_name}</p>
                                            <p className="text-[10px] font-mono font-bold text-indigo-800">{item.appointment.medical_record_number}</p>
                                            <span className="inline-block mt-2 text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 font-black uppercase">
                                                Terisi
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
                                {createForm.errors.patient_id && <p className="text-xs font-bold text-rose-600 mt-1">{createForm.errors.patient_id}</p>}
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
                                    {createForm.errors.appointment_date && <p className="text-xs font-bold text-rose-600 mt-1">{createForm.errors.appointment_date}</p>}
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
                                {createForm.errors.bed_number && <p className="text-xs font-bold text-rose-600 mt-1">{createForm.errors.bed_number}</p>}
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={createForm.data.is_recurring}
                                        onChange={(e) => createForm.setData('is_recurring', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                                        <Repeat className="w-4 h-4 text-purple-600" />
                                        <span>Janji Temu Berulang (Rutin Mingguan)</span>
                                    </span>
                                </label>

                                {createForm.data.is_recurring && (
                                    <div className="pt-2 border-t border-slate-200">
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Durasi Pengulangan (Minggu)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="12"
                                            value={createForm.data.recurring_weeks}
                                            onChange={(e) => createForm.setData('recurring_weeks', parseInt(e.target.value) || 1)}
                                            className="w-full bg-white border border-slate-300 text-slate-900 text-sm font-bold rounded-xl p-2.5 focus:border-blue-600 focus:outline-none"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={createForm.data.emergency_override}
                                        onChange={(e) => createForm.setData('emergency_override', e.target.checked)}
                                        className="w-4 h-4 text-rose-600 bg-white border-rose-300 rounded focus:ring-rose-500"
                                    />
                                    <span className="text-sm font-black text-rose-900 flex items-center space-x-2">
                                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                                        <span>Override Manual Slot Darurat (Bypass Proteksi Konflik)</span>
                                    </span>
                                </label>
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
                                Anda akan membatalkan janji temu pasien <strong className="text-slate-900 font-black">{cancellingAppointment.patient?.user?.name}</strong> pada {cancellingAppointment.appointment_date?.substring(0, 10)} shift {cancellingAppointment.shift}.
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
