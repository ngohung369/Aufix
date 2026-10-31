import { useState, useEffect, useCallback } from 'react';
import {
  NotificationPermissionState,
  NotificationSettings,
  NotificationHistoryItem,
  VehicleAlert,
} from '../types/notification';
import { Vehicle } from '../types/vehicle';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getStoredNotificationSettings,
  saveStoredNotificationSettings,
  getStoredHistory,
  clearNotificationHistory as clearStorageHistory,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  dispatchBrowserNotification,
  evaluateVehicleAlerts,
  checkAndAutoNotify,
  playCockpitChime,
} from '../utils/notificationService';

export function useNotifications(
  vehicles: Vehicle[],
  onNavigateToAlert?: (vehicleId: string, tab: 'cockpit' | 'documents' | 'maintenance' | 'expenses') => void
) {
  const [permission, setPermission] = useState<NotificationPermissionState>(() =>
    getBrowserNotificationPermission()
  );

  const [settings, setSettings] = useState<NotificationSettings>(() =>
    getStoredNotificationSettings()
  );

  const [history, setHistory] = useState<NotificationHistoryItem[]>(() =>
    getStoredHistory()
  );

  const [alerts, setAlerts] = useState<VehicleAlert[]>([]);

  // Refresh active alerts based on vehicles and user settings
  const refreshAlerts = useCallback(() => {
    const calculated = evaluateVehicleAlerts(vehicles, settings);
    setAlerts(calculated);
    setHistory(getStoredHistory());
  }, [vehicles, settings]);

  // Initial and updates
  useEffect(() => {
    refreshAlerts();
  }, [refreshAlerts]);

  // Check permission on focus or mount
  useEffect(() => {
    const updatePerm = () => {
      setPermission(getBrowserNotificationPermission());
    };
    window.addEventListener('focus', updatePerm);
    return () => window.removeEventListener('focus', updatePerm);
  }, []);

  // Auto check on startup or vehicle update
  useEffect(() => {
    if (permission === 'granted' && settings.enabled && settings.autoCheckOnStartup) {
      const dispatched = checkAndAutoNotify(vehicles, settings, (alert) => {
        if (onNavigateToAlert) {
          onNavigateToAlert(alert.vehicleId, alert.actionTab);
        }
      });
      if (dispatched > 0) {
        setHistory(getStoredHistory());
      }
    }
  }, [vehicles, permission, settings, onNavigateToAlert]);

  // Request browser permission
  const requestPermission = async (): Promise<NotificationPermissionState> => {
    const res = await requestBrowserNotificationPermission();
    setPermission(res);
    return res;
  };

  // Update notification settings
  const updateSettings = (updated: Partial<NotificationSettings>) => {
    const newSettings = { ...settings, ...updated };
    setSettings(newSettings);
    saveStoredNotificationSettings(newSettings);
  };

  // Clear notification history
  const clearHistory = () => {
    clearStorageHistory();
    setHistory([]);
  };

  // Test notification
  const triggerTestNotification = () => {
    const testTitle = '🚗 Aufix • Ứng dụng quản lý xe';
    const testBody = 'Hệ thống thông báo đẩy trình duyệt hoạt động hoàn hảo! Bạn sẽ nhận được nhắc nhở khi đến hạn đăng kiểm hoặc mốc bảo dưỡng.';
    
    const result = dispatchBrowserNotification(
      testTitle,
      {
        body: testBody,
        category: 'TEST',
        severity: 'info',
        onClick: () => {
          if (onNavigateToAlert && vehicles[0]) {
            onNavigateToAlert(vehicles[0].id, 'cockpit');
          }
        },
      },
      settings
    );

    setHistory(getStoredHistory());
    return result;
  };

  // Trigger push notification for a specific alert
  const triggerAlertNotification = (alert: VehicleAlert) => {
    const result = dispatchBrowserNotification(
      alert.title,
      {
        body: alert.body,
        category: alert.category,
        vehiclePlate: alert.plateNumber,
        vehicleId: alert.vehicleId,
        severity: alert.severity,
        tag: `manual-${alert.tag}-${Date.now()}`,
        onClick: () => {
          if (onNavigateToAlert) {
            onNavigateToAlert(alert.vehicleId, alert.actionTab);
          }
        },
      },
      settings
    );

    refreshAlerts();
    return result;
  };

  // Play test sound
  const playTestChime = (type: 'alert' | 'urgent' = 'alert') => {
    playCockpitChime(type);
  };

  const urgentCount = alerts.filter((a) => a.severity === 'urgent').length;
  const totalCount = alerts.length;

  return {
    permission,
    settings,
    alerts,
    history,
    urgentCount,
    totalCount,
    requestPermission,
    updateSettings,
    clearHistory,
    triggerTestNotification,
    triggerAlertNotification,
    playTestChime,
    refreshAlerts,
  };
}
