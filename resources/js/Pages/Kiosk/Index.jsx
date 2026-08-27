import React, { useState, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    QrCode, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    AlertTriangle, 
    Activity,
    Camera,
    LogIn
} from 'lucide-react';
import axios from 'axios';
import ScannerCard from './components/ScannerCard';

export default function KioskIndex() {
    const [qrInput, setQrInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [cameraActive, setCameraActive] = useState(true);
    const [scanMessage, setScanMessage] = useState('Kamera Pemindai Standby');

    const isProcessingRef = useRef(false);

    // Audio Beep generator using Web Audio API for scan feedback
    const playBeep = (type = 'success') => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = type === 'success' ? 'sine' : 'sawtooth';
            osc.frequency.setValueAtTime(type === 'success' ? 880 : 330, audioCtx.currentTime); // Tone A5 (880Hz)
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.18);
        } catch (e) {
            console.log('Audio error:', e);
        }
    };

    /**
     * Advanced QR Payload & Barcode Parser (Handles URL query params, JSON, RM regex, and pure numbers)
     */
    const extractCleanToken = (rawText) => {
        if (!rawText) return '';
        let text = String(rawText).trim();

        // 1. Check if JSON payload (e.g. {"token": "HMAC...", "rm": "RM-9901"})
        try {
            const parsed = JSON.parse(text);
            if (parsed && typeof parsed === 'object') {
                if (parsed.qr_token) return String(parsed.qr_token).trim();
                if (parsed.rm_number) return String(parsed.rm_number).trim();
                if (parsed.rm) return String(parsed.rm).trim();
                if (parsed.token) return String(parsed.token).trim();
            }
        } catch (e) {}

        // 2. Check if URL with query params (e.g. http://.../kiosk?qr_token=HMAC... or ?token=RM-9901)
        if (text.includes('?')) {
            try {
                const urlObj = new URL(text);
                const token = urlObj.searchParams.get('qr_token') 
                    || urlObj.searchParams.get('token') 
                    || urlObj.searchParams.get('rm_number')
                    || urlObj.searchParams.get('rm');
                if (token) return token.trim();
            } catch (e) {
                // Fallback query string parse
                const queryPart = text.split('?')[1];
                if (queryPart) {
                    const params = new URLSearchParams(queryPart);
                    const token = params.get('qr_token') || params.get('token') || params.get('rm_number') || params.get('rm');
                    if (token) return token.trim();
                }
            }
        }

        // 3. Match RM pattern e.g. RM-9901, RM-202607-001, RM9901
        const rmMatch = text.match(/(RM-?\d+(?:-\d+)?)/i);
        if (rmMatch) {
            let matched = rmMatch[1].toUpperCase();
            if (!matched.includes('RM-')) {
                matched = matched.replace('RM', 'RM-');
            }
            return matched;
        }

        // 4. Pure numeric RM
        if (/^\d+$/.test(text)) {
            return `RM-${text}`;
        }

        return text;
    };

    const handleDetectedCode = (rawText) => {
        console.log('[SCANNER DEBUG] Raw incoming payload:', rawText);
        if (isProcessingRef.current) return;

        const cleanToken = extractCleanToken(rawText);
        console.log('[SCANNER DEBUG] Extracted clean token:', cleanToken);

        if (!cleanToken) {
            console.warn('[SCANNER DEBUG] Clean token tidak dapat diekstrak dari payload:', rawText);
            return;
        }

        isProcessingRef.current = true;
        playBeep('success');
        setCameraActive(false);
        setQrInput(cleanToken);
        handleCheckIn(cleanToken);
    };

    const handleCheckIn = async (tokenToUse = null) => {
        const token = tokenToUse || qrInput.trim();
        if (!token || loading) return;

        setLoading(true);
        setResult(null);

        try {
            console.log('[SCANNER DEBUG] Submitting check-in request with token:', token);
            const response = await axios.post(route('api.check-in.web'), {
                rm_number: token,
                qr_token: token,
            });

            console.log('[SCANNER DEBUG] Check-in response success:', response.data);

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
            console.error('[SCANNER DEBUG] Check-in request error:', error);
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
                } else if (data.status === 'reschedule_pending') {
                    setResult({
                        type: 'warning',
                        title: data.message || 'Check-in ditolak: Janji temu ini sedang dalam proses permohonan jadwal ulang',
                        patient_name: data.patient_name || data.data?.patient_name,
                        rm_number: data.medical_record_number || data.data?.rm_number,
                    });
                } else {
                    setResult({
                        type: 'error',
                        title: data.message || 'Nomor Rekam Medis (No. RM) Tidak Ditemukan',
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
            isProcessingRef.current = false;
        }
    };

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col justify-between bg-slate-100 p-4 select-none text-slate-900 font-sans antialiased">
            <Head title="Kiosk Touchscreen — Standby Check-In" />

            {/* CSS Styling for html5-qrcode smooth video rendering */}
            <style>{`
                #html5qr-code-full-region video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    border-radius: 1rem !important;
                }
                #html5qr-code-full-region__scan_region {
                    border-radius: 1rem !important;
                }
                #html5qr-code-full-region img {
                    display: none !important;
                }
                #html5qr-code-full-region__dashboard {
                    display: none !important;
                }
            `}</style>

            {/* Header Atas (Full Width) */}
            <header className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-sm px-6 py-3 flex items-center justify-between border border-slate-200/80">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                        <Activity className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">MESIN KIOSK MANDIRI</h1>
                        <p className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider">Klinik Utama Hemodialisis</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200/80 px-4 py-2 rounded-xl">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-mono font-black text-slate-800">
                        {new Date().toLocaleTimeString('id-ID')} WIB
                    </span>
                </div>
            </header>

            {/* Kartu Tengah (Pemindai & Input No. RM) */}
            <main className="flex-1 flex flex-col items-center justify-center my-auto w-full max-w-2xl mx-auto py-2">
                {result ? (
                    /* Display Result Card */
                    <div className={`w-full p-6 sm:p-8 rounded-3xl border text-center shadow-xl space-y-4 ${
                        result.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' :
                        result.type === 'late' ? 'bg-rose-50 border-rose-300 text-rose-950' :
                        result.type === 'warning' ? 'bg-amber-50 border-amber-300 text-amber-950' :
                        'bg-slate-100 border-slate-300 text-slate-950'
                    }`}>
                        <div className="flex justify-center">
                            {result.type === 'success' && <CheckCircle2 className="w-16 h-16 text-emerald-600" />}
                            {result.type === 'late' && <XCircle className="w-16 h-16 text-rose-600" />}
                            {result.type === 'warning' && <AlertTriangle className="w-16 h-16 text-amber-600" />}
                            {result.type === 'error' && <XCircle className="w-16 h-16 text-slate-600" />}
                        </div>

                        <div>
                            <h2 className="text-2xl font-black">{result.title}</h2>
                            {result.patient_name && (
                                <p className="text-base text-slate-800 mt-1 font-black">{result.patient_name} ({result.rm_number})</p>
                            )}
                            {result.shift && (
                                <p className="text-xs font-bold text-slate-700 mt-1">Shift {result.shift} • {result.bed_number}</p>
                            )}
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={() => setResult(null)}
                                className="px-8 py-3.5 bg-blue-600 text-white hover:bg-blue-500 text-base font-black rounded-xl shadow-lg shadow-blue-600/30 transition-all min-h-[48px]"
                            >
                                Kembali ke Layar Utama
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Scanner & Input Card */
                    <div className="w-full bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                        <div className="text-center space-y-1">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Check-In Pasien Mandiri</h2>
                            <p className="text-xs font-semibold text-slate-500">
                                Masukkan Nomor Rekam Medis (No. RM) Anda atau pindai Barcode / Kode QR
                            </p>
                        </div>

                        {/* Scanner Card Component Box */}
                        <div className="max-w-xs md:max-w-sm w-full mx-auto">
                            <ScannerCard 
                                cameraActive={cameraActive}
                                scanMessage={scanMessage}
                                onToggleCamera={() => setCameraActive(!cameraActive)}
                                onDetected={handleDetectedCode}
                                regionId="html5qr-code-full-region"
                            />
                        </div>

                        {/* Keyboard / Input Touch Card */}
                        <form onSubmit={(e) => { e.preventDefault(); handleCheckIn(); }} className="space-y-3 max-w-xs md:max-w-sm mx-auto">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    value={qrInput}
                                    onChange={(e) => setQrInput(e.target.value)}
                                    placeholder="Masukkan No RM Anda"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-mono text-center font-bold"
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-center">
                                <button
                                    type="submit"
                                    disabled={loading || !qrInput.trim()}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-base font-black rounded-xl shadow-lg shadow-blue-600/30 transition-all min-h-[48px] disabled:opacity-50"
                                >
                                    {loading ? 'Memproses Check-In...' : 'PROSES CHECK-IN NO. RM'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>

            {/* Footer Bawah */}
            <footer className="w-full text-center text-xs text-slate-400 py-1">
                <span>Sistem Antrean Hemodialisis • Versi Kiosk Touchscreen v1.0</span>
            </footer>
        </div>
    );
}
