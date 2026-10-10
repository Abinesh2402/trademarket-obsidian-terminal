import React, { useState } from 'react';
import { MarketPair } from '../types/crypto';

interface PairSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairs: MarketPair[];
  onSelectPair: (pair: MarketPair) => void;
}

export const PairSelectorModal: React.FC<PairSelectorModalProps> = ({
  isOpen,
  onClose,
  pairs,
  onSelectPair,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');

  if (!isOpen) return null;

  const filtered = pairs.filter((p) => {
    const matchesQuery =
      p.symbol.toLowerCase().includes(query.toLowerCase()) ||
      p.name.toLowerCase().includes(query.toLowerCase());
    if (!matchesQuery) return false;
    if (category === 'All') return true;
    return p.category === category;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-[#191c22] border border-[#3b494b]/60 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-3.5 border-b border-[#3b494b]/30 flex items-center justify-between bg-[#10131a]">
          <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#e1e2eb]">
            Select Market
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-[#272a31] text-[#849495] hover:text-[#e1e2eb] flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[#3b494b]/20">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#849495] text-[16px]">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search coin or pair..."
              autoFocus
              className="w-full bg-[#10131a] border border-[#3b494b]/40 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#e1e2eb] placeholder:text-[#849495] focus:outline-none focus:border-[#00f0ff]"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-2 pt-1">
            {['All', 'Layer 1', 'AI & DePIN', 'DeFi', 'Meme'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-['Geist'] whitespace-nowrap transition-colors ${
                  category === cat
                    ? 'bg-[#272a31] text-[#00f0ff] border border-[#00f0ff]/60'
                    : 'text-[#b9cacb] hover:text-[#e1e2eb]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Pairs List */}
        <div className="overflow-y-auto divide-y divide-[#3b494b]/10 flex-grow">
          {filtered.map((pair) => (
            <div
              key={pair.id}
              onClick={() => {
                onSelectPair(pair);
                onClose();
              }}
              className="p-3 flex items-center justify-between hover:bg-[#272a31]/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full ${pair.iconBg} ${pair.iconColor} flex items-center justify-center font-bold text-xs`}
                >
                  {pair.icon}
                </span>
                <div>
                  <div className="font-['Geist'] text-xs font-bold text-[#e1e2eb]">
                    {pair.symbol}
                  </div>
                  <div className="font-['JetBrains_Mono'] text-[9px] text-[#849495]">
                    {pair.name} · {pair.leverage}
                  </div>
                </div>
              </div>

              <div className="text-right font-['JetBrains_Mono']">
                <div className="text-xs font-semibold text-[#e1e2eb] tabular-nums">
                  ${pair.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div
                  className={`text-[10px] font-medium tabular-nums ${
                    pair.priceChange24h >= 0 ? 'text-[#05e777]' : 'text-[#ff3b30]'
                  }`}
                >
                  {pair.priceChange24h >= 0 ? '+' : ''}
                  {pair.priceChange24h.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
