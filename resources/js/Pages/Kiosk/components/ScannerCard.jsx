import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { BrowserQRCodeReader } from '@zxing/browser';
import { RefreshCw, AlertCircle, Camera } from 'lucide-react';

export default function ScannerCard({ 
    onDetected, 
    isProcessing = false, 
    cameraActive = true, 
    scanMessage = '', 
    onToggleCamera 
}) {
    const videoRef = useRef(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const lastScanRef = useRef({ text: '', time: 0 });
    const streamRef = useRef(null);

    const startLaptopCamera = async () => {
        setCameraReady(false);
        setErrorMsg('');

        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }

            // Direct getUserMedia for built-in laptop webcam
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            });

            streamRef.current = mediaStream;

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.setAttribute('playsinline', 'true');
                
                try {
                    await videoRef.current.play();
                } catch (playErr) {
                    console.warn('[CAMERA WARN] Video play interrupted:', playErr);
                }

                setCameraReady(true);
            }
        } catch (err) {
            console.error('[LAPTOP CAMERA ERROR]:', err);
            setCameraReady(false);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setErrorMsg('Izin kamera ditolak oleh browser. Klik ikon gembok di URL bar peramban lalu izinkan Kamera (Allow).');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setErrorMsg('Kamera laptop tidak ditemukan atau sedang digunakan oleh aplikasi lain (Zoom/Teams).');
            } else {
                setErrorMsg(`Gagal membuka kamera laptop: ${err.message || 'Izin tidak diberikan.'}`);
            }
        }
    };

    useEffect(() => {
        if (!cameraActive) {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
            setCameraReady(false);
            return;
        }

        let isMounted = true;
        let animFrameId = null;
        const codeReader = new BrowserQRCodeReader();

        startLaptopCamera();

        // Native BarcodeDetector (GPU Instant)
        const hasNativeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
        let barcodeDetector = null;
        if (hasNativeDetector) {
            try {
                barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
            } catch (e) {
                barcodeDetector = null;
            }
        }

        // Offscreen Canvas for jsQR + Multi-Pass Frame Extraction
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        let lastScanTime = 0;

        const scanLoop = async () => {
            if (!isMounted) return;

            const now = Date.now();
            if (now - lastScanTime >= 100 && videoRef.current && videoRef.current.readyState >= 2 && !isProcessing) {
                lastScanTime = now;
                
                try {
                    const video = videoRef.current;
                    const width = video.videoWidth || 640;
                    const height = video.videoHeight || 480;

                    if (canvas.width !== width || canvas.height !== height) {
                        canvas.width = width;
                        canvas.height = height;
                    }

                    // --- PASS 1: Raw Unmirrored Frame ---
                    ctx.save();
                    ctx.clearRect(0, 0, width, height);
                    ctx.drawImage(video, 0, 0, width, height);
                    ctx.restore();

                    let text = null;

                    // 1. ENGINE 1: jsQR (Instant 1ms sync decode with light/dark inversion attempts)
                    try {
                        const imgData = ctx.getImageData(0, 0, width, height);
                        const qrCode = jsQR(imgData.data, imgData.width, imgData.height, {
                            inversionAttempts: 'attemptBoth',
                        });
                        if (qrCode && qrCode.data) {
                            text = qrCode.data;
                        }
                    } catch (_) {}

                    // 2. ENGINE 2: BarcodeDetector (GPU Native Chrome/Edge)
                    if (!text && barcodeDetector) {
                        try {
                            const codes = await barcodeDetector.detect(canvas);
                            if (codes && codes.length > 0) text = codes[0].rawValue;
                        } catch (_) {}
                    }

                    // 3. ENGINE 3: ZXing decodeFromCanvas
                    if (!text) {
                        try {
                            const result = await codeReader.decodeFromCanvas(canvas);
                            if (result) text = result.getText();
                        } catch (_) {}
                    }

                    // --- PASS 2: Horizontally Flipped Canvas (Dual-Pass Fallback) ---
                    if (!text) {
                        ctx.save();
                        ctx.clearRect(0, 0, width, height);
                        ctx.translate(width, 0);
                        ctx.scale(-1, 1);
                        ctx.drawImage(video, 0, 0, width, height);
                        ctx.restore();

                        // 1. jsQR on flipped canvas
                        try {
                            const imgData = ctx.getImageData(0, 0, width, height);
                            const qrCode = jsQR(imgData.data, imgData.width, imgData.height, {
                                inversionAttempts: 'attemptBoth',
                            });
                            if (qrCode && qrCode.data) {
                                text = qrCode.data;
                            }
                        } catch (_) {}

                        // 2. BarcodeDetector on flipped canvas
                        if (!text && barcodeDetector) {
                            try {
                                const codes = await barcodeDetector.detect(canvas);
                                if (codes && codes.length > 0) text = codes[0].rawValue;
                            } catch (_) {}
                        }

                        // 3. ZXing on flipped canvas
                        if (!text) {
                            try {
                                const result = await codeReader.decodeFromCanvas(canvas);
                                if (result) text = result.getText();
                            } catch (_) {}
                        }
                    }

                    // Successful QR code detection
                    if (text) {
                        if (text !== lastScanRef.current.text || now - lastScanRef.current.time > 2500) {
                            lastScanRef.current = { text, time: now };
                            console.log('[QR SCAN DETECTED SUCCESS]:', text);
                            if (onDetected) onDetected(text);
                        }
                    }
                } catch (e) {
                    // Frame scan attempt silent catch
                }
            }

            if (isMounted) {
                animFrameId = requestAnimationFrame(scanLoop);
            }
        };

        animFrameId = requestAnimationFrame(scanLoop);

        return () => {
            isMounted = false;
            if (animFrameId) cancelAnimationFrame(animFrameId);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [cameraActive, isProcessing]);

    return (
        <div className="relative w-full aspect-square max-w-[420px] mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl flex flex-col items-center justify-center my-4">
            {/* Native Unmirrored Video Feed for True QR Matrix Reading */}
            <video
                ref={videoRef}
                className={`w-full h-full object-cover ${cameraReady ? 'block' : 'hidden'}`}
                autoPlay
                playsInline
                muted
            />

            {/* Viewfinder Bounding Box Overlay */}
            {cameraReady && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-3/4 h-3/4 border-2 border-dashed border-emerald-400/80 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br" />
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {!cameraReady && !errorMsg && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white space-y-4 p-6 text-center z-10">
                    <RefreshCw className="w-10 h-10 animate-spin text-emerald-400" />
                    <div>
                        <p className="text-base font-bold text-white">Menghubungkan Kamera Laptop...</p>
                        <p className="text-xs text-slate-400 mt-1">Jika peramban meminta izin, klik <strong>"Allow / Izinkan"</strong>.</p>
                    </div>
                    <button
                        onClick={startLaptopCamera}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center space-x-2"
                    >
                        <Camera className="w-4 h-4" />
                        <span>Coba Buka Kamera Laptop</span>
                    </button>
                </div>
            )}

            {/* Error Overlay */}
            {errorMsg && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center space-y-4 z-10">
                    <AlertCircle className="w-12 h-12 text-rose-500" />
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-rose-400">{errorMsg}</p>
                        <p className="text-xs text-slate-400">Pastikan kamera laptop Anda tidak terpakai di Zoom / MS Teams / Google Meet.</p>
                    </div>
                    <button
                        onClick={startLaptopCamera}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition-all shadow-lg flex items-center space-x-2"
                    >
                        <Camera className="w-4 h-4" />
                        <span>Coba Buka Kamera Lagi</span>
                    </button>
                </div>
            )}
        </div>
    );
}
