import React from 'react';
import { QrCode } from 'lucide-react';

export default function ScannerCard() {
    return (
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center justify-center backdrop-blur-xl h-full w-full relative overflow-hidden transition-all duration-300">
            {/* Status Indicator Badge */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-widest shadow-sm mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>SCANNER AKTIF &amp; STANDBY</span>
            </div>

            {/* Enlarged Futuristic Scanner Viewport Area (340px-400px) */}
            <div className="w-72 h-72 sm:w-80 sm:h-80 my-4 bg-slate-950/90 border-2 border-dashed border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)] rounded-3xl flex flex-col items-center justify-center p-6 relative group overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
                {/* Futuristic Corner Brackets */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />

                {/* Animated Scan Laser Line */}
                <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce top-1/3 left-0 right-0 z-10" />

                {/* Minimalist QR Icon */}
                <QrCode className="w-28 h-28 text-cyan-400/90 mb-3 animate-pulse" />
                
                {/* Area Pindaian Badge */}
                <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-widest bg-cyan-950/90 px-4 py-1.5 rounded-full border border-cyan-500/30 z-10 shadow-md">
                    AREA PINDAIAN QR
                </span>
            </div>

            {/* Typography Section */}
            <div className="text-center mt-4 space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">Arahkan Cetakan / Layar QR Pasien</h2>
                <p className="text-sm font-medium text-slate-400">Sistem secara otomatis memproses verifikasi HMAC SHA256.</p>
            </div>
        </div>
    );
}
