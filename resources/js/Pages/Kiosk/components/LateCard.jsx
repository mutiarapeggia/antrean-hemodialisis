import React from 'react';
import { XCircle, HelpCircle, RefreshCw } from 'lucide-react';

export default function LateCard({ resultData, autoResetSeconds, handleReset }) {
    return (
        <div className="max-w-3xl w-full mx-auto my-auto bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-rose-100 border-2 border-rose-300 flex items-center justify-center text-rose-700 mx-auto mt-8 mb-4 shadow-sm">
                <XCircle className="w-8 h-8" />
            </div>

            <div className="text-center">
                <span className="px-6 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-black tracking-wider uppercase inline-block mb-3">
                    STATUS: TERLAMBAT &gt;15 MENIT (NO-SHOW)
                </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 text-center mb-1">
                Check-In Gagal!
            </h2>
            <p className="text-base font-bold text-rose-700 text-center mb-6">
                {resultData?.message || 'Check-In Gagal! Batas Waktu Terlampaui (>15 Menit)'}
            </p>

            <div className="bg-slate-50 border-y border-slate-200 p-6 sm:p-8">
                <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-left">
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">NAMA PASIEN</span>
                        <span className="text-xl font-black text-slate-900 block truncate">
                            {resultData?.data?.patient_name || resultData?.patient_name || 'Ahmad Hidayat'}
                        </span>
                    </div>

                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">JAM KEDATANGAN</span>
                        <span className="text-xl font-black text-rose-700 font-mono block">
                            {resultData?.data?.arrival_time || resultData?.arrival_time || '07:25:00'} WIB
                        </span>
                    </div>

                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">BATAS CUTOFF SHIFT</span>
                        <span className="text-xl font-black text-slate-900 font-mono block">
                            {resultData?.data?.cutoff_time || resultData?.cutoff_time || '07:15:00'} WIB
                        </span>
                    </div>

                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">STATUS ANTREAN</span>
                        <span className="text-xl font-black text-rose-700 uppercase block">
                            DITANDAI NO-SHOW
                        </span>
                    </div>
                </div>

                <div className="p-4 mt-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-semibold flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <span>Mohon segera mendatangi Loket Resepsionis Admin untuk penataan ulang jadwal atau penanganan darurat.</span>
                </div>
            </div>

            <div className="px-6 py-4 bg-slate-100 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-600">
                    Auto-Reset Layar: <strong className="text-rose-700 font-black">{autoResetSeconds} detik</strong>
                </div>

                <button
                    onClick={handleReset}
                    className="bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 px-5 py-2 rounded-full text-xs font-black flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                    aria-label="Kembali ke Halaman Scan"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Kembali ke Halaman Scan</span>
                </button>
            </div>
        </div>
    );
}
