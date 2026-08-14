"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import gsap from "gsap";
import {
  DEFAULT_CALENDAR_DATA,
  type CalendarData,
  type CycleEvent,
} from "@/lib/calendar-data";
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

const WEEK_COUNT = 4;

function formatRange(start: number, end: number): string {
  const s = formatBeijingDay(start);
  const e = formatBeijingDay(end - 86_400_000);
  return s === e ? s : `${s} ~ ${e}`;
}

function CalendarGrid({
  data,
  layout,
  now,
  onBoardClick,
}: {
  data: CalendarData;
  layout: WeekLayout[];
  now: number;
  onBoardClick: (event: CycleEvent) => void;
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
          <span>主题</span>
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
              style={{ gridTemplateRows: `var(--cal-date-row) repeat(${rows}, var(--cal-row))` }}
            >
              <div className="cal-cycle-label">
                <strong>{cycleTheme(data, week.cycleWeek)}</strong>
              </div>

              {/* 日期行 */}
              {week.days.map((day, i) => {
                const isToday = day === todayStart;
                const isPast = day < todayStart;
                return (
                  <div
                    className={`cal-date${isToday ? " is-today" : ""}${isPast ? " is-past" : ""}`}
                    key={`d-${day}`}
                    style={{ gridColumn: i + 2, gridRow: 1 }}
                  >
                    {formatBeijingDay(day)}
                  </div>
                );
              })}

              {/* 泳道背景（列） */}
              {week.days.map((day, i) => {
                const isToday = day === todayStart;
                return (
                  <div
                    className={`cal-day${isToday ? " is-today" : ""}`}
                    key={`bg-${day}`}
                    style={{ gridColumn: i + 2, gridRow: "2 / -1" }}
                  />
                );
              })}

              {/* 活动块 */}
              {week.placements.map((p) => {
                const board = p.occ.event.board;
                const style = {
                  gridColumn: `${p.colStart + 2} / ${p.colEnd + 2}`,
                  gridRow: `${p.lane + 2} / ${p.lane + 3}`,
                };
                const title = `${p.occ.event.name}\n${formatRange(p.occ.start, p.occ.end)}\n${p.occ.event.note ?? ""}`;
                const inner = (
                  <>
                    <span className="cal-block-name">
                      {p.continuesBefore ? "← " : ""}
                      {p.occ.event.name}
                      {p.continuesAfter ? " →" : ""}
                    </span>
                    {board ? (
                      <span className="cal-block-tag">详情</span>
                    ) : (
                      p.occ.event.durationDays > 1 && (
                        <span className="cal-block-time">{durationLabel(p.occ.event.durationDays)}</span>
                      )
                    )}
                  </>
                );

                if (board) {
                  return (
                    <button
                      type="button"
                      className="cal-block is-board"
                      key={p.occ.id}
                      style={style}
                      title={`${title}\n点击查看详情`}
                      onClick={() => onBoardClick(p.occ.event)}
                    >
                      {inner}
                    </button>
                  );
                }

                return (
                  <div className="cal-block" key={p.occ.id} style={style} title={title}>
                    {inner}
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

function BoardModal({ event, onClose }: { event: CycleEvent; onClose: () => void }) {
  const board = event.board;
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!panel) return;

    const tl = gsap.timeline();
    if (overlay) {
      tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out" }, 0);
    }
    tl.fromTo(
      panel,
      { opacity: 0, scale: 0.94, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.32, ease: "back.out(1.4)" },
      0,
    );
    const rows = panel.querySelectorAll<HTMLElement>(".board-table tbody tr");
    if (rows.length > 0) {
      tl.fromTo(
        rows,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.25, stagger: 0.035, ease: "power2.out" },
        0.12,
      );
    }
    return () => {
      tl.kill();
    };
  }, []);

  if (!board) return null;

  return (
    <div
      className="board-modal"
      role="dialog"
      aria-modal="true"
      aria-label={event.name}
      onClick={onClose}
      ref={overlayRef}
    >
      <div className="board-panel" onClick={(e) => e.stopPropagation()} ref={panelRef}>
        <header className="board-head">
          <h3>{event.name}</h3>
          <button type="button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </header>

        <p className="board-rules">
          低保线 <strong>{board.minScore.toLocaleString()}</strong> 分 · 上限{" "}
          <strong>{board.maxScore.toLocaleString()}</strong> 分
        </p>

        <table className="board-table">
          <thead>
            <tr>
              <th>材料</th>
              <th className="board-num">分值</th>
              <th className="board-num">最大可使用量</th>
            </tr>
          </thead>
          <tbody>
            {board.materials.map((m) => (
              <tr key={m.name}>
                <td>{m.name}</td>
                <td className="board-points">{m.points}</td>
                <td className="board-max">{Math.floor(board.maxScore / m.points).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="board-foot">「最大可使用量」为达到上限所需数量，超出上限需接受惩罚。</p>
      </div>
    </div>
  );
}

export default function GameCalendar() {
  const [data, setData] = useState<CalendarData>(DEFAULT_CALENDAR_DATA);
  const [now, setNow] = useState(0);
  const [boardEvent, setBoardEvent] = useState<CycleEvent | null>(null);

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

  useEffect(() => {
    if (!boardEvent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBoardEvent(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [boardEvent]);

  const startMonday = useMemo(() => (now > 0 ? currentWeekMondayUtc(now) : 0), [now]);
  const layout = useMemo(
    () => (now > 0 ? buildCalendarLayout(data, startMonday, WEEK_COUNT) : []),
    [data, startMonday, now],
  );

  return (
    <section className="section" id="calendar">
      <div className="shell">
        <div className="section-heading">
          <h2>四周活动日历</h2>
          <p className="cal-legend-note">北京时间 · 灰色为已过去，高亮为今天。</p>
        </div>
        <CalendarGrid data={data} layout={layout} now={now} onBoardClick={setBoardEvent} />
      </div>

      {boardEvent && <BoardModal event={boardEvent} onClose={() => setBoardEvent(null)} />}
    </section>
  );
}
