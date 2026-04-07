/**
 * Minimal input sanitizers / validators for the app UI.
 * React escapes inserted text automatically; these helpers enforce formats,
 * trim values and prevent obvious invalid input before sending to backend/chain.
 */

export function sanitizeName(value) {
  return String(value || '').trim().replace(/\s{2,}/g, ' ');
}

// Allow only digits and limit length (for Aadhaar)
export function sanitizeAadhaar(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 12);
}

export function validateAadhaar(aadhaar) {
  return /^\d{12}$/.test(String(aadhaar));
}

export function sanitizeAge(value) {
  const n = Number(String(value).replace(/\D/g, ''));
  if (!Number.isFinite(n)) return '';
  return String(Math.max(0, Math.min(120, Math.floor(n))));
}

export function validateAge(age, min = 18) {
  const n = Number(age);
  return Number.isFinite(n) && n >= min && n <= 120;
}

// Hashing helper (used if you want to store only hashes locally / send to chain)
export async function sha256Hex(message) {
  if (typeof message !== 'string') message = String(message || '');
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}