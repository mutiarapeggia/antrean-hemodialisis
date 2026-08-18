import React from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';

export default function SuccessCard({ resultData, autoResetSeconds, handleReset }) {
    return (
        <div className="max-w-3xl w-full mx-auto my-auto bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-700 mx-auto mt-8 mb-4 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center">
                <span className="px-6 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black tracking-wider uppercase inline-block mb-3">
                    STATUS: TEPAT WAKTU (CHECK-IN BERHASIL)
                </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 text-center mb-1">
                Check-In Berhasil!
            </h2>
            <p className="text-base font-bold text-emerald-700 text-center mb-6">
                {resultData?.message || 'Check-In Berhasil!'}
            </p>

            <div className="bg-slate-50 border-y border-slate-200 p-6 sm:p-8 grid grid-cols-2 gap-y-6 gap-x-8 text-left">
                <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">NAMA PASIEN</span>
                    <span className="text-xl font-black text-slate-900 block truncate">
                        {resultData?.data?.patient_name || resultData?.patient_name || 'Budi Santoso'}
                    </span>
                </div>

                <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">NOMOR RM</span>
                    <span className="text-xl font-black text-slate-900 font-mono block">
                        {resultData?.data?.rm_number || resultData?.medical_record_number || 'RM-9901'}
                    </span>
                </div>

                <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">SHIFT OPERASIONAL</span>
                    <span className="text-xl font-black text-slate-900 block">
                        {resultData?.data?.shift || resultData?.shift || 'Pagi'}
                    </span>
                </div>

                <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">POSISI BED</span>
                    <span className="text-xl font-black text-blue-700 block">
                        {resultData?.data?.bed_number || resultData?.bed_number || 'Bed 1'}
                    </span>
                </div>
            </div>

            <div className="px-6 py-4 bg-slate-100 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-600">
                    Auto-Reset Layar: <strong className="text-emerald-700 font-black">{autoResetSeconds} detik</strong>
                </div>

                <button
                    onClick={handleReset}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                    aria-label="Selesai / Scan Lagi"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Selesai / Scan Lagi</span>
                </button>
            </div>
        </div>
    );
}
