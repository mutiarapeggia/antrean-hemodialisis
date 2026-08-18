import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Activity, LogOut, Calendar, LayoutDashboard, Megaphone, Bell, Menu, X } from 'lucide-react';

export default function PatientLayout({ children, title }) {
    const { auth, flash } = usePage().props;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
            {/* Top Navbar */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl border border-blue-200">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight block">Antrean Hemodialisis</span>
                                <span className="text-xs text-blue-700 font-extrabold block -mt-1">Portal Pasien</span>
                            </div>
                        </div>

                        {/* Desktop Navigation Links */}
                        <nav className="hidden md:flex space-x-2">
                            <Link
                                href={route('patient.dashboard')}
                                className={`px-4 py-2.5 rounded-xl text-sm font-extrabold transition-colors flex items-center space-x-2 min-h-[48px] ${
                                    route().current('patient.dashboard')
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Dashboard Pasien</span>
                            </Link>

                            <Link
                                href={route('patient.appointments.index')}
                                className={`px-4 py-2.5 rounded-xl text-sm font-extrabold transition-colors flex items-center space-x-2 min-h-[48px] ${
                                    route().current('patient.appointments.*')
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <Calendar className="w-4 h-4" />
                                <span>Janji Temu Saya</span>
                            </Link>

                            <Link
                                href={route('patient.announcements.index')}
                                className={`px-4 py-2.5 rounded-xl text-sm font-extrabold transition-colors flex items-center space-x-2 min-h-[48px] ${
                                    route().current('patient.announcements.*')
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <Megaphone className="w-4 h-4" />
                                <span>Pengumuman</span>
                            </Link>

                            <Link
                                href={route('patient.notifications.index')}
                                className={`px-4 py-2.5 rounded-xl text-sm font-extrabold transition-colors flex items-center space-x-2 min-h-[48px] ${
                                    route().current('patient.notifications.*')
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <Bell className="w-4 h-4" />
                                <span>Notifikasi & WA</span>
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-extrabold text-slate-900">{auth.user?.name}</p>
                            <p className="text-xs text-blue-700 font-bold">{auth.user?.email}</p>
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="hidden md:flex p-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors min-h-[48px] min-w-[48px] items-center justify-center font-bold"
                            title="Keluar Portal"
                        >
                            <LogOut className="w-5 h-5" />
                        </Link>

                        {/* Hamburger Button for Mobile (<768px) */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-3 text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 min-h-[48px] min-w-[48px] flex items-center justify-center"
                            aria-label="Toggle Mobile Menu"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6 text-rose-600" /> : <Menu className="w-6 h-6 text-slate-800" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Drawer Dropdown (<768px) */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 shadow-lg">
                        <div className="pb-3 mb-2 border-b border-slate-100">
                            <p className="text-sm font-extrabold text-slate-900">{auth.user?.name}</p>
                            <p className="text-xs text-blue-700 font-bold">{auth.user?.email}</p>
                        </div>

                        <Link
                            href={route('patient.dashboard')}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center space-x-3 min-h-[48px] ${
                                route().current('patient.dashboard') ? 'bg-blue-600 text-white' : 'text-slate-800 hover:bg-slate-100'
                            }`}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            <span>Dashboard Pasien</span>
                        </Link>

                        <Link
                            href={route('patient.appointments.index')}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center space-x-3 min-h-[48px] ${
                                route().current('patient.appointments.*') ? 'bg-blue-600 text-white' : 'text-slate-800 hover:bg-slate-100'
                            }`}
                        >
                            <Calendar className="w-5 h-5" />
                            <span>Janji Temu Saya</span>
                        </Link>

                        <Link
                            href={route('patient.announcements.index')}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center space-x-3 min-h-[48px] ${
                                route().current('patient.announcements.*') ? 'bg-blue-600 text-white' : 'text-slate-800 hover:bg-slate-100'
                            }`}
                        >
                            <Megaphone className="w-5 h-5" />
                            <span>Pengumuman</span>
                        </Link>

                        <Link
                            href={route('patient.notifications.index')}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center space-x-3 min-h-[48px] ${
                                route().current('patient.notifications.*') ? 'bg-blue-600 text-white' : 'text-slate-800 hover:bg-slate-100'
                            }`}
                        >
                            <Bell className="w-5 h-5" />
                            <span>Notifikasi & WA</span>
                        </Link>

                        <div className="pt-2 border-t border-slate-100">
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="w-full px-4 py-3 text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold rounded-xl flex items-center justify-center space-x-2 min-h-[48px]"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Keluar / Logout</span>
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* Container */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full overflow-x-auto">
                {flash?.success && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-sm font-bold shadow-xs">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl text-sm font-bold shadow-xs">
                        {flash.error}
                    </div>
                )}

                {children}
            </main>
        </div>
    );
}
