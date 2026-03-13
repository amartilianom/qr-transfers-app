import { Transfer } from '@/types/database';

export type Period = 'day' | 'week' | 'month' | 'year';
export type ChartBar = { label: string; value: number };

const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DAY_BARS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

// Returns Monday of the week containing d
function getMondayOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return startOfDay(monday);
}

// Mon=0 … Sun=6
function weekdayIndex(d: Date): number {
  const day = d.getDay();
  return day === 0 ? 6 : day - 1;
}

export type PeriodInfo = {
  /** Range to fetch from the DB (may be wider than the list range, e.g. full week for Día mode) */
  fetchStart: Date;
  fetchEnd: Date;
  /** Range to show in the transfer list and use for the total */
  listStart: Date;
  listEnd: Date;
  periodLabel: string;
  rangeLabel: string;
  emptyBars: ChartBar[];
  getBucketIndex: (d: Date) => number;
  canGoForward: boolean;
};

export function getPeriodInfo(period: Period, offset: number): PeriodInfo {
  const today = startOfDay(new Date());

  switch (period) {
    case 'day': {
      const selected = new Date(today);
      selected.setDate(today.getDate() + offset);

      // Chart shows the full week of the selected day
      const monday = getMondayOfWeek(selected);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const periodLabel = `${WEEKDAY_SHORT[selected.getDay()]}, ${MONTH_SHORT[selected.getMonth()]} ${selected.getDate()}`;

      return {
        fetchStart: monday,
        fetchEnd: endOfDay(sunday),
        listStart: startOfDay(selected),
        listEnd: endOfDay(selected),
        periodLabel,
        rangeLabel: '00:00 - 23:59',
        emptyBars: DAY_BARS.map((l) => ({ label: l, value: 0 })),
        getBucketIndex: (d) => weekdayIndex(d),
        canGoForward: offset < 0,
      };
    }

    case 'week': {
      const ref = new Date(today);
      ref.setDate(today.getDate() + offset * 7);

      const monday = getMondayOfWeek(ref);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const periodLabel = `${MONTH_SHORT[monday.getMonth()]} ${monday.getDate()} – ${sunday.getDate()}`;

      return {
        fetchStart: monday,
        fetchEnd: endOfDay(sunday),
        listStart: monday,
        listEnd: endOfDay(sunday),
        periodLabel,
        rangeLabel: 'Lun – Dom',
        emptyBars: DAY_BARS.map((l) => ({ label: l, value: 0 })),
        getBucketIndex: (d) => weekdayIndex(d),
        canGoForward: offset < 0,
      };
    }

    case 'month': {
      const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const daysInMonth = end.getDate();
      const numWeeks = Math.ceil(daysInMonth / 7);

      return {
        fetchStart: start,
        fetchEnd: end,
        listStart: start,
        listEnd: end,
        periodLabel: `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`,
        rangeLabel: `1 – ${daysInMonth}`,
        emptyBars: Array.from({ length: numWeeks }, (_, i) => ({ label: `S${i + 1}`, value: 0 })),
        getBucketIndex: (d) => Math.floor((d.getDate() - 1) / 7),
        canGoForward: offset < 0,
      };
    }

    case 'year': {
      const year = today.getFullYear() + offset;
      return {
        fetchStart: new Date(year, 0, 1, 0, 0, 0, 0),
        fetchEnd: new Date(year, 11, 31, 23, 59, 59, 999),
        listStart: new Date(year, 0, 1, 0, 0, 0, 0),
        listEnd: new Date(year, 11, 31, 23, 59, 59, 999),
        periodLabel: `${year}`,
        rangeLabel: 'Ene – Dic',
        emptyBars: ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((l) => ({
          label: l,
          value: 0,
        })),
        getBucketIndex: (d) => d.getMonth(),
        canGoForward: offset < 0,
      };
    }
  }
}

export function buildChartBars(
  emptyBars: ChartBar[],
  transfers: Transfer[],
  getBucketIndex: (d: Date) => number,
): ChartBar[] {
  const result = emptyBars.map((b) => ({ ...b }));
  for (const t of transfers) {
    const idx = getBucketIndex(new Date(t.occurred_at));
    if (idx >= 0 && idx < result.length) {
      result[idx].value += Number(t.amount);
    }
  }
  return result;
}

export function formatChartValue(value: number): string {
  if (value >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value}`;
}
