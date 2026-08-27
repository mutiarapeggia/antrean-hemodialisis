import React, { useState, useEffect } from 'react';
import { Activity, Clock, ShieldCheck, HelpCircle } from 'lucide-react';

export default function KioskLayout({ children }) {
    const [timeStr, setTimeStr] = useState('');
    const [dateStr, setDateStr] = useState('');

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setTimeStr(now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
            setDateStr(now.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
        };

        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col justify-between selection:bg-cyan-500 selection:text-black select-none">
            {/* Header: Clean Tanpa Garis Border Putih, Centered Inner Content (max-w-7xl) */}
            <header className="w-full bg-slate-900/90 backdrop-blur-xl shadow-xl z-20">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6 flex items-center justify-between">
                    {/* Header Left: Icon Box + Title dengan Gap Longgar (gap-6) */}
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 p-3.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl shadow-lg shadow-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <Activity className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="leading-snug">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide uppercase">
                                KIOSK CHECK-IN MANDIRI
                            </h1>
                            <p className="text-sm font-medium text-slate-400 mt-1">Klinik Hemodialisis - Antrean Pasien</p>
                        </div>
                    </div>

                    {/* Box Jam Digital Kanan */}
                    <div className="px-6 py-3 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-inner text-right">
                        <div className="flex items-center justify-end gap-4 text-amber-400 font-mono font-bold text-2xl tracking-wider">
                            <Clock className="w-6 h-6 text-amber-400 animate-pulse flex-shrink-0 mr-1" />
                            <span>{timeStr}</span>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold tracking-wide mt-1">{dateStr}</p>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full flex flex-col justify-center py-6">
                {children}
            </main>

            {/* Footer: Clean Tanpa Garis Border Putih, Centered Inner Content (max-w-7xl) */}
            <footer className="w-full bg-slate-900/90 backdrop-blur-xl shadow-xl mt-auto z-20">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6 flex items-center justify-between">
                    <div className="px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-3 sm:gap-4 shadow-sm">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span>Sistem Verifikasi Otomatis Kriptografi HMAC SHA256</span>
                    </div>
                    
                    <div className="px-6 py-3 rounded-full bg-slate-950 border border-slate-800 text-sm font-bold text-slate-200 hover:text-white flex items-center gap-3 sm:gap-4 shadow-md transition-colors cursor-pointer">
                        <HelpCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <span>Butuh Bantuan? Silakan Hubungi Petugas Loket</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
