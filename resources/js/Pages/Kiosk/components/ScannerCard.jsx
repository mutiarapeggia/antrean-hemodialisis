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
    const isProcessingRef = useRef(isProcessing);
    const streamRef = useRef(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isProcessingRef.current = isProcessing;
    }, [isProcessing]);

    /**
     * Complete and safe cleanup of camera stream hardware resources
     */
    const stopMediaStream = () => {
        if (streamRef.current) {
            try {
                streamRef.current.getTracks().forEach(track => {
                    track.enabled = false;
                    track.stop();
                });
            } catch (e) {
                console.warn('[CAMERA CLEANUP WARN]:', e);
            }
            streamRef.current = null;
        }

        if (videoRef.current) {
            try {
                if (videoRef.current.srcObject) {
                    const tracks = videoRef.current.srcObject.getTracks ? videoRef.current.srcObject.getTracks() : [];
                    tracks.forEach(track => {
                        track.enabled = false;
                        track.stop();
                    });
                }
            } catch (e) {}
            videoRef.current.srcObject = null;
        }
    };

    const startLaptopCamera = async () => {
        if (!isMountedRef.current) return;
        setCameraReady(false);
        setErrorMsg('');

        // Ensure previous media stream hardware lock is released
        stopMediaStream();

        // 150ms delay to allow browser and OS video driver to release hardware lock
        await new Promise(resolve => setTimeout(resolve, 150));
        if (!isMountedRef.current) return;

        try {
            let mediaStream;
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    },
                    audio: false
                });
            } catch (firstErr) {
                console.warn('[CAMERA WARN] Ideal resolution constraint failed, falling back to default video:', firstErr);
                if (!isMountedRef.current) return;
                mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }

            if (!isMountedRef.current) {
                if (mediaStream) {
                    mediaStream.getTracks().forEach(t => { t.enabled = false; t.stop(); });
                }
                return;
            }

            streamRef.current = mediaStream;

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.setAttribute('playsinline', 'true');
                
                try {
                    await videoRef.current.play();
                } catch (playErr) {
                    console.warn('[CAMERA WARN] Video play interrupted:', playErr);
                }

                if (isMountedRef.current) {
                    setCameraReady(true);
                }
            }
        } catch (err) {
            console.error('[LAPTOP CAMERA ERROR]:', err);
            if (!isMountedRef.current) return;
            setCameraReady(false);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setErrorMsg('Izin kamera ditolak oleh browser. Klik ikon gembok di URL bar peramban lalu izinkan Kamera (Allow).');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setErrorMsg('Kamera laptop tidak ditemukan atau sedang digunakan oleh aplikasi lain (Zoom/Teams).');
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setErrorMsg('Kamera sedang diakses oleh proses lain atau belum dilepas oleh sistem. Silakan coba buka kamera kembali.');
            } else {
                setErrorMsg(`Gagal membuka kamera laptop: ${err.message || 'Izin tidak diberikan.'}`);
            }
        }
    };

    useEffect(() => {
        isMountedRef.current = true;

        if (!cameraActive) {
            stopMediaStream();
            setCameraReady(false);
            return;
        }

        let animFrameId = null;
        let startTimerId = null;
        const codeReader = new BrowserQRCodeReader();

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
            if (!isMountedRef.current) return;

            const now = Date.now();
            if (now - lastScanTime >= 100 && videoRef.current && videoRef.current.readyState >= 2 && !isProcessingRef.current) {
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

            if (isMountedRef.current) {
                animFrameId = requestAnimationFrame(scanLoop);
            }
        };

        const initScanner = async () => {
            await startLaptopCamera();
            if (isMountedRef.current) {
                animFrameId = requestAnimationFrame(scanLoop);
            }
        };

        startTimerId = setTimeout(() => {
            if (isMountedRef.current) {
                initScanner();
            }
        }, 150);

        return () => {
            isMountedRef.current = false;
            if (startTimerId) clearTimeout(startTimerId);
            if (animFrameId) cancelAnimationFrame(animFrameId);
            stopMediaStream();
            setCameraReady(false);
        };
    }, [cameraActive]);

    return (
        <div className="relative w-full aspect-square max-w-[420px] mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl flex flex-col items-center justify-center">
            {/* Native Unmirrored Video Feed for True QR Matrix Reading */}
            <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none select-none ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
                autoPlay
                playsInline
                muted
                controls={false}
                disablePictureInPicture
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
