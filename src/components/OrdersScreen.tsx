import React, { useState } from 'react';
import { Order } from '../types/crypto';

interface OrdersScreenProps {
  orders: Order[];
  onCancelOrder: (id: string) => void;
  onCancelAllOrders: () => void;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  orders,
  onCancelOrder,
  onCancelAllOrders,
}) => {
  const [activeTab, setActiveTab] = useState<'open' | 'history' | 'trades'>('open');
  const [sideFilter, setSideFilter] = useState<'all' | 'buy' | 'sell'>('all');

  const openOrders = orders.filter((o) => o.status === 'open');
  const historyOrders = orders.filter((o) => o.status !== 'open');

  const filteredOrders = (activeTab === 'open' ? openOrders : historyOrders).filter((o) => {
    if (sideFilter === 'all') return true;
    return o.side === sideFilter;
  });

  return (
    <div className="w-full max-w-[500px] md:max-w-4xl mx-auto min-h-screen bg-[#10131a] flex flex-col relative pb-20">
      {/* Top Header */}
      <div className="p-3 bg-[#191c22] border-b border-[#3b494b]/30 flex items-center justify-between">
        <div>
          <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#e1e2eb]">
            Orders & Execution Ledger
          </h2>
          <p className="font-['JetBrains_Mono'] text-[9px] text-[#849495]">
            Real-time Institutional Execution Center
          </p>
        </div>

        {openOrders.length > 0 && activeTab === 'open' && (
          <button
            onClick={onCancelAllOrders}
            className="px-2.5 py-1 rounded bg-[#272a31] text-[#ffb4ab] text-xs font-['JetBrains_Mono'] hover:bg-[#93000a] hover:text-white transition-colors"
          >
            Cancel All ({openOrders.length})
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between px-3 border-b border-[#3b494b]/20 bg-[#0b0e14]">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('open')}
            className={`py-2.5 text-xs font-['Geist'] transition-colors ${
              activeTab === 'open'
                ? 'text-[#00f0ff] font-semibold border-b-2 border-[#00f0ff]'
                : 'text-[#b9cacb] hover:text-[#e1e2eb]'
            }`}
          >
            Open Orders ({openOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 text-xs font-['Geist'] transition-colors ${
              activeTab === 'history'
                ? 'text-[#00f0ff] font-semibold border-b-2 border-[#00f0ff]'
                : 'text-[#b9cacb] hover:text-[#e1e2eb]'
            }`}
          >
            Order History
          </button>
        </div>

        {/* Side Filter */}
        <div className="flex items-center gap-1 bg-[#191c22] p-0.5 rounded text-[10px] font-['Geist']">
          {(['all', 'buy', 'sell'] as const).map((side) => (
            <button
              key={side}
              onClick={() => setSideFilter(side)}
              className={`px-2 py-0.5 rounded uppercase font-semibold transition-colors ${
                sideFilter === side
                  ? 'bg-[#272a31] text-[#00f0ff]'
                  : 'text-[#849495] hover:text-[#e1e2eb]'
              }`}
            >
              {side}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-grow divide-y divide-[#3b494b]/15">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-xs font-['Geist'] text-[#849495]">
            No orders found in this view.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="p-3.5 bg-[#191c22]/40 hover:bg-[#191c22]/70 transition-colors">
              <div className="flex justify-between items-center mb-1.5 font-['JetBrains_Mono'] text-[10px]">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 font-bold rounded uppercase ${
                      order.side === 'buy'
                        ? 'bg-[#05e777]/20 text-[#05e777]'
                        : 'bg-[#ff3b30]/20 text-[#ff3b30]'
                    }`}
                  >
                    {order.side}
                  </span>
                  <span className="font-['Space_Grotesk'] text-xs font-bold text-[#e1e2eb]">
                    {order.pair}
                  </span>
                  <span className="text-[#849495]">{order.type}</span>
                  <span className="text-[#849495] text-[9px]">{order.timestamp}</span>
                </div>

                {order.status === 'open' && (
                  <button
                    onClick={() => onCancelOrder(order.id)}
                    className="px-2 py-0.5 rounded bg-[#272a31] text-[#ffb4ab] hover:bg-[#93000a] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                )}
                {order.status !== 'open' && (
                  <span className="text-[10px] text-[#849495] capitalize">{order.status}</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 font-['JetBrains_Mono'] text-xs">
                <div>
                  <div className="text-[9px] text-[#849495]">Order Price</div>
                  <div className="text-[#e1e2eb] font-semibold tabular-nums">
                    ${order.price.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-[#849495]">Amount / Filled</div>
                  <div className="text-[#e1e2eb] tabular-nums">
                    {order.amount.toFixed(3)} / {order.filled.toFixed(3)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-[#849495]">Total Value</div>
                  <div className="text-[#00f0ff] font-semibold tabular-nums">
                    ${(order.price * order.amount).toFixed(2)} USDT
                  </div>
                </div>
              </div>

              {order.status === 'open' && (
                <div className="w-full bg-[#1d2026] h-1 rounded overflow-hidden mt-2">
                  <div
                    className="bg-[#05e777] h-full"
                    style={{
                      width: `${order.amount > 0 ? (order.filled / order.amount) * 100 : 0}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
