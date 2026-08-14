"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Link2,
  MapPin,
  ShieldAlert,
  Snowflake,
  Swords,
  Target,
  Users,
  X,
} from "lucide-react";
import GameCalendar from "@/components/game-calendar";
import Snowfall from "@/components/snowfall";
import {
  DEFAULT_SITE_DATA,
  type SiteData,
  type SiteEvent,
} from "@/lib/site-data";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

type Photo = { key: string; name: string };

function diffParts(from: number, to: number): Parts {
  const distance = Math.max(0, to - from);
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
    seconds: Math.floor((distance / 1_000) % 60),
  };
}

function useNow() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function Pad({ value }: { value: number }) {
  return String(value).padStart(2, "0");
}

function Units({ parts }: { parts: Parts }) {
  return (
    <div className='units'>
      {(
        [
          ["天", parts.days],
          ["时", parts.hours],
          ["分", parts.minutes],
          ["秒", parts.seconds],
        ] as const
      ).map(([label, value]) => (
        <div className='unit' key={label}>
          <strong>
            <Pad value={value} />
          </strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function EventTimer({ event, now }: { event: SiteEvent; now: number }) {
  const target = new Date(event.date).getTime();
  const countingDown = event.type === "countdown" && now < target;
  const parts = diffParts(
    countingDown ? now : Math.min(target, now),
    countingDown ? target : Math.max(target, now),
  );

  return (
    <article
      className={event.highlight ? "event-tile is-highlight" : "event-tile"}
    >
      <div className='event-tile-top'>
        <span className='event-kind'>
          {event.type === "countdown" ? "倒计时" : "正计时"}
        </span>
        {event.highlight && <span className='event-flag'>重点事件</span>}
      </div>
      <h3>{event.title || "未命名事件"}</h3>
      {now > 0 && <Units parts={parts} />}
      <p className='event-meta'>
        <CalendarDays size={13} />
        {new Date(event.date).toLocaleString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Shanghai",
        })}
        {event.note && <em>{event.note}</em>}
      </p>
    </article>
  );
}

const minorBoardTypes = [
  { name: "军备、士官", reservable: true },
  { name: "野兽榜", reservable: true },
  { name: "冻土（每日）", reservable: true },
  {
    name: "名片榜",
    note: "仅控野兽日、爆兵日",
    reservable: false,
  },
];

const penaltyLevels = [
  {
    condition: "≥ 10%，< 30%",
    note: "或使用容错后再次轻微超分",
    teams: "1 队",
  },
  {
    condition: "≥ 30%",
    note: "第二次需要处罚的超分，或影响预约名次",
    teams: "2 队",
  },
  {
    condition: "第三次需要处罚，判定为恶意冲榜",
    teams: "4 队",
  },
  {
    condition: "不执行自主清兵",
    teams: "车头撞 4 队",
  },
];

export default function Home() {
  const [data, setData] = useState<SiteData>(DEFAULT_SITE_DATA);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<Photo | null>(null);
  const now = useNow();

  useEffect(() => {
    fetch("/api/site-data", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => setData({ ...DEFAULT_SITE_DATA, ...json }))
      .catch(() => {});
    fetch("/api/photos", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => Array.isArray(json) && setPhotos(json))
      .catch(() => {});
  }, []);

  const highlight = useMemo(
    () => data.events.find((event) => event.highlight) ?? data.events[0],
    [data.events],
  );
  const openSince =
    now > 0 ? diffParts(new Date(data.openDate).getTime(), now) : null;

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected]);

  return (
    <main>
      <Snowfall />

      <section className='hero' id='top'>
        <div className='shell hero-shell'>
          <div className='hero-copy'>
            <p className='eyebrow'>
              <Snowflake size={13} /> WHITEOUT SURVIVAL · #3760
            </p>
            <h1>
              风雪再大，
              <br />
              3760 一起扛。
            </h1>

            <div className='hero-stats'>
              <div className='stat'>
                <span>已开区</span>
                <strong>
                  {openSince ? `${openSince.days}` : "--"}
                  <small> 天</small>
                </strong>
              </div>
              <div className='stat'>
                <span>王国统治力</span>
                <strong>{data.dominance}</strong>
              </div>
              <div className='stat'>
                <span>移民分组</span>
                <strong>第 {data.migration.group} 组</strong>
              </div>
            </div>

            {highlight && now > 0 && (
              <div className='hero-timer'>
                <div className='hero-timer-label'>
                  <Swords size={14} />
                  {highlight.type === "countdown" ? "距离" : "已开始"} ·{" "}
                  {highlight.title}
                </div>
                <Units
                  parts={
                    highlight.type === "countdown" &&
                    now < new Date(highlight.date).getTime()
                      ? diffParts(now, new Date(highlight.date).getTime())
                      : diffParts(new Date(highlight.date).getTime(), now)
                  }
                />
                {highlight.note && (
                  <p className='hero-timer-note'>{highlight.note}</p>
                )}
              </div>
            )}
          </div>

          <figure className='hero-art'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src='/city.png' alt='3760 主城' />
          </figure>
        </div>
      </section>

      <section className='section' id='events'>
        <div className='shell'>
          <div className='section-heading'>
            <h2>事件计时</h2>
          </div>
          <div className='events-grid'>
            {data.events.map((event) => (
              <EventTimer event={event} now={now} key={event.id} />
            ))}
          </div>
        </div>
      </section>

      <GameCalendar />

      <section className='section' id='album'>
        <div className='shell'>
          <div className='section-heading'>
            <h2>3760 相册</h2>
          </div>
          {photos.length > 0 ? (
            <div className='album-grid'>
              {photos.map((photo) => (
                <figure className='album-item' key={photo.key}>
                  <button
                    type='button'
                    className='album-item-button'
                    onClick={() => setSelected(photo)}
                    aria-label={`查看大图：${photo.name || "3760 相册"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/photos?key=${encodeURIComponent(photo.key)}`}
                      alt={photo.name || "3760 相册"}
                      loading='lazy'
                    />
                  </button>
                </figure>
              ))}
            </div>
          ) : (
            <p className='section-empty'>
              <Camera size={15} /> 相册筹备中，敬请期待。
            </p>
          )}
        </div>
      </section>

      <section className='section' id='transfer'>
        <div className='shell'>
          <div className='section-heading'>
            <h2>移民分组</h2>
          </div>
          <div className='transfer-grid'>
            <div className='transfer-card'>
              <span>当前分组</span>
              <strong>第 {data.migration.group} 组</strong>
            </div>
            <div className='transfer-card'>
              <span>接纳区间</span>
              <strong>
                {data.migration.rangeStart} – {data.migration.rangeEnd}
              </strong>
            </div>
            <div className='transfer-card'>
              <span>实力上限</span>
              <strong>{data.migration.powerCap}</strong>
            </div>
          </div>
          <p className='transfer-note'>
            <Users size={15} />
            我们优先欢迎活跃小团体的加入。
          </p>
        </div>
      </section>

      <section className='section' id='rules'>
        <div className='shell'>
          <div className='section-heading rules-heading'>
            <div>
              <p className='rules-kicker'>STATE 3760 · RULES</p>
              <h2>3760 小榜规范</h2>
            </div>
            <p>公开、可预约、有容错。特殊情况另行通知，活动开始后上限只提高、不降低。</p>
          </div>

          <article className='rules-card rules-board-card'>
            <div className='rules-card-title'>
              <Target size={18} />
              <h3>小榜控分范围</h3>
            </div>
            <div className='rules-board' role='table' aria-label='小榜控分范围'>
              <div className='rules-board-row rules-board-head' role='row'>
                <span role='columnheader'>榜单类型</span>
                <span role='columnheader'>可预约</span>
                <span role='columnheader'>控分线</span>
              </div>
              {minorBoardTypes.map((board) => (
                <div className='rules-board-row' role='row' key={board.name}>
                  <span role='cell'>
                    <strong>{board.name}</strong>
                    {board.note && <small>{board.note}</small>}
                  </span>
                  <span
                    className={board.reservable ? "is-yes" : "is-no"}
                    role='cell'
                    aria-label={board.reservable ? "可预约" : "不可预约"}
                  >
                    {board.reservable ? <Check size={22} /> : <X size={22} />}
                  </span>
                  <span role='cell'>低保 5 倍</span>
                </div>
              ))}
            </div>
          </article>

          <article className='rules-card war-rule-card'>
            <div className='rules-card-title rules-card-title-centered'>
              <Swords size={18} />
              <h3>联盟大作战周特别规则</h3>
            </div>
            <div className='war-outcomes'>
              <div className='war-outcome'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src='/bear_happy.png' alt='开心的小熊' loading='lazy' />
                <div>
                  <span>备战赢</span>
                  <strong>小榜不控榜</strong>
                </div>
              </div>
              <div className='war-outcome'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src='/bear_sad.png' alt='难过的小熊' loading='lazy' />
                <div>
                  <span>备战输</span>
                  <strong>正常控榜</strong>
                </div>
              </div>
            </div>
          </article>

          <div className='rules-detail-grid'>
            <article className='rules-card rules-copy-card'>
              <div className='rules-card-title'>
                <Users size={18} />
                <h3>预约规则</h3>
              </div>
              <ol>
                <li>
                  每期开放 <mark>5 个名额</mark>，上期国战前 20
                  优先，剩余名额向全区开放。
                  <ol type='a'>
                    <li>前 20 默认按国战排名确定顺序，也可自由协商。</li>
                    <li>自由预约按预约时间确定顺序，也可自由协商。</li>
                    <li>
                      每个国战周期，每位备战前 20 <mark>最多预约 2 次</mark>
                      小榜。
                    </li>
                  </ol>
                </li>
                <li>预约成员不受 5 倍限制，但不得抢占他人名次。</li>
              </ol>
            </article>

            <article className='rules-card rules-copy-card'>
              <div className='rules-card-title'>
                <ShieldAlert size={18} />
                <h3>容错规则</h3>
              </div>
              <ol>
                <li>超分比例 =（实际积分 − 规定上限）÷ 规定上限。</li>
                <li>
                  每个国战周期首次非恶意超分 <mark>不超过 10%</mark>
                  ，只提醒登记，不处罚。
                </li>
                <li>
                  新移民首个周期，以及因重叠榜、公告不清造成的轻微超分，可参照容错处理。
                </li>
                <li>
                  <strong>故意利用容错抢榜、卡分的，不适用容错。</strong>
                </li>
              </ol>
            </article>
          </div>

          <article className='rules-card penalty-card'>
            <div className='rules-card-title'>
              <ShieldAlert size={18} />
              <h3>处罚规则</h3>
            </div>
            <div className='penalty-table' role='table' aria-label='超分处罚规则'>
              <div className='penalty-row penalty-head' role='row'>
                <span role='columnheader'>超分量或条件</span>
                <span role='columnheader'>惩罚队数</span>
              </div>
              {penaltyLevels.map((level) => (
                <div className='penalty-row' role='row' key={level.condition}>
                  <span role='cell'>
                    <strong>{level.condition}</strong>
                    {level.note && <small>{level.note}</small>}
                  </span>
                  <strong className='penalty-teams' role='cell'>
                    {level.teams}
                  </strong>
                </div>
              ))}
            </div>
            <p className='penalty-note'>
              惩罚操作：使用最强英雄，带 5:1:4 比例兵种撞榜一。
            </p>
          </article>

          <article className='rules-card appeal-card'>
            <div className='rules-card-title'>
              <ShieldAlert size={18} />
              <h3>处理与申诉</h3>
            </div>
            <ol>
              <li>
                管理组公布积分及处罚等级后，当事人可在 <mark>24 小时</mark>
                内申请复核。
              </li>
              <li>
                无异议或复核完成后，应在 <mark>48 小时</mark>
                内完成处罚；有特殊情况可提前申请延期。
              </li>
              <li>无正当理由且多次提醒后仍拒绝处理的，处罚升级一级。</li>
            </ol>
          </article>
        </div>
      </section>

      <section className='section' id='values'>
        <div className='shell'>
          <div className='section-heading'>
            <h2>3760 区文化</h2>
          </div>
          <div className='values-list'>
            <article>
              <h3>长期主义</h3>
              <p>
                我们更在意半年后还有多少人愿意一起玩，而不是今天多拿一档奖励。
              </p>
            </article>
            <article>
              <h3>国战奖励基金</h3>
              <p>
                车头每期国战备战都集资奖励基金，目前每期都有 2100
                元奖励；除野兽榜以外，地心前 10 车头不参与奖金分配。
              </p>
            </article>
            <article>
              <h3>一起玩才重要</h3>
              <p>
                微信群长期举办集体活动，如王者荣耀等比赛。大家一起玩得开心才是最重要的。
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className='section' id='contact'>
        <div className='shell'>
          <div className='section-heading'>
            <h2>联系 3760 管理</h2>
          </div>
          {data.contacts.length > 0 ? (
            <div className='contact-grid'>
              {data.contacts.map((contact) => (
                <article className='contact-card' key={contact.id}>
                  <h3>{contact.name || "管理"}</h3>
                  <p>
                    <Users size={14} /> 游戏 ID：{contact.gameId || "-"}
                  </p>
                  <p>
                    <MapPin size={14} /> 坐标：{contact.coords || "-"}
                  </p>
                  {(contact.fields ?? [])
                    .filter((field) => field.label.trim() && field.value.trim())
                    .map((field) => (
                      <p key={field.id}>
                        <Link2 size={14} /> {field.label}：
                        {/^https?:\/\//i.test(field.value.trim()) ? (
                          <a
                            href={field.value.trim()}
                            target='_blank'
                            rel='noreferrer'
                          >
                            {field.value.trim()}
                          </a>
                        ) : (
                          field.value
                        )}
                      </p>
                    ))}
                </article>
              ))}
            </div>
          ) : (
            <p className='section-empty'>
              <Users size={15} /> 管理组联系方式暂未公布。
            </p>
          )}
        </div>
      </section>

      <footer>
        <div className='shell'>
          <span>无尽冬日 · 国服 3760 区</span>
          <span>页面内容以游戏内最新公告为准</span>
          <span>© 2026 STATE 3760</span>
        </div>
      </footer>

      {selected && (
        <div
          className='album-lightbox'
          role='dialog'
          aria-modal='true'
          aria-label={selected.name || "3760 相册"}
          onClick={() => setSelected(null)}
        >
          <button
            type='button'
            className='album-lightbox-close'
            onClick={() => setSelected(null)}
            aria-label='关闭'
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/photos?key=${encodeURIComponent(selected.key)}`}
            alt={selected.name || "3760 相册"}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
