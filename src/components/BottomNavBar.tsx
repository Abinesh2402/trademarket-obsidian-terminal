import React from 'react';

interface BottomNavBarProps {
  currentTab: 'markets' | 'trade' | 'futures' | 'orders' | 'assets';
  setCurrentTab: (tab: 'markets' | 'trade' | 'futures' | 'orders' | 'assets') => void;
  openOrdersCount: number;
}

interface NavTabItem {
  id: 'markets' | 'trade' | 'futures' | 'orders' | 'assets';
  label: string;
  icon: string;
  badge?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  setCurrentTab,
  openOrdersCount,
}) => {
  const tabs: NavTabItem[] = [
    { id: 'markets', label: 'Markets', icon: 'show_chart' },
    { id: 'trade', label: 'Trade', icon: 'swap_horiz' },
    { id: 'futures', label: 'Futures', icon: 'candlestick_chart' },
    { id: 'orders', label: 'Orders', icon: 'receipt_long', badge: openOrdersCount },
    { id: 'assets', label: 'Assets', icon: 'account_balance_wallet' },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-3 py-1.5 bg-[#0b0e14] border-t border-[#3b494b]/30 shadow-lg"
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex flex-col items-center justify-center relative py-1 px-3 transition-colors active:opacity-80 ${
              isActive
                ? 'text-[#00f0ff] font-medium'
                : 'text-[#b9cacb] hover:text-[#00f0ff]'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <span
                className={`material-symbols-outlined text-[20px] transition-transform ${
                  isActive ? 'scale-110' : ''
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tab.icon}
              </span>

              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] rounded-full bg-[#00f0ff] text-[#0b0e14] font-['JetBrains_Mono'] text-[9px] font-bold flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </div>

            <span className="font-['JetBrains_Mono'] text-[9px] mt-0.5 tracking-tight">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
