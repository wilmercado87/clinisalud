export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const mins = Math.floor(diffMs / MILLISECONDS_PER_MINUTE);
  if (mins < MINUTES_NOW) return 'Ahora';
  if (mins < MINUTES_PER_HOUR) return `Hace ${mins} min`;
  const hours = Math.floor(mins / MINUTES_PER_HOUR);
  if (hours < HOURS_PER_DAY) return `Hace ${hours}h`;
  const days = Math.floor(hours / HOURS_PER_DAY);
  if (days < DAYS_PER_WEEK) return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export function formatNotificationDate(dateSource: string | Date): string {
  return new Date(dateSource).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateAge(birthDate: Date | string | null | undefined): string {
  if (!birthDate) return '';
  const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
  if (isNaN(birth.getTime())) return '';
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    years--;
  }
  return years >= 0 ? String(years) : '';
}

export const MILLISECONDS_PER_DAY = 86400000;
export const MILLISECONDS_PER_MINUTE = 60000;
export  const MINUTES_NOW = 1;
export const DAYS_PER_WEEK = 7;
export const HOURS_PER_DAY = 24;
export const MINUTES_PER_HOUR = 60;
