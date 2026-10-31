import React, { useState } from 'react';
import {
  Gauge,
  Camera,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Fuel,
  Wrench,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Phone,
  PlusCircle,
  FileText,
  DollarSign,
  Car,
  RotateCw,
  Bell,
  Send,
  Cloud,
  Navigation,
  Route,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { Vehicle, VehicleDocument, MaintenanceRecord, ExpenseRecord, TripRecord } from '../types/vehicle';
import { formatCurrencyVND, formatKm, formatDateVN, getDaysRemaining } from '../utils/formatters';
import { DrivingModeHUD } from './DrivingModeHUD';

interface CockpitDashboardProps {
  vehicle: Vehicle;
  documents: VehicleDocument[];
  maintenance: MaintenanceRecord[];
  expenses: ExpenseRecord[];
  trips?: TripRecord[];
  onOpenScanner: () => void;
  onOpenAddExpense: () => void;
  onOpenAddMaintenance: () => void;
  onOpenSos: () => void;
  onUpdateOdo: (newOdo: number) => void;
  onNavigateTab: (tab: string) => void;
  onOpenNotifications?: () => void;
  onTriggerNotification?: (category: 'INSPECTION' | 'MAINTENANCE_ODO' | 'INSURANCE') => void;
  onOpenDriveBackup?: () => void;
  activeAlertsCount?: number;
}

export const CockpitDashboard: React.FC<CockpitDashboardProps> = ({
  vehicle,
  documents,
  maintenance,
  expenses,
  trips = [],
  onOpenScanner,
  onOpenAddExpense,
  onOpenAddMaintenance,
  onOpenSos,
  onUpdateOdo,
  onNavigateTab,
  onOpenNotifications,
  onTriggerNotification,
  onOpenDriveBackup,
  activeAlertsCount = 0,
}) => {
  const [isDrivingMode, setIsDrivingMode] = useState(false);
  const [isEditingOdo, setIsEditingOdo] = useState(false);
  const [odoInput, setOdoInput] = useState(vehicle.currentOdo.toString());

  // Inspections and Insurances countdown
  const inspectionDays = getDaysRemaining(vehicle.inspectionExpiry);
  const insuranceDays = getDaysRemaining(vehicle.insuranceExpiry);

  // Next service calculation
  const nextServiceOdo = vehicle.nextServiceOdo || (Math.ceil(vehicle.currentOdo / 5000) * 5000);
  const kmUntilService = nextServiceOdo - vehicle.currentOdo;
  const serviceProgressPercent = Math.min(
    100,
    Math.max(0, Math.round(((5000 - (kmUntilService > 0 ? kmUntilService : 0)) / 5000) * 100))
  );

  // Total expenses
  const totalExpenseSum = expenses
    .filter((e) => e.vehicleId === vehicle.id)
    .reduce((sum, e) => sum + e.amount, 0);

  // Fuel stats
  const fuelExpenses = expenses.filter(
    (e) => e.vehicleId === vehicle.id && e.category === 'FUEL'
  );
  const totalFuelLiters = fuelExpenses.reduce((s, e) => s + (e.fuelVolume || 0), 0);

  const handleSaveOdo = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(odoInput, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateOdo(val);
      setIsEditingOdo(false);
    }
  };

  if (isDrivingMode) {
    return (
      <div className="space-y-4">
        <DrivingModeHUD
          vehicle={vehicle}
          onExit={() => setIsDrivingMode(false)}
          onOpenSos={onOpenSos}
          onLogTrip={() => {
            setIsDrivingMode(false);
            onNavigateTab('trips');
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP COCKPIT HERO: Vehicle Plate, ODO Telemetry & AI Scanner Callout */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-slate-900 via-slate-900/95 to-cyan-950/40 p-5 sm:p-7 shadow-2xl">
        {/* Cyber Grid Background effect */}
        <div className="absolute inset-0 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Plate & Vehicle identity */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-400/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                BUỒNG LÁI TRỰC TUYẾN
              </span>
              <span className="text-xs text-slate-400">
                Cập nhật lần cuối: {formatDateVN(vehicle.lastOdoUpdate || new Date().toISOString())}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {vehicle.name}
              </h1>
              {/* License Plate Graphic */}
              <div className="inline-flex items-center px-3.5 py-1 rounded-lg bg-amber-400/10 border-2 border-amber-400/80 text-amber-300 font-mono text-xl sm:text-2xl font-black tracking-widest shadow-lg shadow-amber-900/20">
                {vehicle.plateNumber}
              </div>
            </div>

            <p className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
              <span>Màu: <b className="text-slate-200">{vehicle.color || 'Tiêu chuẩn'}</b></span>
              <span>•</span>
              <span>Số khung: <b className="text-slate-200 font-mono">{vehicle.chassisNumber || 'MM7KF...'}</b></span>
              <span>•</span>
              <span>Động cơ: <b className="text-slate-200">{vehicle.engineCapacity || '1998cc'}</b></span>
            </p>
          </div>

          {/* Right: Odometer Display & Quick ODO Update & Driving Mode & AI Scan */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Đồng Hồ Công-Tơ-Mét (ODO)
                </span>
                <button
                  onClick={() => setIsEditingOdo(!isEditingOdo)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  {isEditingOdo ? 'Hủy' : '+ Cập nhật'}
                </button>
              </div>

              {isEditingOdo ? (
                <form onSubmit={handleSaveOdo} className="flex gap-2">
                  <input
                    type="number"
                    value={odoInput}
                    onChange={(e) => setOdoInput(e.target.value)}
                    className="w-32 bg-slate-900 border border-cyan-400/60 rounded px-2 py-1 text-sm font-mono text-white"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-cyan-500 text-slate-950 text-xs font-bold rounded"
                  >
                    Lưu
                  </button>
                </form>
              ) : (
                <div className="font-mono text-2xl sm:text-3xl font-black text-cyan-300 tracking-wider">
                  {vehicle.currentOdo.toLocaleString()} <span className="text-sm font-normal text-slate-400">km</span>
                </div>
              )}
            </div>

            <div className="h-px sm:h-12 w-full sm:w-px bg-slate-800" />

            {/* Driving Mode Button */}
            <button
              onClick={() => setIsDrivingMode(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer whitespace-nowrap group"
              title="Bật Chế độ lái xe: Đồng hồ tốc độ lớn & tối giản xe, tắt các cảnh báo không cần thiết"
            >
              <Gauge className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
              <span>Chế Độ Lái Xe</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-950/20 text-slate-900 tracking-wider">
                HUD
              </span>
            </button>

            {/* AI Scan CTA in Cockpit */}
            <button
              onClick={onOpenScanner}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-4 h-4" />
              <span>Chụp / Thêm Giấy Tờ AI</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. CRITICAL ALERT STRIP: Đăng Kiểm & Bảo Hiểm Countdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Đăng kiểm Countdown Card */}
        <div
          onClick={() => onNavigateTab('documents')}
          className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 p-4 hover:border-amber-500/50 cursor-pointer transition-all hover:bg-slate-850"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Hạn Đăng Kiểm Xe</h4>
                <p className="text-[10px] text-slate-400">Kiểm định an toàn kỹ thuật</p>
              </div>
            </div>
            {inspectionDays != null ? (
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  inspectionDays <= 30
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/40 animate-pulse'
                    : inspectionDays <= 60
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {inspectionDays > 0 ? `Còn ${inspectionDays} ngày` : 'Đã quá hạn!'}
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">Chưa nhập</span>
            )}
          </div>

          <div className="flex items-baseline justify-between mt-3">
            <span className="text-xs text-slate-400">Hạn cuối:</span>
            <span className="font-mono text-sm font-bold text-amber-300">
              {formatDateVN(vehicle.inspectionExpiry)}
            </span>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Bell className="w-3 h-3 text-amber-400" />
              <span>Nhắc đẩy: <b className="text-amber-300 font-normal">Tự động</b></span>
            </div>
            {onTriggerNotification && vehicle.inspectionExpiry && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerNotification('INSPECTION');
                }}
                className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                title="Bắn thử thông báo đẩy hạn đăng kiểm này"
              >
                <Send className="w-2.5 h-2.5" />
                <span>Bắn thử</span>
              </button>
            )}
          </div>
        </div>

        {/* Bảo hiểm TNDS & Thân Vỏ */}
        <div
          onClick={() => onNavigateTab('documents')}
          className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 p-4 hover:border-cyan-500/50 cursor-pointer transition-all hover:bg-slate-850"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Hạn Bảo Hiểm</h4>
                <p className="text-[10px] text-slate-400">{vehicle.insurerName || 'Bảo hiểm PVI'}</p>
              </div>
            </div>
            {insuranceDays != null ? (
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  insuranceDays <= 30
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {insuranceDays > 0 ? `Còn ${insuranceDays} ngày` : 'Hết hạn'}
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">Chưa nhập</span>
            )}
          </div>

          <div className="flex items-baseline justify-between mt-3">
            <span className="text-xs text-slate-400">Hiệu lực đến:</span>
            <span className="font-mono text-sm font-bold text-cyan-300">
              {formatDateVN(vehicle.insuranceExpiry)}
            </span>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Bell className="w-3 h-3 text-cyan-400" />
              <span>Nhắc hạn: <b className="text-cyan-300 font-normal">Tự động</b></span>
            </div>
            {onTriggerNotification && vehicle.insuranceExpiry && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerNotification('INSURANCE');
                }}
                className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold border border-cyan-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                title="Bắn thử thông báo đẩy bảo hiểm này"
              >
                <Send className="w-2.5 h-2.5" />
                <span>Bắn thử</span>
              </button>
            )}
          </div>
        </div>

        {/* Bảo Dưỡng Định Kỳ Tiếp Theo */}
        <div
          onClick={() => onNavigateTab('maintenance')}
          className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 p-4 hover:border-sky-500/50 cursor-pointer transition-all hover:bg-slate-850"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Kỳ Bảo Dưỡng Tới</h4>
                <p className="text-[10px] text-slate-400">{vehicle.nextServiceLevel || 'Cấp 40.000 km'}</p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-500/30">
              {kmUntilService > 0 ? `Còn ${kmUntilService.toLocaleString()} km` : 'Tới hạn!'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Mốc đích: {formatKm(nextServiceOdo)}</span>
              <span>{serviceProgressPercent}% chu kỳ</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all"
                style={{ width: `${serviceProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Bell className="w-3 h-3 text-sky-400" />
              <span>Nhắc ODO: <b className="text-sky-300 font-normal">Tự động</b></span>
            </div>
            {onTriggerNotification && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerNotification('MAINTENANCE_ODO');
                }}
                className="px-2 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-[10px] font-semibold border border-sky-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                title="Bắn thử thông báo đẩy mốc bảo dưỡng này"
              >
                <Send className="w-2.5 h-2.5" />
                <span>Bắn thử</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2.5 Cockpit Browser Notification Telemetry Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-cyan-500/20 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-white">Hệ thống thông báo đẩy Aufix: </span>
            <span className="text-slate-300">
              {activeAlertsCount > 0
                ? `Đang theo dõi ${activeAlertsCount} mốc kiểm định & bảo dưỡng cần chú ý`
                : 'Đang chạy nền tự động canh mốc ODO & ngày đăng kiểm định kỳ'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
          {onOpenDriveBackup && (
            <button
              onClick={onOpenDriveBackup}
              className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sao lưu & Phục hồi Google Drive trực tuyến"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Sao lưu Drive</span>
            </button>
          )}

          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Quản lý nhắc nhở</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. QUICK ACTION TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setIsDrivingMode(true)}
          className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-teal-950/40 border border-emerald-500/30 hover:border-emerald-400 hover:bg-slate-850 flex flex-col items-start text-left transition-all group shadow-md cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Gauge className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white group-hover:text-emerald-300 flex items-center gap-1.5">
            <span>Chế Độ Lái Xe</span>
            <span className="px-1 py-0.2 rounded text-[8px] bg-emerald-400 text-slate-950 font-black">HUD</span>
          </span>
          <span className="text-[10px] text-slate-400">Đồng hồ tốc độ & tối giản</span>
        </button>

        <button
          onClick={onOpenScanner}
          className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 flex flex-col items-start text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Camera className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white group-hover:text-cyan-300">
            Quét Giấy Tờ AI
          </span>
          <span className="text-[10px] text-slate-400">Cà vẹt, Đăng kiểm, Bảo hiểm</span>
        </button>

        <button
          onClick={onOpenAddExpense}
          className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 flex flex-col items-start text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Fuel className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white group-hover:text-amber-300">
            Ghi Đổ Xăng
          </span>
          <span className="text-[10px] text-slate-400">Tính Lít / 100km</span>
        </button>

        <button
          onClick={onOpenAddMaintenance}
          className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-850 flex flex-col items-start text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Wrench className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white group-hover:text-sky-300">
            Ghi Bảo Dưỡng
          </span>
          <span className="text-[10px] text-slate-400">Thay dầu, phụ tùng</span>
        </button>

        <button
          onClick={onOpenSos}
          className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-850 flex flex-col items-start text-left transition-all group col-span-2 sm:col-span-1"
        >
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Phone className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white group-hover:text-rose-300">
            Cứu Hộ & SOS
          </span>
          <span className="text-[10px] text-slate-400">Hotline bảo hiểm 24/7</span>
        </button>
      </div>

      {/* 4. DIGITAL WALLET QUICK CHECK, RECENT MAINTENANCE & RECENT TRIPS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Sổ giấy tờ số hóa */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Sổ Giấy Tờ Xe Đã Lưu</h3>
            </div>
            <button
              onClick={() => onNavigateTab('documents')}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              Xem tất cả ({documents.filter((d) => d.vehicleId === vehicle.id).length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {documents
              .filter((d) => d.vehicleId === vehicle.id)
              .slice(0, 3)
              .map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onNavigateTab('documents')}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-slate-300">
                      {doc.type === 'REGISTRATION' ? (
                        <Car className="w-3.5 h-3.5 text-emerald-400" />
                      ) : doc.type === 'INSPECTION' ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">{doc.title}</div>
                      <div className="text-[10px] text-slate-400">
                        {doc.certificateNumber || 'Bản số hóa'} • Cấp: {formatDateVN(doc.issueDate)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    Hợp lệ
                  </span>
                </div>
              ))}

            {documents.filter((d) => d.vehicleId === vehicle.id).length === 0 && (
              <div className="text-center py-6 text-slate-500 text-xs">
                Chưa có giấy tờ nào được lưu. Bấm "Quét Giấy Tờ AI" để chụp và tự động điền ngay!
              </div>
            )}
          </div>
        </div>

        {/* Lịch sử bảo dưỡng gần nhất */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Nhật Ký Bảo Dưỡng Gần Nhất</h3>
            </div>
            <button
              onClick={() => onNavigateTab('maintenance')}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              Chi tiết ({maintenance.filter((m) => m.vehicleId === vehicle.id).length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {maintenance
              .filter((m) => m.vehicleId === vehicle.id)
              .slice(0, 3)
              .map((maint) => (
                <div
                  key={maint.id}
                  onClick={() => onNavigateTab('maintenance')}
                  className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200">{maint.level}</span>
                    <span className="font-mono font-bold text-amber-300">
                      {formatCurrencyVND(maint.totalCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{maint.garageName}</span>
                    <span className="font-mono text-sky-300">{formatKm(maint.odometerKm)}</span>
                  </div>
                </div>
              ))}

            {maintenance.filter((m) => m.vehicleId === vehicle.id).length === 0 && (
              <div className="text-center py-6 text-slate-500 text-xs">
                Chưa có nhật ký bảo dưỡng nào.
              </div>
            )}
          </div>
        </div>

        {/* Nhật ký hành trình gần nhất */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Hành Trình Gần Nhất</h3>
            </div>
            <button
              onClick={() => onNavigateTab('trips')}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              Chi tiết ({trips.filter((t) => t.vehicleId === vehicle.id).length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {trips
              .filter((t) => t.vehicleId === vehicle.id)
              .slice(0, 3)
              .map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => onNavigateTab('trips')}
                  className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white flex items-center gap-1 truncate text-xs">
                      <span className="truncate max-w-[90px]">{trip.startLocation.split(',')[0]}</span>
                      <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate max-w-[90px]">{trip.endLocation.split(',')[0]}</span>
                    </span>
                    <span className="font-mono font-bold text-cyan-300 shrink-0">
                      {trip.distanceKm} km
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{formatDateVN(trip.date)}</span>
                    <span className="font-mono text-emerald-300 text-[10px]">
                      ODO: {trip.endOdo.toLocaleString()} km
                    </span>
                  </div>
                </div>
              ))}

            {trips.filter((t) => t.vehicleId === vehicle.id).length === 0 && (
              <div className="text-center py-6 text-slate-500 text-xs space-y-2">
                <p>Chưa có lộ trình nào được ghi.</p>
                <button
                  onClick={() => onNavigateTab('trips')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/20 hover:bg-cyan-500/20 cursor-pointer"
                >
                  + Ghi hành trình & cập nhật ODO
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
