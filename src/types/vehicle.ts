export type VehicleType = 'CAR' | 'MOTORBIKE' | 'TRUCK';

export interface Vehicle {
  id: string;
  name: string; // e.g. "Mazda CX-5 2.0 Premium"
  plateNumber: string; // e.g. "30H-868.68"
  type: VehicleType;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  engineCapacity?: string;
  chassisNumber?: string; // VIN
  engineNumber?: string;
  ownerName?: string;
  ownerAddress?: string;
  currentOdo: number; // km
  lastOdoUpdate?: string;

  // Key document dates
  inspectionExpiry?: string; // YYYY-MM-DD
  insuranceExpiry?: string; // YYYY-MM-DD
  insuranceType?: string;
  insurerName?: string;
  insuranceHotline?: string;

  nextServiceOdo?: number;
  nextServiceDate?: string;
  nextServiceLevel?: string;

  imageUrl?: string;
}

export type DocumentType = 
  | 'REGISTRATION' // Cà vẹt xe
  | 'INSPECTION'   // Đăng kiểm
  | 'INSURANCE'    // Bảo hiểm TNDS / Thân vỏ
  | 'MAINTENANCE'  // Phiếu bảo dưỡng / sửa chữa
  | 'FUEL'         // Hóa đơn đổ xăng
  | 'OTHER';

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: DocumentType;
  title: string;
  certificateNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  imageThumbnail?: string;
  extractedData?: Record<string, any>;
  notes?: string;
  createdAt: string;
}

export interface ServiceItem {
  name: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  serviceDate: string;
  odometerKm: number;
  garageName: string;
  garageAddress?: string;
  level: string; // e.g. "Bảo dưỡng 40.000 km", "Thay dầu nhớt & lọc"
  items: ServiceItem[];
  totalCost: number;
  receiptImage?: string;
  nextRecommendedOdo?: number;
  nextRecommendedDate?: string;
  notes?: string;
}

export type ExpenseCategory = 
  | 'FUEL' 
  | 'MAINTENANCE' 
  | 'INSURANCE' 
  | 'INSPECTION' 
  | 'TOLL_PARKING' 
  | 'FINE' 
  | 'ACCESSORIES' 
  | 'OTHER';

export interface ExpenseRecord {
  id: string;
  vehicleId: string;
  date: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  odometerKm?: number;
  fuelVolume?: number; // liters
  fuelPricePerLiter?: number;
  fuelType?: string;
  receiptImage?: string;
  notes?: string;
}

export interface ExtractedDocumentData {
  documentType: DocumentType;
  documentTitle: string;
  confidenceScore: number;
  extractedFields: {
    plateNumber?: string;
    ownerName?: string;
    ownerAddress?: string;
    brand?: string;
    model?: string;
    color?: string;
    chassisNumber?: string;
    engineNumber?: string;
    seats?: number;
    engineCapacity?: string;
    firstRegistrationDate?: string;
    issueDate?: string;
    expiryDate?: string;
    certificateNumber?: string;
    inspectionStation?: string;
    inspectionPurpose?: string;
    insurerName?: string;
    insuranceType?: string;
    insuranceHotline?: string;
    insurancePremium?: number;
    garageName?: string;
    garageAddress?: string;
    odometerKm?: number;
    maintenanceLevel?: string;
    totalAmount?: number;
    nextServiceOdo?: number;
    nextServiceDate?: string;
    serviceItems?: Array<{
      name: string;
      quantity?: number;
      unitPrice?: number;
      amount: number;
    }>;
    fuelType?: string;
    fuelVolumeLiters?: number;
    fuelPricePerLiter?: number;
  };
  summary: string;
  recommendation?: string;
  actionType?: string;
}

export type TripPurpose =
  | 'COMMUTE'    // Đi làm hàng ngày
  | 'BUSINESS'   // Đi công tác / Đối tác
  | 'FAMILY'     // Việc gia đình / Cá nhân
  | 'TRAVEL'     // Du lịch / Phượt
  | 'DELIVERY'   // Chở hàng / Dịch vụ
  | 'OTHER';     // Mục đích khác

export interface TripRecord {
  id: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  startLocation: string; // Điểm đi
  endLocation: string;   // Điểm đến
  distanceKm: number;    // Quãng đường km
  purpose: TripPurpose;  // Mục đích chuyến đi
  purposeNote?: string;
  startOdo: number;      // ODO bắt đầu
  endOdo: number;        // ODO kết thúc (startOdo + distanceKm)
  autoOdoUpdated: boolean; // Đã tự động cập nhật ODO của xe chưa
  fuelCostEstimate?: number; // Chi phí xăng ước tính
  notes?: string;
  createdAt: string;
}
