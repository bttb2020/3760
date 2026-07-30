"use client";

import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Crown,
  Flag,
  Gem,
  HeartHandshake,
  Menu,
  PawPrint,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
};

const events = [
  {
    id: "svs",
    title: "跨区国战",
    short: "国战",
    date: "2026-08-08T19:00:00+08:00",
    displayDate: "08.08",
    icon: Swords,
    tone: "coral",
    detail: "备战期结束 · 19:00 开战",
  },
  {
    id: "progress",
    title: "新游戏进程",
    short: "新进程",
    date: "2026-08-17T00:00:00+08:00",
    displayDate: "08.17",
    icon: Flag,
    tone: "cyan",
    detail: "新阶段内容开放",
  },
  {
    id: "expert",
    title: "新专家登场",
    short: "新专家",
    date: "2026-08-24T00:00:00+08:00",
    displayDate: "08.24",
    icon: Sparkles,
    tone: "violet",
    detail: "专家系统更新",
  },
  {
    id: "pet",
    title: "新宠物开放",
    short: "新宠物",
    date: "2026-08-31T00:00:00+08:00",
    displayDate: "08.31",
    icon: PawPrint,
    tone: "amber",
    detail: "宠物代际更新",
  },
];

const timeline = [
  {
    date: "08.01",
    label: "备战动员",
    title: "国战资源申报开启",
    copy: "提交本轮资源计划与目标档位，管理组汇总后公示。",
    status: "即将开始",
  },
  {
    date: "08.08",
    label: "跨区战事",
    title: "国战 · 王城争夺",
    copy: "18:30 集结，19:00 开战。统一频道指挥，优先保障主力车头。",
    status: "重点事件",
  },
  {
    date: "08.17",
    label: "版本进程",
    title: "新阶段内容开放",
    copy: "开放节奏、资源建议和养成优先级将在前一周发布。",
    status: "预计",
  },
  {
    date: "08.24",
    label: "养成更新",
    title: "新专家 / 新宠物窗口",
    copy: "不要求追满。先看收益曲线，再决定个人投入节奏。",
    status: "预计",
  },
];

const ruleGroups = [
  {
    id: "resources",
    label: "资源分配",
    icon: Gem,
    eyebrow: "STATE ASSETS",
    title: "公共资源，按贡献与需求流转",
    lead: "城池、官职和限量资源属于全区，不属于任何单一联盟或个人。",
    rules: [
      "固定资产实行轮换制，排期提前一轮公示",
      "稀缺资源优先补齐国战关键岗位，不以战力高低一刀切",
      "所有临时调整必须留下原因、经手人与复核时间",
    ],
    note: "分配表将在每轮活动结束后 24 小时内更新。",
  },
  {
    id: "ranking",
    label: "小榜规则",
    icon: Target,
    eyebrow: "RANKING RULES",
    title: "提前报备，分档竞争，避免内耗",
    lead: "小榜不是抢跑比赛。先报名、再分档、后确认，保护长期积累。",
    rules: [
      "冲榜前在指定频道报备目标名次与可用资源",
      "同档位多人冲突时，按轮换记录与资源效率协调",
      "恶意抬分、临时截榜、代打破坏排期将失去下轮优先权",
    ],
    note: "未报备玩家可正常参与，但不享受管理协调与资源补偿。",
  },
  {
    id: "privilege",
    label: "管理特权",
    icon: Crown,
    eyebrow: "LEADERSHIP",
    title: "管理没有额外收益，只有更高责任",
    lead: "权限只用于提升执行效率，不用于为个人、亲友或所属联盟谋利。",
    rules: [
      "管理成员同样遵守轮换、报备与冲榜规则",
      "涉及本人或本盟利益时必须回避，由其他成员复核",
      "连续两次缺席职责或一次严重滥权，立即冻结权限并公示",
    ],
    note: "任何玩家都可以申请查看决策依据并提出复议。",
  },
];

const values = [
  {
    number: "01",
    title: "长期主义",
    copy: "我们更在意半年后还有多少人愿意一起玩，而不是今天多拿一档奖励。",
  },
  {
    number: "02",
    title: "规则透明",
    copy: "重要规则提前写清、变更留下记录、决策允许复议。",
  },
  {
    number: "03",
    title: "尊重差异",
    copy: "重氪、微氪、零氪都有自己的节奏；贡献不只有战力一种形式。",
  },
  {
    number: "04",
    title: "对外团结",
    copy: "区内可以讨论，战场必须协同。赢得有章法，输得有风度。",
  },
];

function getCountdown(target: string): Countdown {
  const distance = new Date(target).getTime() - Date.now();
  if (distance <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  }

  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
    seconds: Math.floor((distance / 1_000) % 60),
    ended: false,
  };
}

