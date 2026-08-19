import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Activity, Bed as BedIcon, CheckCircle2, Clock, Wrench, AlertTriangle, RefreshCw, LogIn } from 'lucide-react';

export default function Index({ beds = [], stats = {}, lastUpdated = '' }) {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('id-ID'));

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('id-ID'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans antialiased flex flex-col justify-between p-6 sm:p-10">
            <Head title="Informasi Ketersediaan Bed Realtime — Klinik Utama Hemodialisis" />

            {/* Top Navigation Header */}
            <header className="flex flex-col sm:flex-row items-center justify-between bg-slate-800/80 border border-slate-700/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl gap-4 mb-8">
                <div className="flex items-center space-x-4">
                    <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/30">
                        <Activity className="w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">KETERSEDIAAN BED REALTIME</h1>
                        <p className="text-xs sm:text-sm font-extrabold text-blue-400 uppercase tracking-widest">Klinik Utama Hemodialisis • Live Display Ruang Tunggu</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3 bg-slate-900/80 border border-slate-700 px-5 py-3 rounded-2xl">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <span className="text-lg font-mono font-black text-slate-100">{currentTime} WIB</span>
                    </div>

                    <Link
                        href="/login"
                        className="inline-flex items-center space-x-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-600/20 transition-all"
                    >
                        <LogIn className="w-4 h-4" />
                        <span>Portal Login</span>
                    </Link>
                </div>
            </header>

            {/* Main Display Grid */}
            <main className="flex-1 space-y-8">
                {/* Metrics Summary Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">Total Kapasitas</span>
                            <BedIcon className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="text-4xl sm:text-5xl font-black text-white">{stats.total || 0}</span>
                        <span className="text-xs font-semibold text-slate-400 block mt-1">Bed Hemodialisis Terdaftar</span>
                    </div>

                    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-3xl p-6 shadow-xl">
                        <div className="flex items-center justify-between text-emerald-400 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">Bed Tersedia</span>
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-4xl sm:text-5xl font-black text-emerald-400">{stats.available || 0}</span>
                        <span className="text-xs font-bold text-emerald-400/80 block mt-1">Siap Digunakan Untuk Pasien</span>
                    </div>

                    <div className="bg-blue-950/40 border border-blue-500/30 rounded-3xl p-6 shadow-xl">
                        <div className="flex items-center justify-between text-blue-400 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">Bed Terpakai</span>
                            <BedIcon className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-4xl sm:text-5xl font-black text-blue-400">{stats.occupied || 0}</span>
                        <span className="text-xs font-bold text-blue-400/80 block mt-1">Sedang Dalam Penanganan HD</span>
                    </div>

                    <div className="bg-amber-950/40 border border-amber-500/30 rounded-3xl p-6 shadow-xl">
                        <div className="flex items-center justify-between text-amber-400 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">Maintenance / Rusak</span>
                            <Wrench className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="text-4xl sm:text-5xl font-black text-amber-400">{stats.maintenance_damaged || 0}</span>
                        <span className="text-xs font-bold text-amber-400/80 block mt-1">Tidak Dapat Dipilih / Perbaikan</span>
                    </div>
                </div>

                {/* Realtime Bed Status Tiles Grid */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                        <h2 className="text-xl font-black text-white flex items-center space-x-3">
                            <BedIcon className="w-6 h-6 text-blue-400" />
                            <span>Denah & Status Seluruh Tempat Tidur (Bed)</span>
                        </h2>
                        <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                            <span>Status Realtime</span>
                        </span>
                    </div>

                    {beds.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 font-bold">
                            Belum ada data Master Bed yang terdaftar di sistem.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {beds.map((bed) => (
                                <div
                                    key={bed.id}
                                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between text-center relative overflow-hidden ${
                                        bed.status === 'available' ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' :
                                        bed.status === 'occupied' ? 'bg-blue-950/30 border-blue-500/40 text-blue-300' :
                                        bed.status === 'maintenance' ? 'bg-amber-950/30 border-amber-500/40 text-amber-300' :
                                        'bg-rose-950/30 border-rose-500/40 text-rose-300'
                                    }`}
                                >
                                    <div>
                                        <span className="text-xs font-mono font-black opacity-80 block uppercase tracking-wider">
                                            {bed.bed_number}
                                        </span>
                                        <p className="text-base font-black text-white mt-1 truncate">
                                            {bed.label}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-700/40">
                                        <span className={`inline-flex items-center justify-center space-x-1 text-[11px] font-black uppercase px-2.5 py-1 rounded-full w-full ${
                                            bed.status === 'available' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                            bed.status === 'occupied' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                            bed.status === 'maintenance' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                            'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                        }`}>
                                            {bed.status === 'available' && <CheckCircle2 className="w-3 h-3" />}
                                            {bed.status === 'occupied' && <BedIcon className="w-3 h-3" />}
                                            {bed.status === 'maintenance' && <Wrench className="w-3 h-3" />}
                                            {bed.status === 'damaged' && <AlertTriangle className="w-3 h-3" />}
                                            <span>
                                                {bed.status === 'available' ? 'Tersedia' :
                                                 bed.status === 'occupied' ? 'Terpakai' :
                                                 bed.status === 'maintenance' ? 'Perbaikan' : 'Rusak'}
                                            </span>
                                        </span>
                                        {bed.notes && (
                                            <p className="text-[10px] italic opacity-75 mt-1 truncate">{bed.notes}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer Display */}
            <footer className="mt-8 pt-4 border-t border-slate-800 text-center text-xs font-semibold text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>© Klinik Utama Hemodialisis • Papan Informasi Realtime Ketersediaan Bed</span>
                <span>Diperbarui otomatis saat terjadi perubahan status bed</span>
            </footer>
        </div>
    );
}
