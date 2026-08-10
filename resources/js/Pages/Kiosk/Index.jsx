import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { 
    QrCode, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    AlertTriangle, 
    RefreshCw,
    Activity,
    Camera,
    Volume2,
    Keyboard
} from 'lucide-react';
import axios from 'axios';

export default function KioskIndex() {
    const [qrInput, setQrInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [autoMode, setAutoMode] = useState(true);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Audio Beep generator using Web Audio API for touch feedback
    const playBeep = (type = 'success') => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type === 'success' ? 'sine' : 'sawtooth';
            osc.frequency.setValueAtTime(type === 'success' ? 880 : 330, ctx.currentTime);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
            // Audio context fallback
        }
    };

    // Camera Stream Management for Auto-Camera Scanner (T-604)
    useEffect(() => {
        if (cameraActive) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [cameraActive]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.warn('Camera access error or unsupported:', err);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const handleCheckIn = async (tokenToUse = null) => {
        const token = tokenToUse || qrInput.trim();
        if (!token) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await axios.post(route('api.check-in.web'), {
                qr_token: token,
            });

            setResult({
                type: 'success',
                title: response.data.message || 'Check-In Berhasil!',
                patient_name: response.data.patient_name || response.data.data?.patient_name,
                rm_number: response.data.medical_record_number || response.data.data?.rm_number,
                shift: response.data.shift || response.data.data?.shift,
                bed_number: response.data.bed_number || response.data.data?.bed_number,
                time: response.data.check_in_time || new Date().toLocaleTimeString('id-ID'),
            });
            playBeep('success');
            setQrInput('');
        } catch (error) {
            playBeep('error');
            if (error.response) {
                const data = error.response.data;
                if (error.response.status === 422) {
                    setResult({
                        type: 'late',
                        title: data.message || 'Terlambat (>15 Menit) - Dinyatakan No-Show',
                        patient_name: data.patient_name || data.data?.patient_name,
                        rm_number: data.medical_record_number || data.data?.rm_number,
                        shift: data.shift || data.data?.shift,
                        arrival_time: data.arrival_time || data.data?.arrival_time,
                        cutoff_time: data.cutoff_time || data.data?.cutoff_time,
                    });
                } else if (data.status === 'already_checked_in') {
                    setResult({
                        type: 'warning',
                        title: 'Sudah Pernah Check-In!',
                        patient_name: data.patient_name || data.data?.patient_name,
                        rm_number: data.medical_record_number || data.data?.rm_number,
                        shift: data.shift || data.data?.shift,
                    });
                } else {
                    setResult({
                        type: 'error',
                        title: data.message || 'Kode QR Tidak Ditemukan',
                    });
                }
            } else {
                setResult({
                    type: 'error',
                    title: 'Koneksi Server Terputus',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans antialiased flex flex-col justify-between p-4 sm:p-8">
            <Head title="Kiosk Machine — Standby Scanner" />

            {/* Header Standby */}
            <header className="flex items-center justify-between bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center space-x-4">
                    <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/40">
                        <Activity className="w-10 h-10 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide">MESIN KIOSK MANDIRI</h1>
                        <p className="text-sm text-blue-400 font-semibold uppercase tracking-wider">Klinik Utama Hemodialisis</p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center space-x-3 bg-slate-900/80 border border-slate-700 px-5 py-3 rounded-2xl">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span className="text-lg font-mono font-bold text-amber-300">
                        {new Date().toLocaleTimeString('id-ID')} WIB
                    </span>
                </div>
            </header>

            {/* Main Body Grid */}
            <main className="my-auto py-8 max-w-4xl mx-auto w-full">
                {result ? (
                    /* Display Result Card */
                    <div className={`p-8 sm:p-12 rounded-3xl border text-center shadow-2xl space-y-6 ${
                        result.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-100' :
                        result.type === 'late' ? 'bg-rose-950/90 border-rose-500 text-rose-100' :
                        result.type === 'warning' ? 'bg-amber-950/90 border-amber-500 text-amber-100' :
                        'bg-slate-950/90 border-slate-700 text-slate-100'
                    }`}>
                        <div className="flex justify-center">
                            {result.type === 'success' && <CheckCircle2 className="w-24 h-24 text-emerald-400" />}
                            {result.type === 'late' && <XCircle className="w-24 h-24 text-rose-400" />}
                            {result.type === 'warning' && <AlertTriangle className="w-24 h-24 text-amber-400" />}
                            {result.type === 'error' && <XCircle className="w-24 h-24 text-slate-400" />}
                        </div>

                        <div>
                            <h2 className="text-3xl sm:text-4xl font-extrabold">{result.title}</h2>
                            {result.patient_name && (
                                <p className="text-xl text-slate-200 mt-2 font-bold">{result.patient_name} ({result.rm_number})</p>
                            )}
                            {result.shift && (
                                <p className="text-base text-slate-300 mt-1">Shift {result.shift} • {result.bed_number}</p>
                            )}
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={() => setResult(null)}
                                className="px-10 py-5 bg-white text-slate-900 hover:bg-slate-200 text-xl font-extrabold rounded-2xl shadow-xl transition-all min-h-[64px]"
                            >
                                Kembali ke Layar Utama
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Scanner & Input Card */
                    <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-8">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Tunjukkan Kode QR Anda</h2>
                            <p className="text-base sm:text-lg text-slate-300">
                                Arahkan Kode QR ke Kamera atau Ketik Kode Token QR / No. RM Anda di bawah ini
                            </p>
                        </div>

                        {/* Camera API Scanner Toggle */}
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => setCameraActive(!cameraActive)}
                                className={`px-6 py-3.5 rounded-2xl font-bold text-base flex items-center space-x-3 transition-all min-h-[52px] ${
                                    cameraActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                <Camera className="w-6 h-6" />
                                <span>{cameraActive ? 'Kamera Pemindai Aktif' : 'Nyalakan Kamera Pemindai (Auto-Scanner)'}</span>
                            </button>
                        </div>

                        {cameraActive && (
                            <div className="relative w-full max-w-md mx-auto aspect-video bg-black rounded-2xl overflow-hidden border-2 border-blue-500 shadow-xl">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                <div className="absolute inset-0 border-4 border-dashed border-blue-400/60 pointer-events-none rounded-2xl" />
                            </div>
                        )}

                        {/* Keyboard / Input Touch Card */}
                        <form onSubmit={(e) => { e.preventDefault(); handleCheckIn(); }} className="space-y-6">
                            <div className="relative max-w-2xl mx-auto">
                                <input
                                    type="text"
                                    value={qrInput}
                                    onChange={(e) => setQrInput(e.target.value)}
                                    placeholder="Masukkan Kode QR Token / No. Rekam Medis..."
                                    className="w-full bg-slate-900 border-2 border-slate-600 rounded-2xl py-5 px-6 text-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-center"
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-center">
                                <button
                                    type="submit"
                                    disabled={loading || !qrInput.trim()}
                                    className="w-full max-w-2xl py-5 bg-blue-600 hover:bg-blue-500 text-white text-2xl font-extrabold rounded-2xl shadow-xl shadow-blue-600/30 transition-all min-h-[64px] disabled:opacity-50"
                                >
                                    {loading ? 'Memproses Check-In...' : 'PROSES CHECK-IN SEKARANG'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>

            {/* Footer Kiosk */}
            <footer className="text-center py-4 border-t border-slate-800 text-slate-500 text-sm">
                Sistem Antrean Hemodialisis • Versi Kiosk Touchscreen v1.0 • Aksesibel WCAG 2.1 AA
            </footer>
        </div>
    );
}
