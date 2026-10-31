import React, { useState } from 'react';
import { Bell, Sparkles, X, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';
import { NotificationPermissionState } from '../types/notification';

interface NotificationPermissionBannerProps {
  permission: NotificationPermissionState;
  onRequestPermission: () => Promise<NotificationPermissionState>;
  onOpenSettings: () => void;
  urgentCount: number;
}

export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({
  permission,
  onRequestPermission,
  onOpenSettings,
  urgentCount,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // If already granted, unsupported, or user dismissed during session
  if (permission === 'granted' || permission === 'unsupported' || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      await onRequestPermission();
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan-500/40 bg-gradient-to-r from-slate-900 via-slate-900/95 to-cyan-950/60 p-3.5 sm:p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white">
                Bật Thông Báo Đẩy Trình Duyệt (Browser Push)
              </span>
              {urgentCount > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 animate-pulse">
                  {urgentCount} mốc sắp tới
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Aufix sẽ tự động gửi thông báo trực tiếp lên màn hình máy tính/điện thoại khi đến hạn đăng kiểm, mốc bảo dưỡng ODO và hạn bảo hiểm xe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto">
          {permission === 'denied' ? (
            <button
              onClick={onOpenSettings}
              className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Xem cách mở lại quyền</span>
            </button>
          ) : (
            <button
              onClick={handleEnable}
              disabled={isRequesting}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isRequesting ? 'Đang kích hoạt...' : 'Bật thông báo ngay'}</span>
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Để sau"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
