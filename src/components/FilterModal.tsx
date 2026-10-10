import React, { useState } from 'react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: { minVolume: number; onlyFavorites: boolean; sortDirection: 'desc' | 'asc' }) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApply }) => {
  const [minVolume, setMinVolume] = useState<number>(0);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-[#191c22] border border-[#3b494b]/60 rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#3b494b]/30">
          <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#e1e2eb]">
            Market Filter Options
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-[#272a31] text-[#849495] hover:text-[#e1e2eb] flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Min 24h Volume */}
        <div className="space-y-1.5">
          <label className="font-['Geist'] text-xs text-[#b9cacb]">
            Minimum 24h Volume ($M USD)
          </label>
          <div className="grid grid-cols-4 gap-1.5 font-['JetBrains_Mono'] text-xs">
            {[0, 50, 200, 500].map((val) => (
              <button
                key={val}
                onClick={() => setMinVolume(val)}
                className={`py-1.5 rounded transition-colors ${
                  minVolume === val
                    ? 'bg-[#00f0ff] text-[#0b0e14] font-bold'
                    : 'bg-[#10131a] text-[#b9cacb] border border-[#3b494b]/40 hover:text-white'
                }`}
              >
                ${val}M+
              </button>
            ))}
          </div>
        </div>

        {/* Sort Direction */}
        <div className="space-y-1.5">
          <label className="font-['Geist'] text-xs text-[#b9cacb]">Price Change Order</label>
          <div className="grid grid-cols-2 gap-2 font-['Geist'] text-xs">
            <button
              onClick={() => setSortDirection('desc')}
              className={`py-2 rounded transition-colors ${
                sortDirection === 'desc'
                  ? 'bg-[#272a31] text-[#00f0ff] border border-[#00f0ff]'
                  : 'bg-[#10131a] text-[#b9cacb] border border-[#3b494b]/30'
              }`}
            >
              Highest Gainers First
            </button>
            <button
              onClick={() => setSortDirection('asc')}
              className={`py-2 rounded transition-colors ${
                sortDirection === 'asc'
                  ? 'bg-[#272a31] text-[#00f0ff] border border-[#00f0ff]'
                  : 'bg-[#10131a] text-[#b9cacb] border border-[#3b494b]/30'
              }`}
            >
              Biggest Losers First
            </button>
          </div>
        </div>

        {/* Favorites only */}
        <div className="flex items-center justify-between py-2 border-t border-[#3b494b]/20">
          <span className="font-['Geist'] text-xs text-[#e1e2eb]">Watchlist Stars Only</span>
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
              onlyFavorites ? 'bg-[#00f0ff]' : 'bg-[#272a31]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                onlyFavorites ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <button
          onClick={() => {
            onApply({ minVolume, onlyFavorites, sortDirection });
            onClose();
          }}
          className="w-full py-2.5 bg-[#00f0ff] text-[#0b0e14] font-['Space_Grotesk'] text-xs font-bold rounded-lg hover:bg-[#7df4ff] transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};
