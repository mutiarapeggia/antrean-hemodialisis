import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Code } from 'lucide-react';

export default function DeveloperTestingPanel({ useSimulated, setUseSimulated, simulatedAt, setSimulatedAt }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 transition-all">
            {/* Collapsible Header Bar */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                aria-expanded={isExpanded}
                aria-label="Toggle Panel Developer Testing"
            >
                <div className="flex items-center space-x-2.5">
                    <Code className="w-4 h-4 text-cyan-500" />
                    <span>Developer Testing</span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
            </button>

            {/* Collapsible Content */}
            {isExpanded && (
                <div className="mt-3.5 pt-3.5 border-t border-slate-800 space-y-3.5 animate-fade-in">
                    <label className="flex items-center space-x-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={useSimulated}
                            onChange={(e) => setUseSimulated(e.target.checked)}
                            className="w-4 h-4 text-cyan-500 bg-slate-900 border-slate-700 rounded focus:ring-cyan-500 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-slate-300">Simulasi Waktu Kedatangan (Testing)</span>
                    </label>

                    {useSimulated && (
                        <input
                            type="text"
                            value={simulatedAt}
                            onChange={(e) => setSimulatedAt(e.target.value)}
                            placeholder="YYYY-MM-DD HH:mm:ss (Contoh: 2026-07-30 07:10:00)"
                            className="w-full h-11 px-4 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                            aria-label="Input waktu simulasi kedatangan"
                        />
                    )}
                </div>
            )}
        </div>
    );
}
