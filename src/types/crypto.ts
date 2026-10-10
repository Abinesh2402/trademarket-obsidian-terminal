export type MarketCategory = 'Watchlist' | 'All' | 'Layer 1' | 'AI & DePIN' | 'DeFi' | 'Top Gainers' | 'Meme';

export interface OrderBookRow {
  price: number;
  qty: number;
  depthPercent: number;
}

export interface MarketPair {
  id: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  name: string;
  price: number;
  priceChange24h: number;
  high24h: number;
  low24h: number;
  volume24hUsd: string;
  volume24hBase: string;
  leverage: string;
  category: MarketCategory;
  isFavorite: boolean;
  sparkline: number[];
  icon: string;
  iconBg: string;
  iconColor: string;
}

export interface Order {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  type: 'Limit' | 'Market' | 'Stop-Limit';
  price: number;
  amount: number;
  filled: number;
  triggerCondition: string;
  timestamp: string;
  status: 'open' | 'filled' | 'canceled';
}

export interface Position {
  id: string;
  pair: string;
  side: 'long' | 'short';
  leverage: number;
  entryPrice: number;
  markPrice: number;
  size: number;
  margin: number;
  marginType: 'Cross' | 'Isolated';
  liqPrice: number;
  pnl: number;
  roe: number;
}

export interface AssetBalance {
  symbol: string;
  name: string;
  amount: number;
  inOrders: number;
  usdValue: number;
  change24h: number;
  icon: string;
}

export interface TradeNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'market' | 'system';
  read: boolean;
}
