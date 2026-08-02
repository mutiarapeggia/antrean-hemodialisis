import React from 'react';
import { UserCheck, AlertOctagon, RefreshCw } from 'lucide-react';

export default function WarningCard({ resultState, resultData, autoResetSeconds, handleReset }) {
    const isDuplicate = resultState === 'already_checked_in' || resultState === 'duplicate';

    return (
        <div className="max-w-3xl w-full mx-auto my-auto bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md animate-fade-in">
            {/* Top Header Circle Icon */}
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mt-8 mb-4 shadow-lg shadow-amber-500/10">
                {isDuplicate ? (
                    <UserCheck className="w-8 h-8" />
                ) : (
                    <AlertOctagon className="w-8 h-8" />
                )}
            </div>

            {/* Status Pill Badge */}
            <div className="text-center">
                <span className="px-5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wider uppercase inline-block mb-3">
                    {isDuplicate ? 'SUDAH CHECK-IN' : 'PERINGATAN TOKEN INVALID'}
                </span>
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-2">
                {isDuplicate ? 'QR Sudah Digunakan' : 'Kode QR Tidak Ditemukan'}
            </h2>
            <p className="text-sm sm:text-base font-semibold text-slate-200 text-center mb-8">
                {resultData?.message || (isDuplicate ? 'Token Kode QR Ini Sudah Pernah Dipakai Check-In!' : 'Token Kode QR Ini Tidak Terdaftar!')}
            </p>

            {/* Optional Info Box if patient data exists */}
            {(resultData?.patient_name || resultData?.data?.patient_name) && (
                <div className="bg-slate-950/80 border-t border-slate-800/80 p-6 sm:p-8 grid grid-cols-2 gap-y-4 gap-x-8 text-left">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase block mb-1">NAMA PASIEN</span>
                        <span className="text-xl font-extrabold text-white block truncate">{resultData?.data?.patient_name || resultData?.patient_name}</span>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase block mb-1">POSISI BED</span>
                        <span className="text-xl font-black text-amber-400 block">{resultData?.data?.bed_number || resultData?.bed_number || '-'}</span>
                    </div>
                </div>
            )}

            {/* Card Footer Baris Bawah */}
            <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-400">
                    Auto-Reset Layar: <strong className="text-amber-400 font-bold">{autoResetSeconds} detik</strong>
                </div>

                <button
                    onClick={handleReset}
                    className="bg-slate-950 border border-slate-800 text-slate-200 hover:bg-slate-900 px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    aria-label="Coba Scan Lagi"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Coba Scan Lagi</span>
                </button>
            </div>
        </div>
    );
}
