import React, { useState, useEffect, useRef } from 'react';
import KioskLayout from '@/Layouts/KioskLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    QrCode,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Keyboard,
    Send,
    HelpCircle,
    UserCheck,
    AlertOctagon,
    X
} from 'lucide-react';

export default function Index() {
    const [manualToken, setManualToken] = useState('');
    const [simulatedAt, setSimulatedAt] = useState('');
    const [useSimulated, setUseSimulated] = useState(false);
    const [loading, setLoading] = useState(false);

    // Response State: null | 'success' | 'late_error' | 'already_checked_in' | 'invalid_token'
    const [resultState, setResultState] = useState(null);
    const [resultData, setResultData] = useState(null);
    const [autoResetSeconds, setAutoResetSeconds] = useState(0);

    const inputRef = useRef(null);

    // Auto-focus manual token input on reset
    useEffect(() => {
        if (!resultState && inputRef.current) {
            inputRef.current.focus();
        }
    }, [resultState]);

    // Timer Auto-Reset 8 Detik saat Layar Respon Muncul
    useEffect(() => {
        if (!resultState) return;

        setAutoResetSeconds(8);
        const timer = setInterval(() => {
            setAutoResetSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setResultState(null);
                    setResultData(null);
                    setManualToken('');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [resultState]);

    const handleCheckInSubmit = async (e, tokenOverride) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        const token = tokenOverride || manualToken;
        if (!token.trim()) return;

        setLoading(true);

        const payload = {
            qr_token: token.trim(),
        };

        if (useSimulated && simulatedAt.trim()) {
            payload.simulated_at = simulatedAt.trim();
            payload.check_in_time = simulatedAt.trim();
        }

        try {
            const response = await axios.post('/api/check-in', payload);
            const data = response.data;
            setResultState(data.status || 'success');
            setResultData(data);
        } catch (error) {
            const errData = error.response?.data || {};
            const statusKey = errData.status || 'invalid_token';
            setResultState(statusKey);
            setResultData(errData);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setResultState(null);
        setResultData(null);
        setManualToken('');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        <KioskLayout>
            <Head title="Kiosk Check-In Mandiri" />

            {/* TAMPILAN 1: LAYAR SCANNER & INPUT MANUAL (SIMETRIS 2-KOLOM EQUAL HEIGHT) */}
            {!resultState ? (
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch my-auto w-full">
                    {/* CARD KIRI: SCANNER QR */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-between h-full backdrop-blur-md">
                        {/* Badge Status - Terletak Rapi di Dalam Card */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider shadow-sm mb-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>SCANNER AKTIF &amp; STANDBY</span>
                        </div>

                        {/* Frame Area Kamera Scanner Presisi */}
                        <div className="w-56 h-56 sm:w-64 sm:h-64 my-auto bg-slate-950 border-2 border-dashed border-cyan-500/40 rounded-3xl flex flex-col items-center justify-center p-4 relative shadow-inner overflow-hidden">
                            {/* Futuristic Corner Brackets */}
                            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-cyan-400 rounded-tl-md" />
                            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-cyan-400 rounded-tr-md" />
                            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-cyan-400 rounded-bl-md" />
                            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-cyan-400 rounded-br-md" />

                            {/* Animated Laser Beam */}
                            <div className="absolute w-full h-0.5 bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse top-1/3 left-0 right-0 z-10" />

                            <QrCode className="w-20 h-20 text-cyan-400 mb-3 opacity-90 animate-pulse" />

                            <span className="text-[11px] font-black text-cyan-300 uppercase tracking-wider bg-cyan-950 px-3 py-1 rounded-full border border-cyan-500/30 z-10 shadow-md">
                                AREA PINDAIAN QR
                            </span>
                        </div>

                        {/* Teks Petunjuk Scanner */}
                        <div className="text-center mt-2">
                            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">Arahkan Cetakan / Layar QR Pasien</h2>
                            <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">Sistem secara otomatis memproses verifikasi HMAC SHA256.</p>
                        </div>
                    </div>

                    {/* CARD KANAN: INPUT MANUAL TOKEN & TESTING */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between h-full backdrop-blur-md space-y-6">
                        <div>
                            {/* Header Section Input */}
                            <div className="pb-5 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center flex-shrink-0 shadow-inner">
                                        <Keyboard className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-wide">INPUT MANUAL TOKEN</h3>
                                </div>
                                <p className="text-xs font-medium text-slate-400 mt-1.5">Pilihan alternatif jika scanner QR terhalang</p>
                            </div>

                            <form onSubmit={(e) => handleCheckInSubmit(e)} className="mt-5 space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                                        KODE TOKEN HMAC QR
                                    </label>
                                    <div className="relative">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={manualToken}
                                            onChange={(e) => setManualToken(e.target.value)}
                                            placeholder="Masukkan token QR..."
                                            className="w-full h-14 px-4 bg-slate-950 border-2 border-slate-700/80 rounded-2xl text-base font-mono text-cyan-300 placeholder-slate-500 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all shadow-inner pr-10"
                                        />
                                        {manualToken && (
                                            <button
                                                type="button"
                                                onClick={() => setManualToken('')}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !manualToken.trim()}
                                    className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base uppercase tracking-wider shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:bg-slate-800 disabled:text-slate-500 disabled:border disabled:border-slate-700/80 disabled:shadow-none disabled:cursor-not-allowed active:scale-[0.99]"
                                >
                                    {loading ? (
                                        <RefreshCw className="w-6 h-6 animate-spin text-white" />
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            <span>Proses Check-In</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Section Simulasi Waktu Kedatangan (Testing) */}
                        <div className="pt-4 border-t border-slate-800">
                            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                                <label className="flex items-center gap-3 text-xs font-bold text-slate-200 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={useSimulated}
                                        onChange={(e) => setUseSimulated(e.target.checked)}
                                        className="w-4 h-4 text-cyan-500 bg-slate-900 border-slate-700 rounded focus:ring-cyan-500 cursor-pointer"
                                    />
                                    <span>Simulasi Waktu Kedatangan (Testing)</span>
                                </label>
                                {useSimulated && (
                                    <input
                                        type="text"
                                        value={simulatedAt}
                                        onChange={(e) => setSimulatedAt(e.target.value)}
                                        placeholder="YYYY-MM-DD HH:mm:ss (Contoh: 2026-07-30 07:10:00)"
                                        className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* TAMPILAN 2: CARD OVERLAY NOTIFIKASI RESPON KIOSK (HIJAU / MERAH / ORANYE) */
                <div className="max-w-4xl mx-auto w-full px-4 my-auto">
                    {/* 1. CARD HIJAU - CHECK-IN BERHASIL (resultState === 'success') */}
                    {resultState === 'success' && (
                        <div className="bg-slate-900 border-4 border-emerald-500/80 rounded-3xl p-8 md:p-12 text-center shadow-2xl shadow-emerald-500/30 space-y-8 animate-fade-in">
                            <div className="inline-flex items-center space-x-2 bg-emerald-500 text-slate-950 px-6 py-2.5 rounded-full shadow-lg">
                                <CheckCircle2 className="w-6 h-6" />
                                <span className="text-base md:text-lg font-black uppercase tracking-widest">
                                    CHECK-IN BERHASIL (TEPAT WAKTU)
                                </span>
                            </div>

                            <div>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
                                    Selamat Datang!
                                </h2>
                                <p className="text-xl md:text-2xl font-bold text-emerald-300 mt-2">
                                    {resultData?.message || 'Check-In Anda telah terkonfirmasi oleh sistem.'}
                                </p>
                            </div>

                            <div className="bg-slate-950/90 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 text-left grid grid-cols-1 md:grid-cols-2 gap-6 shadow-inner">
                                <div className="space-y-1">
                                    <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 block">Nama Pasien</span>
                                    <span className="text-2xl md:text-3xl font-black text-white block truncate">
                                        {resultData?.data?.patient_name || resultData?.patient_name || '-'}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 block">Nomor Rekam Medis (RM)</span>
                                    <span className="text-2xl md:text-3xl font-mono font-black text-cyan-400 block">
                                        {resultData?.data?.rm_number || resultData?.medical_record_number || '-'}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 block">Shift Operasional</span>
                                    <span className="text-2xl md:text-3xl font-extrabold text-slate-200 block">
                                        Shift {resultData?.data?.shift || resultData?.shift || '-'}
                                    </span>
                                </div>

                                <div className="space-y-1 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl">
                                    <span className="text-sm font-extrabold uppercase tracking-wider text-emerald-400 block">POSISI BED / MESIN</span>
                                    <span className="text-3xl md:text-4xl lg:text-5xl font-black font-mono text-emerald-300 block">
                                        {resultData?.data?.bed_number || resultData?.bed_number || '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                <span className="text-sm font-bold text-slate-400">
                                    Layar otomatis reset dalam <strong className="text-emerald-400 font-mono text-lg">{autoResetSeconds} detik</strong>
                                </span>
                                <button
                                    onClick={handleReset}
                                    className="min-h-[52px] px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-2xl shadow-xl transition-all flex items-center space-x-3 cursor-pointer"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    <span>Selesai / Scan Lagi</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 2. CARD MERAH - LATE ERROR >15m (resultState === 'late_error' atau 'late') */}
                    {(resultState === 'late_error' || resultState === 'late') && (
                        <div className="bg-slate-900 border-4 border-rose-500/80 rounded-3xl p-8 md:p-12 text-center shadow-2xl shadow-rose-500/30 space-y-8 animate-fade-in">
                            <div className="inline-flex items-center space-x-2 bg-rose-500 text-white px-6 py-2.5 rounded-full shadow-lg">
                                <XCircle className="w-6 h-6" />
                                <span className="text-base md:text-lg font-black uppercase tracking-widest">
                                    CHECK-IN GAGAL (TERLAMBAT &gt;15 MENIT)
                                </span>
                            </div>

                            <div>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
                                    Batas Waktu Terlampaui
                                </h2>
                                <p className="text-xl md:text-2xl font-bold text-rose-300 mt-2">
                                    {resultData?.message || 'Status Anda Ditandai No Show karena melebihi toleransi shift.'}
                                </p>
                            </div>

                            <div className="bg-slate-950/90 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 text-left grid grid-cols-1 md:grid-cols-2 gap-6 shadow-inner">
                                <div className="space-y-1">
                                    <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 block">Nama Pasien</span>
                                    <span className="text-2xl md:text-3xl font-black text-white block truncate">
                                        {resultData?.data?.patient_name || resultData?.patient_name || '-'}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 block">Jam Kedatangan Anda</span>
                                    <span className="text-2xl md:text-3xl font-mono font-black text-rose-400 block">
                                        {resultData?.data?.arrival_time || resultData?.arrival_time || '-'} WIB
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 block">Batas Cutoff Shift</span>
                                    <span className="text-2xl md:text-3xl font-mono font-extrabold text-slate-300 block">
                                        {resultData?.data?.cutoff_time || resultData?.cutoff_time || '-'} WIB
                                    </span>
                                </div>

                                <div className="space-y-1 bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl">
                                    <span className="text-sm font-extrabold uppercase tracking-wider text-rose-400 block">STATUS ANTREAN</span>
                                    <span className="text-2xl md:text-3xl font-black font-mono text-rose-300 block uppercase">
                                        DITANDAI NO-SHOW
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl text-rose-200 text-base md:text-lg font-bold flex items-center justify-center space-x-3">
                                <HelpCircle className="w-8 h-8 text-rose-400 flex-shrink-0" />
                                <span>Silakan mendatangi <strong>Loket Resepsionis Admin</strong> untuk penataan ulang jadwal kedatangan.</span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                <span className="text-sm font-bold text-slate-400">
                                    Layar otomatis reset dalam <strong className="text-rose-400 font-mono text-lg">{autoResetSeconds} detik</strong>
                                </span>
                                <button
                                    onClick={handleReset}
                                    className="min-h-[52px] px-8 bg-slate-800 hover:bg-slate-700 text-white font-black text-base rounded-2xl border border-slate-700 transition-all flex items-center space-x-3 cursor-pointer"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    <span>Kembali ke Halaman Utama</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 3. CARD ORANYE - SUDAH CHECK-IN / TOKEN INVALID */}
                    {(resultState === 'already_checked_in' || resultState === 'invalid_token' || resultState === 'duplicate' || resultState === 'error') && (
                        <div className="bg-slate-900 border-4 border-amber-500/80 rounded-3xl p-8 md:p-12 text-center shadow-2xl shadow-amber-500/30 space-y-8 animate-fade-in">
                            <div className="inline-flex items-center space-x-2 bg-amber-500 text-slate-950 px-6 py-2.5 rounded-full shadow-lg">
                                {resultState === 'already_checked_in' || resultState === 'duplicate' ? (
                                    <UserCheck className="w-6 h-6" />
                                ) : (
                                    <AlertOctagon className="w-6 h-6" />
                                )}
                                <span className="text-base md:text-lg font-black uppercase tracking-widest">
                                    {resultState === 'already_checked_in' || resultState === 'duplicate' ? 'QR SUDAH DIPAKAI' : 'PERINGATAN TOKEN INVALID'}
                                </span>
                            </div>

                            <div>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
                                    {resultState === 'already_checked_in' || resultState === 'duplicate' ? 'Sudah Melakukan Check-In' : 'Kode QR Tidak Ditemukan'}
                                </h2>
                                <p className="text-xl md:text-2xl font-bold text-amber-300 mt-2">
                                    {resultData?.message || 'Token Kode QR ini tidak terdaftar atau telah digunakan sebelumnya.'}
                                </p>
                            </div>

                            {(resultData?.patient_name || resultData?.data?.patient_name) && (
                                <div className="bg-slate-950/90 border-2 border-slate-800 rounded-3xl p-6 text-left grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm font-semibold uppercase text-slate-400 block">Nama Pasien</span>
                                        <span className="text-2xl font-black text-white">{resultData?.data?.patient_name || resultData?.patient_name}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold uppercase text-slate-400 block">Posisi Bed</span>
                                        <span className="text-2xl font-mono font-black text-amber-400">{resultData?.data?.bed_number || resultData?.bed_number || '-'}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                <span className="text-sm font-bold text-slate-400">
                                    Layar otomatis reset dalam <strong className="text-amber-400 font-mono text-lg">{autoResetSeconds} detik</strong>
                                </span>
                                <button
                                    onClick={handleReset}
                                    className="min-h-[52px] px-8 bg-amber-600 hover:bg-amber-500 text-white font-black text-base rounded-2xl shadow-xl transition-all flex items-center space-x-3 cursor-pointer"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    <span>Coba Scan Lagi</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </KioskLayout>
    );
}
