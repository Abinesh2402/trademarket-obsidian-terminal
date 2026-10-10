import React, { useState } from 'react';
import { MarketPair, Order, OrderBookRow } from '../types/crypto';

interface TradeScreenProps {
  selectedPair: MarketPair;
  orders: Order[];
  onPlaceOrder: (order: Omit<Order, 'id' | 'timestamp' | 'status' | 'filled'>) => void;
  onCancelOrder: (orderId: string) => void;
  onCancelAllOrders: () => void;
  userUsdtBalance: number;
  userCryptoBalance: number;
  orderBook: { asks: OrderBookRow[]; bids: OrderBookRow[] };
}

export const TradeScreen: React.FC<TradeScreenProps> = ({
  selectedPair,
  orders,
  onPlaceOrder,
  onCancelOrder,
  onCancelAllOrders,
  userUsdtBalance,
  userCryptoBalance,
  orderBook,
}) => {
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'Limit' | 'Market' | 'Stop-Limit'>('Limit');
  const [priceInput, setPriceInput] = useState<string>(selectedPair.price.toFixed(2));
  const [amountInput, setAmountInput] = useState<string>('0.10');
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(50);
  const [timeframe, setTimeframe] = useState<'1m' | '15m' | '1h' | '4h' | '1D'>('15m');
  const [trayTab, setTrayTab] = useState<'orders' | 'trades' | 'funds'>('orders');
  const [stepSize, setStepSize] = useState<string>('0.1');
  const [showOrderTypeMenu, setShowOrderTypeMenu] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Filter orders for the selected pair
  const pairOrders = orders.filter((o) => o.pair === selectedPair.symbol && o.status === 'open');

  // Compute estimated value
  const numPrice = parseFloat(priceInput) || selectedPair.price;
  const numAmount = parseFloat(amountInput) || 0;
  const estValue = numPrice * numAmount;

  // Max balance available for current side
  const maxAvailableCrypto = userCryptoBalance;
  const maxAvailableUsdt = userUsdtBalance;
  const maxCanBuyCrypto = numPrice > 0 ? maxAvailableUsdt / numPrice : 0;

  // Price adjuster buttons
  const handlePriceStep = (delta: number) => {
    const current = parseFloat(priceInput) || selectedPair.price;
    const updated = Math.max(0.01, current + delta);
    setPriceInput(updated.toFixed(2));
  };

  // Quick BBO (Best Bid / Offer)
  const handleBBO = () => {
    if (tradeSide === 'buy') {
      // Best ask
      if (orderBook.asks.length > 0) {
        setPriceInput(orderBook.asks[orderBook.asks.length - 1].price.toFixed(2));
      }
    } else {
      // Best bid
      if (orderBook.bids.length > 0) {
        setPriceInput(orderBook.bids[0].price.toFixed(2));
      }
    }
  };

  // Percentage selector handler
  const handlePercentageClick = (pct: number) => {
    setSelectedPercentage(pct);
    if (tradeSide === 'buy') {
      const targetUsdt = (maxAvailableUsdt * pct) / 100;
      const targetCrypto = numPrice > 0 ? targetUsdt / numPrice : 0;
      setAmountInput(targetCrypto.toFixed(3));
    } else {
      const targetCrypto = (maxAvailableCrypto * pct) / 100;
      setAmountInput(targetCrypto.toFixed(3));
    }
  };

  // Submit order
  const handleExecuteTrade = () => {
    if (numAmount <= 0) {
      triggerToast('Please enter a valid amount');
      return;
    }

    if (tradeSide === 'buy' && estValue > userUsdtBalance) {
      triggerToast('Insufficient USDT balance');
      return;
    }

    if (tradeSide === 'sell' && numAmount > userCryptoBalance) {
      triggerToast(`Insufficient ${selectedPair.baseAsset} balance`);
      return;
    }

    onPlaceOrder({
      pair: selectedPair.symbol,
      side: tradeSide,
      type: orderType,
      price: orderType === 'Market' ? selectedPair.price : numPrice,
      amount: numAmount,
      triggerCondition: 'None',
    });

    triggerToast(
      `${tradeSide.toUpperCase()} ${numAmount} ${selectedPair.baseAsset} submitted successfully`
    );
  };

  const triggerToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3200);
  };

  return (
    <div className="w-full max-w-[500px] md:max-w-4xl mx-auto min-h-screen bg-[#10131a] flex flex-col relative pb-20">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#1d2026] border border-[#00f0ff] px-4 py-2 rounded-lg text-xs font-['Geist'] text-[#00f0ff] shadow-lg flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Top Market Metrics Ribbon */}
      <section className="px-3 py-2 bg-[#191c22] border-b border-[#3b494b]/30 grid grid-cols-12 gap-2 items-center">
        <div className="col-span-6 flex flex-col justify-center">
          <div className="flex items-baseline gap-1.5">
            <span className="font-['JetBrains_Mono'] text-[20px] text-[#7dffa2] font-bold tracking-tight tabular-nums">
              ${selectedPair.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1 font-['JetBrains_Mono'] text-[11px] text-[#00e475] tabular-nums">
            <span>
              {selectedPair.priceChange24h >= 0 ? '+' : ''}$
              {((selectedPair.price * selectedPair.priceChange24h) / 100).toFixed(2)}
            </span>
            <span>
              ({selectedPair.priceChange24h >= 0 ? '+' : ''}
              {selectedPair.priceChange24h.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="col-span-6 grid grid-cols-3 gap-1 font-['JetBrains_Mono'] text-[9px] text-right">
          <div className="flex flex-col">
            <span className="text-[#b9cacb]">24h High</span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#e1e2eb] tabular-nums font-medium">
              ${selectedPair.high24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#b9cacb]">24h Low</span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#e1e2eb] tabular-nums font-medium">
              ${selectedPair.low24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#b9cacb]">24h Vol</span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#e1e2eb] tabular-nums font-medium">
              {selectedPair.volume24hBase}
            </span>
          </div>
        </div>
      </section>

      {/* Candlestick Chart Panel */}
      <section className="bg-[#0b0e14] border-b border-[#3b494b]/30 flex flex-col">
        {/* Timeframe and Indicators Selector */}
        <div className="flex items-center justify-between px-3 py-1 border-b border-[#3b494b]/20 bg-[#10131a]">
          <div className="flex items-center space-x-1">
            {(['1m', '15m', '1h', '4h', '1D'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 rounded font-['JetBrains_Mono'] text-[9px] transition-colors ${
                  timeframe === tf
                    ? 'text-[#00f0ff] bg-[#272a31] border-b border-[#00f0ff] font-semibold'
                    : 'text-[#b9cacb] hover:text-[#e1e2eb]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 font-['JetBrains_Mono'] text-[9px] text-[#849495]">
            <span className="text-[#00f0ff]/80">
              EMA(7): {(selectedPair.price * 0.997).toFixed(1)}
            </span>
            <span className="text-[#7dffa2]/80 hidden sm:inline">
              MA(25): {(selectedPair.price * 0.993).toFixed(1)}
            </span>
            <button
              aria-label="Chart Settings"
              className="p-0.5 rounded hover:bg-[#1d2026] text-[#b9cacb]"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
            </button>
          </div>
        </div>

        {/* Candlestick Graphic Container (Exact SVG from mockup) */}
        <div className="w-full h-40 px-3 pt-2 relative overflow-hidden flex flex-col justify-between">
          <svg className="w-full h-28" preserveAspectRatio="none" viewBox="0 0 380 110">
            {/* Horizontal Grid Lines */}
            <line opacity="0.4" stroke="#3b494b" strokeDasharray="3,3" strokeWidth="0.5" x1="0" x2="380" y1="20" y2="20" />
            <line opacity="0.4" stroke="#3b494b" strokeDasharray="3,3" strokeWidth="0.5" x1="0" x2="380" y1="55" y2="55" />
            <line opacity="0.4" stroke="#3b494b" strokeDasharray="3,3" strokeWidth="0.5" x1="0" x2="380" y1="90" y2="90" />

            {/* EMA Overlay Curves */}
            <path d="M 10 75 Q 70 85 130 65 T 250 40 T 370 28" fill="none" opacity="0.8" stroke="#00f0ff" strokeWidth="1.2" />
            <path d="M 10 82 Q 70 78 130 72 T 250 55 T 370 38" fill="none" opacity="0.7" stroke="#7dffa2" strokeDasharray="2,2" strokeWidth="1" />

            {/* Candle series (14 precise candles matching Screen 2) */}
            {/* C1 (Bear) */}
            <line stroke="#ffb4ab" strokeWidth="1" x1="20" x2="20" y1="65" y2="85" />
            <rect fill="#93000a" height="12" rx="0.5" width="6" x="17" y="70" />

            {/* C2 (Bull) */}
            <line stroke="#05e777" strokeWidth="1" x1="44" x2="44" y1="62" y2="80" />
            <rect fill="#00622e" height="11" rx="0.5" width="6" x="41" y="66" />

            {/* C3 (Bull) */}
            <line stroke="#05e777" strokeWidth="1" x1="68" x2="68" y1="58" y2="76" />
            <rect fill="#00622e" height="13" rx="0.5" width="6" x="65" y="60" />

            {/* C4 (Bear pullback) */}
            <line stroke="#ffb4ab" strokeWidth="1" x1="92" x2="92" y1="56" y2="74" />
            <rect fill="#93000a" height="8" rx="0.5" width="6" x="89" y="62" />

            {/* C5 (Bull) */}
            <line stroke="#05e777" strokeWidth="1" x1="116" x2="116" y1="50" y2="70" />
            <rect fill="#00622e" height="14" rx="0.5" width="6" x="113" y="52" />

            {/* C6 (Bull) */}
            <line stroke="#05e777" strokeWidth="1" x1="140" x2="140" y1="45" y2="65" />
            <rect fill="#00622e" height="15" rx="0.5" width="6" x="137" y="47" />

            {/* C7 (Doji) */}
            <line stroke="#849495" strokeWidth="1" x1="164" x2="164" y1="42" y2="58" />
            <rect fill="#849495" height="2" rx="0.5" width="6" x="161" y="49" />

            {/* C8 (Bull strong) */}
            <line stroke="#05e777" strokeWidth="1" x1="188" x2="188" y1="36" y2="54" />
            <rect fill="#00622e" height="14" rx="0.5" width="6" x="185" y="38" />

            {/* C9 (Bear) */}
            <line stroke="#ffb4ab" strokeWidth="1" x1="212" x2="212" y1="34" y2="52" />
            <rect fill="#93000a" height="9" rx="0.5" width="6" x="209" y="38" />

            {/* C10 (Bull) */}
            <line stroke="#05e777" strokeWidth="1" x1="236" x2="236" y1="28" y2="48" />
            <rect fill="#00622e" height="15" rx="0.5" width="6" x="233" y="30" />

            {/* C11 (Bull) */}
            <line stroke="#05e777" strokeWidth="1" x1="260" x2="260" y1="25" y2="42" />
            <rect fill="#00622e" height="13" rx="0.5" width="6" x="257" y="27" />

            {/* C12 (Bear) */}
            <line stroke="#ffb4ab" strokeWidth="1" x1="284" x2="284" y1="26" y2="44" />
            <rect fill="#93000a" height="9" rx="0.5" width="6" x="281" y="29" />

            {/* C13 (Bull break) */}
            <line stroke="#05e777" strokeWidth="1" x1="308" x2="308" y1="18" y2="38" />
            <rect fill="#00622e" height="16" rx="0.5" width="6" x="305" y="20" />

            {/* C14 (Bull live current) */}
            <line stroke="#05e777" strokeWidth="1" x1="332" x2="332" y1="14" y2="34" />
            <rect fill="#00622e" height="14" rx="0.5" width="6" x="329" y="16" />

            {/* Live Price Line Indicator */}
            <line opacity="0.9" stroke="#05e777" strokeDasharray="2,2" strokeWidth="1" x1="0" x2="380" y1="16" y2="16" />
            <rect fill="#05e777" height="12" rx="1" width="52" x="328" y="10" />
            <text fill="#00210b" fontFamily="JetBrains Mono" fontSize="7" fontWeight="700" x="331" y="19">
              {selectedPair.price.toFixed(1)}
            </text>
          </svg>

          {/* Volume Bar Indicator */}
          <div className="h-6 w-full flex items-end gap-1.5 opacity-60 pb-1 border-t border-[#3b494b]/10">
            <div className="w-1.5 h-2 bg-[#93000a]" />
            <div className="w-1.5 h-3 bg-[#05e777]" />
            <div className="w-1.5 h-4 bg-[#05e777]" />
            <div className="w-1.5 h-1.5 bg-[#93000a]" />
            <div className="w-1.5 h-3 bg-[#05e777]" />
            <div className="w-1.5 h-5 bg-[#05e777]" />
            <div className="w-1.5 h-1 bg-[#849495]" />
            <div className="w-1.5 h-4 bg-[#05e777]" />
            <div className="w-1.5 h-2 bg-[#93000a]" />
            <div className="w-1.5 h-5 bg-[#05e777]" />
            <div className="w-1.5 h-3.5 bg-[#05e777]" />
            <div className="w-1.5 h-2 bg-[#93000a]" />
            <div className="w-1.5 h-5.5 bg-[#05e777]" />
            <div className="w-1.5 h-4.5 bg-[#05e777]" />
          </div>
        </div>
      </section>

      {/* Split Trading Interface (Order Book & Execution Form) */}
      <main className="grid grid-cols-12 gap-2 px-3 py-2 bg-[#10131a] flex-grow">
        {/* Left Column: Live Order Book (5 Cols) */}
        <section className="col-span-5 flex flex-col justify-between bg-[#0b0e14] border border-[#3b494b]/20 rounded p-1.5">
          <div>
            {/* Order Book Table Header */}
            <div className="flex justify-between items-center font-['JetBrains_Mono'] text-[9px] text-[#b9cacb] pb-1 border-b border-[#3b494b]/20">
              <span>Price({selectedPair.quoteAsset})</span>
              <span>Qty({selectedPair.baseAsset})</span>
            </div>

            {/* Asks (Sells - Crimson/Red) */}
            <div className="flex flex-col space-y-0.5 py-1">
              {orderBook.asks.map((ask, idx) => (
                <div
                  key={`ask-${idx}`}
                  onClick={() => setPriceInput(ask.price.toFixed(2))}
                  className="relative flex justify-between items-center font-['JetBrains_Mono'] text-[11px] leading-tight h-4 cursor-pointer hover:bg-[#272a31]/50 px-0.5 transition-colors"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-[#93000a]/20 rounded-r"
                    style={{ width: `${ask.depthPercent}%` }}
                  />
                  <span className="text-[#ffb4ab] font-medium z-10 tabular-nums">
                    {ask.price.toFixed(2)}
                  </span>
                  <span className="text-[#b9cacb] z-10 tabular-nums text-[10px]">
                    {ask.qty.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>

            {/* Spread Indicator & Mid Price */}
            <div className="py-1 px-1 my-0.5 bg-[#1d2026] rounded flex flex-col items-center justify-center border-y border-[#3b494b]/30">
              <span className="font-['JetBrains_Mono'] text-[14px] text-[#7dffa2] font-bold leading-none tabular-nums">
                {selectedPair.price.toFixed(2)}
              </span>
              <div className="flex items-center gap-1 font-['JetBrains_Mono'] text-[9px] text-[#b9cacb] mt-0.5">
                <span>Spread</span>
                <span className="text-[#00f0ff] font-semibold">$0.50</span>
              </div>
            </div>

            {/* Bids (Buys - Emerald/Green) */}
            <div className="flex flex-col space-y-0.5 py-1">
              {orderBook.bids.map((bid, idx) => (
                <div
                  key={`bid-${idx}`}
                  onClick={() => setPriceInput(bid.price.toFixed(2))}
                  className="relative flex justify-between items-center font-['JetBrains_Mono'] text-[11px] leading-tight h-4 cursor-pointer hover:bg-[#272a31]/50 px-0.5 transition-colors"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-[#05e777]/20 rounded-r"
                    style={{ width: `${bid.depthPercent}%` }}
                  />
                  <span className="text-[#7dffa2] font-medium z-10 tabular-nums">
                    {bid.price.toFixed(2)}
                  </span>
                  <span className="text-[#b9cacb] z-10 tabular-nums text-[10px]">
                    {bid.qty.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Book Depth / Aggregation selector */}
          <div className="pt-1 border-t border-[#3b494b]/20 flex justify-between items-center font-['JetBrains_Mono'] text-[9px] text-[#849495]">
            <div className="flex items-center gap-0.5">
              <span>Step</span>
              <select
                value={stepSize}
                onChange={(e) => setStepSize(e.target.value)}
                className="bg-transparent text-[#e1e2eb] font-semibold focus:outline-none cursor-pointer"
              >
                <option value="0.1" className="bg-[#191c22]">0.1</option>
                <option value="0.5" className="bg-[#191c22]">0.5</option>
                <option value="1.0" className="bg-[#191c22]">1.0</option>
                <option value="5.0" className="bg-[#191c22]">5.0</option>
              </select>
            </div>
            <span className="material-symbols-outlined text-xs cursor-pointer">unfold_more</span>
          </div>
        </section>

        {/* Right Column: Order Form (7 Cols) */}
        <section className="col-span-7 flex flex-col justify-between bg-[#191c22] border border-[#3b494b]/20 rounded p-2">
          {/* Buy / Sell Segmented Trigger */}
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-[#0b0e14] rounded">
            <button
              onClick={() => setTradeSide('buy')}
              className={`py-1.5 text-center font-['Space_Grotesk'] text-xs font-bold rounded transition-colors active:opacity-85 shadow-sm ${
                tradeSide === 'buy'
                  ? 'bg-[#05e777] text-[#0b0e14]'
                  : 'text-[#b9cacb] hover:text-white'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setTradeSide('sell')}
              className={`py-1.5 text-center font-['Space_Grotesk'] text-xs font-bold rounded transition-colors active:opacity-85 shadow-sm ${
                tradeSide === 'sell'
                  ? 'bg-[#93000a] text-white'
                  : 'text-[#b9cacb] hover:text-white'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Order Type Dropdown */}
          <div className="mt-2 relative">
            <button
              onClick={() => setShowOrderTypeMenu(!showOrderTypeMenu)}
              className="flex items-center justify-between bg-[#1d2026] px-2 py-1.5 rounded w-full border border-[#3b494b]/30 text-left hover:border-[#00f0ff]/40 transition-colors"
            >
              <span className="font-['Geist'] text-[12px] text-[#e1e2eb] font-medium">
                {orderType} Order
              </span>
              <span className="material-symbols-outlined text-sm text-[#b9cacb]">
                expand_more
              </span>
            </button>

            {showOrderTypeMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1d2026] border border-[#3b494b] rounded shadow-xl z-30 py-1">
                {(['Limit', 'Market', 'Stop-Limit'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setOrderType(type);
                      setShowOrderTypeMenu(false);
                    }}
                    className={`w-full text-left px-2 py-1 text-xs font-['Geist'] hover:bg-[#272a31] transition-colors ${
                      orderType === type ? 'text-[#00f0ff] font-semibold' : 'text-[#e1e2eb]'
                    }`}
                  >
                    {type} Order
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input Field: Price */}
          <div className="mt-2 flex flex-col space-y-1">
            <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[9px] text-[#b9cacb]">
              <span>Price</span>
              <button
                onClick={handleBBO}
                className="text-[#00f0ff] hover:underline cursor-pointer font-medium"
              >
                BBO
              </button>
            </div>
            <div className="flex items-center bg-[#0b0e14] border border-[#3b494b]/40 rounded px-2 py-1.5 focus-within:border-[#00f0ff]">
              <button
                onClick={() => handlePriceStep(-0.5)}
                disabled={orderType === 'Market'}
                className="text-[#b9cacb] hover:text-[#00f0ff] active:opacity-85 p-0.5 disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-xs">remove</span>
              </button>
              <input
                type="text"
                disabled={orderType === 'Market'}
                value={orderType === 'Market' ? 'Market Price' : priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="w-full bg-transparent text-center font-['JetBrains_Mono'] text-[14px] text-[#e1e2eb] focus:outline-none px-1 tabular-nums disabled:opacity-50"
              />
              <span className="font-['JetBrains_Mono'] text-[9px] text-[#849495] font-medium mr-1">
                {selectedPair.quoteAsset}
              </span>
              <button
                onClick={() => handlePriceStep(0.5)}
                disabled={orderType === 'Market'}
                className="text-[#b9cacb] hover:text-[#00f0ff] active:opacity-85 p-0.5 disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-xs">add</span>
              </button>
            </div>
          </div>

          {/* Input Field: Amount / Quantity */}
          <div className="mt-2 flex flex-col space-y-1">
            <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[9px] text-[#b9cacb]">
              <span>Amount</span>
              <span className="text-[#849495] tabular-nums">
                Max: {tradeSide === 'buy' ? maxCanBuyCrypto.toFixed(3) : maxAvailableCrypto.toFixed(3)}{' '}
                {selectedPair.baseAsset}
              </span>
            </div>
            <div className="flex items-center bg-[#0b0e14] border border-[#3b494b]/40 rounded px-2 py-1.5 focus-within:border-[#00f0ff]">
              <input
                type="text"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setSelectedPercentage(null);
                }}
                placeholder="0.00"
                className="w-full bg-transparent font-['JetBrains_Mono'] text-[14px] text-[#e1e2eb] focus:outline-none tabular-nums"
              />
              <span className="font-['JetBrains_Mono'] text-[9px] text-[#849495] font-medium">
                {selectedPair.baseAsset}
              </span>
            </div>
          </div>

          {/* Percentage Shortcut Chips */}
          <div className="mt-2 grid grid-cols-4 gap-1">
            {[25, 50, 75, 100].map((pct) => {
              const isSelected = selectedPercentage === pct;
              return (
                <button
                  key={pct}
                  onClick={() => handlePercentageClick(pct)}
                  className={`py-1 rounded font-['JetBrains_Mono'] text-[9px] transition-all active:opacity-85 text-center ${
                    isSelected
                      ? 'bg-[#272a31] border border-[#00f0ff]/80 text-[#00f0ff] font-semibold'
                      : 'bg-[#1d2026] text-[#b9cacb] hover:text-[#00f0ff] hover:border hover:border-[#00f0ff]/40'
                  }`}
                >
                  {pct}%
                </button>
              );
            })}
          </div>

          {/* Available Balance Bar */}
          <div className="mt-2 pt-1 border-t border-[#3b494b]/20 flex flex-col font-['JetBrains_Mono'] text-[9px]">
            <div className="flex justify-between items-center text-[#b9cacb]">
              <span>Avail. Balance:</span>
              <span className="text-[#e1e2eb] font-semibold tabular-nums">
                ${userUsdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                <span className="text-[#849495] font-normal">USDT</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-[#b9cacb] mt-0.5">
              <span>Est. Value:</span>
              <span className="text-[#e1e2eb] tabular-nums">
                {estValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
              </span>
            </div>
          </div>

          {/* Prominent Trade Action Execution Trigger Button */}
          <div className="mt-2.5">
            <button
              onClick={handleExecuteTrade}
              className={`w-full h-10 transition-transform active:scale-[0.99] rounded flex items-center justify-center space-x-1.5 shadow-md ${
                tradeSide === 'buy'
                  ? 'bg-[#05e777] hover:brightness-110 text-[#0b0e14]'
                  : 'bg-[#ff3b30] hover:brightness-110 text-white'
              }`}
            >
              <span className="font-['Space_Grotesk'] text-sm font-bold uppercase tracking-wider">
                {tradeSide === 'buy' ? `Buy ${selectedPair.baseAsset}` : `Sell ${selectedPair.baseAsset}`}
              </span>
            </button>
          </div>
        </section>
      </main>

      {/* Bottom Collapsible Open Orders & Recent Trades Preview Tray */}
      <section className="mt-1 bg-[#0b0e14] border-t border-[#3b494b]/30 flex flex-col">
        {/* Tabs Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#3b494b]/20 bg-[#10131a]">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setTrayTab('orders')}
              className={`font-['Geist'] text-[12px] pb-0.5 transition-colors ${
                trayTab === 'orders'
                  ? 'text-[#00f0ff] font-semibold border-b-2 border-[#00f0ff]'
                  : 'text-[#b9cacb] hover:text-[#e1e2eb]'
              }`}
            >
              Open Orders ({pairOrders.length})
            </button>
            <button
              onClick={() => setTrayTab('trades')}
              className={`font-['Geist'] text-[12px] pb-0.5 transition-colors ${
                trayTab === 'trades'
                  ? 'text-[#00f0ff] font-semibold border-b-2 border-[#00f0ff]'
                  : 'text-[#b9cacb] hover:text-[#e1e2eb]'
              }`}
            >
              Recent Trades
            </button>
            <button
              onClick={() => setTrayTab('funds')}
              className={`font-['Geist'] text-[12px] pb-0.5 transition-colors ${
                trayTab === 'funds'
                  ? 'text-[#00f0ff] font-semibold border-b-2 border-[#00f0ff]'
                  : 'text-[#b9cacb] hover:text-[#e1e2eb]'
              }`}
            >
              Funds
            </button>
          </div>

          {pairOrders.length > 0 && trayTab === 'orders' && (
            <button
              onClick={onCancelAllOrders}
              className="font-['JetBrains_Mono'] text-[9px] text-[#b9cacb] flex items-center gap-0.5 hover:text-[#00f0ff] transition-colors"
            >
              <span>Cancel All</span>
            </button>
          )}
        </div>

        {/* Tab 1: Open Orders */}
        {trayTab === 'orders' && (
          <div>
            {pairOrders.length === 0 ? (
              <div className="py-6 text-center font-['Geist'] text-xs text-[#849495]">
                No open orders for {selectedPair.symbol}. Use the form above to place a limit or market order.
              </div>
            ) : (
              pairOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3 flex flex-col space-y-1.5 bg-[#191c22]/40 border-b border-[#3b494b]/10"
                >
                  <div className="flex justify-between items-center font-['JetBrains_Mono'] text-[9px]">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`px-1 py-0.5 font-bold rounded ${
                          order.side === 'buy'
                            ? 'bg-[#05e777]/20 text-[#05e777]'
                            : 'bg-[#ff3b30]/20 text-[#ff3b30]'
                        }`}
                      >
                        {order.side.toUpperCase()}
                      </span>
                      <span className="font-['Space_Grotesk'] text-xs font-semibold text-[#e1e2eb]">
                        {order.pair}
                      </span>
                      <span className="text-[#849495]">{order.type}</span>
                    </div>

                    <button
                      onClick={() => onCancelOrder(order.id)}
                      className="px-2 py-0.5 rounded bg-[#272a31] text-[#ffb4ab] font-['JetBrains_Mono'] text-[9px] hover:bg-[#93000a] hover:text-white transition-colors active:opacity-85"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-1 font-['JetBrains_Mono'] text-[11px]">
                    <div className="flex flex-col">
                      <span className="font-['JetBrains_Mono'] text-[9px] text-[#b9cacb]">Price</span>
                      <span className="text-[#e1e2eb] tabular-nums">{order.price.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-['JetBrains_Mono'] text-[9px] text-[#b9cacb]">Amount / Filled</span>
                      <span className="text-[#e1e2eb] tabular-nums">
                        {order.amount.toFixed(3)} / {order.filled.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="font-['JetBrains_Mono'] text-[9px] text-[#b9cacb]">Trigger Condition</span>
                      <span className="text-[#e1e2eb]">{order.triggerCondition}</span>
                    </div>
                  </div>

                  {/* Progress bar for fill status */}
                  <div className="w-full bg-[#1d2026] h-1 rounded overflow-hidden mt-1">
                    <div
                      className="bg-[#05e777] h-full"
                      style={{
                        width: `${order.amount > 0 ? (order.filled / order.amount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Recent Trades */}
        {trayTab === 'trades' && (
          <div className="p-3 space-y-1.5 font-['JetBrains_Mono'] text-[11px]">
            <div className="grid grid-cols-3 text-[9px] text-[#849495] pb-1 border-b border-[#3b494b]/20">
              <span>Price (USDT)</span>
              <span className="text-center">Amount ({selectedPair.baseAsset})</span>
              <span className="text-right">Time</span>
            </div>
            {[
              { price: selectedPair.price, amount: 0.142, side: 'buy', time: '14:28:42' },
              { price: +(selectedPair.price - 0.5).toFixed(2), amount: 0.380, side: 'sell', time: '14:28:38' },
              { price: +(selectedPair.price + 1.0).toFixed(2), amount: 0.095, side: 'buy', time: '14:28:15' },
              { price: +(selectedPair.price - 1.5).toFixed(2), amount: 0.820, side: 'buy', time: '14:27:59' },
            ].map((tr, i) => (
              <div key={i} className="grid grid-cols-3 py-0.5">
                <span className={tr.side === 'buy' ? 'text-[#05e777]' : 'text-[#ff3b30]'}>
                  {tr.price.toFixed(2)}
                </span>
                <span className="text-[#e1e2eb] text-center tabular-nums">{tr.amount}</span>
                <span className="text-[#849495] text-right">{tr.time}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Funds */}
        {trayTab === 'funds' && (
          <div className="p-3 space-y-2 font-['JetBrains_Mono'] text-[11px]">
            <div className="flex justify-between items-center py-1 border-b border-[#3b494b]/10">
              <span className="text-[#b9cacb]">USDT Available</span>
              <span className="text-[#e1e2eb] font-semibold tabular-nums">
                ${userUsdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#3b494b]/10">
              <span className="text-[#b9cacb]">{selectedPair.baseAsset} Available</span>
              <span className="text-[#e1e2eb] font-semibold tabular-nums">
                {userCryptoBalance.toFixed(4)} {selectedPair.baseAsset}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#b9cacb]">In Open Orders</span>
              <span className="text-[#00f0ff] font-semibold tabular-nums">
                {pairOrders.reduce((sum, o) => sum + o.price * (o.amount - o.filled), 0).toFixed(2)} USDT
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
