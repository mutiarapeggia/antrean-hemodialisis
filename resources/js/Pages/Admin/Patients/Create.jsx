import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, UserCheck } from 'lucide-react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        medical_record_number: 'RM-' + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + Math.floor(100 + Math.random() * 900),
        address: '',
        medical_conditions: '',
        password: 'pasien',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.patients.store'));
    };

    return (
        <AdminLayout title="Tambah Pasien Baru">
            <Head title="Tambah Pasien Baru" />

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
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Form Data Pasien Baru</h2>
                            <p className="text-xs font-semibold text-slate-600">Isi data lengkap pasien untuk pendaftaran dan pembuatan akun login.</p>
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
                                    placeholder="Contoh: Budi Santoso"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
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
                                    placeholder="budi@example.com"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
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
                                    placeholder="081234567890"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                                />
                                {errors.phone && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.phone}</span>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Alamat Rumah Lengkap
                            </label>
                            <textarea
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                rows="3"
                                placeholder="Jl. Merdeka No. 45, Jakarta..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                            ></textarea>
                            {errors.address && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.address}</span>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Catatan / Kondisi Medis Pasien
                            </label>
                            <textarea
                                value={data.medical_conditions}
                                onChange={(e) => setData('medical_conditions', e.target.value)}
                                rows="3"
                                placeholder="Contoh: Gagal ginjal kronis stage 5, diabetes..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                            ></textarea>
                            {errors.medical_conditions && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.medical_conditions}</span>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Password Login Awal Pasien
                            </label>
                            <input
                                type="text"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600"
                            />
                            <p className="text-[11px] font-semibold text-slate-500 mt-1">Default password diset ke <code className="text-blue-700 font-bold">pasien</code> jika tidak diubah.</p>
                            {errors.password && <span className="text-xs text-rose-600 font-bold mt-1 block">{errors.password}</span>}
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
                                <span>{processing ? 'Menyimpan...' : 'Simpan Data Pasien'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
