import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Award,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Camera,
  Car,
  QrCode,
  Sparkles,
  Bell,
  Send,
} from 'lucide-react';
import { Vehicle, VehicleDocument } from '../types/vehicle';
import { DocumentCardPreview } from './DocumentCardPreview';
import { formatDateVN, getDaysRemaining } from '../utils/formatters';

interface DocumentsViewProps {
  vehicle: Vehicle;
  documents: VehicleDocument[];
  onOpenScanner: () => void;
  onDeleteDocument: (id: string) => void;
  onTriggerDocNotification?: (doc: VehicleDocument) => void;
  onOpenNotifications?: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  vehicle,
  documents,
  onOpenScanner,
  onDeleteDocument,
  onTriggerDocNotification,
  onOpenNotifications,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<VehicleDocument | null>(null);
  const vehicleDocs = documents.filter((d) => d.vehicleId === vehicle.id);

  // Group or identify missing docs
  const hasRegistration = vehicleDocs.some((d) => d.type === 'REGISTRATION');
  const hasInspection = vehicleDocs.some((d) => d.type === 'INSPECTION');
  const hasInsurance = vehicleDocs.some((d) => d.type === 'INSURANCE');

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white">Sổ Giấy Tờ & Hồ Sơ Xe Số Hóa</h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              AUFIX SAFE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Lưu trữ cà vẹt xe, sổ đăng kiểm, chứng nhận bảo hiểm và giấy tờ pháp lý để xuất trình mọi lúc
          </p>
        </div>

        <button
          onClick={onOpenScanner}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer self-start sm:self-auto"
        >
          <Camera className="w-4 h-4" />
          <span>Quét Chụp Giấy Tờ Mới</span>
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Checklist of mandatory documents */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between ${
            hasRegistration
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs font-bold text-white">Cà Vẹt / Đăng Ký Xe</div>
              <div className="text-[10px]">{hasRegistration ? 'Đã số hóa' : 'Chưa có'}</div>
            </div>
          </div>
          {hasRegistration ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <button
              onClick={onOpenScanner}
              className="text-[11px] text-cyan-400 hover:underline"
            >
              + Chụp ngay
            </button>
          )}
        </div>

        {vehicle.type !== 'MOTORBIKE' && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              hasInspection
                ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-white">Giấy Đăng Kiểm ATKT</div>
                <div className="text-[10px]">
                  {hasInspection
                    ? `Hạn: ${formatDateVN(vehicle.inspectionExpiry)}`
                    : 'Chưa có'}
                </div>
              </div>
            </div>
            {hasInspection ? (
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
            ) : (
              <button
                onClick={onOpenScanner}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                + Chụp ngay
              </button>
            )}
          </div>
        )}

        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between ${
            hasInsurance
              ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-xs font-bold text-white">Bảo Hiểm Xe Cơ Giới</div>
              <div className="text-[10px]">
                {hasInsurance
                  ? `Hạn: ${formatDateVN(vehicle.insuranceExpiry)}`
                  : 'Chưa có'}
              </div>
            </div>
          </div>
          {hasInsurance ? (
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          ) : (
            <button
              onClick={onOpenScanner}
              className="text-[11px] text-cyan-400 hover:underline"
            >
              + Chụp ngay
            </button>
          )}
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {vehicleDocs.map((doc) => {
          const days = getDaysRemaining(doc.expiryDate);
          return (
            <div
              key={doc.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 hover:border-slate-700 transition-all shadow-xl"
            >
              {/* Document Visual Card */}
              <DocumentCardPreview
                type={doc.type}
                data={doc.extractedData || { ...doc, plateNumber: vehicle.plateNumber }}
                showDetails={true}
              />

              {/* Extra Metadata & Actions */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-400">
                <div className="space-y-0.5">
                  <span className="block text-[11px] font-mono text-slate-300">
                    Mã số: {doc.certificateNumber || 'N/A'}
                  </span>
                  {doc.notes && <p className="text-[10px] text-slate-400 italic">{doc.notes}</p>}
                </div>

                <div className="flex items-center gap-2">
                  {onTriggerDocNotification && doc.expiryDate && (
                    <button
                      onClick={() => onTriggerDocNotification(doc)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors cursor-pointer"
                      title="Bắn thông báo đẩy trình duyệt thử nghiệm cho giấy tờ này"
                    >
                      <Send className="w-3 h-3" />
                      <span className="hidden sm:inline">Nhắc đẩy</span>
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors"
                    title="Xóa giấy tờ này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {vehicleDocs.length === 0 && (
          <div className="col-span-full py-16 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Chưa Có Giấy Tờ Nào Trong Sổ</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Bạn có thể chụp ảnh Cà vẹt xe, Sổ đăng kiểm hoặc Giấy bảo hiểm. Gemini 3.8 Flash sẽ tự động đọc và lưu trữ thông tin chuẩn xác.
            </p>
            <button
              onClick={onOpenScanner}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25"
            >
              Bật Camera / Quét Mẫu Ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
