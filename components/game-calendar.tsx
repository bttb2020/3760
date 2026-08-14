"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { DEFAULT_CALENDAR_DATA, type CalendarData } from "@/lib/calendar-data";
import {
  buildCalendarLayout,
  beijingMidnightUtc,
  currentWeekMondayUtc,
  cycleTheme,
  durationLabel,
  formatBeijingDay,
  type WeekLayout,
  WEEKDAY_LABELS,
} from "@/lib/calendar-logic";

const WEEK_COUNT = 8;

function formatRange(start: number, end: number): string {
  const s = formatBeijingDay(start);
  const e = formatBeijingDay(end - 86_400_000);
  return s === e ? s : `${s} ~ ${e}`;
}

function CalendarGrid({
  data,
  layout,
  now,
}: {
  data: CalendarData;
  layout: WeekLayout[];
  now: number;
}) {
  if (now <= 0) {
    return (
      <div className="cal-sync">
        <RefreshCw size={15} className="cal-spin" /> 正在同步…
      </div>
    );
  }

  const todayStart = beijingMidnightUtc(now);

  return (
    <div className="cal-scroll">
      <div className="cal-grid">
        <div className="cal-weekdays">
          <span>周期</span>
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        {layout.map((week) => {
          const rows = Math.max(1, week.laneCount);
          return (
            <div
              className="cal-week"
              key={week.weekStart}
              style={{ gridTemplateRows: `repeat(${rows}, var(--cal-row))` }}
            >
              <div className="cal-cycle-label" style={{ gridRow: "1 / -1" }}>
                <strong>第 {week.cycleWeek} 周</strong>
                <small>{cycleTheme(data, week.cycleWeek)}</small>
              </div>

              {week.days.map((day, i) => {
                const isToday = day === todayStart;
                const isPast = day < todayStart;
                return (
                  <div
                    className={`cal-day${isToday ? " is-today" : ""}${isPast ? " is-past" : ""}`}
                    key={day}
                    style={{ gridColumn: i + 2, gridRow: "1 / -1" }}
                  >
                    <span className="cal-day-num">{formatBeijingDay(day)}</span>
                  </div>
                );
              })}

              {week.placements.map((p) => (
                <div
                  className="cal-block"
                  key={p.occ.id}
                  style={{
                    gridColumn: `${p.colStart + 2} / ${p.colEnd + 2}`,
                    gridRow: `${p.lane + 1} / ${p.lane + 2}`,
                  }}
                  title={`${p.occ.event.name}\n${formatRange(p.occ.start, p.occ.end)}\n${p.occ.event.note ?? ""}`}
                >
                  <span className="cal-block-name">
                    {p.continuesBefore ? "← " : ""}
                    {p.occ.event.name}
                    {p.continuesAfter ? " →" : ""}
                  </span>
                  {p.occ.event.durationDays > 1 && (
                    <span className="cal-block-time">{durationLabel(p.occ.event.durationDays)}</span>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GameCalendar() {
  const [data, setData] = useState<CalendarData>(DEFAULT_CALENDAR_DATA);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/calendar", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => setData({ ...DEFAULT_CALENDAR_DATA, ...json }))
      .catch(() => {});
  }, []);

  const startMonday = useMemo(() => (now > 0 ? currentWeekMondayUtc(now) : 0), [now]);
  const layout = useMemo(
    () => (now > 0 ? buildCalendarLayout(data, startMonday, WEEK_COUNT) : []),
    [data, startMonday, now],
  );

  return (
    <section className="section" id="calendar">
      <div className="shell">
        <div className="section-heading">
          <h2>八周活动日历</h2>
          <p className="cal-legend-note">北京时间 · 灰色为已过去，高亮为今天。</p>
        </div>
        <CalendarGrid data={data} layout={layout} now={now} />
      </div>
    </section>
  );
}
