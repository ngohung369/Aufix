export function formatCurrencyVND(amount: number | undefined | null): string {
  if (amount == null || isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatKm(km: number | undefined | null): string {
  if (km == null || isNaN(km)) return '0 km';
  return new Intl.NumberFormat('vi-VN').format(km) + ' km';
}

export function formatDateVN(dateString: string | undefined | null): string {
  if (!dateString) return '--/--/----';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getDaysRemaining(dateString: string | undefined | null): number | null {
  if (!dateString) return null;
  try {
    const target = new Date(dateString).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff;
  } catch {
    return null;
  }
}
