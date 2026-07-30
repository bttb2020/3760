import { env } from "cloudflare:workers";
import { DEFAULT_SITE_DATA, type SiteData } from "@/lib/site-data";

export const dynamic = "force-dynamic";

const KEY = "site-data";

function isAuthorized(request: Request): boolean {
  const password = env.ADMIN_PASSWORD;
  if (!password) return false;
  return request.headers.get("authorization") === `Bearer ${password}`;
}

export async function GET(request: Request) {
  const stored = await env.SITE_DATA.get<SiteData>(KEY, "json");
  const data = stored ?? DEFAULT_SITE_DATA;
  return Response.json({ ...data, authenticated: isAuthorized(request) });
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "密码错误或未授权" }, { status: 401 });
  }

  let data: SiteData;
  try {
    data = (await request.json()) as SiteData;
  } catch {
    return Response.json({ error: "请求体不是有效 JSON" }, { status: 400 });
  }

  if (
    typeof data.openDate !== "string" ||
    typeof data.dominance !== "string" ||
    !Array.isArray(data.events) ||
    typeof data.migration?.group !== "string"
  ) {
    return Response.json({ error: "数据格式不正确" }, { status: 400 });
  }

  data.events = data.events.map((event, index) => ({
    id: typeof event.id === "string" && event.id ? event.id : `event-${index}`,
    title: String(event.title ?? ""),
    date: String(event.date ?? ""),
    type: event.type === "countup" ? "countup" : "countdown",
    note: String(event.note ?? ""),
    highlight: Boolean(event.highlight),
  }));

  data.contacts = (Array.isArray(data.contacts) ? data.contacts : []).map(
    (contact, index) => ({
      id: typeof contact.id === "string" && contact.id ? contact.id : `contact-${index}`,
      name: String(contact.name ?? ""),
      gameId: String(contact.gameId ?? ""),
      coords: String(contact.coords ?? ""),
      fields: (Array.isArray(contact.fields) ? contact.fields : [])
        .map((field, fieldIndex) => ({
          id:
            typeof field.id === "string" && field.id
              ? field.id
              : `field-${index}-${fieldIndex}`,
          label: String(field.label ?? "").trim(),
          value: String(field.value ?? "").trim(),
        }))
        .filter((field) => field.label && field.value),
    }),
  );

  await env.SITE_DATA.put(KEY, JSON.stringify(data));
  return Response.json({ ok: true });
}
