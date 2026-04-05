/** v1 fixed locale codes for safety cards and API paths (lowercase, BCP-47 style). */
export const SAFETY_CARD_LOCALE_CODES = [
  "en",
  "zh-hans",
  "th",
  "sw",
] as const;

export type SafetyCardLocaleCode = (typeof SAFETY_CARD_LOCALE_CODES)[number];

const LOCALE_SET = new Set<string>(SAFETY_CARD_LOCALE_CODES);

export function normalizeSafetyLocale(raw: string): SafetyCardLocaleCode | null {
  const n = raw.trim().toLowerCase().replace(/_/g, "-");
  if (LOCALE_SET.has(n)) return n as SafetyCardLocaleCode;
  return null;
}

export function isSafetyCardLocale(code: string): code is SafetyCardLocaleCode {
  return LOCALE_SET.has(code);
}
