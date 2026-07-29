import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Users, Calendar, CheckCircle2, Clock, Bell, UserPlus, FileSpreadsheet } from 'lucide-react';

export default function Dashboard({ stats, todayAppointments, latestAnnouncements }) {
    return (
        <AdminLayout title="Dashboard Admin">
            <Head title="Dashboard Admin" />

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-400">Total Pasien Aktif</span>
                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-100">{stats.total_patients}</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-400">Jadwal Hari Ini</span>
                        <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-100">{stats.today_appointments}</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-400">Check-In Hari Ini</span>
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-100">{stats.today_checked_in}</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-400">Reschedule Pending</span>
                        <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-100">{stats.pending_reschedules}</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-4 mb-8">
                <Link
                    href={route('admin.patients.create')}
                    className="inline-flex items-center space-x-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Tambah Pasien Baru</span>
                </Link>
                <Link
                    href={route('admin.patients.index')}
                    className="inline-flex items-center space-x-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition-colors border border-slate-700"
                >
                    <Users className="w-4 h-4" />
                    <span>Lihat Kelola Pasien</span>
                </Link>
            </div>

            {/* Grid Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Today's Appointments Table */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-100">Antrean Hari Ini</h2>
                        <span className="text-xs text-slate-400 font-mono">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>

                    {todayAppointments.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-sm">
                            Belum ada jadwal pasien untuk hari ini.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                                    <tr>
                                        <th className="py-3 px-4">Jam & Shift</th>
                                        <th className="py-3 px-4">Nama Pasien</th>
                                        <th className="py-3 px-4">No RM</th>
                                        <th className="py-3 px-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {todayAppointments.map((app) => (
                                        <tr key={app.id} className="hover:bg-slate-800/40">
                                            <td className="py-3.5 px-4 font-mono">
                                                <span className="block font-semibold text-slate-200">{app.start_time.substring(0, 5)} - {app.end_time.substring(0, 5)}</span>
                                                <span className="text-xs text-blue-400 capitalize">Shift {app.shift}</span>
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-slate-100">
                                                {app.patient?.user?.name || 'N/A'}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                                                {app.patient?.medical_record_number || '-'}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                                    app.status === 'checked-in' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    app.status === 'no-show' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Announcements */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center space-x-2 mb-6">
                        <Bell className="w-5 h-5 text-blue-400" />
                        <h2 className="text-lg font-bold text-slate-100">Pengumuman Klinik</h2>
                    </div>

                    {latestAnnouncements.length === 0 ? (
                        <p className="text-slate-500 text-sm py-4">Belum ada pengumuman aktif.</p>
                    ) : (
                        <div className="space-y-4">
                            {latestAnnouncements.map((ann) => (
                                <div key={ann.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                                    <h3 className="text-sm font-semibold text-blue-300 mb-1">{ann.title}</h3>
                                    <p className="text-xs text-slate-400 line-clamp-3 mb-2">{ann.content}</p>
                                    <span className="text-[10px] text-slate-500 font-mono">{ann.publish_date}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
