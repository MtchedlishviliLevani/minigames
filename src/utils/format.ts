const numberFormatter = new Intl.NumberFormat('en-US');
const THOUSAND = 1000;
const TENTHS = 10;

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatCompact(value: number): string {
  if (value < THOUSAND) return String(value);
  const thousands = Math.floor((value / THOUSAND) * TENTHS) / TENTHS;
  return `${String(thousands)}K`;
}

/** "Alex_Pro99" -> "AP" */
export function initials(name: string): string {
  const letters = name.replace(/[^a-zA-Z]/g, '');
  const upper = letters.replace(/[^A-Z]/g, '');
  const source = upper.length >= 2 ? upper : letters.toUpperCase();
  return source.slice(0, 2);
}
