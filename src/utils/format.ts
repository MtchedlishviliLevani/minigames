const THOUSAND = 1000;
const TENTHS = 10;

export function formatCompact(value: number): string {
  if (value < THOUSAND) return String(value);
  const thousands = Math.floor((value / THOUSAND) * TENTHS) / TENTHS;
  return `${String(thousands)}K`;
}
