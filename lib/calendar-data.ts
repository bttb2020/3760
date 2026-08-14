export type BoardMaterial = {
  name: string;
  /** 每个材料对应的分值 */
  points: number;
};

export type Board = {
  /** 低保线（分） */
  minScore: number;
  /** 上限（分） */
  maxScore: number;
  materials: BoardMaterial[];
};

export type CycleEvent = {
  id: string;
  name: string;
  /** 周期内第几周（1-4），可多选；如 [1,3] 表示第 1、3 周都出现 */
  weeks: number[];
  /** 每周几（1=周一 … 7=周日） */
  weekday: number;
  /** 持续天数（含开始当天） */
  durationDays: number;
  note?: string;
  /** 小榜详情（存在即可点击查看） */
  board?: Board;
};

export type CycleWeek = {
  /** 1-4 */
  week: number;
  /** 该周主题名 */
  theme: string;
};

export type CalendarData = {
  /** 第 1 周（最强王国）的周一，北京时间日期 "YYYY-MM-DD" */
  cycleAnchor: string;
  /** 四周主题 */
  cycleWeeks: CycleWeek[];
  events: CycleEvent[];
};

export const DEFAULT_CALENDAR_DATA: CalendarData = {
  cycleAnchor: "2026-08-10",
  cycleWeeks: [
    { week: 1, theme: "最强王国" },
    { week: 2, theme: "联盟大作战" },
    { week: 3, theme: "冻土之王" },
    { week: 4, theme: "联盟总动员" },
  ],
  events: [
    {
      id: "svs",
      name: "最强王国",
      weeks: [1],
      weekday: 1,
      durationDays: 6,
      note: "前一个周六日匹配；周一至周六备战，周六晚跨国战。",
    },
    {
      id: "alliance-duel",
      name: "联盟大作战",
      weeks: [2],
      weekday: 1,
      durationDays: 7,
    },
    {
      id: "minor-board",
      name: "小榜",
      weeks: [2],
      weekday: 1,
      durationDays: 2,
      note: "联盟大作战周周一、周二。",
      board: {
        minScore: 20000,
        maxScore: 100000,
        materials: [
          { name: "火晶", points: 100 },
          { name: "微粒", points: 50 },
          { name: "专家印记", points: 200 },
          { name: "专家书", points: 2 },
          { name: "领主", points: 3 },
          { name: "橙碎", points: 125 },
          { name: "紫碎", points: 50 },
          { name: "蓝碎", points: 15 },
          { name: "加速1分钟", points: 1 },
        ],
      },
    },
    {
      id: "frost-king",
      name: "冻土之王",
      weeks: [3],
      weekday: 1,
      durationDays: 7,
    },
    {
      id: "alliance-mobilization",
      name: "联盟总动员",
      weeks: [4],
      weekday: 1,
      durationDays: 7,
    },
    {
      id: "frostburn-mine",
      name: "燃霜矿区",
      weeks: [1, 3],
      weekday: 2,
      durationDays: 1,
      note: "第一、三周周二。",
    },
    {
      id: "fortress",
      name: "堡垒争夺",
      weeks: [1, 2, 3, 4],
      weekday: 5,
      durationDays: 1,
      note: "每周五。",
    },
  ],
};

const DEFAULT_CYCLE_WEEKS = DEFAULT_CALENDAR_DATA.cycleWeeks;

/** 对任意输入做防御式规范化，保证类型安全。 */
export function normalizeCalendarData(raw: unknown): CalendarData {
  const source = (raw ?? {}) as Record<string, unknown>;

  const events: CycleEvent[] = (Array.isArray(source.events) ? source.events : []).map(
    (e, i) => {
      const item = (e ?? {}) as Record<string, unknown>;
      const weeks = (Array.isArray(item.weeks) ? item.weeks : [])
        .map((w) => Number(w))
        .filter((w) => Number.isFinite(w) && w >= 1 && w <= 4);
      const weekday =
        typeof item.weekday === "number" && item.weekday >= 1 && item.weekday <= 7
          ? Math.round(item.weekday)
          : 1;
      const durationDays =
        typeof item.durationDays === "number" && item.durationDays >= 1
          ? Math.round(item.durationDays)
          : 1;

      let board: Board | undefined;
      if (item.board && typeof item.board === "object") {
        const b = item.board as Record<string, unknown>;
        const materials: BoardMaterial[] = (Array.isArray(b.materials) ? b.materials : [])
          .map((m) => {
            const mat = (m ?? {}) as Record<string, unknown>;
            return {
              name: String(mat.name ?? ""),
              points: typeof mat.points === "number" ? mat.points : 0,
            };
          })
          .filter((m) => m.name && m.points > 0);
        if (materials.length > 0) {
          board = {
            minScore: typeof b.minScore === "number" ? b.minScore : 0,
            maxScore: typeof b.maxScore === "number" ? b.maxScore : 0,
            materials,
          };
        }
      }

      return {
        id: typeof item.id === "string" && item.id ? item.id : `event-${i}`,
        name: String(item.name ?? ""),
        weeks: weeks.length > 0 ? weeks : [1],
        weekday,
        durationDays,
        note: typeof item.note === "string" ? item.note : undefined,
        board,
      };
    },
  );

  const cycleWeeks: CycleWeek[] = (Array.isArray(source.cycleWeeks)
    ? source.cycleWeeks
    : DEFAULT_CYCLE_WEEKS
  ).map((w, i) => {
    const item = (w ?? {}) as Record<string, unknown>;
    const week = typeof item.week === "number" ? Math.round(item.week) : i + 1;
    return {
      week: week >= 1 && week <= 4 ? week : i + 1,
      theme: String(item.theme ?? DEFAULT_CYCLE_WEEKS[i]?.theme ?? `第 ${i + 1} 周`),
    };
  });

  return {
    cycleAnchor:
      typeof source.cycleAnchor === "string" && source.cycleAnchor
        ? source.cycleAnchor
        : DEFAULT_CALENDAR_DATA.cycleAnchor,
    cycleWeeks,
    events,
  };
}
