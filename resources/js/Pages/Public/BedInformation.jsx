import React, { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    Activity, 
    Bed as BedIcon, 
    CheckCircle2, 
    Clock, 
    Wrench, 
    XCircle, 
    RefreshCw,
    ShieldCheck,
    Monitor
} from 'lucide-react';

export default function BedInformation({ beds = [], stats = {}, todayAppointments = [], todayDate, currentTime }) {
    const [timeStr, setTimeStr] = useState(currentTime || new Date().toLocaleTimeString('id-ID'));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeStr(new Date().toLocaleTimeString('id-ID'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const getStatusCardStyle = (status) => {
        switch (status) {
            case 'available':
                return {
                    bg: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
                    badge: 'bg-emerald-500 text-white',
                    label: 'Tersedia',
                    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                };
            case 'occupied':
                return {
                    bg: 'bg-blue-500/10 border-blue-500/40 text-blue-300',
                    badge: 'bg-blue-600 text-white',
                    label: 'Terisi (Occupied)',
                    icon: <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
                };
            case 'maintenance':
                return {
                    bg: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
                    badge: 'bg-amber-600 text-white',
                    label: 'Perbaikan',
                    icon: <Wrench className="w-5 h-5 text-amber-400" />
                };
            case 'damaged':
                return {
                    bg: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
                    badge: 'bg-rose-600 text-white',
                    label: 'Rusak',
                    icon: <XCircle className="w-5 h-5 text-rose-400" />
                };
            default:
                return {
                    bg: 'bg-slate-800 border-slate-700 text-slate-300',
                    badge: 'bg-slate-700 text-white',
                    label: 'Tersedia',
                    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                };
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col justify-between p-4 sm:p-8 selection:bg-blue-500 selection:text-white">
            <Head title="Informasi Ketersediaan Bed Realtime — Klinik Utama Hemodialisis" />

            {/* Display Header */}
            <header className="flex flex-col md:flex-row items-center justify-between bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md gap-4">
                <div className="flex items-center space-x-4">
                    <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/30">
                        <Activity className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
                    </div>
                    <div>
                        <span className="text-xs font-black uppercase tracking-widest text-blue-400">DISPLAY INFORMASI PUBLIK KLINIK</span>
                        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">KETERSEDIAAN BED HEMODIALISIS</h1>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3 bg-slate-800/90 border border-slate-700 px-6 py-3.5 rounded-2xl">
                        <Clock className="w-6 h-6 text-blue-400" />
                        <div className="text-right">
                            <span className="text-xs text-slate-400 font-bold block">{todayDate || 'Hari Ini'}</span>
                            <span className="text-xl font-mono font-black text-white tracking-wider">{timeStr} WIB</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Statistics Cards */}
            <main className="my-auto py-8 space-y-8 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl text-center">
                        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Total Unit Bed</span>
                        <span className="text-4xl sm:text-5xl font-black text-white">{stats.total || beds.length || 10}</span>
                    </div>

                    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-3xl p-6 shadow-xl text-center">
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-widest block mb-1">Bed Tersedia</span>
                        <span className="text-4xl sm:text-5xl font-black text-emerald-300">{stats.available ?? 0}</span>
                    </div>

                    <div className="bg-blue-950/40 border border-blue-500/30 rounded-3xl p-6 shadow-xl text-center">
                        <span className="text-xs font-black text-blue-400 uppercase tracking-widest block mb-1">Bed Terpakai</span>
                        <span className="text-4xl sm:text-5xl font-black text-blue-300">{stats.occupied ?? 0}</span>
                    </div>

                    <div className="bg-amber-950/40 border border-amber-500/30 rounded-3xl p-6 shadow-xl text-center">
                        <span className="text-xs font-black text-amber-400 uppercase tracking-widest block mb-1">Maintenance / Rusak</span>
                        <span className="text-4xl sm:text-5xl font-black text-amber-300">{stats.maintenance ?? 0}</span>
                    </div>
                </div>

                {/* Realtime Bed Grid Visualizer */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-2xl">
                    <h2 className="text-xl sm:text-2xl font-black text-white mb-6 flex items-center space-x-3">
                        <BedIcon className="w-7 h-7 text-blue-400" />
                        <span>Visual Peta Ketersediaan Unit Bed</span>
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
                        {beds.map((b) => {
                            const style = getStatusCardStyle(b.status);
                            return (
                                <div
                                    key={b.id}
                                    className={`p-5 rounded-2xl border ${style.bg} flex flex-col justify-between space-y-4 shadow-lg transition-all transform hover:-translate-y-1`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-black text-lg text-white">{b.bed_number}</span>
                                        {style.icon}
                                    </div>

                                    <div>
                                        <h3 className="font-extrabold text-sm text-slate-200 line-clamp-1">{b.label}</h3>
                                        <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${style.badge}`}>
                                            {style.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Display Footer */}
            <footer className="flex flex-col sm:flex-row items-center justify-between py-4 border-t border-slate-800 text-slate-500 text-xs font-semibold gap-2">
                <span>Display Layar Publik • Klinik Utama Hemodialisis</span>
                <div className="flex items-center space-x-4">
                    <Link href="/kiosk" className="hover:text-blue-400 transition-colors">Mesin Kiosk</Link>
                    <span>•</span>
                    <Link href="/monitor" className="hover:text-blue-400 transition-colors">Monitor Antrean TV</Link>
                </div>
            </footer>
        </div>
    );
}
