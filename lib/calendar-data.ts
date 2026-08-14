export type CalendarObservation = {
  id: string;
  /** ISO 8601 UTC，如 2026-07-20T00:00:00Z */
  startsAtUtc: string;
  /** 持续时间（小时） */
  durationHours?: number;
  note?: string;
};

export type CalendarSchedule = {
  id: string;
  /** 展示名称（中文） */
  name: string;
  /** 英文规范名（游戏内标准标识），可选 */
  nameEn?: string;
  /** pack = 礼包，event = 活动 */
  category: "pack" | "event";
  /** 已确认的观察记录，作为推算锚点 */
  observations: CalendarObservation[];
  /** 重复周期（天）；不填表示周期未确定，仅展示已确认窗口 */
  repeatEveryDays?: number;
  /** 轮换偏移（天），配合区号轮换 A/B 使用 */
  rotationOffsetsDays?: { A: number; B: number };
  confidence?: "confirmed" | "projected" | "suspected";
  /** 说明文字 */
  note?: string;
};

export type IrregularEvent = {
  id: string;
  name: string;
  nameEn?: string;
  /** 标准持续时长（小时） */
  durationHours: number;
  /** 已确认的出现记录（sightings） */
  observations: CalendarObservation[];
};

export type PendingSchedule = {
  id: string;
  name: string;
  nameEn?: string;
  /** 已知周期（天） */
  repeatEveryDays: number;
  /** 已确认的周期锚点（可选） */
  anchorStartsAtUtc?: string;
  note?: string;
};

export type CalendarData = {
  /** 区号，用于展示与轮换提示 */
  stateNumber?: string;
  /** 轮换 A/B */
  rotation?: "A" | "B";
  schedules: CalendarSchedule[];
  irregular: IrregularEvent[];
  pending: PendingSchedule[];
};

