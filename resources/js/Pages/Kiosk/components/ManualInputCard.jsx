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
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col justify-between h-full w-full space-y-8">
            <div>
                <div>
                    <div className="flex items-center gap-4">
                        <Keyboard className="w-10 h-10 text-blue-600 flex-shrink-0" />
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wide uppercase">
                            INPUT MANUAL TOKEN
                        </h3>
                    </div>
                    <p className="text-sm font-semibold text-slate-600 mt-3 sm:mt-4 mb-6 sm:mb-8 leading-relaxed">
                        Pilihan alternatif jika scanner QR terhalang
                    </p>
                </div>

                <form onSubmit={(e) => handleCheckInSubmit(e)} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                            KODE TOKEN HMAC QR
                        </label>
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={manualToken}
                                onChange={(e) => setManualToken(e.target.value)}
                                placeholder="Masukkan token QR..."
                                className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-300 rounded-2xl text-lg font-mono text-slate-900 font-bold placeholder-slate-400 focus:border-blue-600 focus:outline-none transition-all shadow-inner pr-12"
                                aria-label="Input kode token HMAC QR"
                                disabled={loading}
                            />
                            {manualToken && (
                                <button 
                                    type="button" 
                                    onClick={() => setManualToken('')} 
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200 transition-colors"
                                    aria-label="Hapus teks token"
                                    disabled={loading}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !manualToken.trim()}
                        className="h-16 w-full rounded-2xl bg-blue-600 text-white font-black text-lg uppercase tracking-wider shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
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

            <div className="pt-6 border-t border-slate-200">
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
