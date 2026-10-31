import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Trash2,
  RefreshCw,
  LogOut,
  Car,
  FileText,
  Wrench,
  Fuel,
  Database,
  Download,
  Upload,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  logout,
  initAuth,
  backupToGoogleDrive,
  restoreFromGoogleDrive,
  listDriveBackups,
  deleteBackupFromGoogleDrive,
  VeoBackupPayload,
  DriveFileInfo,
  BACKUP_FILE_NAME,
} from '../services/googleDriveService';
import {
  Vehicle,
  VehicleDocument,
  MaintenanceRecord,
  ExpenseRecord,
  TripRecord,
} from '../types/vehicle';
import { NotificationSettings } from '../types/notification';
import { formatDateVN } from '../utils/formatters';

interface GoogleDriveBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  documents: VehicleDocument[];
  maintenance: MaintenanceRecord[];
  expenses: ExpenseRecord[];
  trips?: TripRecord[];
  settings: NotificationSettings;
  onRestoreData: (restored: {
    vehicles: Vehicle[];
    documents: VehicleDocument[];
    maintenance: MaintenanceRecord[];
    expenses: ExpenseRecord[];
    trips?: TripRecord[];
  }) => void;
  onShowToast: (message: string, type?: 'success' | 'info') => void;
}

export const GoogleDriveBackupModal: React.FC<GoogleDriveBackupModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  documents,
  maintenance,
  expenses,
  trips = [],
  settings,
  onRestoreData,
  onShowToast,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isOperating, setIsOperating] = useState(false);
  const [driveBackups, setDriveBackups] = useState<DriveFileInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'offline'>('backup');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Track last backup time in local storage
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    return localStorage.getItem('veo_last_drive_backup_time');
  });

  // Initialize auth listener
  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingAuth(true);
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setIsLoadingAuth(false);
        // Load backups list
        fetchBackupsList(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsLoadingAuth(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  const fetchBackupsList = async (token: string) => {
    try {
      const files = await listDriveBackups(token);
      setDriveBackups(files);
      if (files.length > 0) {
        setLastBackupTime(files[0].modifiedTime);
        localStorage.setItem('veo_last_drive_backup_time', files[0].modifiedTime);
      }
    } catch (err) {
      console.error('Fetch backups error:', err);
    }
  };

  if (!isOpen) return null;

  // Handle Google Login
  const handleSignIn = async () => {
    setIsOperating(true);
    try {
      const result = await googleSignIn();
      setUser(result.user);
      setAccessToken(result.accessToken);
      onShowToast(`Đã kết nối Google Drive (${result.user.email})!`);
      await fetchBackupsList(result.accessToken);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      onShowToast(err.message || 'Không thể đăng nhập Google', 'info');
    } finally {
      setIsOperating(false);
    }
  };

  // Handle Google Logout
  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setDriveBackups([]);
    onShowToast('Đã đăng xuất tài khoản Google');
  };

  // Perform Backup to Google Drive
  const handleBackupNow = async () => {
    if (!accessToken) {
      await handleSignIn();
      return;
    }

    setIsOperating(true);
    try {
      const payload: VeoBackupPayload = {
        version: '1.0',
        appName: 'Aufix: Ứng dụng quản lý xe',
        exportedAt: new Date().toISOString(),
        vehicles,
        documents,
        maintenance,
        expenses,
        trips,
        settings,
        statsSummary: {
          vehiclesCount: vehicles.length,
          documentsCount: documents.length,
          maintenanceCount: maintenance.length,
          expensesCount: expenses.length,
          tripsCount: trips.length,
        },
      };

      const result = await backupToGoogleDrive(accessToken, payload);
      const timeStr = result.modifiedTime || new Date().toISOString();
      setLastBackupTime(timeStr);
      localStorage.setItem('veo_last_drive_backup_time', timeStr);
      await fetchBackupsList(accessToken);
      onShowToast('Đã sao lưu thành công lên Google Drive!');
    } catch (err: any) {
      console.error('Backup error:', err);
      onShowToast(err.message || 'Lỗi khi sao lưu lên Google Drive', 'info');
    } finally {
      setIsOperating(false);
    }
  };

  // Perform Restore with mandatory user confirmation
  const triggerRestorePrompt = (file: DriveFileInfo) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Phục Hồi Dữ Liệu Từ Google Drive',
      description: `Bạn có chắc chắn muốn phục hồi dữ liệu từ bản sao lưu "${file.name}" (cập nhật lúc ${formatDateVN(
        file.modifiedTime
      )})? Toàn bộ danh sách xe, giấy tờ và chi phí hiện tại trên app sẽ được đồng bộ theo bản sao lưu này.`,
      confirmText: 'Đồng ý phục hồi',
      isDestructive: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        if (!accessToken) return;
        setIsOperating(true);
        try {
          const restoredPayload = await restoreFromGoogleDrive(accessToken, file.id);
          onRestoreData({
            vehicles: restoredPayload.vehicles || [],
            documents: restoredPayload.documents || [],
            maintenance: restoredPayload.maintenance || [],
            expenses: restoredPayload.expenses || [],
            trips: restoredPayload.trips || [],
          });
          onShowToast(
            `Đã phục hồi thành công ${restoredPayload.vehicles?.length || 0} xe & ${
              restoredPayload.documents?.length || 0
            } giấy tờ từ Google Drive!`
          );
          onClose();
        } catch (err: any) {
          console.error('Restore error:', err);
          onShowToast(err.message || 'Lỗi khi phục hồi dữ liệu', 'info');
        } finally {
          setIsOperating(false);
        }
      },
    });
  };

  // Perform Delete backup file with mandatory user confirmation
  const triggerDeletePrompt = (file: DriveFileInfo) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa Bản Sao Lưu Trên Google Drive?',
      description: `Bạn có chắc chắn muốn xóa vĩnh viễn tệp sao lưu "${file.name}" khỏi Google Drive của bạn? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xóa vĩnh viễn',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        if (!accessToken) return;
        setIsOperating(true);
        try {
          await deleteBackupFromGoogleDrive(accessToken, file.id);
          await fetchBackupsList(accessToken);
          onShowToast('Đã xóa tệp sao lưu trên Google Drive');
        } catch (err: any) {
          onShowToast(err.message || 'Lỗi khi xóa tệp sao lưu', 'info');
        } finally {
          setIsOperating(false);
        }
      },
    });
  };

  // Offline JSON export
  const handleExportOfflineJson = () => {
    const payload: VeoBackupPayload = {
      version: '1.0',
      appName: 'Aufix: Ứng dụng quản lý xe',
      exportedAt: new Date().toISOString(),
      vehicles,
      documents,
      maintenance,
      expenses,
      settings,
      statsSummary: {
        vehiclesCount: vehicles.length,
        documentsCount: documents.length,
        maintenanceCount: maintenance.length,
        expensesCount: expenses.length,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aufix_Vehicle_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Đã tải tệp sao lưu JSON về thiết bị!');
  };

  // Offline JSON import
  const handleImportOfflineJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as VeoBackupPayload;
        if (!parsed || !Array.isArray(parsed.vehicles)) {
          throw new Error('Định dạng tệp JSON không hợp lệ');
        }
        setConfirmDialog({
          isOpen: true,
          title: 'Xác Nhận Nhập Tệp Sao Lưu Ngoại Tuyến',
          description: `Tệp chứa ${parsed.vehicles.length} xe, ${parsed.documents?.length || 0} giấy tờ, ${
            parsed.maintenance?.length || 0
          } bảo dưỡng. Bạn có muốn phục hồi vào app?`,
          confirmText: 'Nhập dữ liệu',
          isDestructive: false,
          onConfirm: () => {
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            onRestoreData({
              vehicles: parsed.vehicles,
              documents: parsed.documents || [],
              maintenance: parsed.maintenance || [],
              expenses: parsed.expenses || [],
            });
            onShowToast('Đã nhập dữ liệu thành công!');
            onClose();
          },
        });
      } catch (err: any) {
        onShowToast(err.message || 'Lỗi khi đọc tệp JSON', 'info');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Sao Lưu & Phục Hồi Google Drive
                </h3>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                  ONLINE CLOUD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Đồng bộ an toàn dữ liệu sổ xe, cà vẹt, bảo dưỡng và chi phí lên Google Drive
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Auth Status Banner */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-9 h-9 rounded-full border border-cyan-500/40"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{user.displayName || 'Tài khoản Google'}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200">
                  Chưa kết nối tài khoản Google Drive
                </div>
                <div className="text-[11px] text-slate-400">
                  Đăng nhập để tự động lưu tệp sao lưu vào Google Drive của bạn
                </div>
              </div>

              {/* Official Google Sign-In Button */}
              <button
                onClick={handleSignIn}
                disabled={isOperating}
                className="flex items-center justify-center gap-2.5 px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-semibold text-xs shadow-md transition-all cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/20 px-5 pt-2 gap-3 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Sao Lưu Lên Drive</span>
          </button>

          <button
            onClick={() => setActiveTab('restore')}
            className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'restore'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudDownload className="w-3.5 h-3.5" />
            <span>Phục Hồi Dữ Liệu ({driveBackups.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('offline')}
            className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'offline'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Xuất / Nhập Tệp JSON</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: BACKUP TO DRIVE */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* Data Summary Card */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-[11px] uppercase font-bold text-slate-400 block">
                  Dữ Liệu Sẽ Được Đồng Bộ Lên Google Drive
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <Car className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-sm font-bold text-white font-mono">{vehicles.length}</div>
                      <div className="text-[10px] text-slate-400">Phương tiện</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-sm font-bold text-white font-mono">{documents.length}</div>
                      <div className="text-[10px] text-slate-400">Giấy tờ số hóa</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="text-sm font-bold text-white font-mono">{maintenance.length}</div>
                      <div className="text-[10px] text-slate-400">Nhật ký bảo dưỡng</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-sm font-bold text-white font-mono">{expenses.length}</div>
                      <div className="text-[10px] text-slate-400">Khoản chi tiêu</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Tên tệp trên Drive: <b className="text-slate-200 font-mono">{BACKUP_FILE_NAME}</b></span>
                  {lastBackupTime && (
                    <span>Lần sao lưu gần nhất: <b className="text-cyan-400">{formatDateVN(lastBackupTime)}</b></span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleBackupNow}
                disabled={isOperating}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 hover:from-blue-500 hover:to-sky-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {isOperating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang tải lên Google Drive...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" />
                    <span>Sao Lưu Lên Google Drive Ngay</span>
                  </>
                )}
              </button>

              {/* Security info */}
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed space-y-1">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Bảo mật quyền riêng tư (Google Drive File Scope):
                </div>
                <p>
                  Ứng dụng chỉ có quyền tạo và chỉnh sửa duy nhất tệp sao lưu do Aufix tạo ra, hoàn toàn không truy cập hay đọc các tệp tin cá nhân khác trên Google Drive của bạn.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: RESTORE FROM DRIVE */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Các bản sao lưu tìm thấy trên tài khoản Google:</span>
                {accessToken && (
                  <button
                    onClick={() => fetchBackupsList(accessToken)}
                    disabled={isOperating}
                    className="text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isOperating ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                  </button>
                )}
              </div>

              {driveBackups.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <CloudDownload className="w-5 h-5" />
                  </div>
                  <div>Chưa tìm thấy bản sao lưu nào trên Google Drive.</div>
                  <button
                    onClick={() => setActiveTab('backup')}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-semibold"
                  >
                    Chuyển sang tab Sao Lưu để tạo bản đầu tiên
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {driveBackups.map((file) => (
                    <div
                      key={file.id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{file.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                            Cloud JSON
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>Cập nhật: {formatDateVN(file.modifiedTime)}</span>
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:underline flex items-center gap-0.5"
                            >
                              <span>Xem trên Drive</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => triggerRestorePrompt(file)}
                          disabled={isOperating}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          Phục Hồi
                        </button>
                        <button
                          onClick={() => triggerDeletePrompt(file)}
                          disabled={isOperating}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Xóa bản sao lưu này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OFFLINE EXPORT / IMPORT */}
          {activeTab === 'offline' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white">Xuất Tệp JSON Ngoại Tuyến (Offline Export)</h4>
                <p className="text-xs text-slate-400">
                  Tải toàn bộ cơ sở dữ liệu xe về máy tính hoặc điện thoại dưới dạng tệp tin `.json` an toàn.
                </p>
                <button
                  onClick={handleExportOfflineJson}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải tệp sao lưu JSON (.json)</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white">Nhập Tệp Sao Lưu Từ Máy (Offline Import)</h4>
                <p className="text-xs text-slate-400">
                  Chọn một tệp sao lưu `.json` đã lưu từ trước để nạp lại dữ liệu xe vào ứng dụng.
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Chọn tệp JSON để phục hồi</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportOfflineJson}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Tự động mã hóa chuẩn UTF-8</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-3 text-slate-100">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">{confirmDialog.title}</h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{confirmDialog.description}</p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-1.5 rounded-lg text-slate-950 font-bold text-xs shadow-md ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-500 hover:bg-rose-400 text-white'
                    : 'bg-cyan-500 hover:bg-cyan-400'
                }`}
              >
                {confirmDialog.confirmText || 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
