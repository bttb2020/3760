"use client";

import { useEffect, useRef, useState } from "react";
import type { Contact, ContactField, SiteData, SiteEvent } from "@/lib/site-data";
import { DEFAULT_CALENDAR_DATA, type CalendarData } from "@/lib/calendar-data";

const STORAGE_KEY = "3760-admin-password";

type Photo = { key: string; name: string };

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

const emptyEvent = (): SiteEvent => ({
  id: `event-${Date.now()}`,
  title: "",
  date: new Date().toISOString(),
  type: "countdown",
  note: "",
  highlight: false,
});

const emptyContact = (): Contact => ({
  id: `contact-${Date.now()}`,
  name: "",
  gameId: "",
  coords: "",
  fields: [],
});

const emptyField = (): ContactField => ({
  id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: "",
  value: "",
});

export default function ManagementPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<SiteData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [calendarText, setCalendarText] = useState("");
  const [calendarStatus, setCalendarStatus] = useState("");
  const [calendarSaving, setCalendarSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPhotos = async () => {
    const res = await fetch("/api/photos", { cache: "no-store" });
    const json = await res.json();
    if (Array.isArray(json)) setPhotos(json);
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    setStatus("");
    const res = await fetch(`/api/photos?name=${encodeURIComponent(file.name)}`, {
      method: "POST",
      headers: {
        "content-type": file.type,
        authorization: `Bearer ${password}`,
      },
      body: file,
    });
    setUploading(false);
    if (res.ok) {
      setPhotos(await res.json());
      setStatus("图片已上传");
    } else {
      const json = await res.json().catch(() => null);
      setStatus(json?.error ?? "上传失败，请重试");
    }
  };

  const deletePhoto = async (key: string) => {
    const res = await fetch(`/api/photos?key=${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${password}` },
    });
    if (res.ok) setPhotos(await res.json());
  };

  const load = async (pwd: string) => {
    const res = await fetch("/api/site-data", {
      headers: { authorization: `Bearer ${pwd}` },
      cache: "no-store",
    });
    const json = await res.json();
    if (json.authenticated) {
      setAuthed(true);
      const { authenticated: _ignored, ...siteData } = json;
      setData({ contacts: [], ...siteData } as SiteData);
      window.localStorage.setItem(STORAGE_KEY, pwd);
      setStatus("");
      void loadPhotos();
      void loadCalendar(pwd);
    } else {
      setAuthed(false);
      setStatus("密码错误");
    }
  };

  const loadCalendar = async (pwd: string) => {
    try {
      const res = await fetch("/api/calendar", {
        headers: { authorization: `Bearer ${pwd}` },
        cache: "no-store",
      });
      const json = await res.json();
      setCalendarText(JSON.stringify(json, null, 2));
    } catch {
      setCalendarText("");
    }
  };

  const saveCalendar = async () => {
    let parsed: CalendarData;
    try {
      parsed = JSON.parse(calendarText) as CalendarData;
    } catch {
      setCalendarStatus("JSON 格式错误，请检查后重试");
      return;
    }
    setCalendarSaving(true);
    setCalendarStatus("");
    const res = await fetch("/api/calendar", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${password}`,
      },
      body: JSON.stringify(parsed),
    });
    setCalendarSaving(false);
    if (res.ok) {
      setCalendarText(JSON.stringify(parsed, null, 2));
      setCalendarStatus("日历数据已保存，即刻生效");
    } else {
      const json = await res.json().catch(() => null);
      setCalendarStatus(json?.error ?? "保存失败，请重试");
    }
  };

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setPassword(saved);
      void load(saved);
    }
  }, []);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setStatus("");
    const res = await fetch("/api/site-data", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${password}`,
      },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setStatus(res.ok ? "已保存，首页即刻生效" : "保存失败，请重试");
  };

  const updateEvent = (id: string, patch: Partial<SiteEvent>) => {
    if (!data) return;
    setData({
      ...data,
      events: data.events.map((event) => {
        if (event.id !== id) return event;
        const next = { ...event, ...patch };
        if (patch.highlight) return next;
        return next;
      }),
    });
  };

  const setHighlight = (id: string) => {
    if (!data) return;
    setData({
      ...data,
      events: data.events.map((event) => ({ ...event, highlight: event.id === id })),
    });
  };

  const updateContact = (id: string, patch: Partial<Contact>) => {
    if (!data) return;
    setData({
      ...data,
      contacts: data.contacts.map((contact) =>
        contact.id === id ? { ...contact, ...patch } : contact,
      ),
    });
  };

  const updateField = (
    contactId: string,
    fieldId: string,
    patch: Partial<ContactField>,
  ) => {
    if (!data) return;
    setData({
      ...data,
      contacts: data.contacts.map((contact) =>
        contact.id === contactId
          ? {
              ...contact,
              fields: (contact.fields ?? []).map((field) =>
                field.id === fieldId ? { ...field, ...patch } : field,
              ),
            }
          : contact,
      ),
    });
  };

  if (!authed) {
    return (
      <main className="admin-shell">
        <form
          className="admin-login"
          onSubmit={(e) => {
            e.preventDefault();
            void load(password);
          }}
        >
          <span className="brand-mark">3760</span>
          <h1>内容管理</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理密码"
            autoFocus
          />
          <button type="submit">进入</button>
          {status && <p className="admin-status is-error">{status}</p>}
          <a href="/">返回首页</a>
        </form>
      </main>
    );
  }

  if (!data) {
    return <main className="admin-shell"><p className="admin-status">加载中…</p></main>;
  }

  return (
    <main className="admin-shell">
      <div className="admin-panel">
        <header className="admin-header">
          <h1>3760 内容管理</h1>
          <div>
            <a href="/">查看首页</a>
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem(STORAGE_KEY);
                setAuthed(false);
                setData(null);
              }}
            >
              退出
            </button>
          </div>
        </header>

        <section className="admin-section">
          <h2>王国进程</h2>
          <label>
            开区时间
            <input
              type="datetime-local"
              value={toLocalInput(data.openDate)}
              onChange={(e) => setData({ ...data, openDate: fromLocalInput(e.target.value) })}
            />
          </label>
          <label>
            王国统治力
            <input
              type="text"
              value={data.dominance}
              onChange={(e) => setData({ ...data, dominance: e.target.value })}
              placeholder="例如：12.6 亿"
            />
          </label>
        </section>

        <section className="admin-section">
          <h2>移民分组</h2>
          <div className="admin-grid">
            <label>
              当前分组
              <input
                type="text"
                value={data.migration.group}
                onChange={(e) => setData({ ...data, migration: { ...data.migration, group: e.target.value } })}
              />
            </label>
            <label>
              实力上限
              <input
                type="text"
                value={data.migration.powerCap}
                onChange={(e) => setData({ ...data, migration: { ...data.migration, powerCap: e.target.value } })}
              />
            </label>
            <label>
              接纳区间（从）
              <input
                type="text"
                value={data.migration.rangeStart}
                onChange={(e) => setData({ ...data, migration: { ...data.migration, rangeStart: e.target.value } })}
              />
            </label>
            <label>
              接纳区间（到）
              <input
                type="text"
                value={data.migration.rangeEnd}
                onChange={(e) => setData({ ...data, migration: { ...data.migration, rangeEnd: e.target.value } })}
              />
            </label>
          </div>
        </section>

        <section className="admin-section">
          <h2>事件计时</h2>
          {data.events.map((event) => (
            <div className="admin-event" key={event.id}>
              <div className="admin-event-row">
                <input
                  type="text"
                  value={event.title}
                  placeholder="事件名称，如：5 代英雄"
                  onChange={(e) => updateEvent(event.id, { title: e.target.value })}
                />
                <select
                  value={event.type}
                  onChange={(e) => updateEvent(event.id, { type: e.target.value as SiteEvent["type"] })}
                >
                  <option value="countdown">倒计时</option>
                  <option value="countup">正计时</option>
                </select>
                <button
                  type="button"
                  className={event.highlight ? "is-highlight" : ""}
                  title="设为首页重点事件"
                  onClick={() => setHighlight(event.id)}
                >
                  重点
                </button>
                <button
                  type="button"
                  onClick={() => setData({ ...data, events: data.events.filter((e) => e.id !== event.id) })}
                >
                  删除
                </button>
              </div>
              <div className="admin-event-row">
                <input
                  type="datetime-local"
                  value={toLocalInput(event.date)}
                  onChange={(e) => updateEvent(event.id, { date: fromLocalInput(e.target.value) })}
                />
                <input
                  type="text"
                  value={event.note}
                  placeholder="备注（可选）"
                  onChange={(e) => updateEvent(event.id, { note: e.target.value })}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="admin-add"
            onClick={() => setData({ ...data, events: [...data.events, emptyEvent()] })}
          >
            + 添加事件
          </button>
        </section>

        <section className="admin-section">
          <h2>3760 相册</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadPhoto(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="admin-add"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "上传中…" : "+ 上传图片（≤ 10MB）"}
          </button>
          {photos.length > 0 && (
            <div className="admin-photos">
              {photos.map((photo) => (
                <figure key={photo.key}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/photos?key=${encodeURIComponent(photo.key)}`}
                    alt={photo.name || "相册图片"}
                  />
                  <button type="button" onClick={() => void deletePhoto(photo.key)}>
                    删除
                  </button>
                </figure>
              ))}
            </div>
          )}
        </section>

        <section className="admin-section">
          <h2>联系管理</h2>
          {data.contacts.map((contact) => (
            <div className="admin-event" key={contact.id}>
              <div className="admin-event-row admin-contact-row">
                <input
                  type="text"
                  value={contact.name}
                  placeholder="人名，如：老白"
                  onChange={(e) => updateContact(contact.id, { name: e.target.value })}
                />
                <input
                  type="text"
                  value={contact.gameId}
                  placeholder="游戏 ID"
                  onChange={(e) => updateContact(contact.id, { gameId: e.target.value })}
                />
                <input
                  type="text"
                  value={contact.coords}
                  placeholder="坐标，如：X:512 Y:388"
                  onChange={(e) => updateContact(contact.id, { coords: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() =>
                    setData({ ...data, contacts: data.contacts.filter((c) => c.id !== contact.id) })
                  }
                >
                  删除
                </button>
              </div>
              {(contact.fields ?? []).map((field) => (
                <div className="admin-field-row" key={field.id}>
                  <input
                    type="text"
                    value={field.label}
                    placeholder="字段名，如：微信、抖音"
                    onChange={(e) =>
                      updateField(contact.id, field.id, { label: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    value={field.value}
                    placeholder="内容，如：微信号或 https:// 链接"
                    onChange={(e) =>
                      updateField(contact.id, field.id, { value: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateContact(contact.id, {
                        fields: (contact.fields ?? []).filter((f) => f.id !== field.id),
                      })
                    }
                  >
                    删除
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="admin-add-field"
                onClick={() =>
                  updateContact(contact.id, {
                    fields: [...(contact.fields ?? []), emptyField()],
                  })
                }
              >
                + 添加自定义字段
              </button>
            </div>
          ))}
          <button
            type="button"
            className="admin-add"
            onClick={() => setData({ ...data, contacts: [...data.contacts, emptyContact()] })}
          >
            + 添加管理成员
          </button>
          <p className="admin-hint">联系人随「保存全部修改」一并生效；图片上传后立即生效。</p>
        </section>

        <section className="admin-section">
          <h2>游戏日历数据</h2>
          <p className="admin-hint">
            以 JSON 编辑 /calendar 页的礼包与活动日程（UTC）。保存后日历页即刻生效。
          </p>
          <textarea
            className="admin-calendar-json"
            value={calendarText}
            spellCheck={false}
            onChange={(e) => setCalendarText(e.target.value)}
            placeholder="粘贴日历 JSON…"
          />
          <div className="admin-calendar-actions">
            <button
              type="button"
              className="admin-save"
              disabled={calendarSaving}
              onClick={() => void saveCalendar()}
            >
              {calendarSaving ? "保存中…" : "保存日历数据"}
            </button>
            <button
              type="button"
              className="admin-add"
              onClick={() => {
                setCalendarText(JSON.stringify(DEFAULT_CALENDAR_DATA, null, 2));
                setCalendarStatus("已填入默认数据（尚未保存）");
              }}
            >
              恢复默认数据
            </button>
          </div>
          {calendarStatus && <p className="admin-status">{calendarStatus}</p>}
        </section>

        <footer className="admin-footer">
          <button type="button" className="admin-save" disabled={saving} onClick={() => void save()}>
            {saving ? "保存中…" : "保存全部修改"}
          </button>
          {status && <p className="admin-status">{status}</p>}
        </footer>
      </div>
    </main>
  );
}
