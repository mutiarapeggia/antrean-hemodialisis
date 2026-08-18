import React from 'react';
import { UserCheck, AlertOctagon, RefreshCw } from 'lucide-react';

export default function WarningCard({ resultState, resultData, autoResetSeconds, handleReset }) {
    const isDuplicate = resultState === 'already_checked_in' || resultState === 'duplicate';

    return (
        <div className="max-w-3xl w-full mx-auto my-auto bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-700 mx-auto mt-8 mb-4 shadow-sm">
                {isDuplicate ? (
                    <UserCheck className="w-8 h-8" />
                ) : (
                    <AlertOctagon className="w-8 h-8" />
                )}
            </div>

            <div className="text-center">
                <span className="px-5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black tracking-wider uppercase inline-block mb-3">
                    {isDuplicate ? 'SUDAH CHECK-IN' : 'PERINGATAN TOKEN INVALID'}
                </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 text-center mb-2">
                {isDuplicate ? 'QR Sudah Digunakan' : 'Kode QR Tidak Ditemukan'}
            </h2>
            <p className="text-sm sm:text-base font-bold text-slate-700 text-center mb-8">
                {resultData?.message || (isDuplicate ? 'Token Kode QR Ini Sudah Pernah Dipakai Check-In!' : 'Token Kode QR Ini Tidak Terdaftar!')}
            </p>

            {(resultData?.patient_name || resultData?.data?.patient_name) && (
                <div className="bg-slate-50 border-t border-slate-200 p-6 sm:p-8 grid grid-cols-2 gap-y-4 gap-x-8 text-left">
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">NAMA PASIEN</span>
                        <span className="text-xl font-black text-slate-900 block truncate">{resultData?.data?.patient_name || resultData?.patient_name}</span>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">POSISI BED</span>
                        <span className="text-xl font-black text-amber-700 block">{resultData?.data?.bed_number || resultData?.bed_number || '-'}</span>
                    </div>
                </div>
            )}

            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-600">
                    Auto-Reset Layar: <strong className="text-amber-700 font-black">{autoResetSeconds} detik</strong>
                </div>

                <button
                    onClick={handleReset}
                    className="bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 px-5 py-2 rounded-full text-xs font-black flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                    aria-label="Coba Scan Lagi"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Coba Scan Lagi</span>
                </button>
            </div>
        </div>
    );
}
