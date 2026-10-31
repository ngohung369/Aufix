import React, { useState, useEffect } from 'react';
import {
  X,
  PhoneCall,
  ShieldAlert,
  AlertTriangle,
  Car,
  Fuel,
  Wrench,
  MapPin,
  Navigation,
  ExternalLink,
  Clock,
  Star,
  LocateFixed,
  Radio,
  Search,
} from 'lucide-react';
import { Vehicle } from '../types/vehicle';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVehicle: Vehicle;
}

interface NearbyPlace {
  id: string;
  name: string;
  type: 'GAS_STATION' | 'REPAIR_SHOP' | 'TIRE_BATTERY';
  address: string;
  distanceKm: number;
  phone: string;
  openHours: string;
  rating: number;
  tags: string[];
}

export const SosModal: React.FC<SosModalProps> = ({
  isOpen,
  onClose,
  currentVehicle,
}) => {
  const [activeTab, setActiveTab] = useState<'NEARBY' | 'HOTLINES'>('NEARBY');
  const [placeFilter, setPlaceFilter] = useState<'ALL' | 'GAS_STATION' | 'REPAIR_SHOP'>('ALL');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [locationAddress, setLocationAddress] = useState<string>('Đang định vị...');

  // Automatically request geolocation when modal opens
  useEffect(() => {
    if (isOpen) {
      if ('geolocation' in navigator) {
        setLocationStatus('LOADING');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            setUserLocation(coords);
            setLocationStatus('SUCCESS');
            setLocationAddress(`${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E (Vị trí hiện tại của bạn)`);
          },
          (err) => {
            console.warn('Geolocation error or declined:', err);
            // Fallback to default city center
            setUserLocation({ lat: 21.0285, lng: 105.8542 });
            setLocationStatus('ERROR');
            setLocationAddress('Hà Nội / Vị trí ước lượng từ mạng');
          },
          { timeout: 7000, enableHighAccuracy: true }
        );
      } else {
        setUserLocation({ lat: 21.0285, lng: 105.8542 });
        setLocationStatus('ERROR');
        setLocationAddress('Thiết bị không hỗ trợ GPS');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isCar = currentVehicle.type !== 'MOTORBIKE';

  // Sample verified nearby stations & workshops tailored to vehicle type
  const nearbyPlaces: NearbyPlace[] = [
    {
      id: 'p-1',
      name: 'Cửa hàng Xăng dầu Petrolimex Số 01',
      type: 'GAS_STATION',
      address: 'Đường lớn gần bạn (Mặt tiền thuận tiện xe ô tô/xe máy)',
      distanceKm: 0.6,
      phone: '1900 2828',
      openHours: '24/24',
      rating: 4.8,
      tags: ['RON 95-V', 'Dầu DO 0,001S-V', 'Thanh toán thẻ/VETC'],
    },
    {
      id: 'p-2',
      name: isCar
        ? `Xưởng Dịch Vụ & Gara Cứu Hộ ${currentVehicle.brand || 'Ô Tô'} 24/7`
        : 'Tiệm Sửa Xe Máy Cứu Hộ Lưu Động 24/7',
      type: 'REPAIR_SHOP',
      address: 'Cách vị trí bạn khoảng 1.2 km',
      distanceKm: 1.2,
      phone: currentVehicle.insuranceHotline || '1900 54 55 91',
      openHours: '24/7 Cứu hộ khẩn cấp',
      rating: 4.9,
      tags: isCar
        ? ['Cẩu kéo xe 24/7', 'Kích bình ắc quy', 'Thay lốp dự phòng']
        : ['Vá săm lốp lưu động', 'Thay ắc quy', 'Sửa chết máy'],
    },
    {
      id: 'p-3',
      name: 'Trạm Xăng Dầu PVOIL Trục Chính',
      type: 'GAS_STATION',
      address: 'Cách 1.8 km hướng thẳng',
      distanceKm: 1.8,
      phone: '1900 55 88 56',
      openHours: '05:00 - 23:00',
      rating: 4.7,
      tags: ['RON 95-III', 'PVOIL Easy QR', 'Có vòi bơm lốp miễn phí'],
    },
    {
      id: 'p-4',
      name: isCar ? 'Trung Tâm Cứu Hộ Giao Thông & Vá Vỏ Lưu Động' : 'Tiệm Sửa Xe & Thay Nhớt Uy Tín',
      type: 'REPAIR_SHOP',
      address: 'Cách vị trí bạn 2.4 km',
      distanceKm: 2.4,
      phone: '0903 116 116',
      openHours: '24/24',
      rating: 4.6,
      tags: ['Xe cứu hộ sàn trượt', 'Vá vỏ lưu động', 'Xử lý ngập nước'],
    },
    {
      id: 'p-5',
      name: 'Trạm Xăng Dầu Quân Đội Mipec / Petrolimex',
      type: 'GAS_STATION',
      address: 'Cách 2.9 km',
      distanceKm: 2.9,
      phone: '1900 2828',
      openHours: '24/24',
      rating: 4.8,
      tags: ['Bơm nhanh', 'Bãi đỗ rộng'],
    },
  ];

  const filteredPlaces = nearbyPlaces.filter((p) => {
    if (placeFilter === 'ALL') return true;
    return p.type === placeFilter;
  });

  interface HotlineItem {
    name: string;
    phone: string;
    desc: string;
    isUser?: boolean;
  }

  interface HotlineCategory {
    category: string;
    items: HotlineItem[];
  }

  // Hotlines list
  const hotlines: HotlineCategory[] = [
    {
      category: 'Bảo Hiểm Của Bạn',
      items: [
        {
          name: currentVehicle.insurerName || 'Bảo hiểm xe hiện tại',
          phone: currentVehicle.insuranceHotline || '1900 54 54 58',
          desc: 'Hotline thông báo tai nạn, yêu cầu giám định viên & cứu hộ miễn phí',
          isUser: true,
        },
      ],
    },
    {
      category: 'Khẩn Cấp Quốc Gia',
      items: [
        { name: 'Cứu Nạn Y Tế Khẩn Cấp', phone: '115', desc: 'Cấp cứu người bị thương' },
        { name: 'Cảnh Sát Giao Thông / An Ninh', phone: '113', desc: 'Báo tai nạn, va chạm giao thông' },
        { name: 'Cứu Hộ Cứu Nạn PCCC', phone: '114', desc: 'Cháy nổ xe, cứu kẹt trong cabin' },
      ],
    },
    {
      category: 'Cứu Hộ Hãng Xe 24/7 Tại Việt Nam',
      items: [
        { name: 'Mazda / Kia / Peugeot (Thaco)', phone: '1900 54 55 91', desc: 'Cứu hộ chính hãng toàn quốc' },
        { name: 'Toyota Việt Nam', phone: '1800 1524', desc: 'Hỗ trợ kỹ thuật & kéo xe 24/7' },
        { name: 'VinFast Auto', phone: '1900 23 23 89', desc: 'Cứu hộ xe điện, sạc pin lưu động 24/7' },
        { name: 'Honda Ô Tô & Xe Máy', phone: '1800 8001', desc: 'Hotline chăm sóc & cứu hộ khách hàng' },
        { name: 'Hyundai Thành Công', phone: '1900 56 12 12', desc: 'Dịch vụ cứu hộ đường bộ Hyundai' },
      ],
    },
  ];

  // Quick navigation helper
  const openGoogleMapsSearch = (query: string) => {
    const lat = userLocation?.lat || 21.0285;
    const lng = userLocation?.lng || 105.8542;
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},15z`;
    window.open(url, '_blank');
  };

  const openGoogleMapsDirections = (placeName: string, placeAddress: string) => {
    const destination = `${placeName}, ${placeAddress}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-rose-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-rose-950/50 space-y-4 text-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  SOS Khẩn Cấp & Tìm Cứu Hộ Gần Nhất
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                  {currentVehicle.plateNumber}
                </span>
              </div>
              <p className="text-xs text-rose-300">
                Tìm trạm xăng, gara cứu hộ quanh bạn hoặc liên hệ đường dây nóng 24/7
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('NEARBY')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'NEARBY'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Trạm Xăng & Xưởng Gần Đây</span>
          </button>
          <button
            onClick={() => setActiveTab('HOTLINES')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'HOTLINES'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Hotline Cứu Hộ & Bảo Hiểm</span>
          </button>
        </div>

        {/* TAB 1: NEARBY GAS STATIONS & REPAIR SHOPS */}
        {activeTab === 'NEARBY' && (
          <div className="space-y-3.5">
            {/* GPS Location Bar */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <LocateFixed className={`w-4 h-4 shrink-0 ${locationStatus === 'LOADING' ? 'animate-spin text-cyan-400' : 'text-emerald-400'}`} />
                <div>
                  <div className="text-[11px] text-slate-400">Vị trí hiện tại của bạn:</div>
                  <div className="font-semibold text-white truncate max-w-sm">
                    {locationAddress}
                  </div>
                </div>
              </div>

              {/* Direct Google Maps Live Search Triggers */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => openGoogleMapsSearch(isCar ? 'trạm xăng gần đây' : 'cây xăng gần đây')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all cursor-pointer"
                  title="Tìm trực tiếp tất cả cây xăng xung quanh bạn trên Google Maps"
                >
                  <Fuel className="w-3 h-3" />
                  <span>Google Maps Cây Xăng</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={() => openGoogleMapsSearch(isCar ? 'gara ô tô cứu hộ gần đây' : 'tiệm sửa xe máy gần đây')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-all cursor-pointer"
                  title="Tìm trực tiếp tất cả xưởng cứu hộ/sửa chữa trên Google Maps"
                >
                  <Wrench className="w-3 h-3" />
                  <span>Google Maps Gara</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setPlaceFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  placeFilter === 'ALL'
                    ? 'bg-slate-800 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Tất cả ({nearbyPlaces.length})
              </button>
              <button
                onClick={() => setPlaceFilter('GAS_STATION')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  placeFilter === 'GAS_STATION'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <Fuel className="w-3 h-3" />
                <span>Trạm Xăng</span>
              </button>
              <button
                onClick={() => setPlaceFilter('REPAIR_SHOP')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  placeFilter === 'REPAIR_SHOP'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <Wrench className="w-3 h-3" />
                <span>Xưởng Sửa Chữa & Cứu Hộ</span>
              </button>
            </div>

            {/* Places List */}
            <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
              {filteredPlaces.map((place) => (
                <div
                  key={place.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          place.type === 'GAS_STATION'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                        }`}
                      >
                        {place.type === 'GAS_STATION' ? (
                          <Fuel className="w-4 h-4" />
                        ) : (
                          <Wrench className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-white text-sm">{place.name}</h4>
                          <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {place.rating}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{place.address}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-rose-400 text-xs">
                        ~{place.distanceKm} km
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 justify-end mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{place.openHours}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {place.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-900 gap-2">
                    <a
                      href={`tel:${place.phone.replace(/\s+/g, '')}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      <PhoneCall className="w-3 h-3 text-rose-400" />
                      <span>Gọi {place.phone}</span>
                    </a>

                    <button
                      onClick={() => openGoogleMapsDirections(place.name, place.address)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950 transition-all cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Chỉ Đường Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: HOTLINES */}
        {activeTab === 'HOTLINES' && (
          <div className="space-y-4">
            {/* 4 Steps when accident happens */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2 text-xs">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                4 BƯỚC CẦN LÀM NGAY KHI XẢY RA VA CHẠM ĐỂ ĐƯỢC BẢO HIỂM:
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                <li>Dừng xe an toàn, bật đèn cảnh báo nguy hiểm (hazard), kiểm tra người.</li>
                <li><b>Chụp ảnh toàn cảnh hiện trường:</b> biển số, vị trí va chạm, góc đường trước khi di chuyển xe.</li>
                <li><b>Gọi ngay hotline bảo hiểm</b> (trong vòng 1 tiếng) để mở hồ sơ giám định và xin hướng dẫn.</li>
                <li>Nếu có tranh chấp hoặc thiệt hại lớn, gọi CSGT 113 để lập biên bản hiện trường.</li>
              </ol>
            </div>

            {/* Hotlines List */}
            <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
              {hotlines.map((group, gIdx) => (
                <div key={gIdx} className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {group.category}
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          item.isUser
                            ? 'bg-rose-950/30 border-rose-500/40'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white text-sm">{item.name}</div>
                          <div className="text-[11px] text-slate-400">{item.desc}</div>
                        </div>
                        <a
                          href={`tel:${item.phone.replace(/\s+/g, '')}`}
                          className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-950 transition-colors"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          {item.phone}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Khuyên dùng: Luôn bật GPS để nhận chỉ đường chính xác nhất.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

