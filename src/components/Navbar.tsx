import React from 'react';
import {
  Car,
  Bike,
  Plus,
  Camera,
  PhoneCall,
  Gauge,
  FileText,
  Wrench,
  Fuel,
  Bot,
  ChevronDown,
  Sparkles,
  Bell,
  Cloud,
  Route,
} from 'lucide-react';
import { Vehicle } from '../types/vehicle';
import { formatKm } from '../utils/formatters';

interface NavbarProps {
  currentVehicle: Vehicle;
  vehicles: Vehicle[];
  onSelectVehicle: (v: Vehicle) => void;
  onOpenScanner: () => void;
  onOpenAddVehicle: () => void;
  onOpenSos: () => void;
  onOpenNotifications: () => void;
  onOpenDriveBackup: () => void;
  alertsCount?: number;
  urgentAlertsCount?: number;
  activeTab: string;
  onChangeTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentVehicle,
  vehicles,
  onSelectVehicle,
  onOpenScanner,
  onOpenAddVehicle,
  onOpenSos,
  onOpenNotifications,
  onOpenDriveBackup,
  alertsCount = 0,
  urgentAlertsCount = 0,
  activeTab,
  onChangeTab,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const tabs = [
    { id: 'cockpit', label: 'Buồng Lái', icon: Gauge },
    { id: 'trips', label: 'Hành Trình', icon: Route },
    { id: 'documents', label: 'Giấy Tờ Xe', icon: FileText },
    { id: 'maintenance', label: 'Bảo Dưỡng', icon: Wrench },
    { id: 'expenses', label: 'Chi Phí & Xăng', icon: Fuel },
    { id: 'copilot', label: 'Aufix Copilot', icon: Bot },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      {/* Top Bar: Brand, Vehicle Switcher & Action buttons */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Brand & Vehicle Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onChangeTab('cockpit')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-sky-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 text-sm">
              A
            </div>
            <div className="hidden xs:block">
              <span className="font-extrabold text-sm sm:text-base tracking-wider text-white">
                AU<span className="text-cyan-400">FIX</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                QUẢN LÝ XE
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Vehicle Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs text-left transition-all"
            >
              <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
                {currentVehicle?.type === 'MOTORBIKE' ? (
                  <Bike className="w-3.5 h-3.5" />
                ) : (
                  <Car className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="max-w-[130px] sm:max-w-[200px] truncate">
                <span className="font-bold text-white block truncate">
                  {currentVehicle?.name || 'Chọn phương tiện'}
                </span>
                <span className="font-mono text-[11px] text-amber-400 font-semibold">
                  {currentVehicle?.plateNumber}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                  Nhà để xe (Garage)
                </div>
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      onSelectVehicle(v);
                      setDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                      v.id === currentVehicle?.id
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {v.type === 'MOTORBIKE' ? (
                        <Bike className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Car className="w-4 h-4 text-cyan-400" />
                      )}
                      <div className="truncate">
                        <div className="font-semibold truncate">{v.name}</div>
                        <div className="font-mono text-[10px] text-amber-300">{v.plateNumber}</div>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {formatKm(v.currentOdo)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-800 mt-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenAddVehicle();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm xe mới vào Garage
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions: Quét Giấy Tờ AI, Thông Báo Đẩy & SOS */}
        <div className="flex items-center gap-2">
          {/* Notification Center Trigger */}
          <button
            onClick={onOpenNotifications}
            className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              urgentAlertsCount > 0
                ? 'bg-rose-950/70 border-rose-500/50 text-rose-300 hover:bg-rose-900/80 shadow-lg shadow-rose-950'
                : alertsCount > 0
                ? 'bg-slate-900 border-cyan-500/40 text-cyan-300 hover:bg-slate-800'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Trung tâm thông báo đẩy & Nhắc nhở xe"
          >
            <Bell
              className={`w-4 h-4 ${
                urgentAlertsCount > 0
                  ? 'text-rose-400 animate-bounce'
                  : alertsCount > 0
                  ? 'text-cyan-400'
                  : 'text-slate-400'
              }`}
            />
            <span className="hidden md:inline">Nhắc Nhở</span>
            {alertsCount > 0 && (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  urgentAlertsCount > 0
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-cyan-500 text-slate-950'
                }`}
              >
                {alertsCount}
              </span>
            )}
          </button>

          {/* Google Drive Backup Trigger */}
          <button
            onClick={onOpenDriveBackup}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
            title="Sao lưu & Đồng bộ Google Drive trực tuyến"
          >
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Sao Lưu Drive</span>
            <span className="sm:hidden">Drive</span>
          </button>

          {/* Scan CTA */}
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden xs:inline">Quét Giấy Tờ AI</span>
            <span className="xs:hidden">Quét AI</span>
            <Sparkles className="w-3.5 h-3.5 hidden sm:inline" />
          </button>

          {/* SOS Emergency button */}
          <button
            onClick={onOpenSos}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-semibold transition-colors"
            title="Cứu hộ khẩn cấp & Hotline bảo hiểm"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="hidden sm:inline">SOS Cứu Hộ</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-t border-slate-800/80 bg-slate-950/50 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 flex gap-1 sm:gap-2 py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.id === 'copilot' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
