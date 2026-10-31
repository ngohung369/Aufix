import React, { useState, useMemo } from 'react';
import {
  Route,
  MapPin,
  Calendar,
  Clock,
  Briefcase,
  Home,
  Compass,
  Plus,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  Gauge,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Car,
  Fuel,
  Info,
  X,
  Zap,
} from 'lucide-react';
import { Vehicle, TripRecord, TripPurpose } from '../types/vehicle';
import { formatDateVN, formatKm } from '../utils/formatters';

interface TripsViewProps {
  vehicle: Vehicle;
  trips: TripRecord[];
  onAddTrip: (trip: TripRecord, updateOdo: boolean) => void;
  onDeleteTrip: (tripId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

const PURPOSE_CONFIG: Record<
  TripPurpose,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  COMMUTE: {
    label: 'Đi làm hàng ngày',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    icon: Home,
  },
  BUSINESS: {
    label: 'Công tác / Đối tác',
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    icon: Briefcase,
  },
  FAMILY: {
    label: 'Gia đình / Việc riêng',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    icon: Home,
  },
  TRAVEL: {
    label: 'Du lịch / Đi phượt',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: Compass,
  },
  DELIVERY: {
    label: 'Chở hàng / Dịch vụ',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    icon: Car,
  },
  OTHER: {
    label: 'Khác',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    icon: Route,
  },
};

export const TripsView: React.FC<TripsViewProps> = ({
  vehicle,
  trips,
  onAddTrip,
  onDeleteTrip,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPurposeFilter, setSelectedPurposeFilter] = useState<string>('ALL');

  // Form state
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [distanceKm, setDistanceKm] = useState<string>('15');
  const [purpose, setPurpose] = useState<TripPurpose>('COMMUTE');
  const [purposeNote, setPurposeNote] = useState('');
  const [tripDate, setTripDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tripTime, setTripTime] = useState(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  const [startOdo, setStartOdo] = useState<number>(vehicle.currentOdo);
  const [autoUpdateOdo, setAutoUpdateOdo] = useState(true);
  const [notes, setNotes] = useState('');

  // Keep startOdo synced when modal opens or vehicle changes
  const handleOpenAddModal = (preset?: { start: string; end: string; km: number; purpose: TripPurpose }) => {
    setStartOdo(vehicle.currentOdo);
    if (preset) {
      setStartLocation(preset.start);
      setEndLocation(preset.end);
      setDistanceKm(preset.km.toString());
      setPurpose(preset.purpose);
    } else {
      setStartLocation('');
      setEndLocation('');
      setDistanceKm('');
      setPurpose('COMMUTE');
    }
    setPurposeNote('');
    setNotes('');
    setAutoUpdateOdo(true);
    setIsAddModalOpen(true);
  };

  // Filter trips for current vehicle
  const vehicleTrips = useMemo(() => {
    return trips.filter((t) => t.vehicleId === vehicle.id);
  }, [trips, vehicle.id]);

  // Statistics
  const totalKm = useMemo(() => {
    return vehicleTrips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
  }, [vehicleTrips]);

  const thisMonthKm = useMemo(() => {
    const currentMonthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
    return vehicleTrips
      .filter((t) => t.date && t.date.startsWith(currentMonthPrefix))
      .reduce((sum, t) => sum + (t.distanceKm || 0), 0);
  }, [vehicleTrips]);

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return vehicleTrips.filter((trip) => {
      const matchPurpose = selectedPurposeFilter === 'ALL' || trip.purpose === selectedPurposeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        trip.startLocation.toLowerCase().includes(q) ||
        trip.endLocation.toLowerCase().includes(q) ||
        (trip.purposeNote && trip.purposeNote.toLowerCase().includes(q)) ||
        (trip.notes && trip.notes.toLowerCase().includes(q));
      return matchPurpose && matchQuery;
    });
  }, [vehicleTrips, selectedPurposeFilter, searchQuery]);

