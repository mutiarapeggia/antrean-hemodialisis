import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Activity, LogOut, Calendar, LayoutDashboard } from 'lucide-react';

export default function PatientLayout({ children, title }) {
    const { auth, flash } = usePage().props;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
            {/* Top Navbar */}
            <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="font-bold text-lg text-white tracking-wide block">Antrean Hemodialisis</span>
                                <span className="text-xs text-slate-400 block -mt-1">Portal Pasien</span>
                            </div>
                        </div>

                        <nav className="hidden md:flex space-x-2">
                            <Link
                                href={route('patient.dashboard')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2 ${
                                    route().current('patient.dashboard')
                                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                }`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Dashboard</span>
                            </Link>

                            <Link
                                href={route('patient.appointments.index')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2 ${
                                    route().current('patient.appointments.*')
                                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                }`}
                            >
                                <Calendar className="w-4 h-4" />
                                <span>Janji Temu Saya</span>
                            </Link>

                            <Link
                                href={route('patient.announcements.index')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2 ${
                                    route().current('patient.announcements.*')
                                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                }`}
                            >
                                <span>Pengumuman Klinik</span>
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-slate-200">{auth.user?.name}</p>
                            <p className="text-xs text-blue-400">{auth.user?.email}</p>
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                            title="Keluar Portal"
                        >
                            <LogOut className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Container */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {flash?.success && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-sm font-medium">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-sm font-medium">
                        {flash.error}
                    </div>
                )}

                {children}
            </main>
        </div>
    );
}
