import React from 'react';

export const GlobalTickerRibbon: React.FC = () => {
  return (
    <section className="bg-[#0b0e14] px-3 py-1.5 border-b border-[#3b494b]/20">
      <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-4 whitespace-nowrap text-xs">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#05e777] animate-pulse" />
          <span className="font-['JetBrains_Mono'] text-[9px] text-[#b9cacb] tracking-wider">
            24H GLOBAL VOL
          </span>
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#e1e2eb] font-semibold tabular-nums">
            $2.41T
          </span>
          <span className="font-['JetBrains_Mono'] text-[9px] text-[#05e777] font-medium tabular-nums">
            +3.4%
          </span>
        </div>

        <div className="h-3 w-px bg-[#3b494b]/40 shrink-0" />

        <div className="flex items-center gap-2">
          <span className="font-['JetBrains_Mono'] text-[9px] text-[#b9cacb] tracking-wider">
            BTC DOM
          </span>
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#e1e2eb] tabular-nums">
            54.8%
          </span>
        </div>

        <div className="h-3 w-px bg-[#3b494b]/40 shrink-0" />

        <div className="flex items-center gap-2">
          <span className="font-['JetBrains_Mono'] text-[9px] text-[#b9cacb] tracking-wider">
            GAS
          </span>
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#00f0ff] tabular-nums">
            14 Gwei
          </span>
        </div>

        <div className="h-3 w-px bg-[#3b494b]/40 shrink-0" />

        <div className="flex items-center gap-1.5">
          <span className="font-['JetBrains_Mono'] text-[9px] text-[#b9cacb] tracking-wider">
            SENTIMENT
          </span>
          <span className="font-['JetBrains_Mono'] text-[9px] px-1 py-0.5 rounded bg-[#1d2026] text-[#7dffa2] font-medium">
            GREED 74
          </span>
        </div>
      </div>
    </section>
  );
};
