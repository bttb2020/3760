export type BoardMaterial = {
  name: string;
  /** 每个材料对应的分值 */
  points: number;
};

export type BoardDay = {
  /** 第几天（1-based） */
  day: number;
  /** 低保线（分） */
  minScore: number;
  /** 上限（分） */
  maxScore: number;
  materials: BoardMaterial[];
};

export type Board = {
  days: BoardDay[];
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
        days: [
          {
            day: 1,
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
        ],
      },
    },
    {
      id: "frost-king",
      name: "冻土之王",
      weeks: [3],
      weekday: 1,
      durationDays: 7,
      note: "第 3 周，7 天榜。",
      board: {
        days: [
          {
            day: 1,
            minScore: 333000,
            maxScore: 1665000,
            materials: [
              { name: "火晶", points: 2000 },
              { name: "加速1分钟", points: 30 },
              { name: "宝石", points: 70 },
            ],
          },
          {
            day: 2,
            minScore: 312000,
            maxScore: 1560000,
            materials: [
              { name: "火晶", points: 2000 },
              { name: "专家印记", points: 6000 },
              { name: "学识之书", points: 60 },
              { name: "加速1分钟", points: 30 },
              { name: "小筑抽奖", points: 8000 },
              { name: "橙碎", points: 3040 },
              { name: "紫碎", points: 1220 },
              { name: "蓝碎", points: 350 },
              { name: "专精", points: 4000 },
              { name: "专武", points: 8000 },
              { name: "秘银", points: 144000 },
            ],
          },
          {
            day: 3,
            minScore: 362000,
            maxScore: 1810000,
            materials: [
              { name: "宠物突破", points: 50 },
              { name: "橙色石头", points: 15000 },
              { name: "蓝色石头", points: 1150 },
              { name: "专家印记", points: 6000 },
              { name: "学识之书", points: 60 },
              { name: "专家加速1分钟", points: 30 },
              { name: "宝石", points: 70 },
              { name: "小筑抽奖", points: 8000 },
              { name: "橙碎", points: 3040 },
              { name: "紫碎", points: 1220 },
              { name: "蓝碎", points: 350 },
            ],
          },
          {
            day: 4,
            minScore: 362000,
            maxScore: 1810000,
            materials: [
              { name: "宝石", points: 70 },
              { name: "专精", points: 4000 },
              { name: "专武", points: 8000 },
              { name: "秘银", points: 144000 },
              { name: "爆兵", points: 39 },
            ],
          },
          {
            day: 5,
            minScore: 289000,
            maxScore: 1445000,
            materials: [
              { name: "专精", points: 4000 },
              { name: "专武", points: 8000 },
              { name: "秘银", points: 144000 },
              { name: "火晶", points: 2000 },
              { name: "加速1分钟", points: 30 },
            ],
          },
          {
            day: 6,
            minScore: 380000,
            maxScore: 1900000,
            materials: [
              { name: "领主装备", points: 36 },
              { name: "爆兵", points: 39 },
            ],
          },
          {
            day: 7,
            minScore: 350000,
            maxScore: 1750000,
            materials: [
              { name: "宠物突破", points: 50 },
              { name: "橙色石头", points: 15000 },
              { name: "蓝色石头", points: 1150 },
              { name: "领主装备", points: 36 },
              { name: "火晶", points: 2000 },
              { name: "加速1分钟", points: 30 },
              { name: "橙碎", points: 3040 },
              { name: "紫碎", points: 1220 },
              { name: "蓝碎", points: 350 },
              { name: "挖8级矿", points: 16800 },
            ],
          },
        ],
      },
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
        const days: BoardDay[] = (Array.isArray(b.days) ? b.days : [])
          .map((d, di) => {
            const dayObj = (d ?? {}) as Record<string, unknown>;
            const materials: BoardMaterial[] = (Array.isArray(dayObj.materials)
              ? dayObj.materials
              : []
            )
              .map((m) => {
                const mat = (m ?? {}) as Record<string, unknown>;
                return {
                  name: String(mat.name ?? ""),
                  points: typeof mat.points === "number" ? mat.points : 0,
                };
              })
              .filter((m) => m.name && m.points > 0);
            return {
              day: typeof dayObj.day === "number" ? Math.round(dayObj.day) : di + 1,
              minScore: typeof dayObj.minScore === "number" ? dayObj.minScore : 0,
              maxScore: typeof dayObj.maxScore === "number" ? dayObj.maxScore : 0,
              materials,
            };
          })
          .filter((d) => d.materials.length > 0);
        if (days.length > 0) {
          board = { days };
        }
      }

      const id = typeof item.id === "string" && item.id ? item.id : `event-${i}`;

      // 若已存储数据未携带榜详情，回退到默认数据的同 id 榜（保证可点击查看详情）
      if (!board) {
        board = DEFAULT_CALENDAR_DATA.events.find((e) => e.id === id)?.board;
      }

      return {
        id,
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
