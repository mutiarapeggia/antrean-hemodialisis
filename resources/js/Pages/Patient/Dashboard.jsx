import React from 'react';
import PatientLayout from '@/Layouts/PatientLayout';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Clock, QrCode, Pill, Bell, CheckCircle2, FileText, RefreshCw, AlertCircle } from 'lucide-react';

export default function Dashboard({ patient, upcomingAppointments = [], rescheduleRequests = [], medications = [], announcements = [] }) {
    const pendingReschedules = rescheduleRequests.filter(r => r.status === 'pending');

    return (
        <PatientLayout title="Portal Pasien">
            <Head title="Portal Pasien — Antrean Hemodialisis" />

            {/* Patient Header Banner - Solid Clean Dark Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-sm">
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
                            Nomor Rekam Medis: {patient?.medical_record_number || 'RM-PENDING'}
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Selamat Datang, {patient?.user?.name || 'Pasien'}
                        </h1>
                        <p className="text-sm text-slate-300 mt-1 max-w-xl">
                            Pantau jadwal hemodialisis mendatang, kode QR check-in kiosk, dan informasi permohonan reschedule Anda di sini.
                        </p>
                    </div>

                    <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-right">
                        <span className="text-xs text-slate-400 block font-medium">Status Akun Pasien</span>
                        <span className="text-sm font-bold text-emerald-400 flex items-center space-x-1.5 justify-end mt-0.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Aktif Terdaftar</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Pending Reschedule Alert Banner if exists */}
            {pendingReschedules.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-8 flex items-center justify-between gap-4 text-amber-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl flex-shrink-0">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">Permohonan Reschedule Dalam Proses Review</h3>
                            <p className="text-xs text-amber-300 mt-0.5">
                                Anda memiliki {pendingReschedules.length} permohonan perubahan jadwal yang sedang ditinjau oleh staf admin.
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route('patient.appointments.index')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex-shrink-0"
                    >
                        Lihat Status
                    </Link>
                </div>
            )}

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming Appointments */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                            <div className="flex items-center space-x-3">
                                <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-100">Jadwal Hemodialisis Mendatang</h2>
                                    <p className="text-xs text-slate-400">Tunjukkan kode QR saat tiba di kiosk klinik untuk check-in otomatis.</p>
                                </div>
                            </div>
                        </div>

                        {upcomingAppointments.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 text-sm">
                                Belum ada jadwal janji temu hemodialisis mendatang.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {upcomingAppointments.map((app) => (
                                    <div key={app.id} className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-start space-x-4">
                                            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl text-center min-w-[70px]">
                                                <span className="text-xs uppercase font-bold text-slate-400 block">{new Date(app.appointment_date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                                <span className="text-xl font-black text-white">{new Date(app.appointment_date).getDate()}</span>
                                            </div>

                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="text-base font-bold text-slate-100 capitalize">Shift {app.shift}</h3>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                                                        app.status === 'checked-in' ? 'bg-emerald-500/20 text-emerald-300' :
                                                        app.status === 'completed' ? 'bg-indigo-500/20 text-indigo-300' :
                                                        app.status === 'cancelled' ? 'bg-rose-500/20 text-rose-300' :
                                                        app.status === 'no-show' ? 'bg-purple-500/20 text-purple-300' :
                                                        app.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300' :
                                                        'bg-slate-800 text-slate-300'
                                                    }`}>
                                                        {app.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Waktu: {app.start_time ? app.start_time.substring(0, 5) : '07:00'} WIB | Bed: <strong className="text-slate-200">{app.bed_number ? (app.bed_number.startsWith('Bed') ? app.bed_number : `Bed ${app.bed_number}`) : 'Utama'}</strong>
                                                </p>
                                            </div>
                                        </div>

                                        <Link
                                            href={route('patient.appointments.index')}
                                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
                                        >
                                            Detail & Kode QR
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Status Permohonan Reschedule */}
                    {rescheduleRequests.length > 0 && (
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                            <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center space-x-2">
                                <RefreshCw className="w-4 h-4 text-amber-400" />
                                <span>Riwayat Reschedule</span>
                            </h2>
                            <div className="space-y-3">
                                {rescheduleRequests.slice(0, 3).map((req) => (
                                    <div key={req.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-200">Diminta: {req.requested_date ? req.requested_date.substring(0, 10) : ''}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                                req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' :
                                                req.status === 'rejected' ? 'bg-rose-500/20 text-rose-300' :
                                                'bg-amber-500/20 text-amber-300'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <p className="text-slate-400">Shift {req.requested_shift}</p>
                                        {req.admin_notes && (
                                            <p className="text-amber-400 italic text-[11px]">Note: {req.admin_notes}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pengumuman Klinik */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center space-x-2">
                            <Bell className="w-4 h-4 text-blue-400" />
                            <span>Pengumuman Klinik</span>
                        </h2>
                        {announcements.length === 0 ? (
                            <p className="text-xs text-slate-500">Belum ada pengumuman baru.</p>
                        ) : (
                            <div className="space-y-3">
                                {announcements.map((item) => (
                                    <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                                        <h3 className="font-bold text-slate-200">{item.title}</h3>
                                        <p className="text-slate-400 mt-1 line-clamp-2">{item.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PatientLayout>
    );
}
