export function normalizeDateOnly(value: Date | string) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function differenceInRentalDays(startDate: Date | string, endDate: Date | string) {
  const start = normalizeDateOnly(startDate);
  const end = normalizeDateOnly(endDate);
  const diffInMs = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
}

export function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

export function buildSequence(prefix: string, count: number) {
  return `${prefix}-${String(count).padStart(6, '0')}`;
}
