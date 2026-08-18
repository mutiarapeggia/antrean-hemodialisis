import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Users, Calendar, CheckCircle2, Clock, Bell, UserPlus } from 'lucide-react';

export default function Dashboard({ stats, todayAppointments = [], latestAnnouncements = [] }) {
    return (
        <AdminLayout title="Dashboard Admin">
            <Head title="Dashboard Admin" />

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-extrabold uppercase text-slate-500">Total Pasien Aktif</span>
                        <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{stats?.total_patients || 0}</p>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-extrabold uppercase text-slate-500">Jadwal Hari Ini</span>
                        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{stats?.today_appointments || 0}</p>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-extrabold uppercase text-slate-500">Check-In Hari Ini</span>
                        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{stats?.today_checked_in || 0}</p>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-extrabold uppercase text-slate-500">Reschedule Pending</span>
                        <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{stats?.pending_reschedules || 0}</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-4 mb-8">
                <Link
                    href={route('admin.patients.create')}
                    className="inline-flex items-center space-x-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-extrabold rounded-xl transition-all shadow-md shadow-blue-600/20"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Tambah Pasien Baru</span>
                </Link>
                <Link
                    href={route('admin.patients.index')}
                    className="inline-flex items-center space-x-2 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 text-sm font-extrabold rounded-xl transition-colors border border-slate-300 shadow-xs"
                >
                    <Users className="w-4 h-4" />
                    <span>Kelola Data Pasien</span>
                </Link>
            </div>

            {/* Grid Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Today's Appointments Table */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                        <h2 className="text-lg font-black text-slate-900">Antrean Hari Ini</h2>
                        <span className="text-xs font-bold text-slate-500 font-mono">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>

                    {todayAppointments.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-sm font-semibold">
                            Belum ada jadwal pasien untuk hari ini.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-800">
                                <thead className="text-xs uppercase bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                                    <tr>
                                        <th className="py-3 px-4">Jam & Shift</th>
                                        <th className="py-3 px-4">Nama Pasien</th>
                                        <th className="py-3 px-4">No RM</th>
                                        <th className="py-3 px-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {todayAppointments.map((app) => (
                                        <tr key={app.id} className="hover:bg-slate-50">
                                            <td className="py-3.5 px-4 font-mono">
                                                <span className="block font-bold text-slate-900">{app.start_time ? app.start_time.substring(0, 5) : '07:00'} - {app.end_time ? app.end_time.substring(0, 5) : '11:00'}</span>
                                                <span className="text-xs font-bold text-blue-700 capitalize">Shift {app.shift}</span>
                                            </td>
                                            <td className="py-3.5 px-4 font-extrabold text-slate-900">
                                                {app.patient?.user?.name || 'N/A'}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-600">
                                                {app.patient?.medical_record_number || '-'}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                                                    app.status === 'checked-in' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                                    app.status === 'no-show' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                                    'bg-blue-100 text-blue-800 border border-blue-300'
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
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                    <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-slate-200">
                        <Bell className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-black text-slate-900">Pengumuman Klinik</h2>
                    </div>

                    {latestAnnouncements.length === 0 ? (
                        <p className="text-slate-500 text-sm font-semibold py-4">Belum ada pengumuman aktif.</p>
                    ) : (
                        <div className="space-y-4">
                            {latestAnnouncements.map((ann) => (
                                <div key={ann.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <h3 className="text-sm font-black text-blue-700 mb-1">{ann.title}</h3>
                                    <p className="text-xs font-medium text-slate-700 line-clamp-3 mb-2">{ann.content}</p>
                                    <span className="text-[10px] text-slate-500 font-mono font-bold">{ann.publish_date}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
