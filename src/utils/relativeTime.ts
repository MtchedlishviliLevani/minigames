const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const WEEKS_PER_MONTH = 4;
const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;
const DAYS_PER_YEAR = 365;

function plural(value: number, unit: string): string {
  return `${String(value)} ${unit}${value === 1 ? '' : 's'} ago`;
}

export function relativeTime(timestamp: string, now: number = Date.now()): string {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return timestamp;

  const seconds = Math.max(0, Math.floor((now - parsed) / 1000));
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  if (minutes < 1) return 'just now';
  if (minutes < MINUTES_PER_HOUR) return `${String(minutes)} min ago`;

  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  if (hours < HOURS_PER_DAY) return plural(hours, 'hour');

  const days = Math.floor(hours / HOURS_PER_DAY);
  if (days < DAYS_PER_WEEK) return plural(days, 'day');

  const weeks = Math.floor(days / DAYS_PER_WEEK);
  if (weeks < WEEKS_PER_MONTH) return plural(weeks, 'week');

  const months = Math.max(1, Math.floor(days / DAYS_PER_MONTH));
  if (months < MONTHS_PER_YEAR) return plural(months, 'month');

  return plural(Math.max(1, Math.floor(days / DAYS_PER_YEAR)), 'year');
}
