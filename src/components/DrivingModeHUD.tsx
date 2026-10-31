import React, { useState, useEffect, useRef } from 'react';
import {
  Gauge,
  Navigation,
  ShieldCheck,
  Compass,
  Clock,
  X,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Route,
} from 'lucide-react';
import { Vehicle } from '../types/vehicle';
import { formatKm } from '../utils/formatters';

interface DrivingModeHUDProps {
  vehicle: Vehicle;
  onExit: () => void;
  onOpenSos?: () => void;
  onLogTrip?: () => void;
}

export const DrivingModeHUD: React.FC<DrivingModeHUDProps> = ({
  vehicle,
  onExit,
  onOpenSos,
  onLogTrip,
}) => {
  // Speed state (in km/h)
  const [speed, setSpeed] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [targetSpeed, setTargetSpeed] = useState<number>(0);
  const [speedLimit, setSpeedLimit] = useState<number>(60); // 50, 60, 80, 100, 120 km/h
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [headingDegrees, setHeadingDegrees] = useState<number>(45); // Compass heading
  const [tripSeconds, setTripSeconds] = useState<number>(0);

  // Current real time
  const [currentTime, setCurrentTime] = useState<string>(() =>
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Update clock every second & increment trip timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setTripSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real GPS Speed tracking via Geolocation API
  useEffect(() => {
    let watchId: number | null = null;
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            setGpsActive(true);
            setGpsAccuracy(position.coords.accuracy ? Math.round(position.coords.accuracy) : null);
            if (position.coords.heading !== null && !isNaN(position.coords.heading)) {
              setHeadingDegrees(Math.round(position.coords.heading));
            }
            // Only update speed from GPS if NOT in manual simulation mode
            if (!isSimulating && position.coords.speed !== null && !isNaN(position.coords.speed)) {
              const kmh = Math.max(0, Math.round(position.coords.speed * 3.6));
              setSpeed(kmh);
            }
          },
          (err) => {
            console.warn('GPS geolocation watch warning:', err.message);
            setGpsActive(false);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 5000,
          }
        );
      } catch (e) {
        console.warn('Failed to start geolocation:', e);
      }
    }

    return () => {
      if (watchId !== null && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isSimulating]);

  // Smooth acceleration/deceleration loop when simulating
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSpeed((prev) => {
        if (prev < targetSpeed) {
          const step = Math.min(3, targetSpeed - prev);
          return prev + step;
        } else if (prev > targetSpeed) {
          const step = Math.min(4, prev - targetSpeed);
          return prev - step;
        }
        return prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isSimulating, targetSpeed]);

  // Next service calculation
  const nextServiceOdo = vehicle.nextServiceOdo || (Math.ceil(vehicle.currentOdo / 5000) * 5000);
  const kmUntilService = nextServiceOdo - vehicle.currentOdo;

  // Compass cardinal direction
  const getCardinalDirection = (deg: number) => {
    const directions = ['Bắc (N)', 'Đông Bắc (NE)', 'Đông (E)', 'Đông Nam (SE)', 'Nam (S)', 'Tây Nam (SW)', 'Tây (W)', 'Tây Bắc (NW)'];
    const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 45) % 8;
    return directions[index];
  };

  // Overspeed check
  const isOverspeed = speed > speedLimit;

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Format trip time
  const formatTripTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const hours = Math.floor(mins / 60);
    if (hours > 0) {
      return `${hours}h ${mins % 60}m`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Speedometer arc gauge calculations (0 to 160 km/h)
  const maxDialSpeed = 160;
  const speedPercentage = Math.min(100, Math.max(0, (speed / maxDialSpeed) * 100));
  // Arc radius 140, circumference for a 240 degree sweep
  const arcRadius = 135;
  const arcCircumference = 2 * Math.PI * arcRadius * (240 / 360);
  const strokeDashoffset = arcCircumference - (arcCircumference * speedPercentage) / 100;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col min-h-[620px] rounded-3xl bg-slate-950 border-2 border-cyan-500/30 text-white overflow-hidden shadow-2xl p-4 sm:p-6 lg:p-8 select-none transition-colors"
      style={{
        boxShadow: isOverspeed
          ? '0 0 60px rgba(239, 68, 68, 0.35)'
          : '0 0 50px rgba(6, 182, 212, 0.15)',
      }}
    >
      {/* Background Cyber HUD subtle grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

      {/* TOP BAR: Minimalist vehicle summary & essential controls */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        {/* Left: Vehicle Plate + Brand summary */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1 rounded-lg bg-amber-400/10 border-2 border-amber-400/90 text-amber-300 font-mono text-xl sm:text-2xl font-black tracking-widest shadow-md shadow-amber-900/30">
            {vehicle.plateNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base sm:text-lg tracking-tight">
                {vehicle.name}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                HUD LÁI XE
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
              <span>ODO: <b className="text-slate-200">{vehicle.currentOdo.toLocaleString()} km</b></span>
              <span>•</span>
              <span className="text-cyan-300">
                {kmUntilService > 0 ? `Bảo dưỡng sau: ${formatKm(kmUntilService)}` : 'Đã đến hạn bảo dưỡng'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Suppressed Alert Notice */}
        <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs shadow-inner">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Tất cả cảnh báo không cần thiết đã tắt để lái xe an toàn</span>
        </div>

        {/* Right: Real time clock & Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-cyan-300 text-sm sm:text-base font-bold">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{currentTime}</span>
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Bật/Tắt chế độ toàn màn hình"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden md:inline">Toàn màn hình</span>
          </button>

          {/* SOS Emergency button */}
          {onOpenSos && (
            <button
              onClick={onOpenSos}
              className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
              title="Cứu hộ khẩn cấp 24/7"
            >
              SOS
            </button>
          )}

          {/* Exit Driving Mode button */}
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-rose-950/50 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Thoát Chế Độ Lái</span>
          </button>
        </div>
      </div>

      {/* MOBILE NOTICE: Notice for non-XL screens */}
      <div className="xl:hidden mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px]">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Đã tắt tất cả thông báo rườm rà. Chỉ hiển thị thông số tốc độ & vận hành cốt lõi.</span>
      </div>

      {/* CENTER HUD: Giant Speedometer & Arc Gauge */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-6 sm:py-10">
        {/* Speedometer Gauge Container */}
        <div className="relative flex flex-col items-center justify-center w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96">
          {/* Circular SVG Gauge Track & Fill */}
          <svg className="w-full h-full transform -rotate-210 overflow-visible" viewBox="0 0 320 320">
            {/* Background Arc */}
            <circle
              cx="160"
              cy="160"
              r={arcRadius}
              stroke="rgba(30, 41, 59, 0.8)"
              strokeWidth="16"
              fill="transparent"
              strokeDasharray={`${arcCircumference} ${arcCircumference}`}
              strokeDashoffset="0"
              strokeLinecap="round"
            />
            {/* Speedometer Filled Arc */}
            <circle
              cx="160"
              cy="160"
              r={arcRadius}
              stroke={isOverspeed ? '#ef4444' : speed > 80 ? '#06b6d4' : '#10b981'}
              strokeWidth="16"
              fill="transparent"
              strokeDasharray={`${arcCircumference} ${arcCircumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
              style={{
                filter: isOverspeed
                  ? 'drop-shadow(0 0 14px rgba(239, 68, 68, 0.8))'
                  : 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.6))',
              }}
            />
          </svg>

          {/* Central Digital Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {/* Overspeed Pill */}
            {isOverspeed && (
              <div className="mb-1 flex items-center gap-1 px-3 py-0.5 rounded-full bg-rose-600 text-white font-black text-xs uppercase tracking-wider animate-bounce shadow-lg shadow-rose-900/50">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>QUÁ TỐC ĐỘ ({speedLimit})</span>
              </div>
            )}

            {/* Giant Speed Number */}
            <div
              className={`font-mono text-7xl sm:text-8xl md:text-9xl font-black tracking-tight leading-none transition-colors duration-200 ${
                isOverspeed
                  ? 'text-rose-400 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]'
                  : 'text-cyan-300 drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]'
              }`}
            >
              {speed}
            </div>

            {/* Unit */}
            <div className="text-sm sm:text-base font-extrabold font-mono text-slate-400 tracking-widest mt-1">
              KM / H
            </div>

            {/* GPS Signal / Simulation Status */}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSimulating
                    ? 'bg-amber-400 animate-ping'
                    : gpsActive
                    ? 'bg-emerald-400'
                    : 'bg-slate-600'
                }`}
              />
              <span className="text-slate-400">
                {isSimulating
                  ? 'Mô phỏng tốc độ'
                  : gpsActive
                  ? `GPS Tốc độ thực ${gpsAccuracy ? `(±${gpsAccuracy}m)` : ''}`
                  : 'GPS đang kết nối...'}
              </span>
            </div>
          </div>
        </div>

        {/* Speed Limit Selector */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-slate-400 font-semibold mr-1">Biển giới hạn tốc độ:</span>
          {[50, 60, 80, 100, 120].map((limit) => {
            const isSelected = speedLimit === limit;
            return (
              <button
                key={limit}
                onClick={() => setSpeedLimit(limit)}
                className={`w-10 h-10 rounded-full border-2 font-mono font-black text-sm flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-500/20 border-rose-500 text-white shadow-lg shadow-rose-950/40 scale-105'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                }`}
                title={`Đặt biển giới hạn ${limit} km/h`}
              >
                {limit}
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM CONTROL & TELEMETRY ROW */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-800/80 pt-4">
        {/* Left Card: Driving Trip Stats */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Thời gian lái xe</div>
              <div className="text-base font-bold font-mono text-white">
                {formatTripTime(tripSeconds)}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Hướng đi</div>
            <div className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1 justify-end">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>{getCardinalDirection(headingDegrees)}</span>
            </div>
          </div>
        </div>

        {/* Center Card: Speed Simulation / Test controls */}
        <div className="flex flex-col justify-center p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>Thử nghiệm / Mô phỏng tốc độ</span>
            </div>
            {isSimulating && (
              <button
                onClick={() => {
                  setIsSimulating(false);
                  setTargetSpeed(0);
                  setSpeed(0);
                }}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer"
              >
                Tắt mô phỏng
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                setIsSimulating(true);
                setTargetSpeed(0);
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold cursor-pointer transition-colors"
              title="Dừng xe (0 km/h)"
            >
              Phanh (0)
            </button>
            <button
              onClick={() => {
                setIsSimulating(true);
                setTargetSpeed(45);
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/20 cursor-pointer transition-colors"
            >
              45 km/h
            </button>
            <button
              onClick={() => {
                setIsSimulating(true);
                setTargetSpeed(60);
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-950 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/20 cursor-pointer transition-colors"
            >
              60 km/h
            </button>
            <button
              onClick={() => {
                setIsSimulating(true);
                setTargetSpeed(80);
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-amber-950 text-amber-300 text-xs font-mono font-bold border border-amber-500/20 cursor-pointer transition-colors"
            >
              80 km/h
            </button>
            <button
              onClick={() => {
                setIsSimulating(true);
                setTargetSpeed(100);
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-950 text-rose-300 text-xs font-mono font-bold border border-rose-500/20 cursor-pointer transition-colors"
            >
              100 km/h
            </button>
          </div>
        </div>

        {/* Right Card: Next service countdown & safe return */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Bảo dưỡng kế tiếp</div>
            <div className="text-sm font-bold font-mono text-emerald-300">
              {kmUntilService > 0 ? `Còn ${formatKm(kmUntilService)}` : 'Cần bảo dưỡng ngay'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Mốc: {nextServiceOdo.toLocaleString()} km
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onLogTrip && (
              <button
                onClick={onLogTrip}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-cyan-950"
                title="Kết thúc lái xe & ghi nhật ký lộ trình để cập nhật ODO"
              >
                <Route className="w-3.5 h-3.5" />
                <span>Ghi Hành Trình</span>
              </button>
            )}

            <button
              onClick={onExit}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
