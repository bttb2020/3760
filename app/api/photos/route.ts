import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

const LIST_KEY = "photos";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

type PhotoEntry = { key: string; name: string };

function isAuthorized(request: Request): boolean {
  const password = env.ADMIN_PASSWORD;
  if (!password) return false;
  return request.headers.get("authorization") === `Bearer ${password}`;
}

async function readList(): Promise<PhotoEntry[]> {
  return (await env.SITE_DATA.get<PhotoEntry[]>(LIST_KEY, "json")) ?? [];
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");

  if (key) {
    const object = await env.PHOTOS.get(key);
    if (!object) return new Response("Not Found", { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    return new Response(object.body, { headers });
  }

  return Response.json(await readList());
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "密码错误或未授权" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return Response.json({ error: "只支持图片文件" }, { status: 400 });
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_SIZE) {
    return Response.json({ error: "图片不能超过 10MB" }, { status: 400 });
  }

  const name = new URL(request.url).searchParams.get("name") ?? "photo";
  const ext = contentType.split("/")[1]?.split(";")[0] ?? "bin";
  const key = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  await env.PHOTOS.put(key, request.body, {
    httpMetadata: { contentType },
  });

  const list = await readList();
  list.push({ key, name });
  await env.SITE_DATA.put(LIST_KEY, JSON.stringify(list));

  return Response.json(list);
}

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "密码错误或未授权" }, { status: 401 });
  }

  const key = new URL(request.url).searchParams.get("key");
  if (!key) return Response.json({ error: "缺少 key" }, { status: 400 });

  await env.PHOTOS.delete(key);
  const list = (await readList()).filter((photo) => photo.key !== key);
  await env.SITE_DATA.put(LIST_KEY, JSON.stringify(list));

  return Response.json(list);
}