export const DEFAULT_CALENDAR_DATA: CalendarData = {
  stateNumber: "3760",
  rotation: "A",
  schedules: [
    {
      id: "mix-match",
      name: "混搭礼包",
      nameEn: "Mix & Match",
      category: "pack",
      observations: [
        { id: "mix-match-2026-07-20", startsAtUtc: "2026-07-20T00:00:00Z", durationHours: 72 },
      ],
      repeatEveryDays: 14,
      confidence: "confirmed",
      note: "周一重置时上线，持续至周三。每两周重复一次。",
    },
    {
      id: "artisans-trove-charms",
      name: "工匠宝库·符咒",
      nameEn: "Artisan's Trove - Charms",
      category: "pack",
      observations: [
        { id: "artisans-trove-charms-2026-07-22", startsAtUtc: "2026-07-22T00:00:00Z", durationHours: 48 },
      ],
      repeatEveryDays: 7,
      confidence: "confirmed",
      note: "周三重置时上线，持续至周四。每周重复。",
    },
    {
      id: "custom-armament",
      name: "定制军备",
      nameEn: "Custom Armament",
      category: "pack",
      observations: [
        { id: "custom-armament-2026-07-23", startsAtUtc: "2026-07-23T00:00:00Z", durationHours: 48 },
      ],
      repeatEveryDays: 7,
      confidence: "confirmed",
      note: "周四重置时上线，持续至周五。每周重复。",
    },
    {
      id: "myriad-bazaar",
      name: "万千集市",
      nameEn: "Myriad Bazaar",
      category: "pack",
      observations: [
        {
          id: "myriad-bazaar-2026-07-23",
          startsAtUtc: "2026-07-23T00:00:00Z",
          durationHours: 48,
          note: "7 月 23 日 00:00 UTC 弹出，持续 48 小时，至 7 月 25 日 00:00 UTC。",
        },
      ],
      confidence: "confirmed",
      note: "首次记录出现。需要再次观察到才能推算周期。",
    },
    {
      id: "dawn-market",
      name: "黎明集市",
      nameEn: "Dawn Market",
      category: "pack",
      observations: [
        { id: "dawn-market-2026-07-24", startsAtUtc: "2026-07-24T00:00:00Z", durationHours: 72 },
      ],
      repeatEveryDays: 14,
      confidence: "confirmed",
      note: "周五重置时上线，持续至周日。每两周重复。",
    },
    {
      id: "dawn-of-wisdom",
      name: "智慧黎明",
      nameEn: "Dawn of Wisdom",
      category: "pack",
      observations: [
        {
          id: "dawn-of-wisdom-2026-08-11",
          startsAtUtc: "2026-08-11T00:00:00Z",
          durationHours: 48,
          note: "确认于 8 月 11 日 00:00 UTC 至 8 月 13 日重置。",
        },
      ],
      repeatEveryDays: 14,
      confidence: "confirmed",
      note: "周二重置时上线，持续至周三。每两周重复。",
    },
    {
      id: "artisans-trove-chief-gear",
      name: "工匠宝库·统帅装备",
      nameEn: "Artisan's Trove - Chief Gear",
      category: "pack",
      observations: [
        { id: "artisans-trove-chief-gear-2026-07-24", startsAtUtc: "2026-07-24T00:00:00Z", durationHours: 48 },
      ],
      repeatEveryDays: 7,
      confidence: "confirmed",
      note: "周五重置时上线，持续至周六。每周重复。",
    },
    {
      id: "alliance-showdown",
      name: "联盟争霸赛",
      nameEn: "Alliance Showdown",
      category: "event",
      observations: [
        { id: "alliance-showdown-2026-07-20", startsAtUtc: "2026-07-20T00:00:00Z", durationHours: 132 },
      ],
      repeatEveryDays: 28,
      confidence: "confirmed",
      note: "周一重置开始，周六 12:00 UTC 结束。每四周重复。",
    },
    {
      id: "snowbusters",
      name: "雪怪",
      nameEn: "Snowbusters",
      category: "event",
      observations: [
        {
          id: "snowbusters-rotation-a-2026-08-04",
          startsAtUtc: "2026-08-04T00:00:00Z",
          durationHours: 72,
          note: "确认轮换 A：8 月 4 日至 8 月 7 日重置。",
        },
      ],
      repeatEveryDays: 56,
      rotationOffsetsDays: { A: 0, B: 28 },
      confidence: "confirmed",
      note: "与钓鱼每四周交替。轮换 A 于 8 月 4 日开始雪怪；轮换 B 四周后开始。",
    },
    {
      id: "fishing",
      name: "钓鱼",
      nameEn: "Fishing",
      category: "event",
      observations: [
        {
          id: "fishing-rotation-b-2026-08-04",
          startsAtUtc: "2026-08-04T00:00:00Z",
          durationHours: 72,
          note: "确认轮换 B：8 月 4 日至 8 月 7 日重置。",
        },
      ],
      repeatEveryDays: 56,
      rotationOffsetsDays: { A: 28, B: 0 },
      confidence: "confirmed",
      note: "与雪怪每四周交替。轮换 B 于 8 月 4 日开始钓鱼；轮换 A 四周后开始。",
    },
    {
      id: "suncastle-internal",
      name: "日耀城（内部）",
      nameEn: "Suncastle (Internal)",
      category: "event",
      observations: [
        { id: "suncastle-internal-2026-08-01", startsAtUtc: "2026-08-01T00:00:00Z", durationHours: 24 },
      ],
      repeatEveryDays: 28,
      confidence: "confirmed",
      note: "显示为周六全天活动。每四周重复。",
    },
    {
      id: "svs-prep",
      name: "SvS 备战",
      nameEn: "SvS Prep",
      category: "event",
      observations: [
        { id: "svs-prep-2026-08-10", startsAtUtc: "2026-08-10T00:00:00Z", durationHours: 144 },
      ],
      repeatEveryDays: 28,
      confidence: "confirmed",
      note: "周一至周六。每四周重复。",
    },
    {
      id: "icefire-warhymn-league",
      name: "冰火战歌联赛",
      nameEn: "Icefire Warhymn League",
      category: "event",
      observations: [
        {
          id: "icefire-warhymn-league-2026-08-10",
          startsAtUtc: "2026-08-10T00:00:00Z",
          durationHours: 168,
          note: "确认于 8 月 10 日 00:00 UTC 至 8 月 16 日 24:00 UTC。",
        },
      ],
      confidence: "confirmed",
      note: "确认于 8 月 10 日重置至 8 月 17 日重置。周期尚未确定。",
    },
    {
      id: "vault-of-enigma",
      name: "谜之宝库",
      nameEn: "Vault of Enigma",
      category: "event",
      observations: [
        {
          id: "vault-of-enigma-2026-08-10",
          startsAtUtc: "2026-08-10T00:00:00Z",
          durationHours: 168,
          note: "确认于 8 月 10 日 00:00 UTC 至 8 月 17 日重置。",
        },
      ],
      confidence: "confirmed",
      note: "确认于 8 月 10 日重置至 8 月 17 日重置。周期尚未确定。",
    },
    {
      id: "svs-castle",
      name: "SvS 要塞",
      nameEn: "SvS Castle",
      category: "event",
      observations: [
        { id: "svs-castle-2026-08-15", startsAtUtc: "2026-08-15T12:00:00Z", durationHours: 12 },
      ],
      repeatEveryDays: 28,
      confidence: "confirmed",
      note: "周六 12:00 UTC 开始，显示至 UTC 日结束。每四周重复。",
    },
  ],
  irregular: [
    {
      id: "treasure-hunter",
      name: "宝藏猎人",
      nameEn: "Treasure Hunter",
      durationHours: 120,
      observations: [],
    },
    {
      id: "wander-theater",
      name: "流浪剧场",
      nameEn: "Wander Theater",
      durationHours: 144,
      observations: [
        { id: "wander-theater-2026-07-20", startsAtUtc: "2026-07-20T00:00:00Z" },
        { id: "wander-theater-2026-05-11", startsAtUtc: "2026-05-11T00:00:00Z" },
      ],
    },
    {
      id: "twin-stars-together",
      name: "双子星奇遇",
      nameEn: "Twin Star Adventure",
      durationHours: 216,
      observations: [
        {
          id: "twin-star-adventure-2026-08-02",
          startsAtUtc: "2026-08-02T00:00:00Z",
          note: "确认于 8 月 2 日 00:00 UTC 至 8 月 10 日 24:00 UTC。",
        },
      ],
    },
    {
      id: "journey-of-light",
      name: "光明之旅",
      nameEn: "Journey of Light",
      durationHours: 144,
      observations: [],
    },
    {
      id: "kasias-wish-house",
      name: "卡西亚心愿屋",
      nameEn: "Kasia's Wish House",
      durationHours: 144,
      observations: [],
    },
  ],
  pending: [
    {
      id: "svs-fight",
      name: "SvS 交战",
      nameEn: "SvS Fight",
      repeatEveryDays: 28,
      anchorStartsAtUtc: "2026-07-18T00:00:00Z",
      note: "7 月 18 日 UTC 游戏日为已确认的周期锚点。",
    },
    {
      id: "frostdragon-tyrant-battle",
      name: "冰霜巨龙暴君战",
      nameEn: "Frostdragon Tyrant Battle",
      repeatEveryDays: 56,
      note: "周期已知，但仍需确认具体战斗日期。",
    },
  ],
};

