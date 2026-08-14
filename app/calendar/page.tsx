"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Clock3,
  Info,
  RefreshCw,
  Swords,
} from "lucide-react";
import SiteHeader from "@/components/site-header";
import {
  DEFAULT_CALENDAR_DATA,
  type CalendarData,
  type CalendarObservation,
  type IrregularEvent,
} from "@/lib/calendar-data";
import {
  buildCalendarLayout,
  buildQuickSchedule,
  diffHuman,
  durationLabel,
  formatUtcClock,
  formatUtcDate,
  formatUtcTime,
  recurrenceLabel,
  type QuickEntry,
  WEEKDAY_LABELS,
} from "@/lib/calendar-logic";

const WEEK_COUNT = 8;

const pad2 = (n: number) => String(n).padStart(2, "0");

function formatWindow(start: number, end: number): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    `${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
  return `${fmt(s)} – ${fmt(e)}`;
}

function formatStartUtc(ms: number): string {
  return `${formatUtcDate(ms)} ${formatUtcTime(ms)} UTC`;
}

function formatEndUtc(ms: number): string {
  const d = new Date(ms);
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0) {
    const prev = new Date(ms - 1);
    return `${formatUtcDate(prev.getTime())} 24:00 UTC`;
  }
  return `${formatUtcDate(ms)} ${formatUtcTime(ms)} UTC`;
}

function weeksDaysLabel(days: number | null): string {
  if (days === null) return "无更早记录";
  const total = Math.max(0, Math.round(days));
  const w = Math.floor(total / 7);
  const d = total % 7;
  return `${w} 周 ${d} 天`;
}

type Sighting = {
  observation: CalendarObservation;
  startsAt: number;
  endsAt: number;
  durationHours: number;
  daysSincePrevious: number | null;
};

function buildSightings(event: IrregularEvent): Sighting[] {
  const list = event.observations
    .map((o) => {
      const startsAt = new Date(o.startsAtUtc).getTime();
      const durationHours = o.durationHours ?? event.durationHours;
      return {
        observation: o,
        startsAt,
        durationHours,
        endsAt: startsAt + durationHours * 3_600_000,
      };
    })
    .filter((s) => Number.isFinite(s.startsAt) && s.endsAt > s.startsAt)
    .sort((a, b) => a.startsAt - b.startsAt);

  return list
    .map((s, i) => {
      const prev = list[i - 1];
      return {
        ...s,
        daysSincePrevious: prev ? (s.startsAt - prev.startsAt) / 86_400_000 : null,
      };
    })
    .reverse();
}

function CatDot({ category }: { category: "pack" | "event" }) {
  return (
    <span className={`cal-dot${category === "pack" ? " is-pack" : " is-event"}`} aria-hidden="true" />
  );
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
        <RefreshCw size={15} className="cal-spin" /> 正在同步当前 UTC 时段…
      </div>
    );
  }
  if (entries.length === 0) {
    return <div className="cal-empty">当前时段暂无礼包或活动。</div>;
  }

  return (
    <div className="quick-table">
      <div className="quick-row quick-head">
        <span>项目</span>
        <span>UTC 时段</span>
        <span>计时</span>
      </div>
      {entries.map((entry) => {
        const { occ, active } = entry;
        const label = active
          ? `距结束 ${diffHuman(now, occ.end)}`
          : `${diffHuman(now, occ.start)} 后开始`;
        return (
          <div className="quick-row" key={occ.id} title={`${formatWindow(occ.start, occ.end)}`}>
            <span className="quick-name">
              <CatDot category={occ.item.category} />
              <span>
                {occ.item.name}
                {occ.item.nameEn && <small>{occ.item.nameEn}</small>}
              </span>
            </span>
            <span className="quick-window">{formatWindow(occ.start, occ.end)}</span>
            <span className={`quick-timing${active ? " is-active" : ""}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function CalendarGrid({
  startMonday,
  now,
  layout,
}: {
  startMonday: number;
  now: number;
  layout: ReturnType<typeof buildCalendarLayout>;
}) {
  if (now <= 0) {
    return (
      <div className="cal-sync">
        <RefreshCw size={15} className="cal-spin" /> 正在同步当前 UTC 时段…
      </div>
    );
  }

  const todayStart = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate(),
  );

  return (
    <div className="cal-scroll">
      <div className="cal-grid">
        <div className="cal-weekdays">
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
              {week.days.map((day, i) => {
                const isToday = day === todayStart;
                const isPast = day < todayStart;
                return (
                  <div
                    className={`cal-day${isToday ? " is-today" : ""}${isPast ? " is-past" : ""}`}
                    key={day}
                    style={{ gridColumn: i + 1, gridRow: "1 / -1" }}
                  >
                    <span className="cal-day-num">
                      {pad2(new Date(day).getUTCMonth() + 1)}/{pad2(new Date(day).getUTCDate())}
                    </span>
                  </div>
                );
              })}

              {week.placements.map((p) => {
                const cat = p.occ.item.category;
                return (
                  <div
                    className={`cal-block${cat === "pack" ? " is-pack" : " is-event"}${p.occ.projected ? " is-projected" : ""}`}
                    key={p.occ.id}
                    style={{
                      gridColumn: `${p.colStart + 1} / ${p.colEnd + 1}`,
                      gridRow: `${p.lane + 1} / ${p.lane + 2}`,
                    }}
                    title={`${p.occ.item.name}${p.occ.item.nameEn ? ` (${p.occ.item.nameEn})` : ""}\n${formatWindow(p.occ.start, p.occ.end)}\n${p.occ.projected ? "推算" : "已确认"}`}
                  >
                    <span className="cal-block-name">
                      {p.occ.item.name}
                      {p.occ.projected && <i>推算</i>}
                    </span>
                    <span className="cal-block-time">
                      {p.continuesBefore ? "← " : ""}
                      {formatUtcTime(p.occ.start)}
                      {p.continuesAfter ? " →" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IrregularHistory({ events, now }: { events: IrregularEvent[]; now: number }) {
  return (
    <div className="irregular-grid">
      {events.map((event) => {
        const sightings = buildSightings(event);
        return (
          <article className="irregular-card" key={event.id}>
            <div className="irregular-head">
              <div>
                <span className="irregular-kind">非常规活动</span>
                <h3>
                  {event.name}
                  {event.nameEn && <small>{event.nameEn}</small>}
                </h3>
                <p className="irregular-duration">标准时长：{durationLabel(event.durationHours)}</p>
              </div>
              <span className="irregular-count">
                {sightings.length} 次记录
              </span>
            </div>

            {sightings.length > 0 ? (
              <div className="irregular-list">
                {sightings.map((s) => (
                  <div className="sighting" key={s.observation.id}>
                    <div>
                      <span className="sighting-label">确认窗口</span>
                      <strong>
                        {formatStartUtc(s.startsAt)} 至 {formatEndUtc(s.endsAt)}
                      </strong>
                      {s.observation.note && <p>{s.observation.note}</p>}
                    </div>
                    <div className="sighting-side">
                      <span className="sighting-duration">{durationLabel(s.durationHours)}</span>
                      <span className="sighting-since-label">距上一次出现</span>
                      <span className="sighting-since">{weeksDaysLabel(s.daysSincePrevious)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="irregular-empty">尚无已确认的出现记录。</p>
            )}
          </article>
        );
      })}
    </div>
  );
}

function TrackedSchedules({ data }: { data: CalendarData }) {
  return (
    <div className="tracked-grid">
      <div className="tracked-col">
        <h3 className="tracked-title">已收录日程</h3>
        <p className="tracked-sub">用于构建日历的已确认观察记录。</p>
        <div className="tracked-list">
          {data.schedules.map((item) => {
            const latest = [...item.observations]
              .map((o) => ({ o, t: new Date(o.startsAtUtc).getTime() }))
              .filter((x) => Number.isFinite(x.t))
              .sort((a, b) => a.t - b.t)
              .at(-1);
            const dur = latest?.o.durationHours ?? 24;
            return (
              <article className="tracked-item" key={item.id}>
                <div className="tracked-item-head">
                  <CatDot category={item.category} />
                  <h4>
                    {item.name}
                    {item.nameEn && <small>{item.nameEn}</small>}
                  </h4>
                  <span className={`tracked-badge${item.confidence === "confirmed" ? "" : " is-warn"}`}>
                    {item.confidence === "confirmed" ? "已确认" : "待确认"}
                  </span>
                </div>
                <dl className="tracked-meta">
                  <div>
                    <dt>最近确认</dt>
                    <dd>{latest ? formatUtcDate(latest.t) : "—"}</dd>
                  </div>
                  <div>
                    <dt>时长</dt>
                    <dd>{durationLabel(dur)}</dd>
                  </div>
                  <div>
                    <dt>周期</dt>
                    <dd>{recurrenceLabel(item)}</dd>
                  </div>
                </dl>
                {item.note && <p className="tracked-note">{item.note}</p>}
              </article>
            );
          })}
        </div>
      </div>

      {data.pending.length > 0 && (
        <div className="tracked-col">
          <h3 className="tracked-title">待确认日程</h3>
          <p className="tracked-sub">周期已知，但尚缺确认锚点。</p>
          <div className="tracked-list">
            {data.pending.map((item) => (
              <article className="tracked-item" key={item.id}>
                <div className="tracked-item-head">
                  <Swords size={14} className="tracked-pending-icon" />
                  <h4>
                    {item.name}
                    {item.nameEn && <small>{item.nameEn}</small>}
                  </h4>
                </div>
                {item.anchorStartsAtUtc ? (
                  <dl className="tracked-meta">
                    <div>
                      <dt>确认锚点</dt>
                      <dd>{formatUtcDate(new Date(item.anchorStartsAtUtc).getTime())}</dd>
                    </div>
                    <div>
                      <dt>周期</dt>
                      <dd>{recurrenceLabel({ ...item, category: "event", observations: [] })}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="tracked-warn">需要确认锚点日期。</p>
                )}
                {item.note && <p className="tracked-note">{item.note}</p>}
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const [data, setData] = useState<CalendarData>(DEFAULT_CALENDAR_DATA);
  const [now, setNow] = useState(0);
  const [showPacks, setShowPacks] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

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

  const rotation = data.rotation ?? "A";

  const startMonday = now > 0 ? (() => {
    const d = new Date(now);
    const offset = (d.getUTCDay() + 6) % 7;
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - offset * 86_400_000;
  })() : 0;

  const visibleSchedules = useMemo(
    () =>
      data.schedules.filter((s) =>
        s.category === "pack" ? showPacks : showEvents,
      ),
    [data.schedules, showPacks, showEvents],
  );

  const layout = useMemo(
    () =>
      now > 0
        ? buildCalendarLayout(visibleSchedules, startMonday, WEEK_COUNT, rotation)
        : [],
    [visibleSchedules, startMonday, now, rotation],
  );

  const quick = useMemo(
    () => (now > 0 ? buildQuickSchedule(data.schedules, now, rotation) : []),
    [data.schedules, now, rotation],
  );

  const nextReset = useMemo(() => {
    const d = new Date(now);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  }, [now]);

  return (
    <main className="calendar-page">
      <SiteHeader />

      <section className="cal-hero">
        <div className="shell">
          <div className="cal-hero-top">
            <div className="cal-hero-copy">
              <h1>游戏日历</h1>
              <p>
                以 UTC 时间展示《无尽冬日》礼包轮换、日程活动与已确认的非常规活动历史。
              </p>
              <p className="cal-hero-hint">
                区号 {data.stateNumber || "未设置"} · 轮换 {rotation}
                <Info size={13} /> 可在后台「游戏日历数据」中修改。
              </p>
            </div>
            <div className="cal-stats">
              <StatCard icon={Clock3} label="当前游戏时间">
                {now > 0 ? (
                  <>
                    {formatUtcClock(now)}
                    <small>UTC · {formatUtcDate(now)}</small>
                  </>
                ) : (
                  "同步中…"
                )}
              </StatCard>
              <StatCard icon={CalendarClock} label="每日重置">
                00:00 UTC
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
            <h2>八周 UTC 日历</h2>
            <div className="cal-toggles" role="group" aria-label="日历显示项">
              <button
                type="button"
                className={`cal-toggle${showPacks ? " is-on is-pack" : ""}`}
                aria-pressed={showPacks}
                onClick={() => setShowPacks((v) => !v)}
              >
                <span className="cal-toggle-dot is-pack" />
                礼包
              </button>
              <button
                type="button"
                className={`cal-toggle${showEvents ? " is-on is-event" : ""}`}
                aria-pressed={showEvents}
                onClick={() => setShowEvents((v) => !v)}
              >
                <span className="cal-toggle-dot is-event" />
                活动
              </button>
            </div>
          </div>
          <CalendarGrid startMonday={startMonday} now={now} layout={layout} />
          <p className="cal-legend">
            <span className="cal-toggle-dot is-pack" /> 礼包
            <span className="cal-toggle-dot is-event" /> 活动
            <span className="cal-legend-note">半透明为推算，实色为已确认</span>
          </p>
        </div>
      </section>

      <section className="section" id="irregular">
        <div className="shell">
          <div className="section-heading cal-irregular-heading">
            <div>
              <h2>非常规活动历史</h2>
              <p>仅收录已确认出现。这些活动不遵循固定日程，因此仅记录历史，不推算下一次。</p>
            </div>
          </div>
          <IrregularHistory events={data.irregular} now={now} />
        </div>
      </section>

      <section className="section" id="tracked">
        <div className="shell">
          <div className="section-heading">
            <h2>日程收录</h2>
          </div>
          <TrackedSchedules data={data} />
        </div>
      </section>

      <footer>
        <div className="shell">
          <span>无尽冬日 · 国服 3760 区</span>
          <span>日历时间为 UTC，日程以游戏内实际为准</span>
          <span>© 2026 STATE 3760</span>
        </div>
      </footer>
    </main>
  );
}
