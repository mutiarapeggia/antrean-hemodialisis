import React from 'react';
import PatientLayout from '@/Layouts/PatientLayout';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Clock, QrCode, Pill, Bell, CheckCircle2, FileText } from 'lucide-react';

export default function Dashboard({ patient, upcomingAppointments, medications, announcements }) {
    return (
        <PatientLayout title="Portal Pasien">
            <Head title="Portal Pasien — Antrean Hemodialisis" />

            {/* Patient Header Banner */}
            <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-900/40 border border-blue-500/20 rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-xl">
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
                            Nomor Rekam Medis: {patient?.medical_record_number || 'RM-PENDING'}
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Selamat Datang, {patient?.user?.name || 'Pasien'}
                        </h1>
                        <p className="text-sm text-slate-300 mt-1 max-w-xl">
                            Pantau jadwal hemodialisis mendatang, kode QR check-in kiosk, dan informasi resep obat Anda di sini.
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
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        app.status === 'checked-in' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    }`}>
                                                        {app.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-mono mt-1">
                                                    Waktu: {app.start_time.substring(0, 5)} - {app.end_time.substring(0, 5)} WIB
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                                            <div className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-right">
                                                <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-mono">QR Token</span>
                                                <span className="text-xs font-mono text-blue-400 font-bold">{app.qr_token.substring(0, 10)}...</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Medications & Announcements */}
                <div className="space-y-6">
                    {/* Medications Widget */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-800">
                            <Pill className="w-5 h-5 text-emerald-400" />
                            <h2 className="text-base font-bold text-slate-100">Daftar Obat Anda</h2>
                        </div>

                        {medications.length === 0 ? (
                            <p className="text-xs text-slate-500 py-4">Belum ada daftar obat tercatat.</p>
                        ) : (
                            <div className="space-y-3">
                                {medications.map((med) => (
                                    <div key={med.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-semibold text-emerald-300">{med.name}</span>
                                            <span className="text-xs text-slate-400 font-mono">{med.dosage}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-1">Aturan: {med.frequency}</p>
                                        {med.notes && <p className="text-[11px] text-slate-500 italic">{med.notes}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Clinic Announcements */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-800">
                            <Bell className="w-5 h-5 text-blue-400" />
                            <h2 className="text-base font-bold text-slate-100">Pengumuman Klinik</h2>
                        </div>

                        {announcements.length === 0 ? (
                            <p className="text-xs text-slate-500 py-4">Tidak ada pengumuman baru.</p>
                        ) : (
                            <div className="space-y-3">
                                {announcements.map((ann) => (
                                    <div key={ann.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                                        <h3 className="text-xs font-semibold text-blue-300 mb-1">{ann.title}</h3>
                                        <p className="text-xs text-slate-400 line-clamp-3 mb-1">{ann.content}</p>
                                        <span className="text-[10px] text-slate-500 font-mono">{ann.publish_date}</span>
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
