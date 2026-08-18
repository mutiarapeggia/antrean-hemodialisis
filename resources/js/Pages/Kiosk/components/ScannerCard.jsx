import React from 'react';
import { QrCode } from 'lucide-react';

export default function ScannerCard() {
    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col items-center justify-center h-full w-full relative overflow-hidden transition-all duration-300">
            {/* Status Indicator Badge */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-widest shadow-xs mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                <span>SCANNER AKTIF &amp; STANDBY</span>
            </div>

            {/* Viewport Area */}
            <div className="w-72 h-72 sm:w-80 sm:h-80 my-4 bg-slate-50 border-2 border-dashed border-blue-400 rounded-3xl flex flex-col items-center justify-center p-6 relative group overflow-hidden transition-transform duration-300">
                <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-blue-600 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-blue-600 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-blue-600 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-blue-600 rounded-br-lg" />

                <div className="absolute w-full h-1 bg-blue-500 animate-bounce top-1/3 left-0 right-0 z-10 shadow-md" />

                <QrCode className="w-28 h-28 text-blue-600 mb-3 animate-pulse" />
                
                <span className="text-xs font-black text-blue-800 uppercase tracking-widest bg-blue-100 px-4 py-1.5 rounded-full border border-blue-300 z-10 shadow-xs">
                    AREA PINDAIAN QR
                </span>
            </div>

            <div className="text-center mt-4 space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wide">Arahkan Cetakan / Layar QR Pasien</h2>
                <p className="text-sm font-semibold text-slate-600">Sistem secara otomatis memproses verifikasi HMAC SHA256.</p>
            </div>
        </div>
    );
}
