import {
  NotificationPermissionState,
  AlertCategory,
  AlertSeverity,
  VehicleAlert,
  NotificationSettings,
  NotificationHistoryItem,
} from '../types/notification';
import { Vehicle } from '../types/vehicle';
import { formatDateVN, formatKm, getDaysRemaining } from './formatters';

const SETTINGS_KEY = 'veo_notification_settings';
const HISTORY_KEY = 'veo_notification_history';
const SENT_TAGS_KEY = 'veo_notification_sent_tags';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  inspectionAlerts: true,
  inspectionDaysBefore: 30, // Nhắc trước 30 ngày
  maintenanceAlerts: true,
  maintenanceKmBefore: 1500, // Nhắc trước 1500 km
  maintenanceDaysBefore: 15, // Nhắc trước 15 ngày
  insuranceAlerts: true,
  insuranceDaysBefore: 30, // Nhắc trước 30 ngày
  autoCheckOnStartup: true,
};

// 1. Storage Helpers
export function getStoredNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function saveStoredNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function getStoredHistory(): NotificationHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addNotificationToHistory(item: Omit<NotificationHistoryItem, 'id' | 'timestamp'>): void {
  try {
    const current = getStoredHistory();
    const newItem: NotificationHistoryItem = {
      ...item,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    const updated = [newItem, ...current].slice(0, 50); // Lưu tối đa 50 thông báo gần nhất
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}

export function clearNotificationHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
}

function getSentTagsMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SENT_TAGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function markTagAsSent(tag: string): void {
  try {
    const map = getSentTagsMap();
    map[tag] = Date.now();
    localStorage.setItem(SENT_TAGS_KEY, JSON.stringify(map));
  } catch {}
}

// 2. Futuristic Cockpit Melodic Audio Chime (Web Audio API)
let audioCtx: AudioContext | null = null;

export function playCockpitChime(type: 'alert' | 'success' | 'urgent' = 'alert'): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    if (type === 'urgent') {
      // 3 short pulse alert beeps
      [0, 0.12, 0.24].forEach((offset) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now + offset);
        gain.gain.setValueAtTime(0.15, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
    } else {
      // Pleasant futuristic cockpit 2-tone melodic chime (E5 -> A5)
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      const gain2 = audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Tone 1: E5 (659.25 Hz)
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.26);

      // Tone 2: A5 (880 Hz) slightly delayed
      osc2.frequency.setValueAtTime(880, now + 0.1);
      gain2.gain.setValueAtTime(0.2, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.46);
    }
  } catch (err) {
    console.warn('Audio chime could not play:', err);
  }
}

// 3. Permission & Support Checking
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): NotificationPermissionState {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }

  try {
    // Native Promise or callback fallback
    let result: NotificationPermission;
    if (typeof Notification.requestPermission().then === 'function') {
      result = await Notification.requestPermission();
    } else {
      result = await new Promise((resolve) => {
        Notification.requestPermission((p) => resolve(p));
      });
    }
    return result as NotificationPermissionState;
  } catch {
    return Notification.permission as NotificationPermissionState;
  }
}

// 4. Dispatch Browser Push Notification
export interface DispatchOptions {
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  category: AlertCategory;
  vehiclePlate?: string;
  vehicleId?: string;
  severity?: AlertSeverity;
  data?: any;
  onClick?: () => void;
}

