export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export type AlertCategory = 
  | 'INSPECTION'        // Đăng kiểm xe
  | 'MAINTENANCE_ODO'   // Bảo dưỡng theo số km ODO
  | 'MAINTENANCE_DATE'  // Bảo dưỡng theo ngày hẹn
  | 'INSURANCE'         // Bảo hiểm bắt buộc / thân vỏ
  | 'TEST';             // Thông báo thử nghiệm

export type AlertSeverity = 'urgent' | 'warning' | 'info';

export interface VehicleAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  plateNumber: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  body: string;
  targetValueDisplay: string; // e.g. "Hết hạn ngày 15/12/2026" hoặc "Mốc 40.000 km"
  remainingDisplay: string;   // e.g. "Còn 46 ngày", "Còn 1.550 km"
  remainingValue: number;     // Số ngày hoặc số km còn lại
  tag: string;
  lastSentAt?: string;
  isSent: boolean;
  actionTab: 'cockpit' | 'documents' | 'maintenance' | 'expenses';
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  inspectionAlerts: boolean;
  inspectionDaysBefore: number;   // 60, 30, 15, 7, 3
  maintenanceAlerts: boolean;
  maintenanceKmBefore: number;    // 2000, 1500, 1000, 500
  maintenanceDaysBefore: number;  // 30, 15, 7
  insuranceAlerts: boolean;
  insuranceDaysBefore: number;    // 30, 15, 7
  autoCheckOnStartup: boolean;
}

export interface NotificationHistoryItem {
  id: string;
  timestamp: string;
  category: AlertCategory;
  title: string;
  body: string;
  vehiclePlate?: string;
  vehicleId?: string;
  status: 'delivered' | 'clicked' | 'fallback';
}
