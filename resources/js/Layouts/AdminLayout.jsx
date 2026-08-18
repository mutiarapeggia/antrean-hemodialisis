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
    Activity,
    UserCheck,
    CheckSquare
} from 'lucide-react';

export default function AdminLayout({ children, title }) {
    const { auth, flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: route('admin.dashboard'), icon: LayoutDashboard, current: route().current('admin.dashboard') },
        { name: 'Monitor Antrean', href: route('admin.queue.index'), icon: QrCode, current: route().current('admin.queue.*') },
        { name: 'Approval Registrasi Pasien', href: route('admin.patient-approvals.index'), icon: UserCheck, current: route().current('admin.patient-approvals.*') },
        { name: 'Approval Janji & Reschedule', href: route('admin.appointment-approvals.index'), icon: CheckSquare, current: route().current('admin.appointment-approvals.*') || route().current('admin.reschedule-requests.*') },
        { name: 'Manajemen Pasien', href: route('admin.patients.index'), icon: Users, current: route().current('admin.patients.*') },
        { name: 'Janji Temu & Shift', href: route('admin.appointments.index'), icon: Calendar, current: route().current('admin.appointments.*') },
        { name: 'Pengumuman Klinik', href: route('admin.announcements.index'), icon: Bell, current: route().current('admin.announcements.*') },
        { name: 'Manajemen Obat', href: route('admin.medications.index'), icon: Pill, current: route().current('admin.medications.*') },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-xl border border-blue-200">
                            <Activity className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg text-slate-900 tracking-wide">HemoQueue</span>
                    </div>
                    <button 
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-slate-500 hover:text-slate-900 p-1"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                        <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider">Portal Staf Admin</p>
                        <p className="text-sm font-medium text-slate-800 truncate">{auth.user?.name}</p>
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
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold' 
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                                    `}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Keluar Portal</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-xs">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ● System Online
                        </span>
                    </div>
                </header>

                {/* Notifications & Flash Messages */}
                <div className="px-6 pt-4">
                    {flash?.success && (
                        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center justify-between shadow-xs">
                            <span>{flash.success}</span>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium flex items-center justify-between shadow-xs">
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
