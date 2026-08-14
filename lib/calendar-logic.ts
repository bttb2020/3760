import type { CalendarData, CycleEvent } from "./calendar-data";

export const DAY_MS = 86_400_000;
export const HOUR_MS = 3_600_000;
/** 北京时间 = UTC+8 */
export const BEIJING_OFFSET_MS = 8 * HOUR_MS;
const CYCLE_DAYS = 28;

export type Occurrence = {
  id: string;
  event: CycleEvent;
  start: number; // UTC ms
  end: number; // UTC ms
};

/* ---------- 北京时间工具 ---------- */

export function beijingParts(ms: number): { y: number; m: number; d: number } {
  const d = new Date(ms + BEIJING_OFFSET_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
}

/** 该时刻所在北京日期当天的 00:00（以 UTC ms 表示）。 */
export function beijingMidnightUtc(ms: number): number {
  const { y, m, d } = beijingParts(ms);
  return Date.UTC(y, m, d) - BEIJING_OFFSET_MS;
}

/** "YYYY-MM-DD" 解析为北京当天 00:00 的 UTC ms。 */
export function parseBeijingDate(dateStr: string): number {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return NaN;
  return Date.UTC(parts[0], parts[1] - 1, parts[2]) - BEIJING_OFFSET_MS;
}

/** 当前北京时间所在周的周一 00:00（以 UTC ms 表示）。 */
export function currentWeekMondayUtc(now: number): number {
  const { y, m, d } = beijingParts(now);
  const dayOfWeek = new Date(Date.UTC(y, m, d)).getUTCDay(); // 0=周日 … 6=周六
  const offset = (dayOfWeek + 6) % 7; // 周一=0 … 周日=6
  return Date.UTC(y, m, d) - offset * DAY_MS - BEIJING_OFFSET_MS;
}

/** 计算某个周一（UTC ms）属于周期第几周（1-4）。 */
export function cycleWeekNumber(mondayUtcMs: number, anchorUtcMs: number): number {
  const diffWeeks = Math.round((mondayUtcMs - anchorUtcMs) / (7 * DAY_MS));
  return ((diffWeeks % 4) + 4) % 4 + 1;
}

export function cycleTheme(data: CalendarData, weekNumber: number): string {
  return data.cycleWeeks.find((w) => w.week === weekNumber)?.theme ?? `第 ${weekNumber} 周`;
}

/* ---------- 周期推算 ---------- */

export function buildOccurrences(
  events: CycleEvent[],
  anchorUtc: number,
  fromUtc: number,
  toUtc: number,
): Occurrence[] {
  const out: Occurrence[] = [];
  const period = CYCLE_DAYS * DAY_MS;

  for (const ev of events) {
    for (const w of ev.weeks) {
      const baseDay = anchorUtc + (w - 1) * 7 * DAY_MS + (ev.weekday - 1) * DAY_MS;
      const durationMs = ev.durationDays * DAY_MS;
      const kStart = Math.ceil((fromUtc - durationMs - baseDay) / period);
      const kEnd = Math.floor((toUtc - baseDay) / period);
      for (let k = kStart; k <= kEnd; k++) {
        const start = baseDay + k * period;
        const end = start + durationMs;
        if (end <= fromUtc || start >= toUtc) continue;
        out.push({ id: `${ev.id}-${w}-${k}`, event: ev, start, end });
      }
    }
  }

  return out.sort((a, b) => a.start - b.start);
}

export type Placement = {
  occ: Occurrence;
  colStart: number; // 0..6（周一..周日）
  colEnd: number; // 1..7（exclusive）
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

export type WeekLayout = {
  weekStart: number;
  days: number[];
  cycleWeek: number;
  placements: Placement[];
  laneCount: number;
};

export function buildCalendarLayout(
  data: CalendarData,
  startMondayUtc: number,
  weekCount: number,
): WeekLayout[] {
  const anchorUtc = parseBeijingDate(data.cycleAnchor);
  const totalEnd = startMondayUtc + weekCount * 7 * DAY_MS;
  const occs = buildOccurrences(data.events, anchorUtc, startMondayUtc, totalEnd);

  const weeks: WeekLayout[] = [];
  for (let w = 0; w < weekCount; w++) {
    const weekStart = startMondayUtc + w * 7 * DAY_MS;
    const weekEnd = weekStart + 7 * DAY_MS;

    const inWeek = occs
      .filter((o) => o.start < weekEnd && o.end > weekStart)
      .map((o) => {
        const start = Math.max(o.start, weekStart);
        const end = Math.min(o.end, weekEnd);
        const colStart = Math.max(0, Math.min(6, Math.floor((start - weekStart) / DAY_MS)));
        const colEnd = Math.max(
          colStart + 1,
          Math.min(7, Math.ceil((end - weekStart) / DAY_MS)),
        );
        return {
          occ: o,
          colStart,
          colEnd,
          continuesBefore: o.start < weekStart,
          continuesAfter: o.end > weekEnd,
        };
      })
      .sort(
        (a, b) =>
          a.colStart - b.colStart || b.colEnd - b.colStart - (a.colEnd - a.colStart),
      );

    const laneEnds: number[] = [];
    const placements: Placement[] = inWeek.map((p) => {
      let lane = laneEnds.findIndex((end) => end <= p.colStart);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(p.colStart);
      }
      laneEnds[lane] = p.colEnd;
      return { ...p, lane };
    });

    weeks.push({
      weekStart,
      days: Array.from({ length: 7 }, (_, d) => weekStart + d * DAY_MS),
      cycleWeek: cycleWeekNumber(weekStart, anchorUtc),
      placements,
      laneCount: laneEnds.length,
    });
  }

  return weeks;
}

export type QuickEntry = { occ: Occurrence; active: boolean };

/** 当前正在进行的 + 未来 horizonDays 天内的即将开始项。 */
export function buildQuickSchedule(
  data: CalendarData,
  nowUtc: number,
  horizonDays = 7,
): QuickEntry[] {
  const anchorUtc = parseBeijingDate(data.cycleAnchor);
  const occs = buildOccurrences(
    data.events,
    anchorUtc,
    nowUtc - 14 * DAY_MS,
    nowUtc + horizonDays * DAY_MS,
  );
  return occs
    .filter((o) => o.end > nowUtc)
    .map((o) => ({ occ: o, active: o.start <= nowUtc && o.end > nowUtc }))
    .sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      const keyA = a.active ? a.occ.end : a.occ.start;
      const keyB = b.active ? b.occ.end : b.occ.start;
      return keyA - keyB;
    });
}

