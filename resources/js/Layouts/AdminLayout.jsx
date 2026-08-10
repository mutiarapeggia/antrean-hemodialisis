import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    Users, 
    Calendar, 
    QrCode, 
    Bell, 
    Pill, 
    LogOut, 
    Menu, 
    X,
    Activity
} from 'lucide-react';

export default function AdminLayout({ children, title }) {
    const { auth, flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: route('admin.dashboard'), icon: LayoutDashboard, current: route().current('admin.dashboard') },
        { name: 'Monitor Antrean', href: route('admin.queue.index'), icon: QrCode, current: route().current('admin.queue.*') },
        { name: 'Manajemen Pasien', href: route('admin.patients.index'), icon: Users, current: route().current('admin.patients.*') },
        { name: 'Janji Temu & Shift', href: route('admin.appointments.index'), icon: Calendar, current: route().current('admin.appointments.*') },
        { name: 'Permintaan Reschedule', href: route('admin.reschedule-requests.index'), icon: Bell, current: route().current('admin.reschedule-requests.*') },
        { name: 'Pengumuman Klinik', href: route('admin.announcements.index'), icon: Bell, current: route().current('admin.announcements.*') },
        { name: 'Manajemen Obat', href: route('admin.medications.index'), icon: Pill, current: route().current('admin.medications.*') },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                            <Activity className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg text-white tracking-wide">HemoQueue</span>
                    </div>
                    <button 
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-slate-400 hover:text-white p-1"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4">
                        <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Portal Staf Admin</p>
                        <p className="text-sm font-medium text-slate-200 truncate">{auth.user?.name}</p>
                    </div>

                    <nav className="space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                                        flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                                        ${item.current 
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold' 
                                            : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'}
                                    `}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900/80">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Keluar Portal</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-100">{title}</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ● System Online
                        </span>
                    </div>
                </header>

                {/* Notifications & Flash Messages */}
                <div className="px-6 pt-4">
                    {flash?.success && (
                        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm">
                            <span>{flash.success}</span>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm">
                            <span>{flash.error}</span>
                        </div>
                    )}
                </div>

                {/* Main Body */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
