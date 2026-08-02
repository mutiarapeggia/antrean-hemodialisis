import React from 'react';
import { Keyboard, Send, RefreshCw, X } from 'lucide-react';
import DeveloperTestingPanel from './DeveloperTestingPanel';

export default function ManualInputCard({
    manualToken,
    setManualToken,
    handleCheckInSubmit,
    loading,
    inputRef,
    useSimulated,
    setUseSimulated,
    simulatedAt,
    setSimulatedAt
}) {
    return (
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col justify-between backdrop-blur-xl h-full w-full space-y-8">
            <div>
                {/* Header Section: Standalone Icon Large + Text Matched Size */}
                <div>
                    <div className="flex items-center gap-4">
                        <Keyboard className="w-10 h-10 text-blue-400 flex-shrink-0" />
                        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase">
                            INPUT MANUAL TOKEN
                        </h3>
                    </div>
                    {/* Subtitle dengan Spasi Longgar Atas & Bawah */}
                    <p className="text-sm font-medium text-slate-400 mt-3 sm:mt-4 mb-6 sm:mb-8 leading-relaxed">
                        Pilihan alternatif jika scanner QR terhalang
                    </p>
                </div>

                {/* Form Section */}
                <form onSubmit={(e) => handleCheckInSubmit(e)} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                            KODE TOKEN HMAC QR
                        </label>
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={manualToken}
                                onChange={(e) => setManualToken(e.target.value)}
                                placeholder="Masukkan token QR..."
                                className="w-full h-16 px-6 bg-slate-950 border-2 border-slate-700/80 rounded-2xl text-lg font-mono text-cyan-300 placeholder-slate-500 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all shadow-inner pr-12"
                                aria-label="Input kode token HMAC QR"
                                disabled={loading}
                            />
                            {manualToken && (
                                <button 
                                    type="button" 
                                    onClick={() => setManualToken('')} 
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
                                    aria-label="Hapus teks token"
                                    disabled={loading}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Touchscreen Button - Menggunakan Label "Check-In" */}
                    <button
                        type="submit"
                        disabled={loading || !manualToken.trim()}
                        className="h-16 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white font-extrabold text-lg uppercase tracking-wider shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:bg-slate-800 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:border disabled:border-slate-700/60 disabled:shadow-none disabled:cursor-not-allowed disabled:hover:scale-100"
                        aria-label="Tombol Check-In"
                    >
                        {loading ? (
                            <RefreshCw className="w-6 h-6 animate-spin text-white" />
                        ) : (
                            <>
                                <Send className="w-6 h-6" />
                                <span>Check-In</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Developer Testing Panel (Collapsible) */}
            <div className="pt-6 border-t border-slate-800/80">
                <DeveloperTestingPanel
                    useSimulated={useSimulated}
                    setUseSimulated={setUseSimulated}
                    simulatedAt={simulatedAt}
                    setSimulatedAt={setSimulatedAt}
                />
            </div>
        </div>
    );
}