/* ---------- 格式化（北京时间） ---------- */

const pad2 = (n: number) => String(n).padStart(2, "0");

export function formatBeijingDate(ms: number): string {
  const { y, m, d } = beijingParts(ms);
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

export function formatBeijingClock(ms: number): string {
  const d = new Date(ms + BEIJING_OFFSET_MS);
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
}

export function formatBeijingDay(ms: number): string {
  const d = new Date(ms + BEIJING_OFFSET_MS);
  return `${pad2(d.getUTCMonth() + 1)}/${pad2(d.getUTCDate())}`;
}

export function durationLabel(days: number): string {
  if (days === 1) return "1 天";
  return `${days} 天`;
}

export type DurationParts = { days: number; hours: number; minutes: number };

export function diffParts(from: number, to: number): DurationParts {
  const distance = Math.max(0, to - from);
  return {
    days: Math.floor(distance / DAY_MS),
    hours: Math.floor((distance / HOUR_MS) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
  };
}

export function diffHuman(from: number, to: number): string {
  const p = diffParts(from, to);
  if (p.days > 0) return `${p.days} 天 ${p.hours} 小时`;
  if (p.hours > 0) return `${p.hours} 小时 ${p.minutes} 分`;
  return `${p.minutes} 分钟`;
}

export const WEEKDAY_LABELS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
