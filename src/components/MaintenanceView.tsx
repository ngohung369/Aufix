import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Camera,
  Calendar,
  Sparkles,
  DollarSign,
  Trash2,
  FileText,
  MapPin,
  ChevronDown,
  ChevronUp,
  Bell,
  Send,
} from 'lucide-react';
import { Vehicle, MaintenanceRecord, ServiceItem } from '../types/vehicle';
import { formatCurrencyVND, formatKm, formatDateVN } from '../utils/formatters';

interface MaintenanceViewProps {
  vehicle: Vehicle;
  maintenance: MaintenanceRecord[];
  onOpenScanner: () => void;
  onAddMaintenance: (record: MaintenanceRecord) => void;
  onDeleteMaintenance: (id: string) => void;
  onOpenNotifications?: () => void;
  onTriggerMaintenanceNotification?: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  vehicle,
  maintenance,
  onOpenScanner,
  onAddMaintenance,
  onDeleteMaintenance,
  onOpenNotifications,
  onTriggerMaintenanceNotification,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New record form states
  const [garageName, setGarageName] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometerKm, setOdometerKm] = useState(vehicle.currentOdo.toString());
  const [level, setLevel] = useState('Bảo dưỡng định kỳ');
  const [items, setItems] = useState<ServiceItem[]>([
    { name: 'Thay dầu nhớt động cơ', quantity: 1, amount: 850000 },
  ]);
  const [notes, setNotes] = useState('');

  const vehicleMaintenance = maintenance.filter((m) => m.vehicleId === vehicle.id);
  const totalCost = vehicleMaintenance.reduce((sum, m) => sum + m.totalCost, 0);

  const handleAddItemRow = () => {
    setItems([...items, { name: '', quantity: 1, amount: 0 }]);
  };

  const handleItemChange = (index: number, field: keyof ServiceItem, value: any) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedTotal = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const newRecord: MaintenanceRecord = {
      id: 'maint-' + Date.now(),
      vehicleId: vehicle.id,
      serviceDate,
      odometerKm: parseInt(odometerKm, 10) || vehicle.currentOdo,
      garageName: garageName || 'Gara Dịch Vụ',
      level: level || 'Bảo dưỡng định kỳ',
      items: items.filter((i) => i.name.trim().length > 0),
      totalCost: calculatedTotal,
      notes,
      nextRecommendedOdo: (parseInt(odometerKm, 10) || vehicle.currentOdo) + 5000,
    };
    onAddMaintenance(newRecord);
    setShowAddModal(false);
    // Reset form
    setGarageName('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white">Nhật Ký Bảo Dưỡng & Sửa Chữa</h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-500/30">
              SERVICE LOG
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Theo dõi chi tiết lịch sử bảo dưỡng, thay nhớt, phụ tùng và mốc ODO kiểm tra định kỳ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20"
          >
            <Camera className="w-4 h-4" />
            <span>Quét Hóa Đơn AI</span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm thủ công</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Tổng chi phí bảo dưỡng đã ghi
          </span>
          <div className="text-xl font-extrabold text-amber-300 font-mono">
            {formatCurrencyVND(totalCost)}
          </div>
          <span className="text-[10px] text-slate-400">
            Qua {vehicleMaintenance.length} lần vào xưởng
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Lần bảo dưỡng gần nhất
          </span>
          <div className="text-base font-bold text-white">
            {vehicleMaintenance[0] ? formatDateVN(vehicleMaintenance[0].serviceDate) : 'Chưa có dữ liệu'}
          </div>
          <span className="text-[10px] text-sky-400 font-mono">
            {vehicleMaintenance[0] ? formatKm(vehicleMaintenance[0].odometerKm) : '--'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Mốc bảo dưỡng khuyến nghị tiếp theo
              </span>
              <span className="flex items-center gap-1 text-[10px] text-cyan-400">
                <Bell className="w-3 h-3" />
                <span>Nhắc đẩy</span>
              </span>
            </div>
            <div className="text-xl font-extrabold text-cyan-300 font-mono">
              {formatKm(vehicle.nextServiceOdo || 40000)}
            </div>
            <span className="text-[10px] text-emerald-400">
              {vehicle.nextServiceLevel || 'Cấp bảo dưỡng lớn'}
            </span>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              {vehicle.nextServiceOdo ? `Còn ${(vehicle.nextServiceOdo - vehicle.currentOdo).toLocaleString()} km` : 'Sắp tới'}
            </span>
            {onTriggerMaintenanceNotification && (
              <button
                type="button"
                onClick={onTriggerMaintenanceNotification}
                className="px-2 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-[10px] font-semibold border border-sky-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                title="Bắn thử thông báo đẩy nhắc mốc bảo dưỡng này"
              >
                <Send className="w-2.5 h-2.5" />
                <span>Bắn thử thông báo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance List */}
      <div className="space-y-3">
        {vehicleMaintenance.map((record) => {
          const isExpanded = expandedId === record.id;
          return (
            <div
              key={record.id}
              className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden transition-colors"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : record.id)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-850"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-400/20 text-sky-400 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{record.level}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300">
                        {formatKm(record.odometerKm)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{record.garageName}</span>
                      <span>•</span>
                      <span>{formatDateVN(record.serviceDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <div className="font-mono text-base font-bold text-amber-300">
                      {formatCurrencyVND(record.totalCost)}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {record.items.length} hạng mục phụ tùng
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-950/40 space-y-3 text-xs">
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase text-slate-400 flex justify-between pb-1 border-b border-slate-800">
                      <span>Chi tiết linh kiện & dịch vụ</span>
                      <span>Thành tiền</span>
                    </div>
                    {record.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-300 py-0.5">
                        <span>
                          • {item.name} {item.quantity ? `(x${item.quantity})` : ''}
                        </span>
                        <span className="font-mono text-slate-100">
                          {formatCurrencyVND(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {record.notes && (
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                      <b className="text-slate-300">Ghi chú thợ máy:</b> {record.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">
                      Lần tới: <b className="text-emerald-400 font-mono">{formatKm(record.nextRecommendedOdo)}</b>
                    </span>
                    <button
                      onClick={() => onDeleteMaintenance(record.id)}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa phiếu này
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {vehicleMaintenance.length === 0 && (
          <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-dashed border-slate-800 space-y-2">
            <p className="text-xs text-slate-400">Chưa có lịch sử bảo dưỡng nào.</p>
            <p className="text-[11px] text-slate-500">
              Hãy bấm "Quét Hóa Đơn AI" để chụp hóa đơn bảo dưỡng của gara, Aufix sẽ tự động đọc từng dòng linh kiện và chi phí!
            </p>
          </div>
        )}
      </div>

      {/* Manual Add Maintenance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
            <h3 className="text-base font-bold text-white">Ghi Nhật Ký Bảo Dưỡng Thủ Công</h3>

            <form onSubmit={handleSubmitNew} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Cấp bảo dưỡng / Tên gói</label>
                <input
                  type="text"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Bảo dưỡng định kỳ 40.000 km"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Ngày bảo dưỡng</label>
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Số ODO lúc làm (km)</label>
                  <input
                    type="number"
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Tên Gara / Trung tâm bảo hành</label>
                <input
                  type="text"
                  value={garageName}
                  onChange={(e) => setGarageName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="Gara Ô Tô Tuấn Phát / Đại lý Mazda"
                />
              </div>

              {/* Items */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-semibold">Danh mục phụ tùng & công việc</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-cyan-400 hover:underline text-[11px]"
                  >
                    + Thêm dòng
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      placeholder="Tên phụ tùng (vd: Lọc dầu nhớt)"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                    <input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) =>
                        handleItemChange(idx, 'amount', parseInt(e.target.value, 10) || 0)
                      }
                      placeholder="Số tiền (VND)"
                      className="w-28 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-amber-300 font-mono"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-400 p-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Ghi chú thêm</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white h-16"
                  placeholder="Thay nhớt tổng hợp, đảo lốp, vệ sinh phanh..."
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
                  className="px-5 py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs"
                >
                  Lưu Phiếu Bảo Dưỡng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
