import React, { useState } from 'react';
import { MarketPair, MarketCategory } from '../types/crypto';

interface MarketsScreenProps {
  pairs: MarketPair[];
  onSelectPair: (pair: MarketPair) => void;
  onToggleFavorite: (pairId: string) => void;
  onOpenConvertModal: () => void;
  onOpenFilterModal: () => void;
}

export const MarketsScreen: React.FC<MarketsScreenProps> = ({
  pairs,
  onSelectPair,
  onToggleFavorite,
  onOpenConvertModal,
  onOpenFilterModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>('Watchlist');
  const [rankingTab, setRankingTab] = useState<'hot' | 'volume' | 'gainers' | 'losers'>('hot');
  const [showAllPairs, setShowAllPairs] = useState(false);

  const categories: MarketCategory[] = [
    'Watchlist',
    'All',
    'Layer 1',
    'AI & DePIN',
    'DeFi',
    'Top Gainers',
    'Meme',
  ];

  // Filtering pairs
  const filteredPairs = pairs.filter((pair) => {
    // Search filter
    const matchesSearch =
      pair.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pair.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Category filter
    if (selectedCategory === 'Watchlist') {
      return pair.isFavorite;
    }
    if (selectedCategory === 'All') {
      return true;
    }
    if (selectedCategory === 'Top Gainers') {
      return pair.priceChange24h > 3;
    }
    return pair.category === selectedCategory;
  });

  // Sorting according to ranking tabs
  const sortedPairs = [...filteredPairs].sort((a, b) => {
    if (rankingTab === 'volume') {
      return parseFloat(b.volume24hUsd.replace(/[^0-9.]/g, '')) - parseFloat(a.volume24hUsd.replace(/[^0-9.]/g, ''));
    }
    if (rankingTab === 'gainers') {
      return b.priceChange24h - a.priceChange24h;
    }
    if (rankingTab === 'losers') {
      return a.priceChange24h - b.priceChange24h;
    }
    // 'hot' defaults to standard priority
    return 0;
  });

  const displayedPairs = showAllPairs ? sortedPairs : sortedPairs.slice(0, 6);

  // Spot Highlights (first 3 pairs: BTC, ETH, SOL)
  const spotHighlights = pairs.filter((p) => ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'].includes(p.symbol));

  return (
    <main className="w-full max-w-7xl mx-auto px-3 pt-3 space-y-3 pb-24">
      {/* Quick Search & Filter Utility Strip */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#849495] text-[16px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coin, pair or contract..."
            className="w-full bg-[#191c22] border border-[#3b494b]/30 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#e1e2eb] placeholder:text-[#849495] focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] font-['Geist'] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#849495] hover:text-[#e1e2eb]"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>

        <button
          onClick={onOpenFilterModal}
          className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#191c22] border border-[#3b494b]/30 text-[#b9cacb] hover:text-[#e1e2eb] hover:border-[#00f0ff]/50 active:opacity-85 text-xs font-['Geist'] transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          <span className="text-[12px] tracking-wider font-medium">Filter</span>
        </button>
      </div>

      {/* Quick Category Sector Pills */}
      <nav aria-label="Market Categories" className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1 px-3 py-1 rounded text-[12px] font-['Geist'] font-medium whitespace-nowrap transition-all active:opacity-85 ${
                isActive
                  ? 'bg-[#272a31] border border-[#00f0ff] text-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                  : 'bg-[#191c22] border border-[#3b494b]/20 text-[#b9cacb] hover:text-[#e1e2eb] hover:border-[#3b494b]/50'
              }`}
            >
              {cat === 'Watchlist' && (
                <span
                  className="material-symbols-outlined text-[13px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  star
                </span>
              )}
              <span>{cat}</span>
            </button>
          );
        })}
      </nav>

      {/* Hot Market Ticker Carousel Cards */}
      <section aria-labelledby="featured-tickers-heading">
        <div className="flex items-center justify-between mb-1.5">
          <h2
            id="featured-tickers-heading"
            className="font-['JetBrains_Mono'] text-[9px] text-[#849495] uppercase tracking-widest"
          >
            Spot Highlights
          </h2>
          <div className="flex items-center gap-1 font-['JetBrains_Mono'] text-[9px] text-[#849495]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#05e777] animate-pulse" />
            <span>REALTIME FEED</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 overflow-x-auto no-scrollbar">
          {spotHighlights.map((pair) => {
            const isPositive = pair.priceChange24h >= 0;
            return (
              <article
                key={pair.id}
                onClick={() => onSelectPair(pair)}
                className="bg-[#191c22] p-2.5 rounded-lg border border-[#3b494b]/30 relative overflow-hidden group hover:border-[#00f0ff]/40 cursor-pointer transition-all shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded-full ${pair.iconBg} ${pair.iconColor} flex items-center justify-center font-bold text-[10px] shrink-0`}
                    >
                      {pair.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-[14px] font-bold text-[#e1e2eb] font-['Geist'] leading-none">
                          {pair.baseAsset}
                        </span>
                        <span className="font-['JetBrains_Mono'] text-[9px] text-[#849495]">
                          /{pair.quoteAsset}
                        </span>
                      </div>
                      <span className="font-['JetBrains_Mono'] text-[9px] text-[#b9cacb]">
                        {pair.name}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 rounded font-['JetBrains_Mono'] text-[9px] font-semibold tabular-nums ${
                      isPositive
                        ? 'bg-[#05e777]/15 text-[#05e777]'
                        : 'bg-[#ff3b30]/15 text-[#ff3b30]'
                    }`}
                  >
                    {isPositive ? `+${pair.priceChange24h.toFixed(2)}%` : `${pair.priceChange24h.toFixed(2)}%`}
                  </span>
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-['JetBrains_Mono'] text-[14px] text-[#e1e2eb] font-semibold tracking-tight tabular-nums">
                    ${pair.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>

                  {/* High fidelity SVG sparkline */}
                  <svg className="w-16 h-5 stroke-[#05e777] fill-none" viewBox="0 0 60 20">
                    <path
                      d={
                        pair.symbol === 'BTC/USDT'
                          ? 'M0,16 L10,14 L20,17 L30,9 L40,11 L50,4 L60,2'
                          : pair.symbol === 'ETH/USDT'
                          ? 'M0,18 L12,15 L22,12 L32,14 L42,8 L52,7 L60,4'
                          : 'M0,19 L10,18 L20,11 L30,13 L40,6 L50,5 L60,1'
                      }
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.75"
                    />
                  </svg>
                </div>

                <div className="mt-1 flex items-center justify-between font-['JetBrains_Mono'] text-[9px] text-[#849495]">
                  <span>24h Vol {pair.volume24hUsd}</span>
                  <span className="text-[#b9cacb]">
                    High ${pair.high24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Market Ranking Table Section */}
      <section className="bg-[#0b0e14] rounded-lg border border-[#3b494b]/30 overflow-hidden shadow-sm">
        {/* Table Sub-Tabs */}
        <div className="flex items-center justify-between border-b border-[#3b494b]/20 px-3 bg-[#191c22]/50">
          <div className="flex items-center gap-4">
            {(
              [
                { id: 'hot', label: 'Hot' },
                { id: 'volume', label: '24h Volume' },
                { id: 'gainers', label: 'Top Gainers' },
                { id: 'losers', label: 'Losers' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setRankingTab(t.id)}
                className={`py-2.5 text-[12px] font-['Geist'] transition-colors ${
                  rankingTab === t.id
                    ? 'text-[#00f0ff] font-semibold border-b-2 border-[#00f0ff]'
                    : 'text-[#b9cacb] hover:text-[#e1e2eb]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (rankingTab === 'gainers') setRankingTab('losers');
              else setRankingTab('gainers');
            }}
            aria-label="Toggle sort order"
            className="text-[#849495] hover:text-[#e1e2eb] transition-colors p-1"
          >
            <span className="material-symbols-outlined text-[16px]">swap_vert</span>
          </button>
        </div>

        {/* Column Labels */}
        <div className="grid grid-cols-12 px-3 py-2 font-['JetBrains_Mono'] text-[9px] text-[#849495] border-b border-[#3b494b]/10">
          <div className="col-span-6 flex items-center gap-1">
            <span>PAIR / VOL</span>
            <span className="material-symbols-outlined text-[10px]">unfold_more</span>
          </div>
          <div className="col-span-3 text-right flex items-center justify-end gap-1">
            <span>LAST PRICE</span>
            <span className="material-symbols-outlined text-[10px]">unfold_more</span>
          </div>
          <div className="col-span-3 text-right">
            <span>24H CHG</span>
          </div>
        </div>

        {/* Market Pair Rows */}
        <div className="divide-y divide-[#3b494b]/10">
          {displayedPairs.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#849495]">
              No pairs found matching "{searchQuery}" in {selectedCategory}.
            </div>
          ) : (
            displayedPairs.map((pair) => {
              const isPositive = pair.priceChange24h >= 0;
              return (
                <div
                  key={pair.id}
                  onClick={() => onSelectPair(pair)}
                  className="grid grid-cols-12 items-center px-3 py-2.5 hover:bg-[#272a31]/40 transition-colors cursor-pointer group"
                >
                  {/* Left Column: Star + Pair Info */}
                  <div className="col-span-6 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(pair.id);
                      }}
                      className="text-[#849495] hover:text-[#00f0ff] p-0.5 transition-colors"
                      aria-label={pair.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <span
                        className={`material-symbols-outlined text-[16px] ${
                          pair.isFavorite ? 'text-[#00f0ff]' : ''
                        }`}
                        style={pair.isFavorite ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        star
                      </span>
                    </button>

                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-['Geist'] text-[14px] font-bold text-[#e1e2eb] group-hover:text-[#00f0ff] transition-colors leading-none">
                          {pair.baseAsset}
                        </span>
                        <span className="font-['JetBrains_Mono'] text-[9px] text-[#849495]">
                          /{pair.quoteAsset}
                        </span>
                        <span className="text-[9px] px-1 bg-[#1d2026] rounded text-[#849495] font-['JetBrains_Mono']">
                          {pair.leverage}
                        </span>
                      </div>
                      <div className="font-['JetBrains_Mono'] text-[9px] text-[#b9cacb] mt-0.5">
                        Vol {pair.volume24hUsd}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Price */}
                  <div className="col-span-3 text-right">
                    <div className="font-['JetBrains_Mono'] text-[14px] text-[#e1e2eb] font-semibold tabular-nums leading-none">
                      {pair.price < 0.01
                        ? pair.price.toFixed(7)
                        : pair.price < 10
                        ? pair.price.toFixed(4)
                        : pair.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="font-['JetBrains_Mono'] text-[9px] text-[#849495] mt-0.5 tabular-nums">
                      ${pair.price < 0.01
                        ? pair.price.toFixed(7)
                        : pair.price < 10
                        ? pair.price.toFixed(3)
                        : pair.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Right Column: 24h Change Badge */}
                  <div className="col-span-3 flex justify-end">
                    <span
                      className={`min-w-[62px] text-center px-1.5 py-1 rounded font-['JetBrains_Mono'] text-[11px] font-bold tabular-nums shadow-sm ${
                        isPositive
                          ? 'bg-[#05e777] text-[#0b0e14]'
                          : 'bg-[#FF3B30] text-white'
                      }`}
                    >
                      {isPositive ? `+${pair.priceChange24h.toFixed(2)}%` : `${pair.priceChange24h.toFixed(2)}%`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Footer Summary inside table */}
        <div className="p-2.5 bg-[#191c22]/40 border-t border-[#3b494b]/20 flex items-center justify-between font-['JetBrains_Mono'] text-[9px] text-[#849495]">
          <span>Displaying {displayedPairs.length} of 420 Pairs</span>
          <button
            onClick={() => setShowAllPairs(!showAllPairs)}
            className="text-[#00f0ff] hover:underline flex items-center gap-0.5"
          >
            <span>{showAllPairs ? 'Show Less' : 'View All Markets'}</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          </button>
        </div>
      </section>

      {/* Algorithmic Heatmap / Fast Execution Teaser Bar */}
      <div className="p-3 bg-[#191c22] rounded-lg border border-[#3b494b]/30 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff]">
            <span className="material-symbols-outlined text-[18px]">bolt</span>
          </div>
          <div>
            <div className="font-['Geist'] text-[12px] font-semibold text-[#e1e2eb]">
              Instant Fast Swap
            </div>
            <div className="font-['JetBrains_Mono'] text-[9px] text-[#849495]">
              Zero slippage on major USD pairs
            </div>
          </div>
        </div>

        <button
          onClick={onOpenConvertModal}
          className="px-3 py-1.5 rounded bg-[#00f0ff] text-[#0b0e14] font-['Space_Grotesk'] text-[12px] font-bold hover:bg-[#7df4ff] active:opacity-85 transition-colors shadow-sm"
        >
          Convert
        </button>
      </div>
    </main>
  );
};
