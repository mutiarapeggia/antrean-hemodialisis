import React, { useState, useEffect, useRef } from 'react';
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
import Quagga from '@ericblade/quagga2';
import jsQR from 'jsqr';

export default function KioskIndex() {
    const [qrInput, setQrInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [scanMessage, setScanMessage] = useState('');

    const scannerContainerRef = useRef(null);
    const canvasRef = useRef(null);
    const isProcessingRef = useRef(false);

    const playBeep = (type = 'success') => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(type === 'success' ? 880 : 330, audioCtx.currentTime); // Tone A5
            osc.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
        } catch (e) {
            console.log('Audio error:', e);
        }
    };

    const extractCleanRm = (rawText) => {
        if (!rawText) return '';
        let text = rawText.trim();
        
        // 1. Check if contains pattern RM-9901 or RM9901
        const rmMatch = text.match(/(RM-?\d+(?:-\d+)?)/i);
        if (rmMatch) {
            let matched = rmMatch[1].toUpperCase();
            if (!matched.includes('RM-')) {
                matched = matched.replace('RM', 'RM-');
            }
            return matched;
        }

        // 2. Check if pure digits e.g. "9901" -> convert to "RM-9901"
        const digitMatch = text.match(/^\d+$/);
        if (digitMatch) {
            return `RM-${text}`;
        }

        return text;
    };

    useEffect(() => {
        if (!cameraActive) {
            try { Quagga.stop(); } catch (e) {}
            return;
        }

        isProcessingRef.current = false;
        setScanMessage('Membuka pemindai Barcode (Quagga2 Ultra-Sensitif) & QR Code...');

        const handleDetectedCode = (rawText) => {
            if (isProcessingRef.current) return;
            const cleanRm = extractCleanRm(rawText);
            if (!cleanRm) return;

            isProcessingRef.current = true;
            console.log("Barcode/QR Terdeteksi Instan:", rawText, "-> Clean RM:", cleanRm);

            playBeep('success');

            try { Quagga.stop(); } catch (e) {}

            setCameraActive(false);
            setQrInput(cleanRm);
            handleCheckIn(cleanRm);
        };

        let animFrameId = null;

        const timer = setTimeout(() => {
            if (!scannerContainerRef.current) return;

            // 1. Inisialisasi Quagga2 khusus 1D Barcode (Code 128, Code 39, EAN)
            Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: scannerContainerRef.current,
                    constraints: {
                        facingMode: "user",
                        width: { min: 640, ideal: 1280, max: 1920 },
                        height: { min: 480, ideal: 720, max: 1080 }
                    }
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                },
                numOfWorkers: 4,
                frequency: 20, // 20 scans per second
                decoder: {
                    readers: [
                        "code_128_reader",
                        "code_39_reader",
                        "code_39_vin_reader",
                        "ean_reader",
                        "ean_8_reader",
                        "codabar_reader"
                    ]
                },
                locate: true
            }, function(err) {
                if (err) {
                    console.error("Quagga Init Failed:", err);
                    setScanMessage("Gagal membuka pemindai kamera.");
                    return;
                }
                Quagga.start();
                setScanMessage("Kamera Pemindai Ultra-Sensitif Aktif — Arahkan Barcode / QR Code No. RM");

                // 2. Pararel canvas loop untuk 2D QR Code decoding via jsQR
                const scanQrLoop = () => {
                    if (isProcessingRef.current) return;

                    const videoEl = scannerContainerRef.current?.querySelector('video');
                    if (videoEl && videoEl.readyState === 4) {
                        const canvas = canvasRef.current || document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        canvas.width = videoEl.videoWidth || 640;
                        canvas.height = videoEl.videoHeight || 480;
                        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "dontInvert"
                        });

                        if (qrCode && qrCode.data) {
                            handleDetectedCode(qrCode.data);
                            return;
                        }
                    }
                    animFrameId = requestAnimationFrame(scanQrLoop);
                };
                animFrameId = requestAnimationFrame(scanQrLoop);
            });

            Quagga.onDetected((result) => {
                if (result && result.codeResult && result.codeResult.code) {
                    handleDetectedCode(result.codeResult.code);
                }
            });
        }, 100);

        return () => {
            isProcessingRef.current = true;
            clearTimeout(timer);
            if (animFrameId) cancelAnimationFrame(animFrameId);
            try { Quagga.offDetected(); } catch (e) {}
            try { Quagga.stop(); } catch (e) {}
        };
    }, [cameraActive]);

    const handleCheckIn = async (tokenToUse = null) => {
        const token = tokenToUse || qrInput.trim();
        if (!token || loading) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await axios.post(route('api.check-in.web'), {
                rm_number: token,
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
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between p-4 sm:p-8">
            <Head title="Kiosk Touchscreen — Standby Check-In" />

            {/* Quagga Video Styling to fit container cleanly */}
            <style>{`
                #scanner-container video, #scanner-container canvas {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    border-radius: 1rem !important;
                }
                #scanner-container canvas.drawingBuffer {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                }
            `}</style>

            {/* Header Standby */}
            <header className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-200 rounded-3xl p-6 shadow-xs gap-4">
                <div className="flex items-center space-x-4">
                    <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-md">
                        <Activity className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">MESIN KIOSK MANDIRI</h1>
                        <p className="text-xs sm:text-sm font-extrabold text-blue-600 uppercase tracking-wider">Klinik Utama Hemodialisis</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="hidden sm:flex items-center space-x-3 bg-slate-100 border border-slate-200 px-5 py-3 rounded-2xl">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-lg font-mono font-black text-slate-800">
                            {new Date().toLocaleTimeString('id-ID')} WIB
                        </span>
                    </div>

                    <a
                        href="/login"
                        className="inline-flex items-center space-x-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all min-h-[48px]"
                    >
                        <LogIn className="w-4 h-4 text-blue-400" />
                        <span>Login / Registrasi Staf & Pasien</span>
                    </a>
                </div>
            </header>

            {/* Main Body Grid */}
            <main className="my-auto py-8 max-w-4xl mx-auto w-full">
                {result ? (
                    /* Display Result Card */
                    <div className={`p-8 sm:p-12 rounded-3xl border text-center shadow-xl space-y-6 ${
                        result.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' :
                        result.type === 'late' ? 'bg-rose-50 border-rose-300 text-rose-950' :
                        result.type === 'warning' ? 'bg-amber-50 border-amber-300 text-amber-950' :
                        'bg-slate-100 border-slate-300 text-slate-950'
                    }`}>
                        <div className="flex justify-center">
                            {result.type === 'success' && <CheckCircle2 className="w-24 h-24 text-emerald-600" />}
                            {result.type === 'late' && <XCircle className="w-24 h-24 text-rose-600" />}
                            {result.type === 'warning' && <AlertTriangle className="w-24 h-24 text-amber-600" />}
                            {result.type === 'error' && <XCircle className="w-24 h-24 text-slate-600" />}
                        </div>

                        <div>
                            <h2 className="text-3xl sm:text-4xl font-black">{result.title}</h2>
                            {result.patient_name && (
                                <p className="text-xl text-slate-800 mt-2 font-black">{result.patient_name} ({result.rm_number})</p>
                            )}
                            {result.shift && (
                                <p className="text-base font-bold text-slate-700 mt-1">Shift {result.shift} • {result.bed_number}</p>
                            )}
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={() => setResult(null)}
                                className="px-10 py-5 bg-blue-600 text-white hover:bg-blue-500 text-xl font-black rounded-2xl shadow-lg shadow-blue-600/30 transition-all min-h-[64px]"
                            >
                                Kembali ke Layar Utama
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Scanner & Input Card */
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-xl space-y-8">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Check-In Pasien Mandiri</h2>
                            <p className="text-base sm:text-lg font-semibold text-slate-600">
                                Masukkan Nomor Rekam Medis (No. RM) Pasien di bawah ini atau pindai Barcode / Kode QR No. RM Anda
                            </p>
                        </div>

                        {/* Camera API Scanner Toggle */}
                        <div className="flex flex-col items-center space-y-3">
                            <button
                                onClick={() => setCameraActive(!cameraActive)}
                                className={`px-6 py-3.5 rounded-2xl font-extrabold text-base flex items-center space-x-3 transition-all min-h-[52px] ${
                                    cameraActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                                }`}
                            >
                                <Camera className="w-6 h-6" />
                                <span>{cameraActive ? 'Tutup Kamera Pemindai' : 'Buka Kamera Pemindai (Auto-Scanner)'}</span>
                            </button>
                            {cameraActive && (
                                <span className="text-xs font-bold text-blue-700">{scanMessage}</span>
                            )}
                        </div>

                        {cameraActive && (
                            <div className="relative w-full max-w-md mx-auto my-4 overflow-hidden rounded-2xl shadow-md bg-black border-2 border-blue-600 h-80">
                                <div id="scanner-container" ref={scannerContainerRef} className="w-full h-full" />
                                <canvas ref={canvasRef} className="hidden" />
                                <div className="absolute inset-0 border-2 border-dashed border-emerald-400 opacity-80 pointer-events-none rounded-2xl m-6 flex items-center justify-center">
                                    <span className="bg-slate-900/80 text-emerald-400 text-xs font-mono font-bold px-3 py-1 rounded-full">
                                        Area Pemindai Barcode / QR
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Keyboard / Input Touch Card */}
                        <form onSubmit={(e) => { e.preventDefault(); handleCheckIn(); }} className="space-y-6">
                            <div className="relative max-w-2xl mx-auto">
                                <input
                                    type="text"
                                    value={qrInput}
                                    onChange={(e) => setQrInput(e.target.value)}
                                    placeholder="Contoh: RM-9901 atau RM-202607-001"
                                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-2xl py-5 px-6 text-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-mono text-center font-bold"
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-center">
                                <button
                                    type="submit"
                                    disabled={loading || !qrInput.trim()}
                                    className="w-full max-w-2xl py-5 bg-blue-600 hover:bg-blue-500 text-white text-2xl font-black rounded-2xl shadow-xl shadow-blue-600/30 transition-all min-h-[64px] disabled:opacity-50"
                                >
                                    {loading ? 'Memproses Check-In...' : 'PROSES CHECK-IN NO. RM'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>

            {/* Footer Kiosk */}
            <footer className="flex items-center justify-center py-4 border-t border-slate-200 text-slate-600 font-semibold text-xs text-center">
                <span>Sistem Antrean Hemodialisis • Versi Kiosk Touchscreen v1.0 • Aksesibel WCAG 2.1 AA</span>
            </footer>
        </div>
    );
}
