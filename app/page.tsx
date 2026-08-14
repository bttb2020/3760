"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Camera,
  ChevronRight,
  Crown,
  Gem,
  Link2,
  MapPin,
  ShieldAlert,
  Snowflake,
  Swords,
  Target,
  Users,
  X,
} from "lucide-react";
import SiteHeader from "@/components/site-header";
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
        })}
        {event.note && <em>{event.note}</em>}
      </p>
    </article>
  );
}

const minorRules = [
  "非备战期间，或与备战活动不重叠的军备、士官、野兽、冻土日榜等等小榜，个人积分不得超过保底分的 5 倍。",
  "所有小榜活动中，上期备战排行榜前 20 名成员，优先预约前 5 名，轮流不连拿。名额不满，开放全区预约。",
  "节日榜另行通知。",
];

const penaltyRules = [
  "除 5 名预约成员，超分人员一律进行处罚。自行派 3 队最强兵种满编 514 撞榜一（一盟 4 车）。",
  "超分影响到前五名的撞 5 车（一盟 6 车）。",
  "处罚时间为小榜结束 22 小时内，无特殊情况，在规定时间内没完成处罚将清兵处理。",
  "一个国战周期，每累计超分一次，撞车数 +1。",
];

const resourceRules = [
  "按照国战备战期间联盟积分比例，分配每个月的堡垒要塞首占资格。",
  "国战个人排名前 20 拉满所有堡垒要塞奖励。",
];

function RuleBlock({
  icon: Icon,
  title,
  rules,
}: {
  icon: typeof Target;
  title: string;
  rules: string[];
}) {
  return (
    <article className='rule-block'>
      <h3>
        <Icon size={17} /> {title}
      </h3>
      <ol>
        {rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ol>
    </article>
  );
}

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
      <SiteHeader />
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
          <div className='section-heading'>
            <h2>3760 管理制度</h2>
            <p>把模糊的“惯例”变成所有人都能查阅的共同规则。</p>
          </div>
          <div className='rules-grid'>
            <RuleBlock icon={Target} title='小榜制度' rules={minorRules} />
            <RuleBlock
              icon={ShieldAlert}
              title='处罚规定'
              rules={penaltyRules}
            />
            <RuleBlock icon={Gem} title='资源分配' rules={resourceRules} />
            <article className='rule-block'>
              <h3>
                <Crown size={17} /> 管理特权
              </h3>
              <p className='rule-plain'>管理无任何特权。</p>
            </article>
          </div>
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
