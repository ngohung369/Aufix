/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CockpitDashboard } from './components/CockpitDashboard';
import { DocumentsView } from './components/DocumentsView';
import { MaintenanceView } from './components/MaintenanceView';
import { ExpensesView } from './components/ExpensesView';
import { TripsView } from './components/TripsView';
import { CopilotView } from './components/CopilotView';
import { DocumentScannerModal } from './components/DocumentScannerModal';
import { SosModal } from './components/SosModal';
import { VehicleManagerModal } from './components/VehicleManagerModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { GoogleDriveBackupModal } from './components/GoogleDriveBackupModal';
import { NotificationPermissionBanner } from './components/NotificationPermissionBanner';
import { useNotifications } from './hooks/useNotifications';
import { dispatchBrowserNotification } from './utils/notificationService';
import { formatDateVN, formatKm } from './utils/formatters';
import {
  Vehicle,
  VehicleDocument,
  MaintenanceRecord,
  ExpenseRecord,
  TripRecord,
  ExtractedDocumentData,
} from './types/vehicle';
import {
  INITIAL_VEHICLES,
  INITIAL_DOCUMENTS,
  INITIAL_MAINTENANCE,
  INITIAL_EXPENSES,
  INITIAL_TRIPS,
} from './data/sampleVehicles';
import { CheckCircle2, Sparkles, AlertCircle, Bell } from 'lucide-react';

