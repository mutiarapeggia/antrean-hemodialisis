import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function LoadingOverlay() {
    return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4 animate-fade-in">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center space-y-4 px-10 py-8">
                <RefreshCw className="w-14 h-14 text-cyan-400 animate-spin" />
                <p className="text-2xl font-bold text-white tracking-wide">Memproses Check-In...</p>
                <p className="text-xs text-slate-400 font-medium">Mohon tunggu sebentar, sistem sedang memverifikasi token HMAC</p>
            </div>
        </div>
    );
}
