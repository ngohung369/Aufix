import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Vehicle,
  VehicleDocument,
  MaintenanceRecord,
  ExpenseRecord,
  TripRecord,
} from '../types/vehicle';
import { NotificationSettings } from '../types/notification';

// 1. Initialize Firebase App (reuse if exists)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 2. Google Auth Provider with Google Drive scope
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache (never in localStorage per security requirements)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const BACKUP_FILE_NAME = 'Aufix_Vehicle_Backup.json';

export type AufixBackupPayload = VeoBackupPayload;
export interface VeoBackupPayload {
  version: string;
  appName: string;
  exportedAt: string;
  vehicles: Vehicle[];
  documents: VehicleDocument[];
  maintenance: MaintenanceRecord[];
  expenses: ExpenseRecord[];
  trips?: TripRecord[];
  settings?: NotificationSettings;
  statsSummary: {
    vehiclesCount: number;
    documentsCount: number;
    maintenanceCount: number;
    expensesCount: number;
    tripsCount?: number;
  };
}

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
}

// 3. Auth Management
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User is logged into Firebase Auth session, but we need fresh OAuth token for Google Drive API
        // Keep user signed in, token will be renewed via signIn or on-demand
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không lấy được OAuth Access Token từ Google');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

// 4. Google Drive API Operations
export async function listDriveBackups(token: string): Promise<DriveFileInfo[]> {
  try {
    const query = encodeURIComponent(`name = '${BACKUP_FILE_NAME}' and trashed = false`);
    const fields = encodeURIComponent('files(id, name, modifiedTime, size, webViewLink)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `Lỗi tải danh sách backup (${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (err: any) {
    console.error('List Drive Backups Error:', err);
    throw err;
  }
}

export async function backupToGoogleDrive(
  token: string,
  payload: VeoBackupPayload
): Promise<DriveFileInfo> {
  try {
    // 1. Check if backup file already exists in Drive
    const existingFiles = await listDriveBackups(token);
    const fileContent = JSON.stringify(payload, null, 2);
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: BACKUP_FILE_NAME,
      mimeType: 'application/json',
      description: `Bản sao lưu dữ liệu xe Aufix lúc ${new Date().toLocaleString('vi-VN')}`,
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    let res: Response;

    if (existingFiles.length > 0) {
      // Update existing file in Google Drive
      const fileId = existingFiles[0].id;
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id,name,modifiedTime,size,webViewLink`;
      res = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });
    } else {
      // Create new file in Google Drive
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,size,webViewLink`;
      res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Lỗi tải lên Google Drive (${res.status})`);
    }

    const uploaded = await res.json();
    return uploaded;
  } catch (err: any) {
    console.error('Backup to Google Drive Error:', err);
    throw err;
  }
}

export async function restoreFromGoogleDrive(
  token: string,
  fileId: string
): Promise<VeoBackupPayload> {
  try {
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Không thể tải tệp sao lưu từ Google Drive (Mã lỗi ${res.status})`);
    }

    const rawData = await res.json();

    // Validate payload basic schema
    if (!rawData || !Array.isArray(rawData.vehicles)) {
      throw new Error('Tệp sao lưu không đúng định dạng Aufix!');
    }

    return rawData as VeoBackupPayload;
  } catch (err: any) {
    console.error('Restore from Google Drive Error:', err);
    throw err;
  }
}

export async function deleteBackupFromGoogleDrive(token: string, fileId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Không thể xóa tệp sao lưu trên Drive (${res.status})`);
  }
}
