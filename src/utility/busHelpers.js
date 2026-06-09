// Shared helpers for all bus booking screens

// Normalize MERPI location objects (may be string or { address, city: { name } })
export const placeLabel = (v) => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    const city = typeof v.city === 'object' ? v.city?.name : v.city;
    return city || v.name || v.address || '';
  }
  return String(v);
};

// Derive airline-style seat code from row/column (row 1, col 1 → "1A")
export const seatLabel = (seat) =>
  `${seat.row}${String.fromCharCode(64 + seat.column)}`;

// YYYY-MM-DD → "25 Aug 2024"
export const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : '';

// YYYY-MM-DD → DD-MM-YYYY (MERPI schedules/seats format)
export const toDMY = (ymd) => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  return `${d}-${m}-${y}`;
};

// Convert "HH:MM AM/PM" or "HH:MM" to 24-hour "HH:MM"
export const to24Hour = (timeStr) => {
  if (!timeStr) return '00:00';
  const match = timeStr.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
  if (!match) return '00:00';
  let hours = parseInt(match[1], 10);
  const mins = match[2];
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${mins}`;
};

// Combine YYYY-MM-DD date + time string → "YYYY-MM-DD HH:MM" (V2 API format)
export const buildDepartureDate = (dateStr, timeStr) => {
  const date = new Date(dateStr);
  const yyyy = date.getFullYear();
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const dd   = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${to24Hour(timeStr)}`;
};

// Extract nested list from MERPI/backend response
export const extractList = (r, ...keys) => {
  const payload = r?.data?.data || r?.data || {};
  for (const k of keys) {
    if (Array.isArray(payload[k])) return payload[k];
    if (Array.isArray(payload?.data?.[k])) return payload.data[k];
  }
  return Array.isArray(payload) ? payload : [];
};