  // Calculated End ODO for the form
  const parsedDistance = parseFloat(distanceKm) || 0;
  const calculatedEndOdo = startOdo + parsedDistance;

  // Form submission
  const handleSubmitTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startLocation.trim() || !endLocation.trim()) return;
    if (parsedDistance <= 0) return;

    const newTrip: TripRecord = {
      id: 'trip-' + Date.now(),
      vehicleId: vehicle.id,
      date: tripDate,
      time: tripTime,
      startLocation: startLocation.trim(),
      endLocation: endLocation.trim(),
      distanceKm: parsedDistance,
      purpose,
      purposeNote: purposeNote.trim() || undefined,
      startOdo,
      endOdo: calculatedEndOdo,
      autoOdoUpdated: autoUpdateOdo,
      fuelCostEstimate: vehicle.type === 'CAR' ? Math.round(parsedDistance * 2000) : Math.round(parsedDistance * 600),
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddTrip(newTrip, autoUpdateOdo);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER: Vehicle Context & Action */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-slate-900 via-slate-900/95 to-cyan-950/40 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-400/30 flex items-center gap-1.5">
                <Route className="w-3.5 h-3.5 text-cyan-400" />
                NHẬT KÝ HÀNH TRÌNH
              </span>
              <span className="font-mono text-xs text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                {vehicle.plateNumber}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Nhật Ký Hành Trình & Lộ Trình Xe
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Ghi lại điểm đi, điểm đến, mục đích di chuyển và quãng đường. Khi lưu, hệ thống sẽ tự động cập nhật ODO công-tơ-mét của xe chính xác.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi Chuyến Đi Mới</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Tổng quãng đường</span>
            <Route className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300">
            {formatKm(totalKm)}
          </div>
          <div className="text-[10px] text-slate-500">
            Từ {vehicleTrips.length} chuyến đi đã ghi
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Quãng đường tháng này</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300">
            {formatKm(thisMonthKm)}
          </div>
          <div className="text-[10px] text-slate-500">
            Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>ODO xe hiện tại</span>
            <Gauge className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-300">
            {vehicle.currentOdo.toLocaleString()} km
          </div>
          <div className="text-[10px] text-slate-500">
            Tự động đồng bộ sau mỗi lộ trình
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Trung bình mỗi chuyến</span>
            <Compass className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-sky-300">
            {vehicleTrips.length > 0 ? (totalKm / vehicleTrips.length).toFixed(1) : 0} km
          </div>
          <div className="text-[10px] text-slate-500">
            Cự ly hành trình tiêu biểu
          </div>
        </div>
      </div>

      {/* 3. QUICK PRESET SUGGESTIONS */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Gợi ý lộ trình nhanh (Bấm để điền mẫu ngay):</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              handleOpenAddModal({
                start: 'Nhà riêng (Cầu Giấy, HN)',
                end: 'Văn phòng làm việc (Hoàn Kiếm, HN)',
                km: 9.5,
                purpose: 'COMMUTE',
              })
            }
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home className="w-3 h-3 text-emerald-400" />
            <span>Đi làm: Nhà $\rightarrow$ Công ty (9.5 km)</span>
          </button>
          <button
            onClick={() =>
              handleOpenAddModal({
                start: 'Cầu Giấy, Hà Nội',
                end: 'Sân bay Quốc tế Nội Bài',
                km: 28,
                purpose: 'BUSINESS',
              })
            }
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Briefcase className="w-3 h-3 text-sky-400" />
            <span>Sân bay Nội Bài (28 km)</span>
          </button>
          <button
            onClick={() =>
              handleOpenAddModal({
                start: 'Trung tâm Hà Nội',
                end: 'KĐT Vinhomes Ocean Park 2 (Hưng Yên)',
                km: 25,
                purpose: 'FAMILY',
              })
            }
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home className="w-3 h-3 text-purple-400" />
            <span>Về thăm gia đình ngoại thành (25 km)</span>
          </button>
          <button
            onClick={() =>
              handleOpenAddModal({
                start: 'Hà Nội',
                end: 'Tam Đảo / Hạ Long',
                km: 85,
                purpose: 'TRAVEL',
              })
            }
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Compass className="w-3 h-3 text-amber-400" />
            <span>Đi du lịch / Cuối tuần (85 km)</span>
          </button>
        </div>
      </div>

      {/* 4. FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo điểm đi, điểm đến, ghi chú chuyến đi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Purpose Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={selectedPurposeFilter}
            onChange={(e) => setSelectedPurposeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Tất cả mục đích ({vehicleTrips.length})</option>
            <option value="COMMUTE">Đi làm hàng ngày</option>
            <option value="BUSINESS">Công tác / Đối tác</option>
            <option value="FAMILY">Gia đình / Việc riêng</option>
            <option value="TRAVEL">Du lịch / Phượt</option>
            <option value="DELIVERY">Chở hàng / Dịch vụ</option>
            <option value="OTHER">Mục đích khác</option>
          </select>
        </div>
      </div>

      {/* 5. TRIP TIMELINE LIST */}
      <div className="space-y-3">
        {filteredTrips.map((trip) => {
          const config = PURPOSE_CONFIG[trip.purpose] || PURPOSE_CONFIG.OTHER;
          const PurposeIcon = config.icon;

          return (
            <div
              key={trip.id}
              className="relative overflow-hidden rounded-xl border border-slate-800/90 bg-slate-900/70 hover:bg-slate-900 p-4 sm:p-5 transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Locations & Purpose */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Purpose Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.bg} ${config.text} ${config.border}`}
                    >
                      <PurposeIcon className="w-3 h-3" />
                      <span>{config.label}</span>
                    </span>

                    {/* Date & Time */}
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{formatDateVN(trip.date)}</span>
                      {trip.time && (
                        <>
                          <span>•</span>
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{trip.time}</span>
                        </>
                      )}
                    </span>

                    {/* Auto-updated ODO status pill */}
                    {trip.autoOdoUpdated && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Đã cộng ODO</span>
                      </span>
                    )}
                  </div>

                  {/* Route Visual: Start -> End */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm sm:text-base font-semibold text-white">
                    <div className="flex items-center gap-2 text-slate-300">
                      <div className="w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-cyan-500/20 shrink-0" />
                      <span className="break-words">{trip.startLocation}</span>
                    </div>

                    <div className="hidden sm:flex items-center text-cyan-400 px-1">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <div className="sm:hidden text-cyan-400 text-xs pl-5 font-mono">
                      $\downarrow$ Đi đến:
                    </div>

                    <div className="flex items-center gap-2 text-white font-bold">
                      <div className="w-3 h-3 rounded-full bg-amber-400 ring-4 ring-amber-500/20 shrink-0" />
                      <span className="break-words">{trip.endLocation}</span>
                    </div>
                  </div>

                  {/* Purpose Note & Additional info */}
                  {(trip.purposeNote || trip.notes) && (
                    <div className="text-xs text-slate-400 flex items-start gap-1.5 pl-0 sm:pl-5">
                      <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>
                        {trip.purposeNote && <b className="text-slate-300">{trip.purposeNote}</b>}
                        {trip.purposeNote && trip.notes && ' — '}
                        {trip.notes}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Distance, Odometer Range & Action */}
                <div className="flex items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                  {/* Distance */}
                  <div className="text-left lg:text-right">
                    <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300">
                      {trip.distanceKm} <span className="text-xs font-normal text-slate-400">km</span>
                    </div>
                    {/* ODO range */}
                    <div className="text-[11px] font-mono text-slate-400">
                      ODO: <span className="text-slate-300">{trip.startOdo?.toLocaleString()}</span> $\rightarrow${' '}
                      <span className="text-amber-300 font-bold">{trip.endOdo.toLocaleString()} km</span>
                    </div>
                    {trip.fuelCostEstimate && (
                      <div className="text-[10px] text-slate-500 flex items-center lg:justify-end gap-1">
                        <Fuel className="w-3 h-3 text-amber-500/70" />
                        <span>~{trip.fuelCostEstimate.toLocaleString()} đ xăng</span>
                      </div>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => onDeleteTrip(trip.id)}
                    className="p-2 rounded-lg bg-slate-800/60 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-colors cursor-pointer"
                    title="Xóa chuyến đi này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTrips.length === 0 && (
          <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
              <Route className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Chưa có nhật ký hành trình nào</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Bắt đầu ghi lại các chuyến đi để theo dõi lộ trình và tự động cập nhật ODO công-tơ-mét của xe!
            </p>
            <button
              onClick={() => handleOpenAddModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi chuyến đi đầu tiên</span>
            </button>
          </div>
        )}
      </div>

      {/* 6. ADD TRIP MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 space-y-5 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                  <Route className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ghi Nhật Ký Chuyến Đi</h3>
                  <p className="text-xs text-slate-400">
                    Xe: <b className="text-cyan-300">{vehicle.name}</b> ({vehicle.plateNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitTrip} className="space-y-4 text-xs">
              {/* Điểm đi & Điểm đến */}
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Điểm đi (Nơi xuất phát) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nhà riêng (Hoàng Đạo Thúy, Cầu Giấy)"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Điểm đến (Nơi kết thúc) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Sân bay Quốc tế Nội Bài / Văn phòng công ty"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Quãng đường & Mục đích */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Quãng đường (km) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      placeholder="15"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-10 py-2 text-white font-mono text-sm font-bold focus:outline-none focus:border-cyan-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                      km
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Mục đích chuyến đi
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as TripPurpose)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="COMMUTE">Đi làm hàng ngày</option>
                    <option value="BUSINESS">Công tác / Gặp đối tác</option>
                    <option value="FAMILY">Gia đình / Việc riêng</option>
                    <option value="TRAVEL">Du lịch / Đi phượt</option>
                    <option value="DELIVERY">Chở hàng / Dịch vụ</option>
                    <option value="OTHER">Mục đích khác</option>
                  </select>
                </div>
              </div>

              {/* Chi tiết mục đích */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Chi tiết mục đích / Khách hàng / Tuyến đường
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đón khách chuyên gia, họp dự án tại Keangnam"
                  value={purposeNote}
                  onChange={(e) => setPurposeNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Ngày & Giờ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Ngày đi
                  </label>
                  <input
                    type="date"
                    value={tripDate}
                    onChange={(e) => setTripDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Giờ đi
                  </label>
                  <input
                    type="time"
                    value={tripTime}
                    onChange={(e) => setTripTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* ODO AUTO-UPDATE SECTION */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/40 to-slate-950 border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-xs">
                      Tự động cập nhật ODO công-tơ-mét của xe
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoUpdateOdo}
                      onChange={(e) => setAutoUpdateOdo(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">ODO ban đầu:</span>
                    <span className="text-slate-200 font-bold">{startOdo.toLocaleString()} km</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-cyan-500/40">
                    <span className="text-cyan-300 block text-[10px]">ODO sau chuyến:</span>
                    <span className="text-amber-300 font-bold text-xs">
                      {calculatedEndOdo.toLocaleString()} km
                    </span>
                  </div>
                </div>

                {autoUpdateOdo ? (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Khi bấm Lưu, ODO của xe sẽ tự động tăng từ <b>{startOdo.toLocaleString()}</b> lên{' '}
                      <b>{calculatedEndOdo.toLocaleString()} km</b>.
                    </span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Chỉ lưu chuyến đi vào nhật ký, không thay đổi ODO hiện tại của xe.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu Chuyến Đi & Cập Nhật ODO</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