export function dispatchBrowserNotification(
  title: string,
  options: DispatchOptions,
  settings: NotificationSettings = getStoredNotificationSettings()
): { success: boolean; reason?: string } {
  if (!isBrowserNotificationSupported()) {
    addNotificationToHistory({
      category: options.category,
      title,
      body: options.body,
      vehiclePlate: options.vehiclePlate,
      vehicleId: options.vehicleId,
      status: 'fallback',
    });
    return { success: false, reason: 'unsupported' };
  }

  if (Notification.permission !== 'granted') {
    return { success: false, reason: 'permission_denied' };
  }

  try {
    // Play cockpit chime
    if (settings.soundEnabled) {
      playCockpitChime(options.severity === 'urgent' ? 'urgent' : 'alert');
    }

    const tag = options.tag || `veo-alert-${Date.now()}`;
    const notification = new Notification(title, {
      body: options.body,
      icon: options.icon || '/icon.svg',
      badge: options.badge || '/icon.svg',
      tag,
      data: options.data,
    });

    notification.onclick = (event) => {
      event.preventDefault();
      try {
        window.focus();
      } catch {}
      notification.close();
      if (options.onClick) {
        options.onClick();
      }
    };

    if (options.tag) {
      markTagAsSent(options.tag);
    }

    addNotificationToHistory({
      category: options.category,
      title,
      body: options.body,
      vehiclePlate: options.vehiclePlate,
      vehicleId: options.vehicleId,
      status: 'delivered',
    });

    return { success: true };
  } catch (err) {
    console.error('Failed to dispatch notification:', err);
    return { success: false, reason: 'dispatch_error' };
  }
}