function useCountdown(target: string) {
  const [countdown, setCountdown] = useState<Countdown>(() => ({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    ended: false,
  }));

  useEffect(() => {
    const update = () => setCountdown(getCountdown(target));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  return countdown;
}

function Pad({ value }: { value: number }) {
  return String(value).padStart(2, "0");
}

function PrimaryCountdown() {
  const countdown = useCountdown(events[0].date);

  return (
    <div className="hero-countdown" aria-live="polite">
      <div className="countdown-heading">
        <span className="live-dot" />
        <span>距离下一场跨区国战</span>
        <span className="demo-tag">示例档期</span>
      </div>
      <div className="countdown-grid">
        {[
          ["天", countdown.days],
          ["时", countdown.hours],
          ["分", countdown.minutes],
          ["秒", countdown.seconds],
        ].map(([label, value]) => (
          <div className="countdown-unit" key={label}>
            <strong><Pad value={Number(value)} /></strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="countdown-meta">
        <span><CalendarDays size={15} /> 2026.08.08 周六 19:00</span>
        <span><Swords size={15} /> 集结时间 18:30</span>
      </div>
    </div>
  );
}

function EventCountdown({ event }: { event: (typeof events)[number] }) {
  const countdown = useCountdown(event.date);
  const Icon = event.icon;

  return (
    <article className={`event-card tone-${event.tone}`}>
      <div className="event-icon"><Icon size={19} /></div>
      <div className="event-copy">
        <span>{event.title}</span>
        <strong>{countdown.ended ? "已开启" : `${countdown.days}天 ${String(countdown.hours).padStart(2, "0")}时`}</strong>
        <small>{event.detail}</small>
      </div>
      <div className="event-date">{event.displayDate}</div>
    </article>
  );
}

export default function Home() {
  const [activeRule, setActiveRule] = useState("resources");
  const [menuOpen, setMenuOpen] = useState(false);
  const currentRule = useMemo(
    () => ruleGroups.find((rule) => rule.id === activeRule) ?? ruleGroups[0],
    [activeRule],
  );
  const ActiveIcon = currentRule.icon;

  const closeMenu = () => setMenuOpen(false);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="3760 区首页">
          <span className="brand-mark">3760</span>
          <span className="brand-copy">
            <strong>冰原共同体</strong>
            <small>国服 · 玩家共治</small>
          </span>
        </a>
        <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="主导航">
          <a href="#timeline" onClick={closeMenu}>时间线</a>
          <a href="#transfer" onClick={closeMenu}>移民分组</a>
          <a href="#rules" onClick={closeMenu}>管理办法</a>
          <a href="#values" onClick={closeMenu}>价值观</a>
          <a className="nav-cta" href="#notice" onClick={closeMenu}>本周公告 <ArrowRight size={15} /></a>
        </nav>
        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? "关闭导航" : "打开导航"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-orbit orbit-one" aria-hidden="true" />
        <div className="hero-orbit orbit-two" aria-hidden="true" />
        <div className="section-shell hero-layout">
          <div className="hero-copy">
            <div className="status-line">
              <span className="status-badge"><ShieldCheck size={14} /> 秩序稳定</span>
              <span>最后更新 · 2026.07.30</span>
            </div>
            <p className="eyebrow">WHITEOUT SURVIVAL · STATE 3760</p>
            <h1>规矩写在明处，<br /><span>把资源留给长期主义。</span></h1>
            <p className="hero-lead">
              这里是 3760 区的公开信息台。重要档期、移民安排、资源规则与共同价值，
              都可以在这里被看到、被理解、被讨论。
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#timeline">查看近期安排 <ArrowDown size={16} /></a>
              <a className="text-button" href="#rules">阅读管理办法 <ChevronRight size={16} /></a>
            </div>
          </div>
          <PrimaryCountdown />
        </div>
        <div className="section-shell event-strip">
          {events.slice(1).map((event) => <EventCountdown event={event} key={event.id} />)}
        </div>
      </section>

      <section className="notice-band" id="notice">
        <div className="section-shell notice-content">
          <div className="notice-label"><span>本周</span><strong>公告</strong></div>
          <p><b>国战报名已开放。</b>主力车头、集结手与替补成员请在 08.01 前完成登记；本页时间与分组目前为设计演示数据。</p>
          <a href="#rules">查看战前规则 <ArrowRight size={15} /></a>
        </div>
      </section>

      <section className="content-section timeline-section" id="timeline">
        <div className="section-shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow dark">STATE TIMELINE</p>
              <h2>近期时间线</h2>
            </div>
            <p>提前知道下一件大事，把节奏掌握在自己手里。</p>
          </div>
          <div className="timeline">
            {timeline.map((item, index) => (
              <article className="timeline-item" key={item.date + item.title}>
                <div className="timeline-date">
                  <span>{item.date}</span>
                  <small>AUG</small>
                </div>
                <div className="timeline-line">
                  <span className={index === 1 ? "timeline-node is-key" : "timeline-node"} />
                </div>
                <div className="timeline-copy">
                  <div className="timeline-topline">
                    <span>{item.label}</span>
                    <em>{item.status}</em>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="data-note">以上为版式演示档期，正式时间以游戏内公告及管理组通知为准。</p>
        </div>
      </section>

      <section className="content-section transfer-section" id="transfer">
        <div className="section-shell transfer-layout">
          <div className="transfer-intro">
            <p className="eyebrow">STATE TRANSFER</p>
            <h2>移民不是抢人，<br />是一次双向选择。</h2>
            <p>
              我们希望新成员在进入 3760 前就清楚这里的节奏、边界和期待。
              战力是参考，稳定、协作与长期意愿同样重要。
            </p>
            <div className="group-card">
              <span>本轮移民分组</span>
              <strong>待游戏内确认</strong>
              <small>范围与战力上限将在开放前同步更新</small>
            </div>
          </div>
          <div className="transfer-phases">
            {[
              ["01", "预登记", "填写基础信息、目标联盟、活跃时段与迁入原因。"],
              ["02", "双向沟通", "管理组与目标联盟沟通，确认节奏、位置与邀请类型。"],
              ["03", "名单公示", "普通邀请与特殊邀请分别公示，保留复核窗口。"],
              ["04", "落地融入", "完成联盟对接、规则确认和首周活动安排。"],
            ].map(([step, title, copy]) => (
              <article className="phase-row" key={step}>
                <span>{step}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
                <Check size={18} />
              </article>
            ))}
          </div>
        </div>
        <div className="section-shell profile-line">
          <span><Users size={18} /> 我们优先欢迎</span>
          <strong>稳定在线</strong>
          <strong>愿意沟通</strong>
          <strong>尊重排期</strong>
          <strong>不过度内耗</strong>
        </div>
      </section>

      <section className="content-section rules-section" id="rules">
        <div className="section-shell">
          <div className="section-heading rules-heading">
            <div>
              <p className="eyebrow dark">GOVERNANCE</p>
              <h2>区管理办法</h2>
            </div>
            <p>把模糊的“惯例”变成所有人都能查阅的共同规则。</p>
          </div>
          <div className="rule-tabs" role="tablist" aria-label="管理办法分类">
            {ruleGroups.map((rule) => {
              const Icon = rule.icon;
              return (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeRule === rule.id}
                  className={activeRule === rule.id ? "rule-tab is-active" : "rule-tab"}
                  onClick={() => setActiveRule(rule.id)}
                  key={rule.id}
                >
                  <Icon size={18} />
                  {rule.label}
                </button>
              );
            })}
          </div>
          <div className="rule-panel" role="tabpanel">
            <div className="rule-title-block">
              <div className="large-rule-icon"><ActiveIcon /></div>
              <p className="eyebrow dark">{currentRule.eyebrow}</p>
              <h3>{currentRule.title}</h3>
              <p>{currentRule.lead}</p>
            </div>
            <div className="rule-list">
              {currentRule.rules.map((rule, index) => (
                <div className="rule-item" key={rule}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{rule}</p>
                </div>
              ))}
              <div className="rule-note"><ScrollText size={17} /> {currentRule.note}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="values-section" id="values">
        <div className="section-shell">
          <div className="values-heading">
            <p className="eyebrow">OUR PRINCIPLES</p>
            <h2>我们想一起守住的，<br />不只是一座王城。</h2>
            <HeartHandshake size={54} />
          </div>
          <div className="values-grid">
            {values.map((value) => (
              <article className="value-item" key={value.number}>
                <span>{value.number}</span>
                <h3>{value.title}</h3>
                <p>{value.copy}</p>
              </article>
            ))}
          </div>
          <blockquote>
            <span>“</span>
            <p>强大不是让所有人用同一种方式游戏，<br />而是让不同的人仍愿意朝同一个方向前进。</p>
          </blockquote>
        </div>
      </section>

      <footer>
        <div className="section-shell footer-top">
          <div>
            <p className="eyebrow">STATE 3760</p>
            <h2>共同建设，持续更新。</h2>
          </div>
          <a className="primary-button light" href="#top">返回顶部 <ArrowDown className="rotate-icon" size={16} /></a>
        </div>
        <div className="section-shell footer-bottom">
          <span>国服 3760 区 · 玩家共治信息台</span>
          <span>页面内容以游戏内最新公告为准</span>
          <span>© 2026 STATE 3760</span>
        </div>
      </footer>
    </main>
  );
}
