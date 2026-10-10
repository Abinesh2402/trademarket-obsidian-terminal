import React, { useState, useEffect } from 'react';
import { MarketPair, Order, Position, AssetBalance, TradeNotification } from './types/crypto';
import {
  INITIAL_PAIRS,
  INITIAL_ORDERS,
  INITIAL_POSITIONS,
  INITIAL_ASSETS,
  INITIAL_NOTIFICATIONS,
  generateOrderBook,
} from './data/mockMarketData';
import { TopAppBar } from './components/TopAppBar';
import { GlobalTickerRibbon } from './components/GlobalTickerRibbon';
import { BottomNavBar } from './components/BottomNavBar';
import { MarketsScreen } from './components/MarketsScreen';
import { TradeScreen } from './components/TradeScreen';
import { FuturesScreen } from './components/FuturesScreen';
import { OrdersScreen } from './components/OrdersScreen';
import { AssetsScreen } from './components/AssetsScreen';
import { FastSwapModal } from './components/FastSwapModal';
import { PairSelectorModal } from './components/PairSelectorModal';
import { NotificationsModal } from './components/NotificationsModal';
import { FilterModal } from './components/FilterModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'markets' | 'trade' | 'futures' | 'orders' | 'assets'>('markets');
  const [pairs, setPairs] = useState<MarketPair[]>(INITIAL_PAIRS);
  const [selectedPair, setSelectedPair] = useState<MarketPair>(INITIAL_PAIRS[0]); // BTC/USDT default
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);
  const [assets, setAssets] = useState<AssetBalance[]>(INITIAL_ASSETS);
  const [notifications, setNotifications] = useState<TradeNotification[]>(INITIAL_NOTIFICATIONS);

  // Modals state
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isPairSelectorOpen, setIsPairSelectorOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Order Book state for selected pair
  const [orderBook, setOrderBook] = useState(() =>
    generateOrderBook(INITIAL_PAIRS[0].price, 0.5)
  );

  // Balances mapping
  const balancesMap: { [symbol: string]: number } = assets.reduce(
    (acc, curr) => ({ ...acc, [curr.symbol]: curr.amount }),
    {}
  );
  const userUsdtBalance = balancesMap['USDT'] || 0;
  const userCryptoBalance = balancesMap[selectedPair.baseAsset] || 0;

  // Real-time market tick simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPairs((prev) =>
        prev.map((p) => {
          // slight random jitter (-0.05% to +0.05%)
          const changeFactor = 1 + (Math.random() * 0.001 - 0.0005);
          const newPrice = +(p.price * changeFactor).toFixed(p.price < 1 ? 4 : 2);
          const newHigh = Math.max(p.high24h, newPrice);
          const newLow = Math.min(p.low24h, newPrice);
          return {
            ...p,
            price: newPrice,
            high24h: newHigh,
            low24h: newLow,
          };
        })
      );
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // Update selected pair whenever pairs array updates
  useEffect(() => {
    const found = pairs.find((p) => p.id === selectedPair.id);
    if (found) {
      setSelectedPair(found);
      setOrderBook(generateOrderBook(found.price, 0.5));
    }
  }, [pairs, selectedPair.id]);

  // Favorite toggle handler
  const handleToggleFavorite = (pairId: string) => {
    setPairs((prev) =>
      prev.map((p) => (p.id === pairId ? { ...p, isFavorite: !p.isFavorite } : p))
    );
  };

  // Pair selection handler
  const handleSelectPair = (pair: MarketPair) => {
    setSelectedPair(pair);
    setOrderBook(generateOrderBook(pair.price, 0.5));
    setCurrentTab('trade');
  };

  // Place Order handler
  const handlePlaceOrder = (newOrderData: Omit<Order, 'id' | 'timestamp' | 'status' | 'filled'>) => {
    const newOrder: Order = {
      ...newOrderData,
      id: `ord-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      status: 'open',
      filled: 0,
    };

    // Deduct balance
    if (newOrder.side === 'buy') {
      const cost = newOrder.price * newOrder.amount;
      setAssets((prev) =>
        prev.map((a) => (a.symbol === 'USDT' ? { ...a, amount: a.amount - cost } : a))
      );
    } else {
      setAssets((prev) =>
        prev.map((a) =>
          a.symbol === selectedPair.baseAsset ? { ...a, amount: a.amount - newOrder.amount } : a
        )
      );
    }

    setOrders((prev) => [newOrder, ...prev]);

    // Add notification
    const notif: TradeNotification = {
      id: `notif-${Date.now()}`,
      title: 'Order Placed',
      message: `Limit ${newOrder.side.toUpperCase()} ${newOrder.amount} ${selectedPair.baseAsset} placed at $${newOrder.price.toFixed(2)}.`,
      time: 'Just now',
      type: 'order',
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Cancel Order handler
  const handleCancelOrder = (orderId: string) => {
    const orderToCancel = orders.find((o) => o.id === orderId);
    if (!orderToCancel || orderToCancel.status !== 'open') return;

    // Refund balance
    if (orderToCancel.side === 'buy') {
      const refund = orderToCancel.price * (orderToCancel.amount - orderToCancel.filled);
      setAssets((prev) =>
        prev.map((a) => (a.symbol === 'USDT' ? { ...a, amount: a.amount + refund } : a))
      );
    } else {
      const refundCrypto = orderToCancel.amount - orderToCancel.filled;
      const baseSym = orderToCancel.pair.split('/')[0];
      setAssets((prev) =>
        prev.map((a) => (a.symbol === baseSym ? { ...a, amount: a.amount + refundCrypto } : a))
      );
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'canceled' } : o))
    );
  };

  // Cancel All Orders
  const handleCancelAllOrders = () => {
    orders.forEach((o) => {
      if (o.status === 'open') {
        handleCancelOrder(o.id);
      }
    });
  };

  // Open Futures Position
  const handleOpenPosition = (posData: Omit<Position, 'id' | 'pnl' | 'roe'>) => {
    const newPos: Position = {
      ...posData,
      id: `pos-${Date.now().toString().slice(-4)}`,
      pnl: 0,
      roe: 0,
    };

    setAssets((prev) =>
      prev.map((a) =>
        a.symbol === 'USDT' ? { ...a, amount: Math.max(0, a.amount - newPos.margin) } : a
      )
    );
    setPositions((prev) => [newPos, ...prev]);
  };

  // Close Futures Position
  const handleClosePosition = (posId: string) => {
    const pos = positions.find((p) => p.id === posId);
    if (!pos) return;

    setAssets((prev) =>
      prev.map((a) =>
        a.symbol === 'USDT' ? { ...a, amount: a.amount + pos.margin + pos.pnl } : a
      )
    );
    setPositions((prev) => prev.filter((p) => p.id !== posId));
  };

  // Instant Fast Swap Execution
  const handleFastSwap = (
    fromAsset: string,
    toAsset: string,
    fromAmount: number,
    toAmount: number
  ) => {
    setAssets((prev) => {
      let updated = [...prev];
      const fromObj = updated.find((a) => a.symbol === fromAsset);
      const toObj = updated.find((a) => a.symbol === toAsset);

      if (fromObj) {
        fromObj.amount = Math.max(0, fromObj.amount - fromAmount);
      }
      if (toObj) {
        toObj.amount += toAmount;
      } else {
        updated.push({
          symbol: toAsset,
          name: toAsset,
          amount: toAmount,
          inOrders: 0,
          usdValue: toAmount,
          change24h: 0,
          icon: '🪙',
        });
      }

      // Re-calculate usd values
      return updated.map((item) => {
        const pair = pairs.find((p) => p.baseAsset === item.symbol && p.quoteAsset === 'USDT');
        const price = item.symbol === 'USDT' ? 1 : pair ? pair.price : 1;
        return { ...item, usdValue: item.amount * price };
      });
    });

    const notif: TradeNotification = {
      id: `notif-${Date.now()}`,
      title: 'Fast Swap Executed',
      message: `Swapped ${fromAmount} ${fromAsset} for ${toAmount.toFixed(4)} ${toAsset} at guaranteed 0% slippage.`,
      time: 'Just now',
      type: 'order',
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Simulated Deposit
  const handleDeposit = (symbol: string, amount: number) => {
    setAssets((prev) =>
      prev.map((a) => (a.symbol === symbol ? { ...a, amount: a.amount + amount } : a))
    );
  };

  // Filter application
  const handleApplyFilter = (filters: {
    minVolume: number;
    onlyFavorites: boolean;
    sortDirection: 'desc' | 'asc';
  }) => {
    setPairs((prev) => {
      let copy = [...prev];
      if (filters.onlyFavorites) {
        copy = copy.filter((p) => p.isFavorite);
      }
      if (filters.sortDirection === 'desc') {
        copy.sort((a, b) => b.priceChange24h - a.priceChange24h);
      } else {
        copy.sort((a, b) => a.priceChange24h - b.priceChange24h);
      }
      return copy;
    });
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const openOrdersCount = orders.filter((o) => o.status === 'open').length;

  return (
    <div className="min-h-screen bg-[#10131a] text-[#e1e2eb] font-['Geist'] selection:bg-[#00f0ff] selection:text-[#0b0e14]">
      {/* Top App Bar & Navigation Anchor */}
      <TopAppBar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedPair={selectedPair}
        onOpenPairSelector={() => setIsPairSelectorOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadCount={unreadNotificationsCount}
      />

      {/* Global Market Sentiment & Ticker Header Banner (visible on Markets and desktop) */}
      {currentTab === 'markets' && <GlobalTickerRibbon />}

      {/* Main Screen Router */}
      {currentTab === 'markets' && (
        <MarketsScreen
          pairs={pairs}
          onSelectPair={handleSelectPair}
          onToggleFavorite={handleToggleFavorite}
          onOpenConvertModal={() => setIsConvertOpen(true)}
          onOpenFilterModal={() => setIsFilterOpen(true)}
        />
      )}

      {currentTab === 'trade' && (
        <TradeScreen
          selectedPair={selectedPair}
          orders={orders}
          onPlaceOrder={handlePlaceOrder}
          onCancelOrder={handleCancelOrder}
          onCancelAllOrders={handleCancelAllOrders}
          userUsdtBalance={userUsdtBalance}
          userCryptoBalance={userCryptoBalance}
          orderBook={orderBook}
        />
      )}

      {currentTab === 'futures' && (
        <FuturesScreen
          selectedPair={selectedPair}
          positions={positions}
          onOpenPosition={handleOpenPosition}
          onClosePosition={handleClosePosition}
          userUsdtBalance={userUsdtBalance}
        />
      )}

      {currentTab === 'orders' && (
        <OrdersScreen
          orders={orders}
          onCancelOrder={handleCancelOrder}
          onCancelAllOrders={handleCancelAllOrders}
        />
      )}

      {currentTab === 'assets' && (
        <AssetsScreen
          assets={assets}
          onDeposit={handleDeposit}
          onOpenConvertModal={() => setIsConvertOpen(true)}
        />
      )}

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openOrdersCount={openOrdersCount}
      />

      {/* Modals */}
      <FastSwapModal
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        pairs={pairs}
        balances={balancesMap}
        onSwap={handleFastSwap}
      />

      <PairSelectorModal
        isOpen={isPairSelectorOpen}
        onClose={() => setIsPairSelectorOpen(false)}
        pairs={pairs}
        onSelectPair={handleSelectPair}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
      />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilter}
      />
    </div>
  );
}
