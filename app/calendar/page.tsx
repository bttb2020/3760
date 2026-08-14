"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Clock3, Info, RefreshCw } from "lucide-react";
import SiteHeader from "@/components/site-header";
import { DEFAULT_CALENDAR_DATA, type CalendarData } from "@/lib/calendar-data";
import {
  buildCalendarLayout,
  buildQuickSchedule,
  beijingMidnightUtc,
  currentWeekMondayUtc,
  cycleTheme,
  cycleWeekNumber,
  diffHuman,
  durationLabel,
  formatBeijingClock,
  formatBeijingDate,
  formatBeijingDay,
  parseBeijingDate,
  type QuickEntry,
  WEEKDAY_LABELS,
} from "@/lib/calendar-logic";

const WEEK_COUNT = 8;

function formatRange(start: number, end: number): string {
  const s = formatBeijingDay(start);
  const e = formatBeijingDay(end - 86_400_000);
  return s === e ? s : `${s} ~ ${e}`;
}

function StatCard({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock3;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="cal-stat">
      <div className="cal-stat-label">
        <Icon size={14} />
        {label}
      </div>
      <div className="cal-stat-value">{children}</div>
    </div>
  );
}

function QuickSchedule({ entries, now }: { entries: QuickEntry[]; now: number }) {
  if (now <= 0) {
    return (
      <div className="cal-sync">
        <RefreshCw size={15} className="cal-spin" /> 正在同步…
      </div>
    );
  }
  if (entries.length === 0) {
    return <div className="cal-empty">当前时段暂无活动。</div>;
  }

  return (
    <div className="quick-table">
      <div className="quick-row quick-head">
        <span>活动</span>
        <span>时间（北京时间）</span>
        <span>计时</span>
      </div>
      {entries.map((entry) => {
        const { occ, active } = entry;
        const label = active
          ? `距结束 ${diffHuman(now, occ.end)}`
          : `${diffHuman(now, occ.start)} 后开始`;
        return (
          <div className="quick-row" key={occ.id} title={formatRange(occ.start, occ.end)}>
            <span className="quick-name">
              <span className="cal-dot" aria-hidden="true" />
              <span>{occ.event.name}</span>
            </span>
            <span className="quick-window">{formatRange(occ.start, occ.end)}</span>
            <span className={`quick-timing${active ? " is-active" : ""}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function CalendarGrid({
  data,
  startMonday,
  now,
  layout,
}: {
  data: CalendarData;
  startMonday: number;
  now: number;
  layout: ReturnType<typeof buildCalendarLayout>;
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
          <span className="cal-weekdays-cycle">周期</span>
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

function CycleSummary({ data }: { data: CalendarData }) {
  const recurring = data.events.filter((e) => e.weeks.length > 1);

  return (
    <div className="cycle-summary">
      <div className="cycle-cards">
        {data.cycleWeeks
          .slice()
          .sort((a, b) => a.week - b.week)
          .map((w) => (
            <article className="cycle-card" key={w.week}>
              <span>第 {w.week} 周</span>
              <strong>{w.theme}</strong>
            </article>
          ))}
      </div>

      {recurring.length > 0 && (
        <div className="cycle-fixed">
          <h3>固定节点</h3>
          <ul>
            {recurring.map((e) => (
              <li key={e.id}>
                <strong>{e.name}</strong>
                {e.note && <span>{e.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const [data, setData] = useState<CalendarData>(DEFAULT_CALENDAR_DATA);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/calendar", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => setData({ ...DEFAULT_CALENDAR_DATA, ...json }))
      .catch(() => {});
  }, []);

  const anchorUtc = useMemo(() => parseBeijingDate(data.cycleAnchor), [data.cycleAnchor]);

  const startMonday = useMemo(
    () => (now > 0 ? currentWeekMondayUtc(now) : 0),
    [now],
  );

  const layout = useMemo(
    () => (now > 0 ? buildCalendarLayout(data, startMonday, WEEK_COUNT) : []),
    [data, startMonday, now],
  );

  const quick = useMemo(
    () => (now > 0 ? buildQuickSchedule(data, now) : []),
    [data, now],
  );

  const thisWeek = useMemo(
    () => (now > 0 ? cycleWeekNumber(startMonday, anchorUtc) : 0),
    [startMonday, anchorUtc, now],
  );

  const nextReset = useMemo(() => beijingMidnightUtc(now) + 86_400_000, [now]);

  return (
    <main className="calendar-page">
      <SiteHeader />

      <section className="cal-hero">
        <div className="shell">
          <div className="cal-hero-top">
            <div className="cal-hero-copy">
              <h1>游戏日历</h1>
              <p>按 4 周为一个周期展示活动安排，所有时间均为北京时间。</p>
              <p className="cal-hero-hint">
                {now > 0 && thisWeek > 0 ? (
                  <>
                    当前：第 {thisWeek} 周 · {cycleTheme(data, thisWeek)}
                  </>
                ) : (
                  "同步中…"
                )}
                <Info size={13} /> 可在后台「游戏日历数据」中修改周期锚点与活动。
              </p>
            </div>
            <div className="cal-stats">
              <StatCard icon={Clock3} label="当前北京时间">
                {now > 0 ? (
                  <>
                    {formatBeijingClock(now)}
                    <small>{formatBeijingDate(now)}</small>
                  </>
                ) : (
                  "同步中…"
                )}
              </StatCard>
              <StatCard icon={CalendarClock} label="每日重置">
                00:00
                {now > 0 && <small>距下次重置 {diffHuman(now, nextReset)}</small>}
              </StatCard>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="quick">
        <div className="shell">
          <div className="section-heading">
            <h2>当前时段</h2>
          </div>
          <QuickSchedule entries={quick} now={now} />
        </div>
      </section>

      <section className="section" id="calendar">
        <div className="shell">
          <div className="section-heading">
            <h2>八周活动日历</h2>
            <p className="cal-legend-note">灰色为已过去，高亮为今天。</p>
          </div>
          <CalendarGrid data={data} startMonday={startMonday} now={now} layout={layout} />
        </div>
      </section>

      <section className="section" id="cycle">
        <div className="shell">
          <div className="section-heading">
            <h2>周期说明</h2>
          </div>
          <CycleSummary data={data} />
        </div>
      </section>

      <footer>
        <div className="shell">
          <span>无尽冬日 · 国服 3760 区</span>
          <span>日历时间为北京时间，日程以游戏内实际为准</span>
          <span>© 2026 STATE 3760</span>
        </div>
      </footer>
    </main>
  );
}
