export type PrinterProfile = 'pos' | 'standard';

export const PRINTER_PROFILE_KEY = 'equipapp_printer_profile';

export function readPrinterProfile(): PrinterProfile {
  if (typeof window === 'undefined') {
    return 'standard';
  }

  const stored = window.localStorage.getItem(PRINTER_PROFILE_KEY);
  return stored === 'pos' ? 'pos' : 'standard';
}

export function savePrinterProfile(profile: PrinterProfile) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(PRINTER_PROFILE_KEY, profile);
}
