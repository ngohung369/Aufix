import React, { useState } from 'react';
import {
  Bell,
  X,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  Volume2,
  VolumeX,
  Send,
  Trash2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Sliders,
  History,
} from 'lucide-react';
import {
  NotificationPermissionState,
  NotificationSettings,
  NotificationHistoryItem,
  VehicleAlert,
} from '../types/notification';
import { formatDateVN } from '../utils/formatters';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: NotificationPermissionState;
  settings: NotificationSettings;
  alerts: VehicleAlert[];
  history: NotificationHistoryItem[];
  onRequestPermission: () => Promise<NotificationPermissionState>;
  onUpdateSettings: (settings: Partial<NotificationSettings>) => void;
  onClearHistory: () => void;
  onTriggerTestNotification: () => { success: boolean; reason?: string };
  onTriggerAlertNotification: (alert: VehicleAlert) => { success: boolean; reason?: string };
  onPlayChime: (type?: 'alert' | 'urgent') => void;
  onNavigateToVehicle: (vehicleId: string, tab: 'cockpit' | 'documents' | 'maintenance' | 'expenses') => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  permission,
  settings,
  alerts,
  history,
  onRequestPermission,
  onUpdateSettings,
  onClearHistory,
  onTriggerTestNotification,
  onTriggerAlertNotification,
  onPlayChime,
  onNavigateToVehicle,
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'settings' | 'history'>('alerts');
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestPush = () => {
    const res = onTriggerTestNotification();
    if (res.success) {
      setTestResult('Đã gửi thông báo đẩy thành công lên màn hình!');
    } else {
      if (res.reason === 'permission_denied') {
        setTestResult('Chưa cấp quyền thông báo. Vui lòng bấm [Cấp quyền thông báo] trước!');
      } else if (res.reason === 'unsupported') {
        setTestResult('Trình duyệt hiện tại không hỗ trợ Web Notification API.');
      } else {
        setTestResult('Không thể gửi thông báo. Hãy kiểm tra cài đặt trình duyệt.');
      }
    }
    setTimeout(() => setTestResult(null), 4000);
  };

  const handlePushSingleAlert = (alert: VehicleAlert) => {
    const res = onTriggerAlertNotification(alert);
    if (res.success) {
      setTestResult(`Đã bắn thông báo đẩy: ${alert.title}`);
    } else {
      if (res.reason === 'permission_denied') {
        setTestResult('Chưa được cấp quyền gửi thông báo đẩy trình duyệt!');
      } else {
        setTestResult('Lỗi khi gửi thông báo.');
      }
    }
    setTimeout(() => setTestResult(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center">
              <Bell className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Trung Tâm Thông Báo Đẩy (Browser Push)
                </h3>
                {alerts.length > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    {alerts.length} CẢNH BÁO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Nhắc nhở chủ động hạn đăng kiểm, mốc bảo dưỡng ODO & bảo hiểm xe
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'alerts'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Mốc Cảnh Báo ({alerts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Cài Đặt & Cấp Quyền</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Lịch Sử Đã Gửi ({history.length})</span>
          </button>
        </div>

        {/* Floating Feedback Banner */}
        {testResult && (
          <div className="mx-5 mt-3 px-3.5 py-2 rounded-lg bg-cyan-950/80 border border-cyan-400/50 text-cyan-200 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{testResult}</span>
            </div>
            <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: ACTIVE ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {/* Permission Quick Status Notice */}
              {permission !== 'granted' && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-300">
                        Chưa cấp quyền thông báo đẩy trình duyệt
                      </div>
                      <p className="text-[11px] text-amber-200/80">
                        Cấp quyền ngay để nhận thông báo trực tiếp trên màn hình desktop/mobile khi sắp đến hạn.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onRequestPermission}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shrink-0 transition-colors"
                  >
                    Cấp Quyền
                  </button>
                </div>
              )}

              {alerts.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Mọi thông số đều an toàn!</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Chưa có xe nào sắp đến hạn đăng kiểm hoặc mốc bảo dưỡng trong phạm vi cảnh báo đã cài đặt.
                  </p>
                  <button
                    onClick={handleTestPush}
                    className="mt-3 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-700"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Gửi thông báo đẩy thử nghiệm
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Các mốc bảo dưỡng & đăng kiểm cần chú ý:</span>
                    <button
                      onClick={handleTestPush}
                      className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Gửi thử thông báo
                    </button>
                  </div>

                  {alerts.map((alert) => {
                    const isUrgent = alert.severity === 'urgent';
                    const isWarning = alert.severity === 'warning';

                    return (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isUrgent
                            ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400'
                            : isWarning
                            ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                            : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                              {alert.plateNumber}
                            </span>
                            <span className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                              {alert.vehicleName}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              isUrgent
                                ? 'bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse'
                                : isWarning
                                ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                                : 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                            }`}
                          >
                            {alert.remainingDisplay}
                          </span>
                        </div>

                        <div className="space-y-1 mb-3">
                          <div className="text-xs font-bold text-slate-200">{alert.title}</div>
                          <p className="text-xs text-slate-300 leading-relaxed">{alert.body}</p>
                          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 pt-1">
                            <span>Mục tiêu: <b className="text-slate-200">{alert.targetValueDisplay}</b></span>
                            {alert.lastSentAt && (
                              <span>• Đã gửi lúc: {formatDateVN(alert.lastSentAt)}</span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/60">
                          <button
                            onClick={() => handlePushSingleAlert(alert)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors cursor-pointer"
                            title="Gửi ngay thông báo đẩy trình duyệt cho mục này"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Đẩy thông báo ngay</span>
                          </button>

                          <button
                            onClick={() => {
                              onNavigateToVehicle(alert.vehicleId, alert.actionTab);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                          >
                            <span>Xem xe trong Buồng Lái</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SETTINGS & PERMISSIONS */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              {/* Permission Card */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Trạng Thái Quyền Thông Báo Trình Duyệt
                    </h4>
                    <p className="text-xs text-slate-400">
                      Cần quyền Notification API để hiển thị banner thông báo ngoài trình duyệt
                    </p>
                  </div>

                  {permission === 'granted' ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ĐÃ CẤP QUYỀN
                    </span>
                  ) : permission === 'denied' ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-500/40">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      BỊ CHẶN (DENIED)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/40">
                      <Info className="w-3.5 h-3.5" />
                      CHƯA CẤP QUYỀN
                    </span>
                  )}
                </div>

                {permission === 'denied' && (
                  <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200/90 space-y-1.5">
                    <div className="font-bold">Cách mở lại thông báo đẩy:</div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                      <li>Bấm vào biểu tượng 🔒 (Khóa) hoặc ⚙️ bên trái thanh địa chỉ URL trình duyệt.</li>
                      <li>Tìm mục <b>Thông báo (Notifications)</b> và chuyển thành <b>Cho phép (Allow)</b>.</li>
                      <li>Tải lại (F5) trang web để kích hoạt.</li>
                    </ol>
                  </div>
                )}

                {permission !== 'granted' && permission !== 'denied' && (
                  <button
                    onClick={onRequestPermission}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-sky-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Bell className="w-4 h-4" />
                    Yêu Cầu Cấp Quyền Thông Báo Đẩy
                  </button>
                )}

                {permission === 'granted' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestPush}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Bắn Thông Báo Mẫu (Test Notification)
                    </button>
                    <button
                      onClick={() => onPlayChime('alert')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      Nghe thử chuông
                    </button>
                  </div>
                )}
              </div>

              {/* Master Switches */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Cấu Hình Ngưỡng Nhắc Nhở Tự Động
                </h4>

                {/* Master Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Bật hệ thống nhắc nhở tự động
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Cho phép ứng dụng tự động kiểm tra và bắn thông báo
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enabled}
                      onChange={(e) => onUpdateSettings({ enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                {/* Sound Chime Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                  <div className="flex items-center gap-2">
                    {settings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Âm thanh chuông buồng lái (Cockpit Chime)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Phát âm thanh chuông công nghệ khi thông báo đẩy xuất hiện
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                {/* Inspection Threshold */}
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        🛡️ Nhắc Hạn Đăng Kiểm Xe
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Gửi cảnh báo trước ngày hết hạn kiểm định
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.inspectionAlerts}
                        onChange={(e) => onUpdateSettings({ inspectionAlerts: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                    </label>
                  </div>
                  {settings.inspectionAlerts && (
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-slate-400">Thời gian báo trước:</span>
                      <select
                        value={settings.inspectionDaysBefore}
                        onChange={(e) =>
                          onUpdateSettings({ inspectionDaysBefore: parseInt(e.target.value, 10) })
                        }
                        className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-400"
                      >
                        <option value={60}>Trước 60 ngày</option>
                        <option value={45}>Trước 45 ngày</option>
                        <option value={30}>Trước 30 ngày (Khuyến nghị)</option>
                        <option value={15}>Trước 15 ngày</option>
                        <option value={7}>Trước 7 ngày</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Maintenance ODO Threshold */}
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        🔧 Nhắc Mốc Bảo Dưỡng Theo ODO
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Cảnh báo khi ODO xe gần chạm mốc bảo dưỡng kế tiếp
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.maintenanceAlerts}
                        onChange={(e) => onUpdateSettings({ maintenanceAlerts: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                    </label>
                  </div>
                  {settings.maintenanceAlerts && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Báo trước số km:</span>
                        <select
                          value={settings.maintenanceKmBefore}
                          onChange={(e) =>
                            onUpdateSettings({ maintenanceKmBefore: parseInt(e.target.value, 10) })
                          }
                          className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs rounded-lg px-2 py-1"
                        >
                          <option value={2000}>Trước 2.000 km</option>
                          <option value={1500}>Trước 1.500 km (Chuẩn)</option>
                          <option value={1000}>Trước 1.000 km</option>
                          <option value={500}>Trước 500 km</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Báo trước ngày hẹn:</span>
                        <select
                          value={settings.maintenanceDaysBefore}
                          onChange={(e) =>
                            onUpdateSettings({ maintenanceDaysBefore: parseInt(e.target.value, 10) })
                          }
                          className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs rounded-lg px-2 py-1"
                        >
                          <option value={30}>Trước 30 ngày</option>
                          <option value={15}>Trước 15 ngày</option>
                          <option value={7}>Trước 7 ngày</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Insurance Threshold */}
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        🛡️ Nhắc Hạn Bảo Hiểm Xe
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Cảnh báo trước khi hợp đồng bảo hiểm TNDS & Thân vỏ hết hạn
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.insuranceAlerts}
                        onChange={(e) => onUpdateSettings({ insuranceAlerts: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                    </label>
                  </div>
                  {settings.insuranceAlerts && (
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-slate-400">Thời gian báo trước:</span>
                      <select
                        value={settings.insuranceDaysBefore}
                        onChange={(e) =>
                          onUpdateSettings({ insuranceDaysBefore: parseInt(e.target.value, 10) })
                        }
                        className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs rounded-lg px-2.5 py-1"
                      >
                        <option value={45}>Trước 45 ngày</option>
                        <option value={30}>Trước 30 ngày</option>
                        <option value={15}>Trước 15 ngày</option>
                        <option value={7}>Trước 7 ngày</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SENT NOTIFICATION HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Nhật ký thông báo đã kích hoạt & gửi tới trình duyệt:</span>
                {history.length > 0 && (
                  <button
                    onClick={onClearHistory}
                    className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-xs font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa lịch sử</span>
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Chưa có thông báo nào được gửi. Bấm <b>"Bắn Thông Báo Mẫu"</b> trong tab Cài đặt để thử nghiệm.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-amber-300 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded">
                            {item.vehiclePlate || 'HỆ THỐNG'}
                          </span>
                          <span className="font-bold text-white">{item.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          {formatDateVN(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{item.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Đồng bộ theo thời gian thực với ODO & sổ đăng kiểm</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
