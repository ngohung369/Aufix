import React, { useState, useMemo } from 'react';
import {
  Fuel,
  Plus,
  DollarSign,
  TrendingUp,
  Trash2,
  Calendar,
  Filter,
  CreditCard,
  Layers,
  Sparkles,
  BarChart3,
  LineChart as LineChartIcon,
  Activity,
  ArrowUpRight,
  Compass,
  CalendarClock,
  Sliders,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Vehicle, ExpenseRecord, ExpenseCategory } from '../types/vehicle';
import { formatCurrencyVND, formatKm, formatDateVN } from '../utils/formatters';

interface ExpensesViewProps {
  vehicle: Vehicle;
  expenses: ExpenseRecord[];
  onAddExpense: (expense: ExpenseRecord) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  vehicle,
  expenses,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'FUEL' | 'OTHER'>('FUEL');

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<ExpenseCategory>('FUEL');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometerKm, setOdometerKm] = useState(vehicle.currentOdo.toString());
  const [fuelVolume, setFuelVolume] = useState<number>(40);
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState<number>(22500);
  const [fuelType, setFuelType] = useState('RON 95-V');
  const [notes, setNotes] = useState('');

  // Recharts & Forecast states
  const [chartType, setChartType] = useState<'BAR' | 'AREA' | 'LINE'>('BAR');
  const [chartTimeframe, setChartTimeframe] = useState<'ALL' | '6M' | '3M'>('ALL');
  
  // Forecast & Analysis Mode
  // 'COMBINED': Toàn cảnh Lịch sử + Dự báo 6 tháng tới
  // 'FORECAST': Chỉ tập trung Dự báo 6 tháng tới
  // 'HISTORY': Chỉ xem Lịch sử thực tế đã qua
  const [analysisMode, setAnalysisMode] = useState<'COMBINED' | 'FORECAST' | 'HISTORY'>('COMBINED');
  
  // Driving intensity scenario:
  // 'STANDARD': ~900 - 1.000 km/tháng (hệ số x1.0)
  // 'HIGH': ~1.600 km/tháng - Hay đi tỉnh/về quê (hệ số x1.5)
  // 'LOW': ~500 km/tháng - Nội thành gần (hệ số x0.65)
  const [drivingScenario, setDrivingScenario] = useState<'STANDARD' | 'HIGH' | 'LOW'>('STANDARD');

  const vehicleExpenses = expenses.filter((e) => e.vehicleId === vehicle.id);

  const filtered = vehicleExpenses.filter((e) => {
    if (filterCategory === 'ALL') return true;
    return e.category === filterCategory;
  });

  const totalSpent = vehicleExpenses.reduce((s, e) => s + e.amount, 0);

  // Compute monthly historical data for Recharts
  const monthlyData = useMemo(() => {
    if (vehicleExpenses.length === 0) return [];

    const monthMap: Record<
      string,
      {
        monthKey: string;
        displayMonth: string;
        fuel: number;
        maintenance: number;
        tollParking: number;
        insurance: number;
        other: number;
        total: number;
        fuelLiters: number;
      }
    > = {};

    const sorted = [...vehicleExpenses].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sorted.forEach((item) => {
      const d = new Date(item.date);
      if (isNaN(d.getTime())) return;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${yyyy}-${mm}`;
      const display = `T${mm}/${String(yyyy).slice(2)}`;

      if (!monthMap[key]) {
        monthMap[key] = {
          monthKey: key,
          displayMonth: display,
          fuel: 0,
          maintenance: 0,
          tollParking: 0,
          insurance: 0,
          other: 0,
          total: 0,
          fuelLiters: 0,
        };
      }

      const amt = Number(item.amount) || 0;
      monthMap[key].total += amt;

      if (item.category === 'FUEL') {
        monthMap[key].fuel += amt;
        monthMap[key].fuelLiters += item.fuelVolume || 0;
      } else if (item.category === 'MAINTENANCE') {
        monthMap[key].maintenance += amt;
      } else if (item.category === 'TOLL_PARKING') {
        monthMap[key].tollParking += amt;
      } else if (item.category === 'INSURANCE' || item.category === 'INSPECTION') {
        monthMap[key].insurance += amt;
      } else {
        monthMap[key].other += amt;
      }
    });

    let result = Object.values(monthMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    if (chartTimeframe === '3M') {
      result = result.slice(-3);
    } else if (chartTimeframe === '6M') {
      result = result.slice(-6);
    }

    return result;
  }, [vehicleExpenses, chartTimeframe]);

  // Historical statistics KPI
  const chartStats = useMemo(() => {
    if (monthlyData.length === 0) return { highestMonth: null, avgPerMonth: 0, fuelPercent: 0 };
    let highest = monthlyData[0];
    let sum = 0;
    let totalFuel = 0;
    let grandTotal = 0;

    monthlyData.forEach((m) => {
      sum += m.total;
      totalFuel += m.fuel;
      grandTotal += m.total;
      if (m.total > highest.total) {
        highest = m;
      }
    });

    return {
      highestMonth: highest,
      avgPerMonth: Math.round(sum / monthlyData.length),
      fuelPercent: grandTotal > 0 ? Math.round((totalFuel / grandTotal) * 100) : 0,
    };
  }, [monthlyData]);

  // 6-MONTH PREDICTIVE FORECAST MODEL
  // Based on historical baseline, vehicle attributes, inspection expiry, maintenance intervals & seasonal factors
  const forecastData = useMemo(() => {
    const isCar = vehicle.type !== 'MOTORBIKE';
    const scenarioMultiplier =
      drivingScenario === 'HIGH' ? 1.5 : drivingScenario === 'LOW' ? 0.65 : 1.0;

    // Estimated driving intensity
    const avgKmPerMonth = Math.round((isCar ? 950 : 450) * scenarioMultiplier);

    // 1. Calculate baseline recurring monthly fuel & toll from historical records
    const fuelExpenses = vehicleExpenses.filter((e) => e.category === 'FUEL');
    const tollExpenses = vehicleExpenses.filter((e) => e.category === 'TOLL_PARKING');

    const historicalMonthKeys = new Set(
      vehicleExpenses
        .map((e) => {
          const d = new Date(e.date);
          return isNaN(d.getTime())
            ? ''
            : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        })
        .filter(Boolean)
    );
    const numMonths = Math.max(1, historicalMonthKeys.size);

    const histTotalFuel = fuelExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const histTotalLiters = fuelExpenses.reduce((s, e) => s + (e.fuelVolume || 0), 0);
    const histTotalToll = tollExpenses.reduce((s, e) => s + (e.amount || 0), 0);

    // Defaults if historical data is limited
    const defaultFuel = isCar ? 1200000 : 280000;
    const defaultLiters = isCar ? 53 : 12;
    const defaultToll = isCar ? 350000 : 50000;

    const baseFuelPerMonth = histTotalFuel > 0 ? histTotalFuel / numMonths : defaultFuel;
    const baseLitersPerMonth = histTotalLiters > 0 ? histTotalLiters / numMonths : defaultLiters;
    const baseTollPerMonth = histTotalToll > 0 ? histTotalToll / numMonths : defaultToll;

    // 2. Scheduled milestones mapping
    const now = new Date();
    const nowY = now.getFullYear();
    const nowM = now.getMonth();

    // Inspection month
    let inspectionMonthKey = '';
    if (vehicle.inspectionExpiry) {
      const iDate = new Date(vehicle.inspectionExpiry);
      if (!isNaN(iDate.getTime())) {
        inspectionMonthKey = `${iDate.getFullYear()}-${String(iDate.getMonth() + 1).padStart(2, '0')}`;
      }
    }

    // Insurance month
    let insuranceMonthKey = '';
    if (vehicle.insuranceExpiry) {
      const inDate = new Date(vehicle.insuranceExpiry);
      if (!isNaN(inDate.getTime())) {
        insuranceMonthKey = `${inDate.getFullYear()}-${String(inDate.getMonth() + 1).padStart(2, '0')}`;
      }
    }

    // Next service target month (from nextServiceDate or calculated from nextServiceOdo)
    let serviceMonthKey = '';
    if (vehicle.nextServiceDate) {
      const sDate = new Date(vehicle.nextServiceDate);
      if (!isNaN(sDate.getTime())) {
        serviceMonthKey = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}`;
      }
    } else if (vehicle.nextServiceOdo) {
      const kmRemaining = Math.max(0, vehicle.nextServiceOdo - vehicle.currentOdo);
      const monthsAway = Math.max(1, Math.min(6, Math.round(kmRemaining / avgKmPerMonth)));
      const sDate = new Date(nowY, nowM + monthsAway, 1);
      serviceMonthKey = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}`;
    }

    // 3. Project 6 upcoming months
    const forecastMonths: Array<{
      monthIndex: number;
      monthKey: string;
      displayMonth: string;
      shortDisplay: string;
      fuel: number;
      fuelLiters: number;
      maintenance: number;
      tollParking: number;
      insurance: number;
      other: number;
      total: number;
      events: string[];
      isForecast: boolean;
      projectedOdo: number;
    }> = [];

    let currentProjectedOdo = vehicle.currentOdo;

    for (let i = 1; i <= 6; i++) {
      const fDate = new Date(nowY, nowM + i, 1);
      const yyyy = fDate.getFullYear();
      const mm = String(fDate.getMonth() + 1).padStart(2, '0');
      const monthKey = `${yyyy}-${mm}`;
      const shortDisplay = `T${mm}/${String(yyyy).slice(2)}`;
      const displayMonth = `Tháng ${mm}/${yyyy}`;
      const events: string[] = [];

      currentProjectedOdo += avgKmPerMonth;

      // Seasonal Tet factor: February (month index 1)
      const isTetMonth = fDate.getMonth() === 1;
      const tetFactor = isTetMonth ? 1.25 : 1.0;
      if (isTetMonth) {
        events.push('🧧 Dịp Tết Nguyên Đán: Tăng ~25% nhu cầu đi lại, về quê, du xuân');
      }

      // Fuel & Toll projection
      const projectedFuel = Math.round(baseFuelPerMonth * scenarioMultiplier * tetFactor);
      const projectedFuelLiters = Math.round(baseLitersPerMonth * scenarioMultiplier * tetFactor);
      const projectedToll = Math.round(baseTollPerMonth * (isTetMonth ? 1.3 : 1.0));

      // Routine monthly maintenance (fluids, car wash, basic upkeep)
      let projectedMaintenance = Math.round((isCar ? 200000 : 50000) * scenarioMultiplier);
      let projectedInsurance = 0;
      const projectedOther = Math.round(isCar ? 100000 : 30000);

      // Milestone 1: Scheduled periodic maintenance
      if (monthKey === serviceMonthKey || (i === 2 && !serviceMonthKey)) {
        const isMajor =
          vehicle.nextServiceLevel?.includes('lớn') ||
          (vehicle.nextServiceOdo && vehicle.nextServiceOdo % 20000 === 0);
        const serviceCost = isCar ? (isMajor ? 2800000 : 1200000) : isMajor ? 650000 : 250000;
        projectedMaintenance += serviceCost;
        events.push(
          `🔧 ${vehicle.nextServiceLevel || 'Bảo dưỡng định kỳ'} (~${formatCurrencyVND(serviceCost)})`
        );
      }

      // Milestone 2: Technical Inspection & Road Fee
      if (monthKey === inspectionMonthKey || (i === 2 && inspectionMonthKey === '' && isCar && vehicle.inspectionExpiry)) {
        const fee = isCar ? 390000 : 0;
        const roadFee = isCar ? 1560000 : 0; // 12-month road maintenance fee
        const totalInspect = fee + roadFee;
        projectedInsurance += totalInspect;
        events.push(`📋 Kỳ Kiểm Định Kỹ Thuật & Phí Đường Bộ (~${formatCurrencyVND(totalInspect)})`);
      }

      // Milestone 3: Compulsory TNDS Insurance Renewal
      if (monthKey === insuranceMonthKey || (i === 6 && isCar)) {
        const insCost = isCar ? 530000 : 66000;
        projectedInsurance += insCost;
        events.push(`🛡️ Tái tục Bảo hiểm TNDS Bắt Buộc (~${formatCurrencyVND(insCost)})`);
      }

      const total =
        projectedFuel +
        projectedMaintenance +
        projectedToll +
        projectedInsurance +
        projectedOther;

      forecastMonths.push({
        monthIndex: i,
        monthKey,
        displayMonth,
        shortDisplay,
        fuel: projectedFuel,
        fuelLiters: projectedFuelLiters,
        maintenance: projectedMaintenance,
        tollParking: projectedToll,
        insurance: projectedInsurance,
        other: projectedOther,
        total,
        events,
        isForecast: true,
        projectedOdo: currentProjectedOdo,
      });
    }

    const totalForecastCost = forecastMonths.reduce((s, m) => s + m.total, 0);
    const avgForecastPerMonth = Math.round(totalForecastCost / 6);
    const totalForecastFuelCost = forecastMonths.reduce((s, m) => s + m.fuel, 0);
    const totalForecastLiters = forecastMonths.reduce((s, m) => s + m.fuelLiters, 0);
    const peakForecastMonth = [...forecastMonths].sort((a, b) => b.total - a.total)[0];
    const recommendedMonthlyReserve = Math.round(totalForecastCost / 6 * 1.1); // +10% buffer

    return {
      forecastMonths,
      totalForecastCost,
      avgForecastPerMonth,
      totalForecastFuelCost,
      totalForecastLiters,
      peakForecastMonth,
      scenarioMultiplier,
      avgKmPerMonth,
      recommendedMonthlyReserve,
    };
  }, [vehicle, vehicleExpenses, drivingScenario]);

  // Combined timeline data for Recharts (combining actuals and 6 forecast months)
  const combinedTimelineData = useMemo(() => {
    // 1. Historical data points
    const historyPoints = monthlyData.map((m) => ({
      displayMonth: m.displayMonth,
      monthKey: m.monthKey,
      isForecast: false,
      actualTotal: m.total,
      actualFuel: m.fuel,
      actualMaintenance: m.maintenance,
      actualToll: m.tollParking,
      actualInsurance: m.insurance,
      actualOther: m.other,
      fuel: m.fuel,
      maintenance: m.maintenance,
      tollParking: m.tollParking,
      insurance: m.insurance,
      other: m.other,
      total: m.total,
      forecastTotal: undefined as number | undefined,
      forecastFuel: undefined as number | undefined,
      events: [] as string[],
    }));

    // 2. Forecast points
    const forecastPoints = forecastData.forecastMonths.map((fm) => ({
      displayMonth: fm.shortDisplay + ' (Dự)',
      monthKey: fm.monthKey,
      isForecast: true,
      actualTotal: undefined as number | undefined,
      actualFuel: undefined as number | undefined,
      actualMaintenance: undefined as number | undefined,
      actualToll: undefined as number | undefined,
      actualInsurance: undefined as number | undefined,
      actualOther: undefined as number | undefined,
      fuel: fm.fuel,
      maintenance: fm.maintenance,
      tollParking: fm.tollParking,
      insurance: fm.insurance,
      other: fm.other,
      total: fm.total,
      forecastTotal: fm.total,
      forecastFuel: fm.fuel,
      events: fm.events,
    }));

    if (analysisMode === 'HISTORY') {
      return historyPoints;
    } else if (analysisMode === 'FORECAST') {
      return forecastPoints;
    } else {
      // COMBINED
      const lastHistory = historyPoints[historyPoints.length - 1];
      if (lastHistory && forecastPoints.length > 0) {
        // Connect the dashed forecast line smoothly to the last actual point
        lastHistory.forecastTotal = lastHistory.actualTotal;
        lastHistory.forecastFuel = lastHistory.actualFuel;
      }
      return [...historyPoints, ...forecastPoints];
    }
  }, [monthlyData, forecastData, analysisMode]);

  // Calculate fuel stats
  const fuelList = vehicleExpenses
    .filter((e) => e.category === 'FUEL' && e.fuelVolume)
    .sort((a, b) => (a.odometerKm || 0) - (b.odometerKm || 0));

  const totalFuelCost = fuelList.reduce((s, e) => s + e.amount, 0);
  const totalLiters = fuelList.reduce((s, e) => s + (e.fuelVolume || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newExpense: ExpenseRecord = {
      id: 'exp-' + Date.now(),
      vehicleId: vehicle.id,
      date,
      category: modalType === 'FUEL' ? 'FUEL' : category,
      title: title || (modalType === 'FUEL' ? `Đổ xăng ${fuelType}` : 'Chi phí xe'),
      amount: Number(amount) || (modalType === 'FUEL' ? fuelVolume * fuelPricePerLiter : 0),
      odometerKm: parseInt(odometerKm, 10) || vehicle.currentOdo,
      fuelVolume: modalType === 'FUEL' ? Number(fuelVolume) : undefined,
      fuelPricePerLiter: modalType === 'FUEL' ? Number(fuelPricePerLiter) : undefined,
      fuelType: modalType === 'FUEL' ? fuelType : undefined,
      notes,
    };
    onAddExpense(newExpense);
    setShowAddModal(false);
    setTitle('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white">Nhật Ký Đổ Xăng & Chi Phí Vận Hành</h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/30">
              EXPENSES
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Theo dõi chi tiêu nhiên liệu, mức tiêu hao (L/100km), phí cầu đường, gửi xe và dự báo ngân sách 6 tháng tới
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setModalType('FUEL');
              setTitle('Đổ xăng Petrolimex');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Fuel className="w-4 h-4" />
            <span>+ Ghi Đổ Xăng</span>
          </button>
          <button
            onClick={() => {
              setModalType('OTHER');
              setCategory('TOLL_PARKING');
              setTitle('Nạp phí VETC / ePass');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Khoản Khác</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Tổng chi phí xe đã ghi
          </span>
          <div className="text-xl font-black text-amber-300 font-mono">
            {formatCurrencyVND(totalSpent)}
          </div>
          <span className="text-[10px] text-slate-500">{vehicleExpenses.length} lần ghi chép</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Tổng chi phí xăng dầu
          </span>
          <div className="text-xl font-black text-cyan-300 font-mono">
            {formatCurrencyVND(totalFuelCost)}
          </div>
          <span className="text-[10px] text-slate-400">
            {totalLiters.toFixed(1)} lít đã nạp
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Mức tiêu thụ ước tính
          </span>
          <div className="text-xl font-black text-emerald-400 font-mono">
            {vehicle.type === 'MOTORBIKE' ? '2.1' : '7.6'} <span className="text-xs text-slate-400 font-normal">L/100km</span>
          </div>
          <span className="text-[10px] text-emerald-300">Tiết kiệm xăng ổn định</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Chi phí trung bình / km
          </span>
          <div className="text-xl font-black text-white font-mono">
            {vehicle.type === 'MOTORBIKE' ? '450' : '1.750'} <span className="text-xs text-slate-400 font-normal">đ/km</span>
          </div>
          <span className="text-[10px] text-slate-500">Xăng + bảo dưỡng + phí</span>
        </div>
      </div>

      {/* 2. RECHARTS PREDICTIVE FORECAST & EXPENSE TIMELINE */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        {/* Chart Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <Compass className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Biểu Đồ Xu Hướng & Dự Báo Chi Phí Vận Hành
              </h3>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                AI PREDICTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dự báo 6 tháng tới cho xe {vehicle.name} ({vehicle.plateNumber}) dựa trên dữ liệu lịch sử và các mốc định kỳ (đăng kiểm, bảo dưỡng lớn, bảo hiểm)
            </p>
          </div>

          {/* Analysis View Mode Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setAnalysisMode('COMBINED')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  analysisMode === 'COMBINED'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Hiển thị liền mạch lịch sử thực tế kết nối với 6 tháng dự báo"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Toàn Cảnh (Thực Tế + Dự Báo 6T)</span>
              </button>
              <button
                onClick={() => setAnalysisMode('FORECAST')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  analysisMode === 'FORECAST'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tập trung phân tích 6 tháng tới"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Dự Báo 6 Tháng Tới</span>
              </button>
              <button
                onClick={() => setAnalysisMode('HISTORY')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  analysisMode === 'HISTORY'
                    ? 'bg-slate-800 text-slate-200 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Chỉ xem dữ liệu chi tiêu thực tế đã ghi"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Lịch Sử</span>
              </button>
            </div>

            {/* Chart Type selector */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setChartType('BAR')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  chartType === 'BAR'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Biểu đồ Cột Phân Loại"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cột</span>
              </button>
              <button
                onClick={() => setChartType('AREA')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  chartType === 'AREA'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Biểu đồ Miền Xu Hướng"
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Miền</span>
              </button>
              <button
                onClick={() => setChartType('LINE')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  chartType === 'LINE'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Biểu đồ Đường với nét đứt Dự Báo"
              >
                <LineChartIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đường</span>
              </button>
            </div>
          </div>
        </div>

        {/* Driving Scenario Bar */}
        {(analysisMode === 'FORECAST' || analysisMode === 'COMBINED') && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Sliders className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-semibold">Kịch bản cường độ di chuyển:</span>
              <span className="text-[11px] text-slate-400 hidden md:inline">
                (Tác động trực tiếp đến dự toán tiền xăng, hao mòn & mốc bảo dưỡng)
              </span>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {[
                { id: 'LOW', label: 'Đi ít / Nội thành (~500 km/tháng)', shortLabel: 'Đi ít (~500km)' },
                { id: 'STANDARD', label: 'Tiêu chuẩn (~950 km/tháng)', shortLabel: 'Tiêu chuẩn (~950km)' },
                { id: 'HIGH', label: 'Đi nhiều / Đi tỉnh (~1.600 km/tháng)', shortLabel: 'Đi nhiều (~1.600km)' },
              ].map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setDrivingScenario(sc.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    drivingScenario === sc.id
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span className="hidden sm:inline">{sc.label}</span>
                  <span className="sm:hidden">{sc.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Forecast KPI Highlights */}
        {(analysisMode === 'FORECAST' || analysisMode === 'COMBINED') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Dự toán 6 tháng tới:</span>
                <span className="text-[10px] font-mono text-purple-300 font-semibold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30">
                  DỰ KIẾN
                </span>
              </div>
              <div className="font-mono font-black text-lg text-cyan-300">
                {formatCurrencyVND(forecastData.totalForecastCost)}
              </div>
              <div className="text-[11px] text-slate-400">
                Bình quân ~<span className="font-mono font-bold text-white">{formatCurrencyVND(forecastData.avgForecastPerMonth)}</span>/tháng
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tháng cao điểm nhất:</span>
                <span className="text-[10px] font-mono text-amber-300 font-semibold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                  ĐỈNH PHÍ
                </span>
              </div>
              <div className="font-mono font-black text-lg text-amber-300">
                {forecastData.peakForecastMonth?.shortDisplay} ({formatCurrencyVND(forecastData.peakForecastMonth?.total || 0)})
              </div>
              <div className="text-[11px] text-amber-200/80 truncate" title={forecastData.peakForecastMonth?.events.join(', ')}>
                {forecastData.peakForecastMonth?.events[0] || 'Kỳ bảo dưỡng & định kỳ'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Dự toán xăng dầu:</span>
                <span className="text-[10px] font-mono text-cyan-300 font-semibold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  ~{forecastData.totalForecastLiters} LÍT
                </span>
              </div>
              <div className="font-mono font-black text-lg text-emerald-300">
                {formatCurrencyVND(forecastData.totalForecastFuelCost)}
              </div>
              <div className="text-[11px] text-slate-400">
                Ước tính tiêu thụ ~{forecastData.avgKmPerMonth * 6} km
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Quỹ dự phòng xe đề xuất:</span>
                <span className="text-[10px] font-mono text-emerald-300 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  TIẾT KIỆM
                </span>
              </div>
              <div className="font-mono font-black text-lg text-purple-300">
                {formatCurrencyVND(forecastData.recommendedMonthlyReserve)}
              </div>
              <div className="text-[11px] text-slate-400">
                Trích lập mỗi tháng để không bị động
              </div>
            </div>
          </div>
        )}

        {/* History-only KPI row when analysisMode is HISTORY */}
        {analysisMode === 'HISTORY' && monthlyData.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Trung bình chi phí thực tế:</span>
              <span className="font-mono font-bold text-cyan-300">
                {formatCurrencyVND(chartStats.avgPerMonth)}/tháng
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Tháng cao điểm nhất:</span>
              <span className="font-mono font-bold text-amber-300">
                {chartStats.highestMonth?.displayMonth || '--'} ({formatCurrencyVND(chartStats.highestMonth?.total || 0)})
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Tỷ trọng nhiên liệu:</span>
              <span className="font-mono font-bold text-emerald-400">
                {chartStats.fuelPercent}% tổng chi tiêu
              </span>
            </div>
          </div>
        )}

        {/* Recharts Canvas */}
        <div className="w-full h-72 sm:h-80 pt-2">
          {combinedTimelineData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-xl">
              <BarChart3 className="w-8 h-8 text-slate-600" />
              <span>Chưa có dữ liệu chi phí để vẽ biểu đồ cho xe này.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'BAR' ? (
                <BarChart data={combinedTimelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="displayMonth"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(val) =>
                      val >= 1000000
                        ? `${(val / 1000000).toFixed(1)}M`
                        : val > 0
                        ? `${(val / 1000).toFixed(0)}k`
                        : '0'
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[220px]">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                              <div>
                                <span className="font-bold text-white text-sm">{data.displayMonth}</span>
                                {data.isForecast && (
                                  <span className="ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
                                    DỰ BÁO
                                  </span>
                                )}
                              </div>
                              <span className="font-mono font-bold text-cyan-300">
                                {formatCurrencyVND(data.total)}
                              </span>
                            </div>

                            {/* Milestone events if any */}
                            {data.events && data.events.length > 0 && (
                              <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 space-y-1">
                                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wide block">
                                  ⚡ Mốc quan trọng trong tháng:
                                </span>
                                {data.events.map((ev: string, idx: number) => (
                                  <div key={idx} className="text-[11px] text-amber-200">
                                    • {ev}
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="space-y-1 text-[11px]">
                              {data.fuel > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-amber-400">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                    <span>Xăng dầu:</span>
                                  </span>
                                  <span className="font-mono text-slate-200">
                                    {formatCurrencyVND(data.fuel)}
                                  </span>
                                </div>
                              )}
                              {data.maintenance > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-sky-400">
                                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                                    <span>Bảo dưỡng:</span>
                                  </span>
                                  <span className="font-mono text-slate-200">
                                    {formatCurrencyVND(data.maintenance)}
                                  </span>
                                </div>
                              )}
                              {data.tollParking > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-purple-400">
                                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                                    <span>Cầu đường & Gửi xe:</span>
                                  </span>
                                  <span className="font-mono text-slate-200">
                                    {formatCurrencyVND(data.tollParking)}
                                  </span>
                                </div>
                              )}
                              {data.insurance > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-emerald-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span>Bảo hiểm & Đăng kiểm:</span>
                                  </span>
                                  <span className="font-mono text-slate-200">
                                    {formatCurrencyVND(data.insurance)}
                                  </span>
                                </div>
                              )}
                              {data.other > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-slate-400">
                                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                                    <span>Khoản khác:</span>
                                  </span>
                                  <span className="font-mono text-slate-200">
                                    {formatCurrencyVND(data.other)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 10, fontSize: 11 }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="fuel"
                    name="Xăng dầu"
                    fill="#f59e0b"
                    stackId="a"
                  />
                  <Bar
                    dataKey="maintenance"
                    name="Bảo dưỡng"
                    fill="#38bdf8"
                    stackId="a"
                  />
                  <Bar
                    dataKey="tollParking"
                    name="Cầu đường / Gửi xe"
                    fill="#a855f7"
                    stackId="a"
                  />
                  <Bar
                    dataKey="insurance"
                    name="Bảo hiểm / Đăng kiểm"
                    fill="#10b981"
                    stackId="a"
                  />
                  <Bar
                    dataKey="other"
                    name="Khác"
                    fill="#94a3b8"
                    stackId="a"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              ) : chartType === 'AREA' ? (
                <AreaChart
                  data={combinedTimelineData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="displayMonth"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(val) =>
                      val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${val / 1000}k`
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px]">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                              <span className="font-bold text-white text-sm">{data.displayMonth}</span>
                              {data.isForecast && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
                                  DỰ BÁO
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-cyan-300 font-bold">
                              Tổng: {formatCurrencyVND(data.total)}
                            </div>
                            <div className="font-mono text-amber-300">
                              Xăng dầu: {formatCurrencyVND(data.fuel)}
                            </div>
                            <div className="font-mono text-sky-300">
                              Bảo dưỡng: {formatCurrencyVND(data.maintenance)}
                            </div>
                            {data.insurance > 0 && (
                              <div className="font-mono text-emerald-300">
                                Đăng kiểm/BH: {formatCurrencyVND(data.insurance)}
                              </div>
                            )}
                            {data.events && data.events.length > 0 && (
                              <div className="pt-1 border-t border-slate-800 text-[11px] text-amber-300">
                                {data.events[0]}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 10, fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Tổng Chi Phí"
                    stroke="#00f0ff"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="fuel"
                    name="Chi Phí Xăng"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFuel)"
                  />
                </AreaChart>
              ) : (
                <LineChart
                  data={combinedTimelineData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="displayMonth"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(val) =>
                      val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${val / 1000}k`
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px]">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                              <span className="font-bold text-white text-sm">{data.displayMonth}</span>
                              {data.isForecast && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
                                  DỰ BÁO
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-cyan-300 font-bold">
                              Tổng: {formatCurrencyVND(data.total)}
                            </div>
                            <div className="font-mono text-amber-300">
                              Xăng dầu: {formatCurrencyVND(data.fuel)}
                            </div>
                            <div className="font-mono text-sky-300">
                              Bảo dưỡng: {formatCurrencyVND(data.maintenance)}
                            </div>
                            {data.insurance > 0 && (
                              <div className="font-mono text-emerald-300">
                                Đăng kiểm/BH: {formatCurrencyVND(data.insurance)}
                              </div>
                            )}
                            {data.events && data.events.length > 0 && (
                              <div className="pt-1 border-t border-slate-800 text-[11px] text-amber-300">
                                {data.events[0]}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 10, fontSize: 11 }} />
                  {/* Historical lines */}
                  <Line
                    type="monotone"
                    dataKey="actualTotal"
                    name="Thực Tế - Tổng Tiền"
                    stroke="#00f0ff"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#00f0ff' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actualFuel"
                    name="Thực Tế - Tiền Xăng"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#f59e0b' }}
                  />
                  {/* Forecast dashed lines */}
                  <Line
                    type="monotone"
                    dataKey="forecastTotal"
                    name="Dự Báo - Tổng Tiền (Dashed)"
                    stroke="#a855f7"
                    strokeWidth={3}
                    strokeDasharray="6 6"
                    dot={{ r: 4, fill: '#a855f7' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecastFuel"
                    name="Dự Báo - Tiền Xăng (Dashed)"
                    stroke="#eab308"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#eab308' }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* 6-Month Predictive Roadmap Cards Grid */}
        {(analysisMode === 'FORECAST' || analysisMode === 'COMBINED') && (
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Lộ Trình Dự Toán Chi Tiết 6 Tháng Tới
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">
                Tốc độ tích lũy ODO dự kiến: ~{forecastData.avgKmPerMonth.toLocaleString()} km/tháng
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {forecastData.forecastMonths.map((fm) => (
                <div
                  key={fm.monthKey}
                  className={`p-3.5 rounded-xl border transition-all ${
                    fm.events.length > 0
                      ? 'bg-slate-950/80 border-cyan-500/30 hover:border-cyan-500/60'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-cyan-950 text-cyan-300 flex items-center justify-center font-mono font-bold text-xs border border-cyan-500/30">
                        0{fm.monthIndex}
                      </div>
                      <span className="font-bold text-white text-xs">{fm.displayMonth}</span>
                    </div>
                    <span className="font-mono font-bold text-cyan-300 text-xs">
                      {formatCurrencyVND(fm.total)}
                    </span>
                  </div>

                  {/* Events Badges */}
                  {fm.events.length > 0 ? (
                    <div className="space-y-1 mb-2.5">
                      {fm.events.map((ev, i) => (
                        <div
                          key={i}
                          className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 font-medium leading-tight flex items-start gap-1"
                        >
                          <span>{ev}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 italic mb-2.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Chi tiêu vận hành thường nhật ổn định</span>
                    </div>
                  )}

                  {/* Breakdown pill tags */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Xăng ({fm.fuelLiters}L):</span>
                      <span className="text-amber-300">{formatCurrencyVND(fm.fuel)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Bảo dưỡng:</span>
                      <span className="text-sky-300">{formatCurrencyVND(fm.maintenance)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Cầu đường/gửi xe:</span>
                      <span className="text-purple-300">{formatCurrencyVND(fm.tollParking)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Đăng kiểm & BH:</span>
                      <span className="text-emerald-300">{formatCurrencyVND(fm.insurance)}</span>
                    </div>
                  </div>

                  {/* Projected ODO target */}
                  <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>ODO mốc tháng:</span>
                    <span className="font-mono text-slate-300 font-semibold">{formatKm(fm.projectedOdo)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'ALL', label: 'Tất cả' },
          { id: 'FUEL', label: '⛽ Xăng dầu' },
          { id: 'MAINTENANCE', label: '🔧 Bảo dưỡng' },
          { id: 'INSURANCE', label: '🛡️ Bảo hiểm' },
          { id: 'TOLL_PARKING', label: '🛣️ Vé cầu đường & Gửi xe' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              filterCategory === tab.id
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Expenses Table / List */}
      <div className="space-y-2.5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  item.category === 'FUEL'
                    ? 'bg-amber-500/10 text-amber-400'
                    : item.category === 'MAINTENANCE'
                    ? 'bg-sky-500/10 text-sky-400'
                    : item.category === 'INSURANCE'
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {item.category === 'FUEL' ? (
                  <Fuel className="w-4 h-4" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="font-bold text-white text-sm">{item.title}</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>{formatDateVN(item.date)}</span>
                  {item.odometerKm && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-cyan-400">{formatKm(item.odometerKm)}</span>
                    </>
                  )}
                  {item.fuelVolume && (
                    <>
                      <span>•</span>
                      <span>{item.fuelVolume}L ({item.fuelType || 'RON 95'})</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-mono font-black text-amber-300 text-sm sm:text-base">
                  {formatCurrencyVND(item.amount)}
                </div>
                {item.fuelPricePerLiter && (
                  <div className="text-[10px] text-slate-500">
                    {formatCurrencyVND(item.fuelPricePerLiter)}/L
                  </div>
                )}
              </div>

              <button
                onClick={() => onDeleteExpense(item.id)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                title="Xóa khoản này"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-xs bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
            Không có khoản chi phí nào thuộc mục này.
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4 text-slate-100">
            <h3 className="text-base font-bold text-white">
              {modalType === 'FUEL' ? 'Ghi Lần Đổ Xăng Mới' : 'Thêm Khoản Chi Phí Xe'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Mô tả / Tên cây xăng / Khoản chi</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder={modalType === 'FUEL' ? 'Petrolimex Cây Xăng Nam Đồng' : 'Phí BOT VETC'}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Ngày thực hiện</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Số ODO lúc đổ (km)</label>
                  <input
                    type="number"
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              {modalType === 'FUEL' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Loại xăng dầu</label>
                      <select
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="RON 95-V">Xăng RON 95-V</option>
                        <option value="RON 95-III">Xăng RON 95-III</option>
                        <option value="E5 RON 92">Xăng E5 RON 92</option>
                        <option value="Diesel DO">Dầu Diesel DO 0.001S</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Số lít đã đổ</label>
                      <input
                        type="number"
                        step="0.1"
                        value={fuelVolume}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          setFuelVolume(v);
                          setAmount(Math.round(v * fuelPricePerLiter));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Đơn giá / Lít (VND)</label>
                      <input
                        type="number"
                        value={fuelPricePerLiter}
                        onChange={(e) => {
                          const p = parseInt(e.target.value, 10) || 0;
                          setFuelPricePerLiter(p);
                          setAmount(Math.round(fuelVolume * p));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-amber-400 font-bold block mb-1">Tổng tiền (VND)</label>
                      <input
                        type="number"
                        value={amount || fuelVolume * fuelPricePerLiter}
                        onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 text-amber-300 font-mono font-bold"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Phân loại chi phí</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="TOLL_PARKING">Phí cầu đường BOT & Gửi xe</option>
                      <option value="INSURANCE">Bảo hiểm xe</option>
                      <option value="INSPECTION">Phí đăng kiểm</option>
                      <option value="ACCESSORIES">Đồ chơi xe & Nâng cấp</option>
                      <option value="FINE">Phạt vi phạm giao thông</option>
                      <option value="OTHER">Chi phí khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-amber-400 font-bold block mb-1">Số tiền (VND)</label>
                    <input
                      type="number"
                      value={amount || ''}
                      onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 text-amber-300 font-mono font-bold"
                      placeholder="500000"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-400 block mb-1">Ghi chú</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Ghi chú thêm..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Lưu Khoản Chi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
