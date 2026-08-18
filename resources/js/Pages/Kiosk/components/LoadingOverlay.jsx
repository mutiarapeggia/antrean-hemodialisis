import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function LoadingOverlay() {
    return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 animate-fade-in">
            <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xl flex flex-col items-center space-y-4 px-10 py-8">
                <RefreshCw className="w-14 h-14 text-blue-600 animate-spin" />
                <p className="text-2xl font-black text-slate-900 tracking-wide">Memproses Check-In...</p>
                <p className="text-xs text-slate-600 font-bold">Mohon tunggu sebentar, sistem sedang memverifikasi token HMAC</p>
            </div>
        </div>
    );
}
