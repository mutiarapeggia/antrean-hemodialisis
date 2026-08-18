import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Code } from 'lucide-react';

export default function DeveloperTestingPanel({ useSimulated, setUseSimulated, simulatedAt, setSimulatedAt }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 transition-all">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors focus:outline-none"
                aria-expanded={isExpanded}
                aria-label="Toggle Panel Developer Testing"
            >
                <div className="flex items-center space-x-2.5">
                    <Code className="w-4 h-4 text-blue-600" />
                    <span>Developer Testing</span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
            </button>

            {isExpanded && (
                <div className="mt-3.5 pt-3.5 border-t border-slate-200 space-y-3.5 animate-fade-in">
                    <label className="flex items-center space-x-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={useSimulated}
                            onChange={(e) => setUseSimulated(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-800">Simulasi Waktu Kedatangan (Testing)</span>
                    </label>

                    {useSimulated && (
                        <input
                            type="text"
                            value={simulatedAt}
                            onChange={(e) => setSimulatedAt(e.target.value)}
                            placeholder="YYYY-MM-DD HH:mm:ss (Contoh: 2026-08-10 07:10:00)"
                            className="w-full h-11 px-4 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                            aria-label="Input waktu simulasi kedatangan"
                        />
                    )}
                </div>
            )}
        </div>
    );
}
