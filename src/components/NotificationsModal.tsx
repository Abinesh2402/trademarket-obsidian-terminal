import React from 'react';
import { TradeNotification } from '../types/crypto';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: TradeNotification[];
  onMarkAllAsRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-[#191c22] border border-[#3b494b]/60 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-3.5 border-b border-[#3b494b]/30 flex items-center justify-between bg-[#10131a]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00f0ff] text-[20px]">notifications</span>
            <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#e1e2eb]">
              Notifications & Alerts
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllAsRead}
              className="text-[10px] font-['Geist'] text-[#00f0ff] hover:underline"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded hover:bg-[#272a31] text-[#849495] hover:text-[#e1e2eb] flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto divide-y divide-[#3b494b]/15 p-2 space-y-1">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-2.5 rounded-lg transition-colors ${
                notif.read ? 'bg-[#10131a]/40' : 'bg-[#272a31]/50 border-l-2 border-[#00f0ff]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-['Geist'] text-xs font-semibold text-[#e1e2eb]">
                  {notif.title}
                </span>
                <span className="font-['JetBrains_Mono'] text-[9px] text-[#849495]">
                  {notif.time}
                </span>
              </div>
              <p className="font-['Geist'] text-[11px] text-[#b9cacb] leading-relaxed">
                {notif.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
