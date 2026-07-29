import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, User, Phone, Mail, MapPin, Activity, Pill, Calendar, Edit } from 'lucide-react';

export default function Show({ patient }) {
    return (
        <AdminLayout title={`Detail Pasien — ${patient.user?.name || patient.medical_record_number}`}>
            <Head title={`Detail Pasien — ${patient.medical_record_number}`} />

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Link
                        href={route('admin.patients.index')}
                        className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke Daftar Pasien</span>
                    </Link>

                    <Link
                        href={route('admin.patients.edit', patient.id)}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30"
                    >
                        <Edit className="w-4 h-4" />
                        <span>Edit Data Pasien</span>
                    </Link>
                </div>

                {/* Profile Overview Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30 flex items-center justify-center font-bold text-2xl">
                                {patient.user?.name ? patient.user.name.charAt(0) : 'P'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-100">{patient.user?.name || 'Tanpa Nama'}</h2>
                                <span className="text-sm font-mono text-blue-400 font-semibold">{patient.medical_record_number}</span>
                            </div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            patient.is_active 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                            {patient.is_active ? 'Status: Aktif' : 'Status: Nonaktif'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
                        <div className="flex items-center space-x-3 text-slate-300">
                            <Phone className="w-5 h-5 text-slate-500" />
                            <div>
                                <span className="text-xs text-slate-500 block">Nomor Telepon</span>
                                <span className="text-sm font-medium">{patient.phone}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 text-slate-300">
                            <Mail className="w-5 h-5 text-slate-500" />
                            <div>
                                <span className="text-xs text-slate-500 block">Email Portal</span>
                                <span className="text-sm font-medium">{patient.user?.email || '-'}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 text-slate-300">
                            <MapPin className="w-5 h-5 text-slate-500" />
                            <div>
                                <span className="text-xs text-slate-500 block">Alamat</span>
                                <span className="text-sm font-medium">{patient.address || '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-800">
                        <span className="text-xs text-slate-500 block mb-1">Riwayat & Kondisi Medis</span>
                        <p className="text-sm text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
                            {patient.medical_conditions || 'Tidak ada riwayat medis khusus terdistribusi.'}
                        </p>
                    </div>
                </div>

                {/* Grid medications & appointments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Medications */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-800">
                            <Pill className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-base font-bold text-slate-100">Daftar Obat Pasien</h3>
                        </div>

                        {patient.medications?.length === 0 ? (
                            <p className="text-xs text-slate-500 py-4">Belum ada resep obat tercatat.</p>
                        ) : (
                            <div className="space-y-3">
                                {patient.medications.map((med) => (
                                    <div key={med.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-semibold text-emerald-300">{med.name}</span>
                                            <span className="text-xs text-slate-400 font-mono">{med.dosage}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-1">Frekuensi: {med.frequency}</p>
                                        {med.notes && <p className="text-[11px] text-slate-500 italic">{med.notes}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Appointments */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-800">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            <h3 className="text-base font-bold text-slate-100">Riwayat Janji Temu Terakhir</h3>
                        </div>

                        {patient.appointments?.length === 0 ? (
                            <p className="text-xs text-slate-500 py-4">Belum ada riwayat janji temu.</p>
                        ) : (
                            <div className="space-y-3">
                                {patient.appointments.map((app) => (
                                    <div key={app.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-semibold text-slate-200 block">{app.appointment_date}</span>
                                            <span className="text-xs text-blue-400 capitalize">Shift {app.shift} ({app.start_time.substring(0, 5)} - {app.end_time.substring(0, 5)})</span>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                                            app.status === 'checked-in' ? 'bg-emerald-500/10 text-emerald-400' :
                                            app.status === 'no-show' ? 'bg-rose-500/10 text-rose-400' :
                                            'bg-blue-500/10 text-blue-400'
                                        }`}>
                                            {app.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
