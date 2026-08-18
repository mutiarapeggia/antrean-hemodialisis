import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Edit as EditIcon } from 'lucide-react';

export default function Edit({ patient }) {
    const { data, setData, put, processing, errors } = useForm({
        name: patient.user?.name || '',
        email: patient.user?.email || '',
        phone: patient.phone || '',
        medical_record_number: patient.medical_record_number || '',
        address: patient.address || '',
        medical_conditions: patient.medical_conditions || '',
        is_active: patient.is_active ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.patients.update', patient.id));
    };

    return (
        <AdminLayout title={`Edit Data Pasien — ${patient.medical_record_number}`}>
            <Head title={`Edit Data Pasien — ${patient.medical_record_number}`} />

            <div className="max-w-3xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href={route('admin.patients.index')}
                        className="inline-flex items-center space-x-2 text-sm font-bold text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke Daftar Pasien</span>
                    </Link>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
                    <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-200">
                        <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                            <EditIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Edit Profil & Informasi Pasien</h2>
                            <p className="text-xs font-semibold text-slate-600">Perbarui data kontak, kondisi medis, dan status keaktifan pasien.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Nama Lengkap Pasien <span className="text-rose-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                                />
                                {errors.name && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.name}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Nomor Rekam Medis (RM) <span className="text-rose-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.medical_record_number}
                                    onChange={(e) => setData('medical_record_number', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-blue-700 font-mono font-bold focus:outline-none focus:border-blue-600"
                                />
                                {errors.medical_record_number && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.medical_record_number}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Email Akun <span className="text-rose-600">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                                />
                                {errors.email && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.email}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Nomor Telepon / WA <span className="text-rose-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                                />
                                {errors.phone && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.phone}</span>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Alamat Rumah
                            </label>
                            <textarea
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                rows="3"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                            ></textarea>
                            {errors.address && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.address}</span>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Kondisi Medis
                            </label>
                            <textarea
                                value={data.medical_conditions}
                                onChange={(e) => setData('medical_conditions', e.target.value)}
                                rows="3"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                            ></textarea>
                            {errors.medical_conditions && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.medical_conditions}</span>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Status Keaktifan Pasien
                            </label>
                            <select
                                value={data.is_active ? '1' : '0'}
                                onChange={(e) => setData('is_active', e.target.value === '1')}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                            >
                                <option value="1">Aktif (Dapat membuat jadwal)</option>
                                <option value="0">Nonaktif (Pasien dinonaktifkan)</option>
                            </select>
                            {errors.is_active && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.is_active}</span>}
                        </div>

                        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
                            <Link
                                href={route('admin.patients.index')}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-extrabold rounded-xl transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                <span>{processing ? 'Memperbarui...' : 'Perbarui Data Pasien'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
