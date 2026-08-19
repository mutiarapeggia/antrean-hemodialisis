import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Activity, ArrowRight, Lock, User } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex items-center justify-center p-4 antialiased">
            <Head title="Masuk Portal — Antrean Hemodialisis" />

            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-blue-100 text-blue-700 rounded-2xl border border-blue-200 mb-3 shadow-xs">
                        <Activity className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Portal Masuk Klinik</h1>
                    <p className="text-sm font-semibold text-slate-600 mt-1">Layanan Antrean & Manajemen Hemodialisis</p>
                </div>

                {status && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                            Username / Email / No. RM
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 pl-10"
                                placeholder="Masukkan username, email, atau No. RM"
                                required
                                autoFocus
                            />
                            <User className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                        </div>
                        {errors.email && (
                            <p className="text-xs font-bold text-rose-600 mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                            Password / Kata Sandi
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 pl-10"
                                placeholder="••••••••"
                                required
                            />
                            <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                        </div>
                        {errors.password && (
                            <p className="text-xs font-bold text-rose-600 mt-1">{errors.password}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center text-xs font-semibold text-slate-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">Ingat Sesi Saya</span>
                        </label>

                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                            >
                                Lupa Password?
                            </Link>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                    >
                        <span>Masuk Ke Portal</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                    <p className="text-xs font-medium text-slate-600">
                        Pasien baru Klinik Hemodialisis?{' '}
                        <Link href="/register" className="font-extrabold text-blue-600 hover:text-blue-700 underline">
                            Daftar Pasien Baru
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
