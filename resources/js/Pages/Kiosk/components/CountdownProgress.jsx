import React from 'react';

export default function CountdownProgress({ autoResetSeconds, colorClass = "bg-emerald-400" }) {
    const percentage = Math.max(0, Math.min(100, (autoResetSeconds / 8) * 100));

    return (
        <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Auto-reset Layar</span>
                <span className="font-mono font-bold text-slate-200">{autoResetSeconds}s</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                    className={`h-full ${colorClass} transition-all duration-1000 ease-linear rounded-full`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
