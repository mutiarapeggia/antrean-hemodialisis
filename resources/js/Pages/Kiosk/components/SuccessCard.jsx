import React from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';

export default function SuccessCard({ resultData, autoResetSeconds, handleReset }) {
    return (
        <div className="max-w-3xl w-full mx-auto my-auto bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md animate-fade-in">
            {/* Top Header Circle Icon */}
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto mt-8 mb-4 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
            </div>

            {/* Status Pill Badge */}
            <div className="text-center">
                <span className="px-6 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider uppercase inline-block mb-3">
                    STATUS: TEPAT WAKTU (CHECK-IN BERHASIL)
                </span>
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-1">
                Check-In Berhasil!
            </h2>
            <p className="text-base font-semibold text-emerald-400 text-center mb-6">
                {resultData?.message || 'Check-In Berhasil!'}
            </p>

            {/* Grid Info Pasien (Dark Box 2-Kolom) */}
            <div className="bg-slate-950/80 border-y border-slate-800/80 p-6 sm:p-8 grid grid-cols-2 gap-y-6 gap-x-8 text-left">
                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">NAMA PASIEN</span>
                    <span className="text-xl font-extrabold text-white block truncate">
                        {resultData?.data?.patient_name || resultData?.patient_name || 'Budi Santoso'}
                    </span>
                </div>

                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">NOMOR RM</span>
                    <span className="text-xl font-extrabold text-white font-mono block">
                        {resultData?.data?.rm_number || resultData?.medical_record_number || 'RM-202607-001'}
                    </span>
                </div>

                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">SHIFT OPERASIONAL</span>
                    <span className="text-xl font-extrabold text-white block">
                        {resultData?.data?.shift || resultData?.shift || 'Pagi'}
                    </span>
                </div>

                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">POSISI BED</span>
                    <span className="text-xl font-black text-amber-400 block">
                        {resultData?.data?.bed_number || resultData?.bed_number || 'Bed 1'}
                    </span>
                </div>
            </div>

            {/* Card Footer Baris Bawah */}
            <div className="px-6 py-4 bg-slate-900/60 flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-400">
                    Auto-Reset Layar: <strong className="text-emerald-400 font-bold">{autoResetSeconds} detik</strong>
                </div>

                <button
                    onClick={handleReset}
                    className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    aria-label="Selesai / Scan Lagi"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Selesai / Scan Lagi</span>
                </button>
            </div>
        </div>
    );
}