export default function App() {
  // Persistent state with localStorage fallback
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try {
      const saved = localStorage.getItem('veo_vehicles');
      return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
    } catch {
      return INITIAL_VEHICLES;
    }
  });

  const [activeVehicleId, setActiveVehicleId] = useState<string>(() => {
    return vehicles[0]?.id || 'veh-1';
  });

  const [documents, setDocuments] = useState<VehicleDocument[]>(() => {
    try {
      const saved = localStorage.getItem('veo_documents');
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });

  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('veo_maintenance');
      return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE;
    } catch {
      return INITIAL_MAINTENANCE;
    }
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem('veo_expenses');
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [trips, setTrips] = useState<TripRecord[]>(() => {
    try {
      const saved = localStorage.getItem('veo_trips');
      return saved ? JSON.parse(saved) : INITIAL_TRIPS;
    } catch {
      return INITIAL_TRIPS;
    }
  });

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<string>('cockpit');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isDriveBackupOpen, setIsDriveBackupOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const handleNavigateToAlert = (
    vId: string,
    tab: 'cockpit' | 'documents' | 'maintenance' | 'expenses'
  ) => {
    setActiveVehicleId(vId);
    setActiveTab(tab);
  };

  const handleRestoreData = (restored: {
    vehicles: Vehicle[];
    documents: VehicleDocument[];
    maintenance: MaintenanceRecord[];
    expenses: ExpenseRecord[];
    trips?: TripRecord[];
  }) => {
    if (restored.vehicles && restored.vehicles.length > 0) {
      setVehicles(restored.vehicles);
      setActiveVehicleId(restored.vehicles[0].id);
    }
    if (restored.documents) setDocuments(restored.documents);
    if (restored.maintenance) setMaintenance(restored.maintenance);
    if (restored.expenses) setExpenses(restored.expenses);
    if (restored.trips) setTrips(restored.trips);
  };

  // Browser Notification Push System
  const {
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
  } = useNotifications(vehicles, handleNavigateToAlert);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('veo_vehicles', JSON.stringify(vehicles));
    } catch {}
  }, [vehicles]);

  useEffect(() => {
    try {
      localStorage.setItem('veo_documents', JSON.stringify(documents));
    } catch {}
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem('veo_maintenance', JSON.stringify(maintenance));
    } catch {}
  }, [maintenance]);

  useEffect(() => {
    try {
      localStorage.setItem('veo_expenses', JSON.stringify(expenses));
    } catch {}
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem('veo_trips', JSON.stringify(trips));
    } catch {}
  }, [trips]);

  // Current active vehicle
  const currentVehicle =
    vehicles.find((v) => v.id === activeVehicleId) || vehicles[0] || INITIAL_VEHICLES[0];

  // Helper to show notification
  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Update current vehicle's ODO
  const handleUpdateOdo = (newOdo: number) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === currentVehicle.id
          ? {
              ...v,
              currentOdo: newOdo,
              lastOdoUpdate: new Date().toISOString().split('T')[0],
            }
          : v
      )
    );
    showToast(`Đã cập nhật ODO xe lên ${newOdo.toLocaleString()} km`);
  };

  // Add new trip and automatically update ODO if selected
  const handleAddTrip = (newTrip: TripRecord, updateOdo: boolean) => {
    setTrips((prev) => [newTrip, ...prev]);
    if (updateOdo && newTrip.endOdo > currentVehicle.currentOdo) {
      handleUpdateOdo(newTrip.endOdo);
      showToast(
        `Đã lưu chuyến đi (${newTrip.distanceKm} km) & tự động cập nhật ODO lên ${newTrip.endOdo.toLocaleString()} km!`
      );
    } else {
      showToast(`Đã lưu chuyến đi (${newTrip.distanceKm} km) vào nhật ký hành trình!`);
    }
  };

  // Delete trip from history
  const handleDeleteTrip = (tripId: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
    showToast('Đã xóa chuyến đi khỏi nhật ký hành trình.');
  };

  // Add new vehicle
  const handleSaveVehicle = (newVeh: Vehicle) => {
    setVehicles((prev) => {
      const exists = prev.some((v) => v.id === newVeh.id);
      if (exists) {
        return prev.map((v) => (v.id === newVeh.id ? newVeh : v));
      }
      return [newVeh, ...prev];
    });
    setActiveVehicleId(newVeh.id);
    showToast(`Đã thêm xe ${newVeh.name} (${newVeh.plateNumber}) vào buồng lái!`);
  };

  // Core handler: Apply extracted OCR data from camera or presets
  const handleApplyExtractedData = (
    data: ExtractedDocumentData,
    targetVehicleId: string,
    isNewVehicle: boolean,
    imageThumbnail?: string
  ) => {
    const fields = data.extractedFields || {};
    let resolvedVehicleId = targetVehicleId;

    // 1. If user chose to create a new vehicle from this registration/document
    if (isNewVehicle || !resolvedVehicleId) {
      const newVehId = 'veh-' + Date.now();
      const createdVehicle: Vehicle = {
        id: newVehId,
        name: `${fields.brand || 'Xe'} ${fields.model || 'Mới'}`.trim() || 'Phương tiện mới',
        plateNumber: fields.plateNumber || '30X-999.99',
        type: fields.seats && fields.seats <= 2 && fields.engineCapacity?.includes('cc') && parseInt(fields.engineCapacity) < 200 ? 'MOTORBIKE' : 'CAR',
        brand: fields.brand || 'Honda',
        model: fields.model || 'Xe',
        color: fields.color || 'Tiêu chuẩn',
        engineCapacity: fields.engineCapacity,
        chassisNumber: fields.chassisNumber,
        engineNumber: fields.engineNumber,
        ownerName: fields.ownerName,
        ownerAddress: fields.ownerAddress,
        currentOdo: fields.odometerKm || 10000,
        lastOdoUpdate: new Date().toISOString().split('T')[0],
        inspectionExpiry: fields.expiryDate || (data.documentType === 'INSPECTION' ? fields.expiryDate : undefined),
        insuranceExpiry: data.documentType === 'INSURANCE' ? fields.expiryDate : undefined,
      };

      setVehicles((prev) => [createdVehicle, ...prev]);
      setActiveVehicleId(newVehId);
      resolvedVehicleId = newVehId;
    } else {
      // Update existing vehicle with any newly scanned dates/numbers
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.id !== resolvedVehicleId) return v;
          const updated: Vehicle = { ...v };

          if (fields.plateNumber && !v.plateNumber) updated.plateNumber = fields.plateNumber;
          if (fields.chassisNumber) updated.chassisNumber = fields.chassisNumber;
          if (fields.engineNumber) updated.engineNumber = fields.engineNumber;
          if (fields.ownerName) updated.ownerName = fields.ownerName;

          if (data.documentType === 'INSPECTION' && fields.expiryDate) {
            updated.inspectionExpiry = fields.expiryDate;
          }
          if (data.documentType === 'INSURANCE') {
            if (fields.expiryDate) updated.insuranceExpiry = fields.expiryDate;
            if (fields.insurerName) updated.insurerName = fields.insurerName;
            if (fields.insuranceHotline) updated.insuranceHotline = fields.insuranceHotline;
            if (fields.insuranceType) updated.insuranceType = fields.insuranceType;
          }
          if (data.documentType === 'MAINTENANCE') {
            if (fields.odometerKm && fields.odometerKm > v.currentOdo) {
              updated.currentOdo = fields.odometerKm;
              updated.lastOdoUpdate = fields.issueDate || new Date().toISOString().split('T')[0];
            }
            if (fields.nextServiceOdo) {
              updated.nextServiceOdo = fields.nextServiceOdo;
            }
            if (fields.nextServiceDate) {
              updated.nextServiceDate = fields.nextServiceDate;
            }
          }
          return updated;
        })
      );
    }

    // 2. Add as a Vehicle Document in digital wallet
    const newDoc: VehicleDocument = {
      id: 'doc-' + Date.now(),
      vehicleId: resolvedVehicleId,
      type: data.documentType,
      title: data.documentTitle,
      certificateNumber: fields.certificateNumber || 'Số hóa AI',
      issueDate: fields.issueDate || fields.firstRegistrationDate || new Date().toISOString().split('T')[0],
      expiryDate: fields.expiryDate,
      issuingAuthority: fields.inspectionStation || fields.insurerName || fields.garageName || 'Bộ Công An',
      imageThumbnail,
      extractedData: { ...fields },
      createdAt: new Date().toISOString(),
      notes: data.summary,
    };
    setDocuments((prev) => [newDoc, ...prev]);

    // 3. If Maintenance record was extracted, also automatically append to maintenance history & expenses
    if (data.documentType === 'MAINTENANCE') {
      const newMaint: MaintenanceRecord = {
        id: 'maint-' + Date.now(),
        vehicleId: resolvedVehicleId,
        serviceDate: fields.issueDate || new Date().toISOString().split('T')[0],
        odometerKm: fields.odometerKm || currentVehicle.currentOdo,
        garageName: fields.garageName || 'Xưởng Dịch Vụ Ô Tô',
        garageAddress: fields.garageAddress,
        level: fields.maintenanceLevel || 'Bảo dưỡng định kỳ',
        items: fields.serviceItems || [
          { name: 'Gói dịch vụ bảo dưỡng', amount: fields.totalAmount || 0 },
        ],
        totalCost: fields.totalAmount || 0,
        nextRecommendedOdo: fields.nextServiceOdo,
        nextRecommendedDate: fields.nextServiceDate,
        notes: data.summary,
      };
      setMaintenance((prev) => [newMaint, ...prev]);

      // Add expense
      if (fields.totalAmount) {
        const newExp: ExpenseRecord = {
          id: 'exp-' + Date.now(),
          vehicleId: resolvedVehicleId,
          date: fields.issueDate || new Date().toISOString().split('T')[0],
          category: 'MAINTENANCE',
          title: fields.maintenanceLevel || `Bảo dưỡng tại ${fields.garageName || 'Gara'}`,
          amount: fields.totalAmount,
          odometerKm: fields.odometerKm,
          notes: 'Tự động tạo từ phiếu bảo dưỡng AI quét',
        };
        setExpenses((prev) => [newExp, ...prev]);
      }
    }

    // 4. Feedback toast & smooth navigation
    showToast(`Đã bóc tách & tự động điền thành công vào sổ xe!`);
    if (data.documentType === 'MAINTENANCE') {
      setActiveTab('maintenance');
    } else if (data.documentType === 'REGISTRATION' || data.documentType === 'INSPECTION' || data.documentType === 'INSURANCE') {
      setActiveTab('documents');
    }
  };

  // Delete handlers
  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    showToast('Đã xóa giấy tờ khỏi sổ xe', 'info');
  };

  const handleDeleteMaintenance = (id: string) => {
    setMaintenance((prev) => prev.filter((m) => m.id !== id));
    showToast('Đã xóa phiếu bảo dưỡng', 'info');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast('Đã xóa khoản chi phí', 'info');
  };

  const handleAddMaintenance = (record: MaintenanceRecord) => {
    setMaintenance((prev) => [record, ...prev]);
    // Also record as expense
    if (record.totalCost > 0) {
      setExpenses((prev) => [
        {
          id: 'exp-' + Date.now(),
          vehicleId: record.vehicleId,
          date: record.serviceDate,
          category: 'MAINTENANCE',
          title: record.level,
          amount: record.totalCost,
          odometerKm: record.odometerKm,
        },
        ...prev,
      ]);
    }
    showToast('Đã lưu nhật ký bảo dưỡng');
  };

  const handleAddExpense = (record: ExpenseRecord) => {
    setExpenses((prev) => [record, ...prev]);
    showToast('Đã ghi nhận chi phí xe');
  };

  // Specific push notification trigger handlers
  const handleTriggerNotificationFromCard = (
    category: 'INSPECTION' | 'MAINTENANCE_ODO' | 'INSURANCE'
  ) => {
    const matchingAlert = alerts.find(
      (a) => a.vehicleId === currentVehicle.id && a.category === category
    );

    if (matchingAlert) {
      const res = triggerAlertNotification(matchingAlert);
      if (res.success) {
        showToast(`Đã gửi thông báo đẩy: ${matchingAlert.title}`);
      } else {
        if (res.reason === 'permission_denied') {
          setIsNotificationModalOpen(true);
          showToast('Vui lòng cấp quyền thông báo đẩy trình duyệt!', 'info');
        } else {
          showToast('Không thể gửi thông báo đẩy', 'info');
        }
      }
    } else {
      let title = '';
      let body = '';
      if (category === 'INSPECTION') {
        title = `🔔 Nhắc đăng kiểm: ${currentVehicle.plateNumber}`;
        body = `Hạn kiểm định của xe ${currentVehicle.name} đến ngày ${formatDateVN(
          currentVehicle.inspectionExpiry
        )}. Hãy chú ý đặt lịch kiểm định sớm.`;
      } else if (category === 'MAINTENANCE_ODO') {
        const nextOdo =
          currentVehicle.nextServiceOdo || Math.ceil(currentVehicle.currentOdo / 5000) * 5000;
        title = `🔧 Nhắc bảo dưỡng: ${currentVehicle.plateNumber}`;
        body = `Xe ${currentVehicle.name} đang ở ODO ${formatKm(
          currentVehicle.currentOdo
        )}, mốc bảo dưỡng tới là ${formatKm(nextOdo)} (${
          currentVehicle.nextServiceLevel || 'Định kỳ'
        }).`;
      } else {
        title = `🛡️ Hạn bảo hiểm xe: ${currentVehicle.plateNumber}`;
        body = `Hợp đồng bảo hiểm của ${currentVehicle.name} có hiệu lực đến ngày ${formatDateVN(
          currentVehicle.insuranceExpiry
        )}.`;
      }

      const res = dispatchBrowserNotification(
        title,
        {
          body,
          category,
          vehiclePlate: currentVehicle.plateNumber,
          vehicleId: currentVehicle.id,
          severity: 'info',
          onClick: () => {
            setActiveTab(category === 'MAINTENANCE_ODO' ? 'maintenance' : 'documents');
          },
        },
        settings
      );

      if (res.success) {
        showToast(`Đã gửi thông báo đẩy: ${title}`);
      } else {
        if (res.reason === 'permission_denied') {
          setIsNotificationModalOpen(true);
          showToast('Vui lòng cấp quyền thông báo đẩy trình duyệt!', 'info');
        } else {
          showToast('Không thể gửi thông báo', 'info');
        }
      }
    }
  };

  const handleTriggerDocNotification = (doc: VehicleDocument) => {
    const title = `📄 Nhắc hạn giấy tờ: ${doc.title}`;
    const body = `Giấy tờ xe ${currentVehicle.name} (${currentVehicle.plateNumber}) có hạn đến ngày ${formatDateVN(
      doc.expiryDate
    )}.`;
    const res = dispatchBrowserNotification(
      title,
      {
        body,
        category:
          doc.type === 'INSPECTION'
            ? 'INSPECTION'
            : doc.type === 'INSURANCE'
            ? 'INSURANCE'
            : 'TEST',
        vehiclePlate: currentVehicle.plateNumber,
        vehicleId: currentVehicle.id,
        severity: 'info',
        onClick: () => {
          setActiveTab('documents');
        },
      },
      settings
    );

    if (res.success) {
      showToast(`Đã gửi thông báo đẩy nhắc giấy tờ: ${doc.title}`);
    } else {
      if (res.reason === 'permission_denied') {
        setIsNotificationModalOpen(true);
        showToast('Vui lòng cấp quyền thông báo đẩy trình duyệt!', 'info');
      } else {
        showToast('Lỗi khi gửi thông báo', 'info');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 flex flex-col font-sans">
      {/* Navbar with Vehicle Selector, Push Notification Trigger & Action Triggers */}
      <Navbar
        currentVehicle={currentVehicle}
        vehicles={vehicles}
        onSelectVehicle={(v) => setActiveVehicleId(v.id)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAddVehicle={() => setIsVehicleModalOpen(true)}
        onOpenSos={() => setIsSosOpen(true)}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenDriveBackup={() => setIsDriveBackupOpen(true)}
        alertsCount={totalCount}
        urgentAlertsCount={urgentCount}
        activeTab={activeTab}
        onChangeTab={(t) => setActiveTab(t)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        {/* Permission Callout Banner if not yet granted */}
        <NotificationPermissionBanner
          permission={permission}
          onRequestPermission={requestPermission}
          onOpenSettings={() => setIsNotificationModalOpen(true)}
          urgentCount={urgentCount}
        />

        {activeTab === 'cockpit' && (
          <CockpitDashboard
            vehicle={currentVehicle}
            documents={documents}
            maintenance={maintenance}
            expenses={expenses}
            trips={trips}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenAddExpense={() => setActiveTab('expenses')}
            onOpenAddMaintenance={() => setActiveTab('maintenance')}
            onOpenSos={() => setIsSosOpen(true)}
            onUpdateOdo={handleUpdateOdo}
            onNavigateTab={(t) => setActiveTab(t)}
            onOpenNotifications={() => setIsNotificationModalOpen(true)}
            onTriggerNotification={handleTriggerNotificationFromCard}
            onOpenDriveBackup={() => setIsDriveBackupOpen(true)}
            activeAlertsCount={totalCount}
          />
        )}

        {activeTab === 'trips' && (
          <TripsView
            vehicle={currentVehicle}
            trips={trips}
            onAddTrip={handleAddTrip}
            onDeleteTrip={handleDeleteTrip}
            onNavigateTab={(t) => setActiveTab(t)}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsView
            vehicle={currentVehicle}
            documents={documents}
            onOpenScanner={() => setIsScannerOpen(true)}
            onDeleteDocument={handleDeleteDocument}
            onOpenNotifications={() => setIsNotificationModalOpen(true)}
            onTriggerDocNotification={handleTriggerDocNotification}
          />
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceView
            vehicle={currentVehicle}
            maintenance={maintenance}
            onOpenScanner={() => setIsScannerOpen(true)}
            onAddMaintenance={handleAddMaintenance}
            onDeleteMaintenance={handleDeleteMaintenance}
            onOpenNotifications={() => setIsNotificationModalOpen(true)}
            onTriggerMaintenanceNotification={() =>
              handleTriggerNotificationFromCard('MAINTENANCE_ODO')
            }
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            vehicle={currentVehicle}
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'copilot' && <CopilotView vehicle={currentVehicle} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/70 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Aufix • Ứng dụng quản lý xe thông minh & AI quét giấy tờ xe</span>
          <span className="font-mono text-cyan-400/80">AI Multimodal OCR & Smart Cockpit</span>
        </div>
      </footer>

      {/* Browser Notification Push Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        permission={permission}
        settings={settings}
        alerts={alerts}
        history={history}
        onRequestPermission={requestPermission}
        onUpdateSettings={updateSettings}
        onClearHistory={clearHistory}
        onTriggerTestNotification={triggerTestNotification}
        onTriggerAlertNotification={triggerAlertNotification}
        onPlayChime={playTestChime}
        onNavigateToVehicle={handleNavigateToAlert}
      />

      {/* Google Drive Online Backup & Restore Modal */}
      <GoogleDriveBackupModal
        isOpen={isDriveBackupOpen}
        onClose={() => setIsDriveBackupOpen(false)}
        vehicles={vehicles}
        documents={documents}
        maintenance={maintenance}
        expenses={expenses}
        trips={trips}
        settings={settings}
        onRestoreData={handleRestoreData}
        onShowToast={showToast}
      />

      {/* Document Scanner Modal (Camera, Upload, Realistic Presets & OCR Auto-Fill) */}
      <DocumentScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        currentVehicle={currentVehicle}
        allVehicles={vehicles}
        onApplyExtractedData={handleApplyExtractedData}
      />

      {/* Emergency SOS Modal */}
      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        currentVehicle={currentVehicle}
      />

      {/* Vehicle Manager / Add Vehicle Modal */}
      <VehicleManagerModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSaveVehicle={handleSaveVehicle}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-cyan-400/50 text-white shadow-2xl shadow-cyan-950 text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
