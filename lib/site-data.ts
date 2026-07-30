export type SiteEvent = {
  id: string;
  title: string;
  /** ISO 8601 时间 */
  date: string;
  /** countdown = 倒计时（未来事件），countup = 正计时（已发生） */
  type: "countdown" | "countup";
  note: string;
  /** 是否作为首页重点事件展示 */
  highlight: boolean;
};

export type MigrationInfo = {
  group: string;
  rangeStart: string;
  rangeEnd: string;
  powerCap: string;
};

export type ContactField = {
  id: string;
  /** 字段名，如：微信、抖音 */
  label: string;
  /** 内容；以 http(s):// 开头时前台渲染为可点击链接 */
  value: string;
};

export type Contact = {
  id: string;
  name: string;
  gameId: string;
  coords: string;
  /** 自定义字段，空字段不展示 */
  fields: ContactField[];
};

export type SiteData = {
  /** 开区时间，ISO 8601 */
  openDate: string;
  /** 王国统治力（自由文本，如 “12.6 亿”） */
  dominance: string;
  events: SiteEvent[];
  migration: MigrationInfo;
  /** 管理组联系方式 */
  contacts: Contact[];
};

export const DEFAULT_SITE_DATA: SiteData = {
  openDate: "2026-05-01T00:00:00+08:00",
  dominance: "待填写",
  events: [
    {
      id: "hero-5",
      title: "5 代英雄",
      date: "2026-08-17T00:00:00+08:00",
      type: "countdown",
      note: "新代际英雄开放",
      highlight: true,
    },
  ],
  migration: {
    group: "11",
    rangeStart: "3600",
    rangeEnd: "3800",
    powerCap: "1.7 亿",
  },
  contacts: [],
};
