import React, { useState } from 'react';
import { MarketPair } from '../types/crypto';

interface FastSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairs: MarketPair[];
  balances: { [symbol: string]: number };
  onSwap: (fromAsset: string, toAsset: string, fromAmount: number, toAmount: number) => void;
}

export const FastSwapModal: React.FC<FastSwapModalProps> = ({
  isOpen,
  onClose,
  pairs,
  balances,
  onSwap,
}) => {
  const [fromAsset, setFromAsset] = useState<string>('USDT');
  const [toAsset, setToAsset] = useState<string>('BTC');
  const [fromAmount, setFromAmount] = useState<string>('1000');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const supportedAssets = ['USDT', 'BTC', 'ETH', 'SOL', 'SUI', 'AVAX'];

  // Calculate rate
  const getAssetPriceInUsd = (asset: string) => {
    if (asset === 'USDT') return 1;
    const pair = pairs.find((p) => p.baseAsset === asset && p.quoteAsset === 'USDT');
    return pair ? pair.price : 1;
  };

  const fromPrice = getAssetPriceInUsd(fromAsset);
  const toPrice = getAssetPriceInUsd(toAsset);

  const numFromAmount = parseFloat(fromAmount) || 0;
  const toAmount = toPrice > 0 ? (numFromAmount * fromPrice) / toPrice : 0;
  const exchangeRate = toPrice > 0 ? fromPrice / toPrice : 0;

  const currentFromBalance = balances[fromAsset] || 0;

  const handleExecuteSwap = () => {
    if (numFromAmount <= 0) return;
    if (numFromAmount > currentFromBalance) return;

    onSwap(fromAsset, toAsset, numFromAmount, toAmount);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  const handleFlipAssets = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-[#191c22] border border-[#3b494b]/60 rounded-xl p-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-[#3b494b]/30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff]">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
            </div>
            <div>
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#e1e2eb]">
                Instant Fast Swap
              </h3>
              <p className="font-['JetBrains_Mono'] text-[9px] text-[#00f0ff]">
                Zero Slippage · Guaranteed Execution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-[#272a31] text-[#849495] hover:text-[#e1e2eb] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {isSuccess ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#05e777]/20 border border-[#05e777] flex items-center justify-center text-[#05e777] text-2xl">
              ✓
            </div>
            <div className="font-['Space_Grotesk'] text-lg font-bold text-[#e1e2eb]">
              Swap Completed!
            </div>
            <div className="font-['JetBrains_Mono'] text-xs text-[#b9cacb]">
              Received {toAmount.toFixed(4)} {toAsset}
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {/* From Asset Box */}
            <div className="bg-[#10131a] p-3 rounded-lg border border-[#3b494b]/30">
              <div className="flex justify-between items-center text-xs font-['Geist'] text-[#b9cacb] mb-1">
                <span>You Pay</span>
                <span className="font-['JetBrains_Mono'] text-[10px]">
                  Avail:{' '}
                  {currentFromBalance.toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}{' '}
                  {fromAsset}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent font-['JetBrains_Mono'] text-lg text-[#e1e2eb] focus:outline-none tabular-nums"
                />

                <select
                  value={fromAsset}
                  onChange={(e) => setFromAsset(e.target.value)}
                  className="bg-[#272a31] border border-[#3b494b] text-[#e1e2eb] rounded px-2.5 py-1 font-['JetBrains_Mono'] text-xs focus:outline-none"
                >
                  {supportedAssets.map((asset) => (
                    <option key={asset} value={asset}>
                      {asset}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Invert Swap Button */}
            <div className="flex justify-center -my-1">
              <button
                onClick={handleFlipAssets}
                className="w-8 h-8 rounded-full bg-[#272a31] border border-[#3b494b] hover:border-[#00f0ff] text-[#b9cacb] hover:text-[#00f0ff] flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">swap_vert</span>
              </button>
            </div>

            {/* To Asset Box */}
            <div className="bg-[#10131a] p-3 rounded-lg border border-[#3b494b]/30">
              <div className="flex justify-between items-center text-xs font-['Geist'] text-[#b9cacb] mb-1">
                <span>You Receive (Est.)</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#05e777]">
                  No fees applied
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="font-['JetBrains_Mono'] text-lg text-[#05e777] font-semibold tabular-nums">
                  {toAmount.toFixed(6)}
                </div>

                <select
                  value={toAsset}
                  onChange={(e) => setToAsset(e.target.value)}
                  className="bg-[#272a31] border border-[#3b494b] text-[#e1e2eb] rounded px-2.5 py-1 font-['JetBrains_Mono'] text-xs focus:outline-none"
                >
                  {supportedAssets.map((asset) => (
                    <option key={asset} value={asset}>
                      {asset}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conversion Details */}
            <div className="p-2.5 bg-[#10131a]/60 rounded border border-[#3b494b]/20 font-['JetBrains_Mono'] text-[10px] space-y-1 text-[#b9cacb]">
              <div className="flex justify-between">
                <span>Rate</span>
                <span>
                  1 {fromAsset} = {exchangeRate.toFixed(6)} {toAsset}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Slippage Guarantee</span>
                <span className="text-[#05e777]">0.00% Locked</span>
              </div>
              <div className="flex justify-between">
                <span>Settlement</span>
                <span className="text-[#00f0ff]">Instant On-Ledger</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleExecuteSwap}
              disabled={numFromAmount <= 0 || numFromAmount > currentFromBalance}
              className="w-full py-2.5 bg-[#00f0ff] text-[#0b0e14] font-['Space_Grotesk'] text-sm font-bold rounded-lg hover:bg-[#7df4ff] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.99]"
            >
              {numFromAmount > currentFromBalance
                ? `Insufficient ${fromAsset}`
                : `Confirm Swap to ${toAsset}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
