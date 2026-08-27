import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Activity, UserPlus, ArrowRight, Lock, Mail, User, Phone, MapPin, FileText } from 'lucide-react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        medical_conditions: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex items-center justify-center p-4 antialiased my-8">
            <Head title="Pendaftaran Pasien Baru — Antrean Hemodialisis" />

            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-blue-100 text-blue-700 rounded-2xl border border-blue-200 mb-3 shadow-xs">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pendaftaran Pasien Baru</h1>
                    <p className="text-sm font-semibold text-slate-600 mt-1">Daftarkan diri Anda untuk layanan mandiri Klinik Hemodialisis</p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">Nama Lengkap Pasien</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none pl-10"
                                placeholder="Contoh: Budi Santoso"
                                required
                            />
                            <User className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                        </div>
                        {errors.name && <p className="text-xs font-bold text-rose-600 mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">Alamat Email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none pl-10"
                                    placeholder="nama@domain.com"
                                    required
                                />
                                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                            </div>
                            {errors.email && <p className="text-xs font-bold text-rose-600 mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">No. HP / Telepon (WhatsApp)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none pl-10"
                                    placeholder="081234567890"
                                />
                                <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                            </div>
                            {errors.phone && <p className="text-xs font-bold text-rose-600 mt-1">{errors.phone}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">Alamat Lengkap</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none pl-10"
                                placeholder="Jl. Merdeka No. 45, Jakarta"
                            />
                            <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                        </div>
                        {errors.address && <p className="text-xs font-bold text-rose-600 mt-1">{errors.address}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                            Kondisi Medis / Catatan Medis (Keluhan Awal)
                            <span className="text-[10px] text-slate-400 font-normal lowercase tracking-normal ml-1.5">(opsional)</span>
                        </label>
                        <div className="relative">
                            <textarea
                                value={data.medical_conditions}
                                onChange={(e) => setData('medical_conditions', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none pl-10 min-h-[84px]"
                                placeholder="Contoh: Gagal Ginjal Kronis (Dialisis Rutin 2x Seminggu), Hipertensi, Alergi Obat"
                                rows={3}
                            />
                            <FileText className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                        </div>
                        {errors.medical_conditions && <p className="text-xs font-bold text-rose-600 mt-1">{errors.medical_conditions}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">Password (Min. 6 Karakter)</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none pl-10"
                                    placeholder="••••••••"
                                    required
                                />
                                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                            </div>
                            {errors.password && <p className="text-xs font-bold text-rose-600 mt-1">{errors.password}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">Konfirmasi Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none pl-10"
                                    placeholder="••••••••"
                                    required
                                />
                                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 text-sm mt-4"
                    >
                        <span>Daftar Pasien Mandiri</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                    <p className="text-xs font-medium text-slate-600">
                        Sudah terdaftar sebagai pasien?{' '}
                        <Link href="/pasien/login" className="font-extrabold text-blue-600 hover:text-blue-700 underline">
                            Masuk Di Sini
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
