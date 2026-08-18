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
                        className="inline-flex items-center space-x-2 text-sm font-bold text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke Daftar Pasien</span>
                    </Link>

                    <Link
                        href={route('admin.patients.edit', patient.id)}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-extrabold rounded-xl transition-all shadow-md shadow-blue-600/20"
                    >
                        <Edit className="w-4 h-4" />
                        <span>Edit Data Pasien</span>
                    </Link>
                </div>

                {/* Profile Overview Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl border border-blue-200 flex items-center justify-center font-black text-2xl">
                                {patient.user?.name ? patient.user.name.charAt(0) : 'P'}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">{patient.user?.name || 'Tanpa Nama'}</h2>
                                <span className="text-sm font-mono text-blue-700 font-bold">{patient.medical_record_number}</span>
                            </div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            patient.is_active 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                            {patient.is_active ? 'Status: Aktif' : 'Status: Nonaktif'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
                        <div className="flex items-center space-x-3 text-slate-800">
                            <Phone className="w-5 h-5 text-slate-400" />
                            <div>
                                <span className="text-xs text-slate-500 font-bold uppercase block">Nomor Telepon</span>
                                <span className="text-sm font-bold">{patient.phone}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 text-slate-800">
                            <Mail className="w-5 h-5 text-slate-400" />
                            <div>
                                <span className="text-xs text-slate-500 font-bold uppercase block">Email Portal</span>
                                <span className="text-sm font-bold">{patient.user?.email || '-'}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 text-slate-800">
                            <MapPin className="w-5 h-5 text-slate-400" />
                            <div>
                                <span className="text-xs text-slate-500 font-bold uppercase block">Alamat</span>
                                <span className="text-sm font-bold">{patient.address || '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Riwayat & Kondisi Medis</span>
                        <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            {patient.medical_conditions || 'Tidak ada riwayat medis khusus terdistribusi.'}
                        </p>
                    </div>
                </div>

                {/* Grid medications & appointments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Medications */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-200">
                            <Pill className="w-5 h-5 text-emerald-600" />
                            <h3 className="text-base font-black text-slate-900">Daftar Obat Pasien</h3>
                        </div>

                        {patient.medications?.length === 0 ? (
                            <p className="text-xs font-semibold text-slate-500 py-4">Belum ada resep obat tercatat.</p>
                        ) : (
                            <div className="space-y-3">
                                {patient.medications.map((med) => (
                                    <div key={med.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-black text-emerald-700">{med.name}</span>
                                            <span className="text-xs text-slate-600 font-mono font-bold">{med.dosage}</span>
                                        </div>
                                        <p className="text-xs font-semibold text-slate-700 mb-1">Frekuensi: {med.frequency}</p>
                                        {med.notes && <p className="text-[11px] text-slate-500 italic font-medium">{med.notes}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Appointments */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-200">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <h3 className="text-base font-black text-slate-900">Riwayat Janji Temu Terakhir</h3>
                        </div>

                        {patient.appointments?.length === 0 ? (
                            <p className="text-xs font-semibold text-slate-500 py-4">Belum ada riwayat janji temu.</p>
                        ) : (
                            <div className="space-y-3">
                                {patient.appointments.map((app) => (
                                    <div key={app.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-black text-slate-900 block">{app.appointment_date}</span>
                                            <span className="text-xs text-blue-700 font-bold capitalize">Shift {app.shift} ({app.start_time ? app.start_time.substring(0, 5) : '07:00'} - {app.end_time ? app.end_time.substring(0, 5) : '11:00'})</span>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                                            app.status === 'checked-in' ? 'bg-emerald-100 text-emerald-800' :
                                            app.status === 'no-show' ? 'bg-rose-100 text-rose-800' :
                                            'bg-blue-100 text-blue-800'
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
