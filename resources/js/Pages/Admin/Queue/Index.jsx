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
    Users
} from 'lucide-react';

export default function QueueIndex({ appointments, auditLogs, stats, filters }) {
    const [date, setDate] = useState(filters.date || new Date().toISOString().split('T')[0]);
    const [shift, setShift] = useState(filters.shift || 'all');
    const [status, setStatus] = useState(filters.status || 'all');
    const [selectedAppointment, setSelectedAppointment] = useState(null);
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
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Checked-In</span>;
            case 'in-progress':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Diproses</span>;
            case 'completed':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Selesai</span>;
            case 'no-show':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">No-Show</span>;
            case 'cancelled':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">Dibatalkan</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Menunggu</span>;
        }
    };

    return (
        <AdminLayout title="Monitor Antrean Real-Time & Log Audit">
            <Head title="Monitor Antrean Real-Time — Antrean Hemodialisis" />

            {/* Tabs Header */}
            <div className="flex items-center space-x-3 mb-6 border-b border-slate-800 pb-4">
                <button
                    onClick={() => setActiveTab('queue')}
                    className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        activeTab === 'queue'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                >
                    <Activity className="w-4 h-4" />
                    <span>Daftar Antrean Real-Time</span>
                </button>

                <button
                    onClick={() => setActiveTab('audit')}
                    className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        activeTab === 'audit'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    <span>Log Audit Event Sistem</span>
                </button>
            </div>

            {activeTab === 'queue' ? (
                <>
                    {/* Queue Statistics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                            <span className="text-xs text-slate-400 block font-medium">Total Hari Ini</span>
                            <span className="text-2xl font-bold text-white mt-1 block">{stats.total}</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                            <span className="text-xs text-amber-400 block font-medium">Menunggu</span>
                            <span className="text-2xl font-bold text-amber-300 mt-1 block">{stats.scheduled}</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                            <span className="text-xs text-emerald-400 block font-medium">Checked-In</span>
                            <span className="text-2xl font-bold text-emerald-300 mt-1 block">{stats.checked_in}</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                            <span className="text-xs text-blue-400 block font-medium">Diproses</span>
                            <span className="text-2xl font-bold text-blue-300 mt-1 block">{stats.in_progress}</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                            <span className="text-xs text-purple-400 block font-medium">Selesai</span>
                            <span className="text-2xl font-bold text-purple-300 mt-1 block">{stats.completed}</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                            <span className="text-xs text-rose-400 block font-medium">No-Show</span>
                            <span className="text-2xl font-bold text-rose-300 mt-1 block">{stats.no_show}</span>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                            <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => {
                                        setDate(e.target.value);
                                        handleFilterChange(e.target.value, shift, status);
                                    }}
                                    className="bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    value={shift}
                                    onChange={(e) => {
                                        setShift(e.target.value);
                                        handleFilterChange(date, e.target.value, status);
                                    }}
                                    className="bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="all">Semua Shift</option>
                                    <option value="pagi">Shift Pagi (07:00 - 11:00)</option>
                                    <option value="siang">Shift Siang (12:00 - 16:00)</option>
                                </select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <select
                                    value={status}
                                    onChange={(e) => {
                                        setStatus(e.target.value);
                                        handleFilterChange(date, shift, e.target.value);
                                    }}
                                    className="bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="scheduled">Scheduled (Menunggu)</option>
                                    <option value="checked-in">Checked-In</option>
                                    <option value="in-progress">In-Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="no-show">No-Show</option>
                                </select>
                            </div>
                        </div>

                        <span className="text-xs text-slate-400 font-mono">
                            Auto-Refresh / Dynamic Queue Engine Active
                        </span>
                    </div>

                    {/* Real-time Queue Table */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                                    <tr>
                                        <th className="py-4 px-4">No Antrean</th>
                                        <th className="py-4 px-4">Bed & Shift</th>
                                        <th className="py-4 px-4">Pasien & No RM</th>
                                        <th className="py-4 px-4">Status & Check-In</th>
                                        <th className="py-4 px-4">Estimasi Tunggu</th>
                                        <th className="py-4 px-4 text-right">Aksi Admin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {appointments.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-12 text-slate-500">
                                                Tidak ada data antrean untuk filter tanggal/shift ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        appointments.map((app) => (
                                            <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                                                <td className="py-4 px-4 font-mono font-bold text-blue-400">
                                                    {app.queue_number}
                                                </td>
                                                <td className="py-4 px-4 font-mono">
                                                    <span className="font-semibold text-slate-200 block">Bed #{app.bed_number || '1'}</span>
                                                    <span className="text-xs text-blue-400 capitalize">Shift {app.shift}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="font-semibold text-slate-100">{app.patient?.user?.name || 'N/A'}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{app.patient?.medical_record_number}</div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="space-y-1">
                                                        {getStatusBadge(app.status)}
                                                        {app.check_in && (
                                                            <div className="text-[11px] text-slate-400 font-mono">
                                                                Check-In: {new Date(app.check_in.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ({app.check_in.source})
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 font-mono">
                                                    {app.status === 'scheduled' ? (
                                                        <span className="text-amber-400 text-xs font-semibold flex items-center space-x-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>~{app.estimated_wait_minutes} Menit</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-500 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-right space-x-2">
                                                    {app.status === 'scheduled' && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedAppointment(app);
                                                                    setShowArrivalModal(true);
                                                                }}
                                                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/30 transition-colors"
                                                            >
                                                                <UserCheck className="w-3.5 h-3.5" />
                                                                <span>Tandai Tiba</span>
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setSelectedAppointment(app);
                                                                    setShowNoShowModal(true);
                                                                }}
                                                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold rounded-lg border border-rose-500/30 transition-colors"
                                                            >
                                                                <UserX className="w-3.5 h-3.5" />
                                                                <span>Trigger No-Show</span>
                                                            </button>
                                                        </>
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
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-800">
                        <h2 className="text-lg font-bold text-slate-100">Log Audit Activity System (FR-40)</h2>
                        <p className="text-xs text-slate-400">Pencatatan real-time event check-in, no-show, promosi pasien, dan pengubahan resep/pengumuman.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="py-4 px-6">Waktu Timestamp</th>
                                    <th className="py-4 px-6">Aksi Event</th>
                                    <th className="py-4 px-6">Pengguna / Admin</th>
                                    <th className="py-4 px-6">Deskripsi Detail</th>
                                    <th className="py-4 px-6">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 font-mono text-xs">
                                {auditLogs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12 text-slate-500">
                                            Belum ada log audit tercatat.
                                        </td>
                                    </tr>
                                ) : (
                                    auditLogs.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                                            <td className="py-3 px-6 text-slate-400">
                                                {new Date(log.created_at).toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-3 px-6 font-bold">
                                                <span className={`px-2 py-0.5 rounded text-[11px] ${
                                                    log.action.includes('NO_SHOW') ? 'bg-rose-500/20 text-rose-300' :
                                                    log.action.includes('CHECK_IN') ? 'bg-emerald-500/20 text-emerald-300' :
                                                    log.action.includes('PROMOTED') ? 'bg-purple-500/20 text-purple-300' :
                                                    'bg-blue-500/20 text-blue-300'
                                                }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 text-slate-200">
                                                {log.user?.name || 'Sistem Otomatis'}
                                            </td>
                                            <td className="py-3 px-6 text-slate-300 font-sans text-xs">
                                                {log.description}
                                            </td>
                                            <td className="py-3 px-6 text-slate-500">
                                                {log.ip_address || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Audit Log Pagination */}
                    {auditLogs.links && auditLogs.links.length > 3 && (
                        <div className="p-4 border-t border-slate-800 flex justify-end space-x-1">
                            {auditLogs.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                                        link.active ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal Manual Arrival Confirmation */}
            {showArrivalModal && selectedAppointment && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-100 mb-2">Konfirmasi Kedatangan Pasien</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Apakah Anda yakin ingin menandai pasien <strong className="text-white">{selectedAppointment.patient?.user?.name}</strong> (Bed #{selectedAppointment.bed_number}) telah tiba di lokasi?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowArrivalModal(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleMarkArrived(selectedAppointment)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
                            >
                                Ya, Tandai Tiba
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Manual No-Show Trigger */}
            {showNoShowModal && selectedAppointment && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-rose-400 mb-2 flex items-center space-x-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Pemicu Manual No-Show</span>
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">
                            Tindakan ini akan melepaskan bed #{selectedAppointment.bed_number} pasien <strong className="text-white">{selectedAppointment.patient?.user?.name}</strong> dan secara otomatis mengirim notifikasi email promosi ke pasien berikutnya dalam antrean.
                        </p>
                        <form onSubmit={handleConfirmNoShow} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Alasan No-Show / Keterlambatan</label>
                                <textarea
                                    value={noShowData.reason}
                                    onChange={(e) => setNoShowData('reason', e.target.value)}
                                    placeholder="Alasan pasien tidak hadir atau keterlambatan >15 menit..."
                                    rows="3"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                                ></textarea>
                            </div>

                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNoShowModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingNoShow}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/30"
                                >
                                    {processingNoShow ? 'Memproses...' : 'Terapkan No-Show & Promosi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
