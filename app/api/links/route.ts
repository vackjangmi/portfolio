import { ensureLinksStorage, getLinksDb, type LinkRow } from "../../../db/links";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const reservedSlugs = new Set([
  "api",
  "callback",
  "signin-with-chatgpt",
  "signout-with-chatgpt",
]);

export async function GET() {
  await ensureLinksStorage();
  const result = await getLinksDb()
    .prepare(
      `SELECT id, slug, target_url AS targetUrl, title,
              click_count AS clickCount, created_at AS createdAt
       FROM links
       ORDER BY created_at DESC, slug ASC`,
    )
    .all<LinkRow>();

  return Response.json(result.results);
}

export async function POST(request: Request) {
  await ensureLinksStorage();

  let body: { slug?: unknown; targetUrl?: unknown; title?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "입력 내용을 확인해 주세요." }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const targetUrl = typeof body.targetUrl === "string" ? body.targetUrl.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 100) : "";

  if (slug.length < 2 || slug.length > 32 || !slugPattern.test(slug)) {
    return Response.json(
      { error: "짧은 이름은 영문 소문자, 숫자, 하이픈으로 2~32자까지 입력해 주세요." },
      { status: 400 },
    );
  }

  if (reservedSlugs.has(slug)) {
    return Response.json({ error: "사용할 수 없는 이름입니다." }, { status: 400 });
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(targetUrl);
  } catch {
    return Response.json({ error: "올바른 웹 주소를 입력해 주세요." }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(parsedTarget.protocol)) {
    return Response.json({ error: "http 또는 https 주소만 사용할 수 있습니다." }, { status: 400 });
  }

  const existing = await getLinksDb()
    .prepare("SELECT slug FROM links WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first();
  if (existing) {
    return Response.json({ error: `/${slug} 주소는 이미 사용 중입니다.` }, { status: 409 });
  }

  const id = crypto.randomUUID();
  await getLinksDb()
    .prepare(
      "INSERT INTO links (id, slug, target_url, title) VALUES (?, ?, ?, ?)",
    )
    .bind(id, slug, parsedTarget.toString(), title)
    .run();

  const created = await getLinksDb()
    .prepare(
      `SELECT id, slug, target_url AS targetUrl, title,
              click_count AS clickCount, created_at AS createdAt
       FROM links WHERE id = ?`,
    )
    .bind(id)
    .first<LinkRow>();

  return Response.json(created, { status: 201 });
}