/** 对任意输入做防御式规范化，保证类型安全。 */
export function normalizeCalendarData(raw: unknown): CalendarData {
  const source = (raw ?? {}) as Record<string, unknown>;

  const obs = (list: unknown): CalendarObservation[] =>
    (Array.isArray(list) ? list : []).map((o, i) => {
      const item = (o ?? {}) as Record<string, unknown>;
      return {
        id:
          typeof item.id === "string" && item.id
            ? item.id
            : `obs-${i}`,
        startsAtUtc: String(item.startsAtUtc ?? ""),
        durationHours:
          typeof item.durationHours === "number" ? item.durationHours : undefined,
        note: typeof item.note === "string" ? item.note : undefined,
      };
    });

  const schedules: CalendarSchedule[] = (Array.isArray(source.schedules)
    ? source.schedules
    : []
  ).map((s, i) => {
    const item = (s ?? {}) as Record<string, unknown>;
    const rot = item.rotationOffsetsDays as Record<string, unknown> | undefined;
    return {
      id: typeof item.id === "string" && item.id ? item.id : `sched-${i}`,
      name: String(item.name ?? ""),
      nameEn: typeof item.nameEn === "string" ? item.nameEn : undefined,
      category: item.category === "event" ? "event" : "pack",
      observations: obs(item.observations),
      repeatEveryDays:
        typeof item.repeatEveryDays === "number"
          ? item.repeatEveryDays
          : undefined,
      rotationOffsetsDays: rot
        ? {
            A: typeof rot.A === "number" ? rot.A : 0,
            B: typeof rot.B === "number" ? rot.B : 0,
          }
        : undefined,
      confidence:
        item.confidence === "projected" || item.confidence === "suspected"
          ? item.confidence
          : "confirmed",
      note: typeof item.note === "string" ? item.note : undefined,
    };
  });

  const irregular: IrregularEvent[] = (Array.isArray(source.irregular)
    ? source.irregular
    : []
  ).map((s, i) => {
    const item = (s ?? {}) as Record<string, unknown>;
    return {
      id: typeof item.id === "string" && item.id ? item.id : `irr-${i}`,
      name: String(item.name ?? ""),
      nameEn: typeof item.nameEn === "string" ? item.nameEn : undefined,
      durationHours: typeof item.durationHours === "number" ? item.durationHours : 24,
      observations: obs(item.observations),
    };
  });

  const pending: PendingSchedule[] = (Array.isArray(source.pending)
    ? source.pending
    : []
  ).map((s, i) => {
    const item = (s ?? {}) as Record<string, unknown>;
    return {
      id: typeof item.id === "string" && item.id ? item.id : `pend-${i}`,
      name: String(item.name ?? ""),
      nameEn: typeof item.nameEn === "string" ? item.nameEn : undefined,
      repeatEveryDays:
        typeof item.repeatEveryDays === "number" ? item.repeatEveryDays : 7,
      anchorStartsAtUtc:
        typeof item.anchorStartsAtUtc === "string" && item.anchorStartsAtUtc
          ? item.anchorStartsAtUtc
          : undefined,
      note: typeof item.note === "string" ? item.note : undefined,
    };
  });

  return {
    stateNumber:
      typeof source.stateNumber === "string" ? source.stateNumber : undefined,
    rotation: source.rotation === "B" ? "B" : "A",
    schedules,
    irregular,
    pending,
  };
}