// 5. Generate and Evaluate Vehicle Alerts
export function evaluateVehicleAlerts(
  vehicles: Vehicle[],
  settings: NotificationSettings = getStoredNotificationSettings()
): VehicleAlert[] {
  const alerts: VehicleAlert[] = [];
  const sentTags = getSentTagsMap();

  vehicles.forEach((vehicle) => {
    // A. ĐĂNG KIỂM XE (Inspection)
    if (settings.inspectionAlerts && vehicle.inspectionExpiry) {
      const daysRemaining = getDaysRemaining(vehicle.inspectionExpiry);
      if (daysRemaining != null && daysRemaining <= settings.inspectionDaysBefore) {
        const isOverdue = daysRemaining < 0;
        const isUrgent = daysRemaining <= 7 || isOverdue;
        const tag = `insp-${vehicle.id}-${vehicle.inspectionExpiry}`;
        const lastSentTimestamp = sentTags[tag];

        const title = isOverdue
          ? `🚨 ĐÃ QUÁ HẠN ĐĂNG KIỂM: ${vehicle.plateNumber}`
          : isUrgent
          ? `⚠️ KHẨN CẤP: Đăng kiểm ${vehicle.plateNumber} còn ${daysRemaining} ngày`
          : `🔔 Nhắc đăng kiểm: ${vehicle.plateNumber} còn ${daysRemaining} ngày`;

        const body = isOverdue
          ? `Giấy kiểm định xe ${vehicle.name} (${vehicle.plateNumber}) đã quá hạn từ ${formatDateVN(vehicle.inspectionExpiry)}. Không lưu thông để tránh bị phạt nặng!`
          : `Xe ${vehicle.name} có hạn kiểm định đến ngày ${formatDateVN(vehicle.inspectionExpiry)} (còn ${daysRemaining} ngày). Hãy đặt lịch trạm đăng kiểm sớm.`;

        alerts.push({
          id: `alert-insp-${vehicle.id}`,
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          plateNumber: vehicle.plateNumber,
          category: 'INSPECTION',
          severity: isOverdue || isUrgent ? 'urgent' : daysRemaining <= 15 ? 'warning' : 'info',
          title,
          body,
          targetValueDisplay: `Hạn: ${formatDateVN(vehicle.inspectionExpiry)}`,
          remainingDisplay: isOverdue ? `Đã quá hạn ${Math.abs(daysRemaining)} ngày` : `Còn ${daysRemaining} ngày`,
          remainingValue: daysRemaining,
          tag,
          lastSentAt: lastSentTimestamp ? new Date(lastSentTimestamp).toISOString() : undefined,
          isSent: !!lastSentTimestamp,
          actionTab: 'documents',
        });
      }
    }

    // B. BẢO DƯỠNG THEO ODO (Maintenance Milestone)
    if (settings.maintenanceAlerts) {
      const targetOdo = vehicle.nextServiceOdo || Math.ceil(vehicle.currentOdo / 5000) * 5000;
      const kmRemaining = targetOdo - vehicle.currentOdo;

      if (kmRemaining <= settings.maintenanceKmBefore) {
        const isOverdue = kmRemaining <= 0;
        const isUrgent = kmRemaining <= 300 || isOverdue;
        const tag = `maint-odo-${vehicle.id}-${targetOdo}`;
        const lastSentTimestamp = sentTags[tag];

        const serviceName = vehicle.nextServiceLevel || `Mốc ${formatKm(targetOdo)}`;

        const title = isOverdue
          ? `🔧 ĐÃ TỚI HẠN BẢO DƯỠNG: ${vehicle.plateNumber}`
          : isUrgent
          ? `⚠️ SẮP ĐẾN MỐC BẢO DƯỠNG: ${vehicle.plateNumber} (còn ${kmRemaining.toLocaleString()} km)`
          : `🔧 Nhắc bảo dưỡng định kỳ: ${vehicle.plateNumber} (còn ${kmRemaining.toLocaleString()} km)`;

        const body = isOverdue
          ? `Xe ${vehicle.name} đã chạm mốc ODO ${vehicle.currentOdo.toLocaleString()} km (đích ${targetOdo.toLocaleString()} km). Hãy đưa xe đi làm ${serviceName} ngay!`
          : `Xe ${vehicle.name} hiện đạt ${vehicle.currentOdo.toLocaleString()} km, chỉ còn ${kmRemaining.toLocaleString()} km nữa là đến mốc ${serviceName}.`;

        alerts.push({
          id: `alert-maint-odo-${vehicle.id}`,
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          plateNumber: vehicle.plateNumber,
          category: 'MAINTENANCE_ODO',
          severity: isOverdue || isUrgent ? 'urgent' : kmRemaining <= 800 ? 'warning' : 'info',
          title,
          body,
          targetValueDisplay: `Mốc: ${formatKm(targetOdo)} (${serviceName})`,
          remainingDisplay: isOverdue ? 'Đã đến mốc ODO' : `Còn ${kmRemaining.toLocaleString()} km`,
          remainingValue: kmRemaining,
          tag,
          lastSentAt: lastSentTimestamp ? new Date(lastSentTimestamp).toISOString() : undefined,
          isSent: !!lastSentTimestamp,
          actionTab: 'maintenance',
        });
      }

      // C. BẢO DƯỠNG THEO NGÀY HẸN (Maintenance Scheduled Date)
      if (vehicle.nextServiceDate) {
        const daysRemaining = getDaysRemaining(vehicle.nextServiceDate);
        if (daysRemaining != null && daysRemaining <= settings.maintenanceDaysBefore) {
          const isOverdue = daysRemaining < 0;
          const tag = `maint-date-${vehicle.id}-${vehicle.nextServiceDate}`;
          const lastSentTimestamp = sentTags[tag];

          const title = isOverdue
            ? `🔧 QUÁ HẠN LỊCH BẢO DƯỠNG: ${vehicle.plateNumber}`
            : `🔧 Lịch bảo dưỡng sắp tới: ${vehicle.plateNumber} (còn ${daysRemaining} ngày)`;

          const body = isOverdue
            ? `Lịch hẹn bảo dưỡng xe ${vehicle.name} vào ngày ${formatDateVN(vehicle.nextServiceDate)} đã qua.`
            : `Xe ${vehicle.name} có lịch bảo dưỡng vào ngày ${formatDateVN(vehicle.nextServiceDate)}. Vui lòng chuẩn bị xe để bảo dưỡng.`;

          alerts.push({
            id: `alert-maint-date-${vehicle.id}`,
            vehicleId: vehicle.id,
            vehicleName: vehicle.name,
            plateNumber: vehicle.plateNumber,
            category: 'MAINTENANCE_DATE',
            severity: isOverdue || daysRemaining <= 3 ? 'urgent' : 'warning',
            title,
            body,
            targetValueDisplay: `Lịch hẹn: ${formatDateVN(vehicle.nextServiceDate)}`,
            remainingDisplay: isOverdue ? `Quá hẹn ${Math.abs(daysRemaining)} ngày` : `Còn ${daysRemaining} ngày`,
            remainingValue: daysRemaining,
            tag,
            lastSentAt: lastSentTimestamp ? new Date(lastSentTimestamp).toISOString() : undefined,
            isSent: !!lastSentTimestamp,
            actionTab: 'maintenance',
          });
        }
      }
    }

    // D. BẢO HIỂM XE (Insurance)
    if (settings.insuranceAlerts && vehicle.insuranceExpiry) {
      const daysRemaining = getDaysRemaining(vehicle.insuranceExpiry);
      if (daysRemaining != null && daysRemaining <= settings.insuranceDaysBefore) {
        const isOverdue = daysRemaining < 0;
        const tag = `insur-${vehicle.id}-${vehicle.insuranceExpiry}`;
        const lastSentTimestamp = sentTags[tag];

        const title = isOverdue
          ? `🛡️ HẾT HẠN BẢO HIỂM: ${vehicle.plateNumber}`
          : `🛡️ Nhắc gia hạn bảo hiểm: ${vehicle.plateNumber} (còn ${daysRemaining} ngày)`;

        const body = `Hợp đồng bảo hiểm ${vehicle.insurerName || 'xe'} của ${vehicle.name} có hạn đến ngày ${formatDateVN(vehicle.insuranceExpiry)}. Hãy gia hạn để an tâm lưu thông.`;

        alerts.push({
          id: `alert-insur-${vehicle.id}`,
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          plateNumber: vehicle.plateNumber,
          category: 'INSURANCE',
          severity: isOverdue || daysRemaining <= 7 ? 'urgent' : 'warning',
          title,
          body,
          targetValueDisplay: `Hạn: ${formatDateVN(vehicle.insuranceExpiry)}`,
          remainingDisplay: isOverdue ? 'Hết hạn' : `Còn ${daysRemaining} ngày`,
          remainingValue: daysRemaining,
          tag,
          lastSentAt: lastSentTimestamp ? new Date(lastSentTimestamp).toISOString() : undefined,
          isSent: !!lastSentTimestamp,
          actionTab: 'documents',
        });
      }
    }
  });

  // Sort by urgency: urgent first, then warning, then info
  const severityRank: Record<AlertSeverity, number> = { urgent: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

// 6. Automated Background Check on App Launch
export function checkAndAutoNotify(
  vehicles: Vehicle[],
  settings: NotificationSettings,
  onNotificationClick?: (alert: VehicleAlert) => void
): number {
  if (!settings.enabled || !settings.autoCheckOnStartup) return 0;
  if (!isBrowserNotificationSupported() || Notification.permission !== 'granted') return 0;

  const alerts = evaluateVehicleAlerts(vehicles, settings);
  const sentTags = getSentTagsMap();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  let dispatchedCount = 0;

  alerts.forEach((alert) => {
    // Only dispatch if not sent in the last 24 hours for this specific tag
    const lastSent = sentTags[alert.tag];
    const isRecentlySent = lastSent && now - lastSent < ONE_DAY_MS;

    if (!isRecentlySent) {
      const result = dispatchBrowserNotification(
        alert.title,
        {
          body: alert.body,
          tag: alert.tag,
          category: alert.category,
          vehiclePlate: alert.plateNumber,
          vehicleId: alert.vehicleId,
          severity: alert.severity,
          onClick: () => {
            if (onNotificationClick) onNotificationClick(alert);
          },
        },
        settings
      );
      if (result.success) {
        dispatchedCount++;
      }
    }
  });

  return dispatchedCount;
}
