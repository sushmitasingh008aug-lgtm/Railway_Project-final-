export type PlanningCalendarMode = 'day' | 'multi-day' | 'week' | 'month';

export interface PlanningCalendarState {
  mode: PlanningCalendarMode;
  selectedDates: string[];
  startDate: string | null;
  endDate: string | null;
  displayText: string;
  horizonDays: number;
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = padZero(date.getMonth() + 1);
  const d = padZero(date.getDate());
  return `${y}-${m}-${d}`;
}

export function parseDateStr(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function formatReadableDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const monthName = MONTH_NAMES_SHORT[m - 1] || '';
  return `${d} ${monthName} ${y}`;
}

/**
 * Returns Monday-Sunday week bounds enclosing dateStr
 */
export function getWeekRange(dateStr: string): { startDate: string; endDate: string; dates: string[] } {
  const d = parseDateStr(dateStr);
  const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  // Mon should be day 0 of our week
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(mon);
    cur.setDate(mon.getDate() + i);
    dates.push(formatDateStr(cur));
  }

  return {
    startDate: dates[0],
    endDate: dates[6],
    dates,
  };
}

/**
 * Returns all dates for full month (1st to last day)
 */
export function getMonthRange(year: number, monthIndex: number): { startDate: string; endDate: string; dates: string[] } {
  const lastDay = new Date(year, monthIndex + 1, 0, 12, 0, 0);
  const dates: string[] = [];

  for (let day = 1; day <= lastDay.getDate(); day++) {
    dates.push(`${year}-${padZero(monthIndex + 1)}-${padZero(day)}`);
  }

  return {
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    dates,
  };
}

/**
 * Computes a clean human-readable compact label for the header button
 */
export function formatDisplayRange(
  mode: PlanningCalendarMode,
  dates: string[],
  startDate: string | null,
  endDate: string | null
): string {
  if (!dates || dates.length === 0) {
    return 'Select Planning Date';
  }

  if (mode === 'day') {
    return formatReadableDate(dates[0]);
  }

  if (mode === 'week') {
    if (startDate && endDate) {
      const startParts = startDate.split('-').map(Number);
      const endParts = endDate.split('-').map(Number);
      const startDay = startParts[2];
      const endDay = endParts[2];
      const monthShort = MONTH_NAMES_SHORT[endParts[1] - 1];
      const year = endParts[0];
      return `Week · ${startDay}–${endDay} ${monthShort} ${year}`;
    }
    return `Week · ${dates.length} Days`;
  }

  if (mode === 'month') {
    if (startDate) {
      const parts = startDate.split('-').map(Number);
      const monthFull = MONTH_NAMES_FULL[parts[1] - 1];
      return `${monthFull} ${parts[0]}`;
    }
    return 'Entire Month';
  }

  // multi-day mode
  if (dates.length === 1) {
    return formatReadableDate(dates[0]);
  }
  return `${dates.length} Days Selected`;
}
