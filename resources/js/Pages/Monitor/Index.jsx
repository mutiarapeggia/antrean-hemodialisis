import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Activity, Clock, QrCode, RefreshCw, CheckCircle2, UserCheck, Calendar, Bed } from 'lucide-react';

export default function MonitorIndex({ appointments = [], stats = {}, todayDate }) {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('id-ID'));

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('id-ID'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const shiftPagi = appointments.filter(a => a.shift === 'pagi');
    const shiftSiang = appointments.filter(a => a.shift === 'siang');

    const getStatusBadge = (status) => {
        switch (status) {
            case 'checked-in':
                return <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">Checked-In</span>;
            case 'in-progress':
                return <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">Sedang Perawatan</span>;
            case 'completed':
                return <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-indigo-100 text-indigo-800 border border-indigo-300">Selesai</span>;
            case 'no-show':
                return <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-purple-100 text-purple-800 border border-purple-300">No-Show</span>;
            case 'cancelled':
                return <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">Batal</span>;
            default:
                return <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">Menunggu</span>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 sm:p-8 antialiased">
            <Head title="Display Monitor Antrean TV — Klinik Hemodialisis" />

            {/* TV Header Banner */}
            <header className="bg-white border border-slate-200 rounded-3xl p-6 mb-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-md">
                        <Activity className="w-8 h-8" />
                    </div>
                    <div>
                        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 block">Papan Antrean Real-Time (TV Display)</span>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Klinik Utama Hemodialisis</h1>
                    </div>
                </div>

                <div className="flex items-center space-x-6 bg-slate-100 px-6 py-3 rounded-2xl border border-slate-200">
                    <div className="text-right">
                        <span className="text-xs font-bold text-slate-500 uppercase block">Tanggal Hari Ini</span>
                        <span className="text-sm font-extrabold text-slate-800">{todayDate}</span>
                    </div>
                    <div className="h-8 w-px bg-slate-300" />
                    <div className="text-left">
                        <span className="text-xs font-bold text-slate-500 uppercase block">Waktu Server</span>
                        <span className="text-xl font-black text-blue-600 font-mono">{currentTime} WIB</span>
                    </div>
                </div>
            </header>

            {/* Summary Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center">
                    <span className="text-xs font-bold text-slate-500 uppercase block">Total Antrean</span>
                    <span className="text-3xl font-black text-slate-900">{stats.total || 0}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm text-center">
                    <span className="text-xs font-bold text-emerald-700 uppercase block">Pasien Checked-In</span>
                    <span className="text-3xl font-black text-emerald-800">{stats.checked_in || 0}</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm text-center">
                    <span className="text-xs font-bold text-blue-700 uppercase block">Sedang Tindakan</span>
                    <span className="text-3xl font-black text-blue-800">{stats.in_progress || 0}</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm text-center">
                    <span className="text-xs font-bold text-amber-700 uppercase block">Menunggu Kedatangan</span>
                    <span className="text-3xl font-black text-amber-800">{stats.scheduled || 0}</span>
                </div>
            </div>

            {/* Shift Grid Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Shift Pagi */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                        <div className="flex items-center space-x-3">
                            <span className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                Shift Pagi (07:00 - 11:00 WIB)
                            </span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-500">{shiftPagi.length} Pasien Terjadwal</span>
                    </div>

                    {shiftPagi.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-bold text-sm">
                            Tidak ada jadwal shift pagi hari ini.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {shiftPagi.map((app) => (
                                <div key={app.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black text-blue-700 flex items-center gap-1">
                                            <Bed className="w-4 h-4" /> Bed #{app.bed_number || '?'}
                                        </span>
                                        {getStatusBadge(app.status)}
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 truncate">
                                        {app.patient?.user?.name || 'Nama Pasien'}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-600 mt-1 font-mono">
                                        RM: {app.patient?.medical_record_number || '-'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Shift Siang */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                        <div className="flex items-center space-x-3">
                            <span className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase bg-indigo-100 text-indigo-800 border border-indigo-300">
                                Shift Siang (12:00 - 16:00 WIB)
                            </span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-500">{shiftSiang.length} Pasien Terjadwal</span>
                    </div>

                    {shiftSiang.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-bold text-sm">
                            Tidak ada jadwal shift siang hari ini.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {shiftSiang.map((app) => (
                                <div key={app.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black text-blue-700 flex items-center gap-1">
                                            <Bed className="w-4 h-4" /> Bed #{app.bed_number || '?'}
                                        </span>
                                        {getStatusBadge(app.status)}
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 truncate">
                                        {app.patient?.user?.name || 'Nama Pasien'}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-600 mt-1 font-mono">
                                        RM: {app.patient?.medical_record_number || '-'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
