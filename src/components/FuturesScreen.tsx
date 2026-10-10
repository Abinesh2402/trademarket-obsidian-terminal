import React, { useState } from 'react';
import { MarketPair, Position } from '../types/crypto';

interface FuturesScreenProps {
  selectedPair: MarketPair;
  positions: Position[];
  onOpenPosition: (pos: Omit<Position, 'id' | 'pnl' | 'roe'>) => void;
  onClosePosition: (id: string) => void;
  userUsdtBalance: number;
}

export const FuturesScreen: React.FC<FuturesScreenProps> = ({
  selectedPair,
  positions,
  onOpenPosition,
  onClosePosition,
  userUsdtBalance,
}) => {
  const [leverage, setLeverage] = useState<number>(50);
  const [marginType, setMarginType] = useState<'Cross' | 'Isolated'>('Cross');
  const [futuresSide, setFuturesSide] = useState<'long' | 'short'>('long');
  const [sizeInput, setSizeInput] = useState<string>('0.25');
  const [feedback, setFeedback] = useState<string | null>(null);

  const numSize = parseFloat(sizeInput) || 0;
  const notionalValue = numSize * selectedPair.price;
  const requiredMargin = leverage > 0 ? notionalValue / leverage : 0;
  const estLiqPrice =
    futuresSide === 'long'
      ? selectedPair.price * (1 - 0.9 / leverage)
      : selectedPair.price * (1 + 0.9 / leverage);

  const handleExecutePosition = () => {
    if (numSize <= 0) {
      triggerToast('Enter valid position size');
      return;
    }
    if (requiredMargin > userUsdtBalance) {
      triggerToast('Margin exceeds available USDT balance');
      return;
    }

    onOpenPosition({
      pair: selectedPair.symbol,
      side: futuresSide,
      leverage,
      entryPrice: selectedPair.price,
      markPrice: selectedPair.price,
      size: numSize,
      margin: requiredMargin,
      marginType,
      liqPrice: estLiqPrice,
    });

    triggerToast(`Opened ${leverage}x ${futuresSide.toUpperCase()} ${numSize} ${selectedPair.baseAsset}`);
  };

  const triggerToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="w-full max-w-[500px] md:max-w-4xl mx-auto min-h-screen bg-[#10131a] flex flex-col relative pb-20">
      {feedback && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#1d2026] border border-[#00f0ff] px-4 py-2 rounded-lg text-xs font-['Geist'] text-[#00f0ff] shadow-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">info</span>
          <span>{feedback}</span>
        </div>
      )}

      {/* Top Banner Ribbon */}
      <div className="px-3 py-2 bg-[#191c22] border-b border-[#3b494b]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-['Space_Grotesk'] text-base font-bold text-[#e1e2eb]">
            {selectedPair.symbol} Perpetual
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#272a31] text-[#00f0ff] font-['JetBrains_Mono'] text-[10px] font-semibold">
            {marginType} {leverage}x
          </span>
        </div>
        <div className="font-['JetBrains_Mono'] text-xs text-[#05e777] font-semibold tabular-nums">
          Funding: +0.0100% / 4h
        </div>
      </div>

      {/* Trading Form */}
      <div className="p-3 bg-[#10131a] space-y-3">
        {/* Margin Mode & Leverage Selector */}
        <div className="bg-[#191c22] p-3 rounded-lg border border-[#3b494b]/30 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#b9cacb] font-['Geist']">Margin Mode & Leverage</span>
            <div className="flex bg-[#0b0e14] p-0.5 rounded border border-[#3b494b]/30">
              <button
                onClick={() => setMarginType('Cross')}
                className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                  marginType === 'Cross' ? 'bg-[#272a31] text-[#00f0ff]' : 'text-[#849495]'
                }`}
              >
                Cross
              </button>
              <button
                onClick={() => setMarginType('Isolated')}
                className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                  marginType === 'Isolated' ? 'bg-[#272a31] text-[#00f0ff]' : 'text-[#849495]'
                }`}
              >
                Isolated
              </button>
            </div>
          </div>

          {/* Leverage Slider */}
          <div className="space-y-1">
            <div className="flex justify-between font-['JetBrains_Mono'] text-xs">
              <span className="text-[#849495]">Adjust Leverage</span>
              <span className="text-[#00f0ff] font-bold">{leverage}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={125}
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="w-full accent-[#00f0ff] cursor-pointer"
            />
            <div className="flex justify-between font-['JetBrains_Mono'] text-[9px] text-[#849495]">
              {[5, 25, 50, 75, 100, 125].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLeverage(lvl)}
                  className={`hover:text-[#00f0ff] ${leverage === lvl ? 'text-[#00f0ff] font-bold' : ''}`}
                >
                  {lvl}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Long / Short Trigger */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setFuturesSide('long')}
            className={`py-2 rounded-lg font-['Space_Grotesk'] text-xs font-bold transition-all shadow-sm ${
              futuresSide === 'long'
                ? 'bg-[#05e777] text-[#0b0e14]'
                : 'bg-[#191c22] text-[#b9cacb] border border-[#3b494b]/30'
            }`}
          >
            Open Long / Bull
          </button>
          <button
            onClick={() => setFuturesSide('short')}
            className={`py-2 rounded-lg font-['Space_Grotesk'] text-xs font-bold transition-all shadow-sm ${
              futuresSide === 'short'
                ? 'bg-[#ff3b30] text-white'
                : 'bg-[#191c22] text-[#b9cacb] border border-[#3b494b]/30'
            }`}
          >
            Open Short / Bear
          </button>
        </div>

        {/* Size Input */}
        <div className="bg-[#191c22] p-3 rounded-lg border border-[#3b494b]/30 space-y-1.5">
          <div className="flex justify-between text-xs font-['Geist'] text-[#b9cacb]">
            <span>Position Size</span>
            <span className="font-['JetBrains_Mono'] text-[10px]">
              Mark: ${selectedPair.price.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center bg-[#0b0e14] border border-[#3b494b]/40 rounded px-2 py-1.5">
            <input
              type="text"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              className="w-full bg-transparent font-['JetBrains_Mono'] text-sm text-[#e1e2eb] focus:outline-none"
            />
            <span className="font-['JetBrains_Mono'] text-xs text-[#849495]">
              {selectedPair.baseAsset}
            </span>
          </div>

          <div className="pt-2 grid grid-cols-2 gap-2 font-['JetBrains_Mono'] text-[10px] text-[#b9cacb]">
            <div>
              <span>Cost / Margin:</span>{' '}
              <span className="text-[#e1e2eb] font-semibold">${requiredMargin.toFixed(2)} USDT</span>
            </div>
            <div className="text-right">
              <span>Est. Liq Price:</span>{' '}
              <span className="text-[#ff3b30] font-semibold">${estLiqPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleExecutePosition}
          className={`w-full py-3 rounded-lg font-['Space_Grotesk'] text-sm font-bold uppercase tracking-wider transition-all shadow-md ${
            futuresSide === 'long'
              ? 'bg-[#05e777] text-[#0b0e14] hover:brightness-110'
              : 'bg-[#ff3b30] text-white hover:brightness-110'
          }`}
        >
          {futuresSide === 'long'
            ? `Buy / Long ${selectedPair.baseAsset} with ${leverage}x`
            : `Sell / Short ${selectedPair.baseAsset} with ${leverage}x`}
        </button>
      </div>

      {/* Active Positions Table */}
      <div className="mt-2 bg-[#0b0e14] border-t border-[#3b494b]/30 flex-grow">
        <div className="p-3 border-b border-[#3b494b]/20 flex justify-between items-center bg-[#10131a]">
          <span className="font-['Geist'] text-xs font-semibold text-[#e1e2eb]">
            Open Positions ({positions.length})
          </span>
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#00f0ff]">
            Total Margin: ${positions.reduce((acc, p) => acc + p.margin, 0).toFixed(2)}
          </span>
        </div>

        <div className="divide-y divide-[#3b494b]/15">
          {positions.length === 0 ? (
            <div className="py-8 text-center font-['Geist'] text-xs text-[#849495]">
              No active futures positions. Configure leverage and enter a position above.
            </div>
          ) : (
            positions.map((pos) => {
              const isProfit = pos.pnl >= 0;
              return (
                <div key={pos.id} className="p-3 bg-[#191c22]/40 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          pos.side === 'long'
                            ? 'bg-[#05e777]/20 text-[#05e777]'
                            : 'bg-[#ff3b30]/20 text-[#ff3b30]'
                        }`}
                      >
                        {pos.side} {pos.leverage}x
                      </span>
                      <span className="font-['Space_Grotesk'] text-xs font-bold text-[#e1e2eb]">
                        {pos.pair}
                      </span>
                      <span className="font-['JetBrains_Mono'] text-[9px] text-[#849495]">
                        {pos.marginType}
                      </span>
                    </div>

                    <button
                      onClick={() => onClosePosition(pos.id)}
                      className="px-2 py-0.5 rounded bg-[#272a31] text-[#ffb4ab] text-[10px] hover:bg-[#93000a] hover:text-white transition-colors"
                    >
                      Close Position
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1 font-['JetBrains_Mono'] text-[10px]">
                    <div>
                      <div className="text-[#849495]">Entry Price</div>
                      <div className="text-[#e1e2eb] tabular-nums">${pos.entryPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[#849495]">Mark Price</div>
                      <div className="text-[#e1e2eb] tabular-nums">${pos.markPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[#849495]">Liq. Price</div>
                      <div className="text-[#ff3b30] tabular-nums">${pos.liqPrice.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#849495]">PnL (ROE%)</div>
                      <div
                        className={`font-bold tabular-nums ${
                          isProfit ? 'text-[#05e777]' : 'text-[#ff3b30]'
                        }`}
                      >
                        {isProfit ? '+' : ''}${pos.pnl.toFixed(2)} ({isProfit ? '+' : ''}
                        {pos.roe.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
