import React from 'react';
import { ShieldCheck, Award, FileText, CheckCircle2, QrCode } from 'lucide-react';
import { formatCurrencyVND } from '../utils/formatters';

interface DocumentCardPreviewProps {
  type: string;
  data: any;
  showDetails?: boolean;
}

export const DocumentCardPreview: React.FC<DocumentCardPreviewProps> = ({
  type,
  data,
  showDetails = true,
}) => {
  const fields = data?.extractedFields || data || {};

  if (type === 'REGISTRATION') {
    return (
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 via-slate-900/90 to-emerald-950/80 p-5 shadow-2xl text-slate-100 font-sans">
        {/* Certificate Watermark / Header */}
        <div className="flex items-start justify-between border-b border-emerald-500/20 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                BỘ CÔNG AN • CỤC CẢNH SÁT GIAO THÔNG
              </p>
              <h4 className="text-base font-extrabold text-white tracking-wide">
                CHỨNG NHẬN ĐĂNG KÝ XE
              </h4>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Số Đăng Ký</span>
            <span className="font-mono text-xs font-bold text-emerald-300">
              {fields.certificateNumber || '084920/ĐK'}
            </span>
          </div>
        </div>

        {/* Plate highlight */}
        <div className="bg-slate-950/70 border border-emerald-500/30 rounded-lg p-2.5 flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Biển số đăng ký</span>
            <div className="font-mono text-xl font-black text-amber-300 tracking-wider">
              {fields.plateNumber || '30H-868.68'}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase">Chủ xe</span>
            <div className="text-xs font-bold text-white uppercase">
              {fields.ownerName || 'NGUYỄN VĂN HÙNG'}
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/40 p-2 rounded border border-emerald-500/10">
              <span className="text-[10px] text-slate-400 block">Nhãn hiệu / Dòng xe</span>
              <span className="font-semibold text-slate-200">
                {fields.brand || 'Mazda'} {fields.model || 'CX-5'}
              </span>
            </div>
            <div className="bg-slate-900/40 p-2 rounded border border-emerald-500/10">
              <span className="text-[10px] text-slate-400 block">Màu sơn / Số chỗ</span>
              <span className="font-semibold text-slate-200">
                {fields.color || 'Đỏ'} • {fields.seats ? `${fields.seats} chỗ` : '5 chỗ'}
              </span>
            </div>
            <div className="bg-slate-900/40 p-2 rounded border border-emerald-500/10 col-span-2">
              <span className="text-[10px] text-slate-400 block">Số khung (VIN)</span>
              <span className="font-mono text-xs text-emerald-300">
                {fields.chassisNumber || 'MM7KF4W76N0892147'}
              </span>
            </div>
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-emerald-500/10 flex items-center justify-between text-[11px] text-emerald-400/80">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Bản số hóa Aufix Safe
          </span>
          <span>Ngày cấp: {fields.issueDate || '18/04/2022'}</span>
        </div>
      </div>
    );
  }

  if (type === 'INSPECTION') {
    return (
      <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/60 via-slate-900/90 to-slate-950 p-5 shadow-2xl text-slate-100 font-sans">
        <div className="flex items-start justify-between border-b border-amber-500/20 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                CỤC ĐĂNG KIỂM VIỆT NAM
              </p>
              <h4 className="text-base font-extrabold text-white tracking-wide">
                GIẤY CHỨNG NHẬN KIỂM ĐỊNH
              </h4>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Số Tem / Sổ</span>
            <span className="font-mono text-xs font-bold text-amber-300">
              {fields.certificateNumber || 'KD-8921458'}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-amber-500/30 rounded-lg p-3 mb-3 grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Biển số</span>
            <div className="font-mono text-lg font-black text-amber-300">
              {fields.plateNumber || '30H-868.68'}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-amber-400 uppercase font-bold">Hạn hiệu lực đến</span>
            <div className="font-mono text-base font-black text-rose-400">
              {fields.expiryDate || '15/12/2026'}
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Trạm kiểm định:</span>
              <span className="font-medium text-slate-200">
                {fields.inspectionStation || 'Trung tâm 29-03V'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Mục đích sử dụng:</span>
              <span className="font-medium text-slate-200">
                {fields.inspectionPurpose || 'Không kinh doanh vận tải'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Ngày kiểm định:</span>
              <span className="font-mono text-slate-300">{fields.issueDate || '15/12/2024'}</span>
            </div>
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px] text-amber-400/90">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Đã kết nối nhắc nhở
          </span>
          <span className="font-semibold text-rose-400">Hạn chót: {fields.expiryDate || '15/12/2026'}</span>
        </div>
      </div>
    );
  }

  if (type === 'INSURANCE') {
    return (
      <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/60 via-slate-900/90 to-slate-950 p-5 shadow-2xl text-slate-100 font-sans">
        <div className="flex items-start justify-between border-b border-cyan-500/20 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                {fields.insurerName || 'BẢO HIỂM PVI SÀI GÒN'}
              </p>
              <h4 className="text-base font-extrabold text-white tracking-wide">
                BẢO HIỂM XE CƠ GIỚI
              </h4>
            </div>
          </div>
          <QrCode className="w-8 h-8 text-cyan-300/60" />
        </div>

        <div className="bg-slate-950/70 border border-cyan-500/30 rounded-lg p-2.5 mb-3 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase">Loại bảo hiểm</span>
            <div className="text-xs font-bold text-cyan-300">
              {fields.insuranceType || 'Bảo hiểm Thân vỏ & TNDS Bắt buộc'}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase">Hotline 24/7</span>
            <div className="font-mono text-xs font-bold text-amber-300">
              {fields.insuranceHotline || '1900 54 54 58'}
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/40 p-2 rounded border border-cyan-500/10">
              <span className="text-[10px] text-slate-400 block">Thời hạn bảo hiểm</span>
              <span className="font-mono text-xs text-slate-200">
                {fields.issueDate || '20/04/2026'} → {fields.expiryDate || '20/04/2027'}
              </span>
            </div>
            <div className="bg-slate-900/40 p-2 rounded border border-cyan-500/10 text-right">
              <span className="text-[10px] text-slate-400 block">Phí bảo hiểm</span>
              <span className="font-semibold text-emerald-400">
                {formatCurrencyVND(fields.insurancePremium || 14200000)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MAINTENANCE
  return (
    <div className="relative overflow-hidden rounded-xl border border-sky-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-sky-950/60 p-5 shadow-2xl text-slate-100 font-sans">
      <div className="flex items-start justify-between border-b border-sky-500/20 pb-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-sky-400">
              {fields.garageName || 'GARA Ô TÔ / TRUNG TÂM DỊCH VỤ'}
            </p>
            <h4 className="text-base font-extrabold text-white tracking-wide">
              {fields.maintenanceLevel || 'PHIẾU BẢO DƯỠNG & SỬA CHỮA'}
            </h4>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Số ODO lúc bảo dưỡng</span>
          <span className="font-mono text-sm font-bold text-sky-300">
            {fields.odometerKm ? `${fields.odometerKm.toLocaleString()} km` : '40.150 km'}
          </span>
        </div>
      </div>

      {fields.serviceItems && fields.serviceItems.length > 0 && (
        <div className="mb-3 bg-slate-950/60 rounded-lg p-2.5 border border-sky-500/20 text-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400 pb-1 mb-1 border-b border-white/5 flex justify-between">
            <span>Hạng mục linh kiện & công việc</span>
            <span>Thành tiền</span>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {fields.serviceItems.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-slate-300">
                <span className="truncate pr-2">• {item.name} {item.quantity ? `(x${item.quantity})` : ''}</span>
                <span className="font-mono font-medium text-slate-100 shrink-0">
                  {formatCurrencyVND(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-sky-500/20">
        <div>
          <span className="text-[10px] text-slate-400 block">Kỳ bảo dưỡng kế tiếp</span>
          <span className="font-mono text-xs font-bold text-emerald-400">
            {fields.nextServiceOdo ? `${fields.nextServiceOdo.toLocaleString()} km` : '45.000 km'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Tổng thanh toán</span>
          <span className="font-mono text-base font-extrabold text-amber-300">
            {formatCurrencyVND(fields.totalAmount || 3850000)}
          </span>
        </div>
      </div>
    </div>
  );
};
