import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { 
    QrCode, 
    Clock, 
    CheckCircle2, 
    UserCheck, 
    UserX, 
    AlertTriangle, 
    Filter, 
    Calendar,
    Activity,
    FileText,
    Bell,
    Users,
    XCircle,
    Info,
    X
} from 'lucide-react';

export default function QueueIndex({ appointments = [], auditLogs = [], stats = {}, filters = {} }) {
    const [date, setDate] = useState(filters.date || new Date().toISOString().split('T')[0]);
    const [shift, setShift] = useState(filters.shift || 'all');
    const [status, setStatus] = useState(filters.status || 'all');
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [showNoShowModal, setShowNoShowModal] = useState(false);
    const [showArrivalModal, setShowArrivalModal] = useState(false);
    const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'audit'

    const { data: noShowData, setData: setNoShowData, post: postNoShow, processing: processingNoShow, reset: resetNoShow } = useForm({
        reason: '',
    });

    const handleFilterChange = (newDate, newShift, newStatus) => {
        router.get(route('admin.queue.index'), {
            date: newDate,
            shift: newShift,
            status: newStatus,
        }, { preserveState: true });
    };

    const handleMarkArrived = (app) => {
        router.post(route('admin.queue.mark-arrived', app.id), {}, {
            onSuccess: () => {
                setShowArrivalModal(false);
                setSelectedAppointment(null);
            }
        });
    };

    const handleStartTreatment = (app) => {
        if (confirm(`Mulai tindakan hemodialisis untuk pasien ${app.patient?.user?.name || ''}?`)) {
            router.post(route('admin.queue.start-treatment', app.id));
        }
    };

    const handleCompleteTreatment = (app) => {
        if (confirm(`Selesaikan tindakan hemodialisis untuk pasien ${app.patient?.user?.name || ''}?`)) {
            router.post(route('admin.queue.complete-treatment', app.id));
        }
    };

    const handleRestoreNoShow = (app) => {
        if (confirm(`Pulihkan status pasien ${app.patient?.user?.name || ''} dari No-Show menjadi Checked-In?`)) {
            router.post(route('admin.queue.restore-noshow', app.id));
        }
    };

    const handleCancelAppointment = (app) => {
        if (confirm(`Batalkan janji temu pasien ${app.patient?.user?.name || ''}?`)) {
            router.post(route('admin.appointments.cancel', app.id), {
                cancellation_reason: 'Dibatalkan dari konsol monitor antrean'
            });
        }
    };

    const handleConfirmNoShow = (e) => {
        e.preventDefault();
        if (!selectedAppointment) return;
        postNoShow(route('admin.queue.trigger-noshow', selectedAppointment.id), {
            onSuccess: () => {
                setShowNoShowModal(false);
                setSelectedAppointment(null);
                resetNoShow();
            }
        });
    };

    const getStatusBadge = (appStatus) => {
        switch (appStatus) {
            case 'checked-in':
            case 'arrived':
                return <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">Checked-In</span>;
            case 'in-progress':
            case 'in_progress':
                return <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-purple-100 text-purple-800 border border-purple-300 animate-pulse">Diproses</span>;
            case 'completed':
                return <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-teal-100 text-teal-800 border border-teal-300">Selesai</span>;
            case 'no-show':
            case 'no_show':
                return <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">No-Show</span>;
            case 'cancelled':
                return <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-slate-100 text-slate-700 border border-slate-300">Dibatalkan</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">Menunggu</span>;
        }
    };

    const isMatch = (statusVal, targets) => targets.includes(statusVal);

    return (
        <AdminLayout title="Monitor Antrean Real-Time & Log Audit">
            <Head title="Monitor Antrean Real-Time — Antrean Hemodialisis" />

            {/* Tabs Header */}
            <div className="flex items-center space-x-3 mb-6 border-b border-slate-200 pb-4">
                <button
                    onClick={() => setActiveTab('queue')}
                    className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all ${
                        activeTab === 'queue'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                >
                    <Activity className="w-4 h-4" />
                    <span>Daftar Antrean Real-Time</span>
                </button>

                <button
                    onClick={() => setActiveTab('audit')}
                    className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all ${
                        activeTab === 'audit'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    <span>Log Audit Event System</span>
                </button>
            </div>

            {activeTab === 'queue' ? (
                <>
                    {/* Ringkasan Kartu Statistik Antrean Hari Ini */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                            <span className="text-[11px] font-extrabold text-slate-500 uppercase block">TOTAL ANTREAN</span>
                            <span className="text-2xl font-black text-slate-900 block mt-1">{stats.total || 0}</span>
                        </div>

                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                            <span className="text-[11px] font-extrabold text-amber-600 uppercase block">MENUNGGU</span>
                            <span className="text-2xl font-black text-amber-700 block mt-1">{stats.scheduled || 0}</span>
                        </div>

                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                            <span className="text-[11px] font-extrabold text-emerald-600 uppercase block">CHECKED-IN</span>
                            <span className="text-2xl font-black text-emerald-700 block mt-1">{stats.checked_in || 0}</span>
                        </div>

                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                            <span className="text-[11px] font-extrabold text-purple-600 uppercase block">DIPROSES</span>
                            <span className="text-2xl font-black text-purple-700 block mt-1">{stats.in_progress || 0}</span>
                        </div>

                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                            <span className="text-[11px] font-extrabold text-teal-600 uppercase block">SELESAI</span>
                            <span className="text-2xl font-black text-teal-700 block mt-1">{stats.completed || 0}</span>
                        </div>

                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                            <span className="text-[11px] font-extrabold text-rose-600 uppercase block">NO-SHOW</span>
                            <span className="text-2xl font-black text-rose-700 block mt-1">{stats.no_show || 0}</span>
                        </div>
                    </div>

                    {/* Controls Bar Filter */}
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => {
                                        setDate(e.target.value);
                                        handleFilterChange(e.target.value, shift, status);
                                    }}
                                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                                <select
                                    value={shift}
                                    onChange={(e) => {
                                        setShift(e.target.value);
                                        handleFilterChange(date, e.target.value, status);
                                    }}
                                    className="bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer shadow-2xs min-w-[170px]"
                                >
                                    <option value="all">Semua Shift</option>
                                    <option value="pagi">Pagi (07:00-11:00)</option>
                                    <option value="siang">Siang (12:00-16:00)</option>
                                </select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <select
                                    value={status}
                                    onChange={(e) => {
                                        setStatus(e.target.value);
                                        handleFilterChange(date, shift, e.target.value);
                                    }}
                                    className="bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer shadow-2xs min-w-[200px]"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="scheduled">Scheduled / Menunggu</option>
                                    <option value="checked-in">Checked-In / Hadir</option>
                                    <option value="in-progress">In-Progress / Diproses</option>
                                    <option value="completed">Completed / Selesai</option>
                                    <option value="no-show">No-Show</option>
                                </select>
                            </div>
                        </div>

                        <span className="text-xs text-slate-500 font-mono font-bold">
                            Live Antrean Synchronized
                        </span>
                    </div>

                    {/* Real-time Queue Table */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-800">
                                <thead className="text-xs uppercase bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                                    <tr>
                                        <th className="py-4 px-4 w-24">No Antrean</th>
                                        <th className="py-4 px-4 w-32">Bed & Shift</th>
                                        <th className="py-4 px-6 w-64">Pasien & No RM</th>
                                        <th className="py-4 px-4 w-44">Status & Check-In</th>
                                        <th className="py-4 px-6 text-right">Aksi Admin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-medium">
                                    {appointments.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-12 text-slate-500 font-semibold">
                                                Tidak ada data antrean untuk filter tanggal/shift ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        appointments.map((app) => (
                                            <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-4 px-4 font-mono font-black text-blue-700">
                                                    {app.queue_number}
                                                </td>
                                                <td className="py-4 px-4 font-mono">
                                                    <span className="font-bold text-slate-900 block">Bed #{app.bed_number || '1'}</span>
                                                    <span className="text-xs font-bold text-blue-700 capitalize">Shift {app.shift}</span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-black text-slate-900">{app.patient?.user?.name || 'N/A'}</span>
                                                        {app.emergency_override && (
                                                            <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-rose-600 text-white rounded-full shadow-xs animate-pulse shrink-0">
                                                                EMERGENCY
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-600 font-mono font-bold">{app.patient?.medical_record_number}</div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="space-y-1">
                                                        {getStatusBadge(app.status)}
                                                        {app.check_in && (
                                                            <div className="text-[11px] text-slate-500 font-mono font-semibold">
                                                                Check-In: {new Date(app.check_in.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ({app.check_in.source})
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right space-x-2">
                                                    {/* 1. Status Scheduled / Confirmed / Approved */}
                                                    {isMatch(app.status, ['scheduled', 'confirmed', 'approved', 'pending_approval']) && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedAppointment(app);
                                                                    setShowArrivalModal(true);
                                                                }}
                                                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-lg border border-emerald-200 transition-colors"
                                                            >
                                                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                                <span>Tandai Hadir</span>
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setSelectedAppointment(app);
                                                                    setShowNoShowModal(true);
                                                                }}
                                                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-extrabold rounded-lg border border-rose-200 transition-colors"
                                                            >
                                                                <UserX className="w-3.5 h-3.5 text-rose-600" />
                                                                <span>Tandai No-Show</span>
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* 2. Status Checked-In / Arrived */}
                                                    {isMatch(app.status, ['checked-in', 'arrived']) && (
                                                        <button
                                                            onClick={() => handleStartTreatment(app)}
                                                            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-lg transition-all shadow-sm shadow-blue-600/30"
                                                        >
                                                            <Activity className="w-3.5 h-3.5" />
                                                            <span>Mulai Tindakan</span>
                                                        </button>
                                                    )}

                                                    {/* 3. Status In-Progress */}
                                                    {isMatch(app.status, ['in-progress', 'in_progress']) && (
                                                        <button
                                                            onClick={() => handleCompleteTreatment(app)}
                                                            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-lg transition-all shadow-sm shadow-purple-600/30"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>Selesaikan Tindakan</span>
                                                        </button>
                                                    )}

                                                    {/* 4. Status No-Show */}
                                                    {isMatch(app.status, ['no-show', 'no_show']) && (
                                                        <>
                                                            <button
                                                                onClick={() => handleRestoreNoShow(app)}
                                                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-extrabold rounded-lg border border-amber-300 transition-colors"
                                                                title="Pulihkan status pasien ke Checked-In (jika terlambat dan diizinkan dokter)"
                                                            >
                                                                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                                                                <span>Pulihkan / Check-In</span>
                                                            </button>

                                                            <button
                                                                onClick={() => handleCancelAppointment(app)}
                                                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-extrabold rounded-lg border border-rose-200 transition-colors"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                                                <span>Batalkan Janji</span>
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* 5. Status Completed */}
                                                    {app.status === 'completed' && (
                                                        <button
                                                            onClick={() => setSelectedDetail(app)}
                                                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors"
                                                        >
                                                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                                                            <span>Detail Tindakan</span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                /* Audit Logs View */
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-slate-200">
                        <h2 className="text-lg font-black text-slate-900">Log Audit Activity System</h2>
                        <p className="text-xs font-semibold text-slate-600">Pencatatan real-time event check-in, no-show, promosi pasien, dan pengubahan resep/pengumuman.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-800">
                            <thead className="text-xs uppercase bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                                <tr>
                                    <th className="py-4 px-6">Waktu Timestamp</th>
                                    <th className="py-4 px-6">Aksi Event</th>
                                    <th className="py-4 px-6">Pengguna / Admin</th>
                                    <th className="py-4 px-6">Deskripsi Detail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                {auditLogs.data && auditLogs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12 text-slate-500">Belum ada log aktivitas tercatat.</td>
                                    </tr>
                                ) : (
                                    auditLogs.data?.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-500">
                                                {new Date(log.created_at).toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-800 text-xs font-mono font-black rounded-lg">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 font-bold text-slate-900">
                                                {log.user?.name || 'Sistem Auto-Job'}
                                            </td>
                                            <td className="py-4 px-6 text-xs text-slate-600 font-semibold">
                                                {log.description}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL ACTION CONFIRMATIONS */}

            {/* Modal Manual Check-In */}
            {showArrivalModal && selectedAppointment && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
                        <div className="flex items-center space-x-3 text-emerald-600">
                            <UserCheck className="w-6 h-6" />
                            <h3 className="text-lg font-black text-slate-900">Konfirmasi Check-In Manual</h3>
                        </div>
                        <p className="text-sm text-slate-600 font-medium">
                            Tandai pasien <strong>{selectedAppointment.patient?.user?.name}</strong> (RM: {selectedAppointment.patient?.medical_record_number}) sebagai <strong>Checked-In (Hadir)</strong>?
                        </p>
                        <div className="flex items-center justify-end space-x-3 pt-2">
                            <button
                                onClick={() => setShowArrivalModal(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleMarkArrived(selectedAppointment)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/30"
                            >
                                Ya, Tandai Hadir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Trigger No-Show */}
            {showNoShowModal && selectedAppointment && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleConfirmNoShow} className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
                        <div className="flex items-center space-x-3 text-rose-600">
                            <UserX className="w-6 h-6" />
                            <h3 className="text-lg font-black text-slate-900">Konfirmasi Pemicu No-Show</h3>
                        </div>
                        <p className="text-sm text-slate-600 font-medium">
                            Status No-Show akan melepaskan Bed #{selectedAppointment.bed_number} dan mempromosikan pasien berikutnya dalam antrean.
                        </p>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Alasan No-Show (Opsional)</label>
                            <input
                                type="text"
                                value={noShowData.reason}
                                onChange={(e) => setNoShowData('reason', e.target.value)}
                                placeholder="Contoh: Pasien tidak dapat dihubungi via telepon..."
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                            />
                        </div>
                        <div className="flex items-center justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowNoShowModal(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processingNoShow}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-600/30"
                            >
                                Ya, Picu No-Show
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Detail Tindakan */}
            {selectedDetail && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 relative">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <span>Detail Tindakan Hemodialisis</span>
                            </h3>
                            <button onClick={() => setSelectedDetail(null)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100">
                                <span className="text-slate-500 font-bold">Pasien:</span>
                                <span className="font-black text-slate-900">{selectedDetail.patient?.user?.name} ({selectedDetail.patient?.medical_record_number})</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                                <span className="text-slate-500 font-bold">Bed & Shift:</span>
                                <span className="font-black text-slate-900">Bed #{selectedDetail.bed_number} (Shift {selectedDetail.shift})</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                                <span className="text-slate-500 font-bold">Status Akhir:</span>
                                <span className="font-black text-emerald-700 uppercase">SELESAI (COMPLETED)</span>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setSelectedDetail(null)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
                            >
                                Tutup Detail
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
