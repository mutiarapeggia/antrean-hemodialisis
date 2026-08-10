import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Activity, LogOut, Calendar, LayoutDashboard, Megaphone, Bell } from 'lucide-react';

export default function PatientLayout({ children, title }) {
    const { auth, flash } = usePage().props;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
            {/* Top Navbar */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl border border-blue-200">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="font-bold text-lg text-slate-900 tracking-wide block">Antrean Hemodialisis</span>
                                <span className="text-xs text-blue-700 font-semibold block -mt-1">Portal Pasien</span>
                            </div>
                        </div>

                        <nav className="hidden md:flex space-x-2">
                            <Link
                                href={route('patient.dashboard')}
                                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 min-h-[44px] ${
                                    route().current('patient.dashboard')
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Dashboard</span>
                            </Link>

                            <Link
                                href={route('patient.appointments.index')}
                                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 min-h-[44px] ${
                                    route().current('patient.appointments.*')
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <Calendar className="w-4 h-4" />
                                <span>Janji Temu Saya</span>
                            </Link>

                            <Link
                                href={route('patient.announcements.index')}
                                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 min-h-[44px] ${
                                    route().current('patient.announcements.*')
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <Megaphone className="w-4 h-4" />
                                <span>Pengumuman</span>
                            </Link>

                            <Link
                                href={route('patient.notifications.index')}
                                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 min-h-[44px] ${
                                    route().current('patient.notifications.*')
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <Bell className="w-4 h-4" />
                                <span>Notifikasi & WA</span>
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-800">{auth.user?.name}</p>
                            <p className="text-xs text-blue-700 font-semibold">{auth.user?.email}</p>
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold shadow-xs">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm font-semibold shadow-xs">
                        {flash.error}
                    </div>
                )}

                {children}
            </main>
        </div>
    );
}
