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

// Extract nested list from MERPI/backend response
export const extractList = (r, ...keys) => {
  const payload = r?.data?.data || r?.data || {};
  for (const k of keys) {
    if (Array.isArray(payload[k])) return payload[k];
    if (Array.isArray(payload?.data?.[k])) return payload.data[k];
  }
  return Array.isArray(payload) ? payload : [];
};
