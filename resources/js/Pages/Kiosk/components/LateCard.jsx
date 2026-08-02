import React from 'react';
import { XCircle, HelpCircle, RefreshCw } from 'lucide-react';

export default function LateCard({ resultData, autoResetSeconds, handleReset }) {
    return (
        <div className="max-w-3xl w-full mx-auto my-auto bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md animate-fade-in">
            {/* Top Header Circle Icon */}
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 mx-auto mt-8 mb-4 shadow-lg shadow-rose-500/20">
                <XCircle className="w-8 h-8" />
            </div>

            {/* Status Pill Badge */}
            <div className="text-center">
                <span className="px-6 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold tracking-wider uppercase inline-block mb-3">
                    STATUS: TERLAMBAT &gt;15 MENIT (NO-SHOW)
                </span>
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-1">
                Check-In Gagal!
            </h2>
            <p className="text-base font-semibold text-rose-400 text-center mb-6">
                {resultData?.message || 'Check-In Gagal! Batas Waktu Terlampaui (>15 Menit)'}
            </p>

            {/* Grid Info Kedatangan & Status (Dark Box 2-Kolom) */}
            <div className="bg-slate-950/80 border-y border-slate-800/80 p-6 sm:p-8">
                <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-left">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase block mb-1">NAMA PASIEN</span>
                        <span className="text-xl font-extrabold text-white block truncate">
                            {resultData?.data?.patient_name || resultData?.patient_name || 'Ahmad Hidayat'}
                        </span>
                    </div>

                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase block mb-1">JAM KEDATANGAN</span>
                        <span className="text-xl font-extrabold text-rose-400 font-mono block">
                            {resultData?.data?.arrival_time || resultData?.arrival_time || '07:25:00'} WIB
                        </span>
                    </div>

                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase block mb-1">BATAS CUTOFF SHIFT</span>
                        <span className="text-xl font-extrabold text-white font-mono block">
                            {resultData?.data?.cutoff_time || resultData?.cutoff_time || '07:15:00'} WIB
                        </span>
                    </div>

                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase block mb-1">STATUS ANTREAN</span>
                        <span className="text-xl font-black text-rose-500 uppercase block">
                            DITANDAI NO-SHOW
                        </span>
                    </div>
                </div>

                {/* Notice Box Resepsionis (Bagian Bawah Grid) */}
                <div className="p-4 mt-6 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-200 text-sm font-semibold flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    <span>Mohon segera mendatangi Loket Resepsionis Admin untuk penataan ulang jadwal atau penanganan darurat.</span>
                </div>
            </div>

            {/* Card Footer Baris Bawah */}
            <div className="px-6 py-4 bg-slate-900/60 flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-400">
                    Auto-Reset Layar: <strong className="text-rose-400 font-bold">{autoResetSeconds} detik</strong>
                </div>

                <button
                    onClick={handleReset}
                    className="bg-slate-950 border border-slate-800 text-slate-200 hover:bg-slate-900 px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    aria-label="Kembali ke Halaman Scan"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Kembali ke Halaman Scan</span>
                </button>
            </div>
        </div>
    );
}
