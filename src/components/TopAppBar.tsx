import React from 'react';
import { MarketPair } from '../types/crypto';

interface TopAppBarProps {
  currentTab: 'markets' | 'trade' | 'futures' | 'orders' | 'assets';
  setCurrentTab: (tab: 'markets' | 'trade' | 'futures' | 'orders' | 'assets') => void;
  selectedPair: MarketPair;
  onOpenPairSelector: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentTab,
  setCurrentTab,
  selectedPair,
  onOpenPairSelector,
  onOpenNotifications,
  unreadCount,
}) => {
  const isTradeView = currentTab === 'trade' || currentTab === 'futures';

  return (
    <header className="flex justify-between items-center w-full px-3 h-12 sticky top-0 z-40 bg-[#10131a] border-b border-[#3b494b]/30">
      {/* Brand / Pair Zone */}
      {isTradeView ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('markets')}
            aria-label="Back to markets"
            className="flex items-center justify-center p-1 rounded hover:bg-[#272a31] text-[#e1e2eb] transition-colors"
          >
            <span className="material-symbols-outlined text-[#00f0ff] text-[18px]">candlestick_chart</span>
          </button>
          
          <button
            onClick={onOpenPairSelector}
            className="flex items-center gap-1 hover:opacity-85 text-left group"
          >
            <span className="font-['Space_Grotesk'] text-[18px] font-bold text-[#dbfcff] tracking-tight">
              {selectedPair.symbol}
            </span>
            <span className="material-symbols-outlined text-[#b9cacb] text-base group-hover:text-[#00f0ff] transition-colors">
              arrow_drop_down
            </span>
          </button>

          <span className="px-1.5 py-0.5 rounded bg-[#272a31] text-[#05e777] font-['JetBrains_Mono'] text-[9px] uppercase font-semibold tracking-wider">
            {currentTab === 'futures' ? 'Futures' : 'Spot'}
          </span>
        </div>
      ) : (
        <div 
          onClick={() => setCurrentTab('markets')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#272a31] border border-[#3b494b]/40 text-[#00f0ff]">
            <span className="material-symbols-outlined text-[18px]">candlestick_chart</span>
          </div>
          <div className="flex flex-col">
            <span className="font-['Space_Grotesk'] text-[18px] font-bold text-[#dbfcff] tracking-tight leading-none">
              TradeMarket
            </span>
            <span className="font-['JetBrains_Mono'] text-[9px] text-[#849495] tracking-wider">
              TERMINAL v2.4
            </span>
          </div>
        </div>
      )}

      {/* Right Global Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenPairSelector}
          aria-label="Search markets"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#b9cacb] hover:bg-[#272a31] hover:text-[#dbfcff] active:opacity-85 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
        </button>

        <button
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="relative w-8 h-8 flex items-center justify-center rounded-lg text-[#b9cacb] hover:bg-[#272a31] hover:text-[#dbfcff] active:opacity-85 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#00f0ff] ring-2 ring-[#10131a]" />
          )}
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-4 ml-3 pl-3 border-l border-[#3b494b]/30">
          {(['markets', 'trade', 'futures', 'orders', 'assets'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              className={`text-[12px] font-['Geist'] tracking-wider capitalize transition-colors ${
                currentTab === tab
                  ? 'text-[#00f0ff] font-semibold'
                  : 'text-[#b9cacb] hover:text-[#dbfcff]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
