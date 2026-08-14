import type { CalendarObservation, CalendarSchedule } from "./calendar-data";

export const DAY_MS = 86_400_000;
export const HOUR_MS = 3_600_000;

export type Occurrence = {
  id: string;
  item: CalendarSchedule;
  start: number;
  end: number;
  projected: boolean;
};

export function parseUtc(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? NaN : t;
}

/** 当前 UTC 时间所在周的周一 00:00 UTC。 */
export function weekStartUtc(now: number): number {
  const d = new Date(now);
  const offset = (d.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - offset * DAY_MS;
}

function latestObservation(item: CalendarSchedule): CalendarObservation | undefined {
  let best: CalendarObservation | undefined;
  let bestT = -Infinity;
  for (const o of item.observations) {
    const t = parseUtc(o.startsAtUtc);
    if (Number.isNaN(t)) continue;
    if (t > bestT) {
      bestT = t;
      best = o;
    }
  }
  return best;
}

/** 生成 [from, to] 区间内的活动/礼包出现区间（含推算）。 */
export function buildOccurrences(
  schedules: CalendarSchedule[],
  from: number,
  to: number,
  rotation: "A" | "B",
): Occurrence[] {
  const out: Occurrence[] = [];

  for (const item of schedules) {
    const anchors = item.observations
      .map((o) => ({ o, t: parseUtc(o.startsAtUtc) }))
      .filter((x) => !Number.isNaN(x.t))
      .sort((a, b) => a.t - b.t);
    if (anchors.length === 0) continue;

    const last = anchors[anchors.length - 1];
    const anchorSet = new Set(anchors.map((x) => x.t));
    const durationHours = last.o.durationHours ?? 24;
    const durationMs = durationHours * HOUR_MS;

    if (item.repeatEveryDays && item.repeatEveryDays > 0) {
      let base = last.t;
      if (item.rotationOffsetsDays) {
        base += (item.rotationOffsetsDays[rotation] ?? 0) * DAY_MS;
      }
      const period = item.repeatEveryDays * DAY_MS;
      const kStart = Math.ceil((from - durationMs - base) / period);
      const kEnd = Math.floor((to - base) / period);
      for (let k = kStart; k <= kEnd; k++) {
        const start = base + k * period;
        out.push({
          id: `${item.id}-${k}`,
          item,
          start,
          end: start + durationMs,
          projected: !anchorSet.has(start),
        });
      }
    } else {
      // 周期未确定：仅展示已确认窗口，不做推算
      for (const { o, t } of anchors) {
        const dur = (o.durationHours ?? durationHours) * HOUR_MS;
        const end = t + dur;
        if (end <= from || t >= to) continue;
        out.push({ id: o.id, item, start: t, end, projected: false });
      }
    }
  }

  return out;
}

export type Week = { start: number; days: number[] };

export function buildWeeks(startMonday: number, count: number): Week[] {
  return Array.from({ length: count }, (_, w) => ({
    start: startMonday + w * 7 * DAY_MS,
    days: Array.from({ length: 7 }, (_, d) => startMonday + (w * 7 + d) * DAY_MS),
  }));
}

export type Placement = {
  occ: Occurrence;
  colStart: number; // 0..6
  colEnd: number; // 1..7 (exclusive)
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

export type WeekLayout = {
  weekStart: number;
  days: number[];
  placements: Placement[];
  laneCount: number;
};

/** 八周日历布局：按周切片 + 泳道排布，避免同一天内重叠。 */
export function buildCalendarLayout(
  schedules: CalendarSchedule[],
  startMonday: number,
  weekCount: number,
  rotation: "A" | "B",
): WeekLayout[] {
  const totalEnd = startMonday + weekCount * 7 * DAY_MS;
  const occs = buildOccurrences(schedules, startMonday, totalEnd, rotation);

  const weeks: WeekLayout[] = [];
  for (let w = 0; w < weekCount; w++) {
    const weekStart = startMonday + w * 7 * DAY_MS;
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
      placements,
      laneCount: laneEnds.length,
    });
  }

  return weeks;
}

export type QuickEntry = { occ: Occurrence; active: boolean };

/** 当前正在进行的 + 未来 horizonDays 天内的即将开始项。 */
export function buildQuickSchedule(
  schedules: CalendarSchedule[],
  now: number,
  rotation: "A" | "B",
  horizonDays = 7,
): QuickEntry[] {
  const occs = buildOccurrences(schedules, now - 14 * DAY_MS, now + horizonDays * DAY_MS, rotation);
  return occs
    .filter((occ) => occ.end > now)
    .map((occ) => ({ occ, active: occ.start <= now && occ.end > now }))
    .sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      const keyA = a.active ? a.occ.end : a.occ.start;
      const keyB = b.active ? b.occ.end : b.occ.start;
      return keyA - keyB;
    });
}

/* ---------- 格式化 ---------- */

const pad2 = (n: number) => String(n).padStart(2, "0");

export function formatUtcDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function formatUtcTime(ms: number): string {
  const d = new Date(ms);
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

export function formatUtcClock(ms: number): string {
  const d = new Date(ms);
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
}

export function durationLabel(hours: number): string {
  const days = Math.floor(hours / 24);
  const rem = Math.round(hours % 24);
  if (days && rem) return `${days} 天 ${rem} 小时`;
  if (days) return `${days} 天`;
  return `${hours} 小时`;
}

export function recurrenceLabel(item: CalendarSchedule): string {
  if (item.repeatEveryDays) {
    const weeks = item.repeatEveryDays / 7;
    if (Number.isInteger(weeks) && weeks > 1) return `每 ${weeks} 周`;
    if (item.repeatEveryDays === 7) return "每周";
    return `每 ${item.repeatEveryDays} 天`;
  }
  return "周期未确定";
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

/** “距上次出现”人类可读（用于非常规活动）。 */
export function sinceHuman(from: number, now: number): string {
  const weeks = Math.floor((now - from) / (7 * DAY_MS));
  const days = Math.floor(((now - from) % (7 * DAY_MS)) / DAY_MS);
  if (weeks > 0) return `${weeks} 周 ${days} 天`;
  return `${days} 天`;
}

export const WEEKDAY_LABELS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
