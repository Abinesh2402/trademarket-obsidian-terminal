import React, { useState } from 'react';
import { AssetBalance } from '../types/crypto';

interface AssetsScreenProps {
  assets: AssetBalance[];
  onDeposit: (symbol: string, amount: number) => void;
  onOpenConvertModal: () => void;
}

export const AssetsScreen: React.FC<AssetsScreenProps> = ({
  assets,
  onDeposit,
  onOpenConvertModal,
}) => {
  const [selectedAssetForDeposit, setSelectedAssetForDeposit] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('5000');
  const [depositSuccess, setDepositSuccess] = useState(false);

  const totalUsdValue = assets.reduce((sum, a) => sum + a.usdValue, 0);
  const btcAsset = assets.find((a) => a.symbol === 'BTC');
  const btcPrice = btcAsset && btcAsset.amount > 0 ? btcAsset.usdValue / btcAsset.amount : 67420.5;
  const totalBtcEquivalent = btcPrice > 0 ? totalUsdValue / btcPrice : 0;

  const handleDepositSubmit = () => {
    if (!selectedAssetForDeposit) return;
    const num = parseFloat(depositAmount) || 0;
    if (num <= 0) return;

    onDeposit(selectedAssetForDeposit, num);
    setDepositSuccess(true);
    setTimeout(() => {
      setDepositSuccess(false);
      setSelectedAssetForDeposit(null);
    }, 1500);
  };

  return (
    <div className="w-full max-w-[500px] md:max-w-4xl mx-auto min-h-screen bg-[#10131a] flex flex-col relative pb-20">
      {/* Portfolio Card */}
      <div className="p-4 bg-gradient-to-br from-[#191c22] to-[#0b0e14] border-b border-[#3b494b]/30">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#849495] tracking-wider uppercase">
              Total Estimated Balance
            </span>
            <div className="font-['Space_Grotesk'] text-2xl font-bold text-[#e1e2eb] tabular-nums mt-0.5">
              ${totalUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs text-[#849495] font-normal ml-1">USD</span>
            </div>
            <div className="font-['JetBrains_Mono'] text-xs text-[#00f0ff] mt-0.5 tabular-nums">
              ≈ {totalBtcEquivalent.toFixed(4)} BTC
            </div>
          </div>

          <div className="text-right">
            <span className="font-['JetBrains_Mono'] text-[9px] text-[#849495] uppercase">
              24h Profit / Loss
            </span>
            <div className="font-['JetBrains_Mono'] text-xs text-[#05e777] font-bold tabular-nums mt-0.5">
              +$1,842.10 (+4.49%)
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={() => setSelectedAssetForDeposit('USDT')}
            className="py-2 rounded-lg bg-[#00f0ff] text-[#0b0e14] font-['Space_Grotesk'] text-xs font-bold hover:bg-[#7df4ff] transition-colors flex items-center justify-center gap-1 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Deposit</span>
          </button>
          <button
            onClick={() => setSelectedAssetForDeposit('USDT')}
            className="py-2 rounded-lg bg-[#272a31] text-[#e1e2eb] font-['Space_Grotesk'] text-xs font-semibold hover:bg-[#32353c] transition-colors flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
            <span>Withdraw</span>
          </button>
          <button
            onClick={onOpenConvertModal}
            className="py-2 rounded-lg bg-[#272a31] text-[#00f0ff] font-['Space_Grotesk'] text-xs font-semibold hover:bg-[#32353c] transition-colors flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>Fast Swap</span>
          </button>
        </div>
      </div>

      {/* Assets Allocation Breakdown */}
      <div className="p-3 bg-[#0b0e14] border-b border-[#3b494b]/20">
        <div className="flex justify-between text-[10px] font-['Geist'] text-[#849495] mb-1.5">
          <span>Asset Distribution</span>
          <span>{assets.length} Hold Tokens</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#1d2026] overflow-hidden flex">
          {assets.map((asset, idx) => {
            const pct = totalUsdValue > 0 ? (asset.usdValue / totalUsdValue) * 100 : 0;
            const colors = ['#00f0ff', '#f59e0b', '#3b82f6', '#a855f7', '#06b6d4', '#ef4444'];
            return (
              <div
                key={asset.symbol}
                style={{ width: `${pct}%`, backgroundColor: colors[idx % colors.length] }}
                title={`${asset.symbol}: ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>
      </div>

      {/* Assets List */}
      <div className="p-3">
        <h3 className="font-['Space_Grotesk'] text-xs font-bold text-[#b9cacb] uppercase tracking-wider mb-2">
          Asset Balances
        </h3>

        <div className="divide-y divide-[#3b494b]/20 bg-[#191c22] rounded-lg border border-[#3b494b]/30 overflow-hidden">
          {assets.map((asset) => (
            <div key={asset.symbol} className="p-3 flex items-center justify-between hover:bg-[#272a31]/40 transition-colors">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[#272a31] text-white flex items-center justify-center font-bold text-xs">
                  {asset.icon}
                </span>
                <div>
                  <div className="font-['Geist'] text-xs font-bold text-[#e1e2eb]">
                    {asset.symbol}
                  </div>
                  <div className="font-['JetBrains_Mono'] text-[10px] text-[#849495]">
                    {asset.name}
                  </div>
                </div>
              </div>

              <div className="text-right font-['JetBrains_Mono']">
                <div className="text-xs font-semibold text-[#e1e2eb] tabular-nums">
                  {asset.amount.toLocaleString(undefined, {
                    minimumFractionDigits: asset.amount < 1 ? 4 : 2,
                    maximumFractionDigits: 4,
                  })}
                </div>
                <div className="text-[10px] text-[#849495] tabular-nums">
                  ≈ ${asset.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulated Deposit / Top Up Modal */}
      {selectedAssetForDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-[#191c22] border border-[#3b494b] rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#3b494b]/30">
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#e1e2eb]">
                Simulate Deposit ({selectedAssetForDeposit})
              </h3>
              <button
                onClick={() => setSelectedAssetForDeposit(null)}
                className="w-7 h-7 rounded hover:bg-[#272a31] text-[#849495] hover:text-[#e1e2eb] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {depositSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#05e777]/20 border border-[#05e777] flex items-center justify-center mx-auto text-[#05e777]">
                  ✓
                </div>
                <div className="font-['Geist'] text-xs font-semibold text-[#e1e2eb]">
                  Deposit Credited to Ledger!
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-['Geist'] text-[#b9cacb]">
                  Add test liquidity directly to your terminal account:
                </p>

                <div className="flex items-center bg-[#0b0e14] border border-[#3b494b] rounded px-3 py-2">
                  <input
                    type="text"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-transparent font-['JetBrains_Mono'] text-base text-[#e1e2eb] focus:outline-none"
                  />
                  <span className="font-['JetBrains_Mono'] text-xs text-[#00f0ff] font-semibold">
                    {selectedAssetForDeposit}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 font-['JetBrains_Mono'] text-[10px]">
                  {[1000, 5000, 25000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setDepositAmount(v.toString())}
                      className="py-1 rounded bg-[#272a31] text-[#b9cacb] hover:text-white"
                    >
                      +{v}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleDepositSubmit}
                  className="w-full py-2.5 bg-[#00f0ff] text-[#0b0e14] font-['Space_Grotesk'] text-xs font-bold rounded-lg hover:bg-[#7df4ff] transition-colors"
                >
                  Confirm Instant Credit
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
