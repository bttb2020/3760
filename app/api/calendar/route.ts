import { env } from "cloudflare:workers";
import {
  DEFAULT_CALENDAR_DATA,
  normalizeCalendarData,
  type CalendarData,
} from "@/lib/calendar-data";

export const dynamic = "force-dynamic";

const KEY = "calendar-data";

function isAuthorized(request: Request): boolean {
  const password = env.ADMIN_PASSWORD;
  if (!password) return false;
  return request.headers.get("authorization") === `Bearer ${password}`;
}

export async function GET(request: Request) {
  const stored = await env.SITE_DATA.get<CalendarData>(KEY, "json");
  const data = stored ? normalizeCalendarData(stored) : DEFAULT_CALENDAR_DATA;
  return Response.json({ ...data, authenticated: isAuthorized(request) });
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "密码错误或未授权" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "请求体不是有效 JSON" }, { status: 400 });
  }

  const data = normalizeCalendarData(raw);
  await env.SITE_DATA.put(KEY, JSON.stringify(data));
  return Response.json({ ok: true });
}
