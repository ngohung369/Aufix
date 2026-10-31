import React, { useState } from 'react';
import { X, Car, Bike, Sparkles, CheckCircle2 } from 'lucide-react';
import { Vehicle, VehicleType } from '../types/vehicle';

interface VehicleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVehicle: (v: Vehicle) => void;
  vehicleToEdit?: Vehicle | null;
}

export const VehicleManagerModal: React.FC<VehicleManagerModalProps> = ({
  isOpen,
  onClose,
  onSaveVehicle,
  vehicleToEdit,
}) => {
  const [name, setName] = useState(vehicleToEdit?.name || '');
  const [plateNumber, setPlateNumber] = useState(vehicleToEdit?.plateNumber || '');
  const [type, setType] = useState<VehicleType>(vehicleToEdit?.type || 'CAR');
  const [brand, setBrand] = useState(vehicleToEdit?.brand || '');
  const [model, setModel] = useState(vehicleToEdit?.model || '');
  const [year, setYear] = useState<number>(vehicleToEdit?.year || 2023);
  const [color, setColor] = useState(vehicleToEdit?.color || '');
  const [currentOdo, setCurrentOdo] = useState<number>(vehicleToEdit?.currentOdo || 10000);
  const [chassisNumber, setChassisNumber] = useState(vehicleToEdit?.chassisNumber || '');
  const [engineNumber, setEngineNumber] = useState(vehicleToEdit?.engineNumber || '');
  const [ownerName, setOwnerName] = useState(vehicleToEdit?.ownerName || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVehicle: Vehicle = {
      id: vehicleToEdit?.id || 'veh-' + Date.now(),
      name: name || `${brand} ${model}` || 'Phương tiện mới',
      plateNumber: plateNumber || '30H-999.99',
      type,
      brand: brand || (type === 'MOTORBIKE' ? 'Honda' : 'Toyota'),
      model: model || (type === 'MOTORBIKE' ? 'Wave' : 'Vios'),
      year: Number(year) || 2023,
      color: color || 'Trắng',
      currentOdo: Number(currentOdo) || 0,
      chassisNumber,
      engineNumber,
      ownerName,
      lastOdoUpdate: new Date().toISOString().split('T')[0],
      inspectionExpiry: type === 'CAR' ? '2026-12-31' : undefined,
      insuranceExpiry: '2027-01-01',
    };
    onSaveVehicle(newVehicle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-100 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              {vehicleToEdit ? 'Chỉnh Sửa Hồ Sơ Xe' : 'Thêm Xe Mới Vào Garage'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('CAR')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 ${
                type === 'CAR'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Xe Ô Tô</span>
            </button>
            <button
              type="button"
              onClick={() => setType('MOTORBIKE')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 ${
                type === 'MOTORBIKE'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Xe Máy / Mô Tô</span>
            </button>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Tên xe hiển thị</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              placeholder="VD: Mazda CX-5 2.0 / Honda SH 150i"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-amber-400 font-bold block mb-1">Biển số đăng ký</label>
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 text-amber-300 font-mono font-bold"
                placeholder="30H-868.68"
                required
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Số ODO hiện tại (km)</label>
              <input
                type="number"
                value={currentOdo}
                onChange={(e) => setCurrentOdo(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Hãng xe (Brand)</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                placeholder="Mazda / Toyota / Honda..."
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Dòng xe (Model)</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                placeholder="CX-5 / Vios / City..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Màu sơn</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                placeholder="Đỏ / Trắng / Đen..."
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Chủ phương tiện</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                placeholder="Họ và tên chủ xe"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs"
            >
              Lưu Phương Tiện
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
