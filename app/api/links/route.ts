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
              android_url AS androidUrl, ios_url AS iosUrl,
              click_count AS clickCount, created_at AS createdAt
       FROM links
       ORDER BY created_at DESC, slug ASC`,
    )
    .all<LinkRow>();

  return Response.json(result.results);
}

export async function POST(request: Request) {
  await ensureLinksStorage();

  let body: {
    slug?: unknown;
    targetUrl?: unknown;
    androidUrl?: unknown;
    iosUrl?: unknown;
    title?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "입력 내용을 확인해 주세요." }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const targetUrl = typeof body.targetUrl === "string" ? body.targetUrl.trim() : "";
  const androidUrl =
    typeof body.androidUrl === "string" ? body.androidUrl.trim() : "";
  const iosUrl = typeof body.iosUrl === "string" ? body.iosUrl.trim() : "";
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

  const parsedTarget = parseWebUrl(targetUrl);
  if (!parsedTarget) {
    return Response.json(
      { error: "올바른 기본 또는 소개 페이지 주소를 입력해 주세요." },
      { status: 400 },
    );
  }

  const parsedAndroid = androidUrl ? parseWebUrl(androidUrl) : null;
  if (androidUrl && !parsedAndroid) {
    return Response.json(
      { error: "올바른 Google Play 주소를 입력해 주세요." },
      { status: 400 },
    );
  }

  const parsedIos = iosUrl ? parseWebUrl(iosUrl) : null;
  if (iosUrl && !parsedIos) {
    return Response.json(
      { error: "올바른 App Store 주소를 입력해 주세요." },
      { status: 400 },
    );
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
      `INSERT INTO links
         (id, slug, target_url, android_url, ios_url, title)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      slug,
      parsedTarget.toString(),
      parsedAndroid?.toString() ?? null,
      parsedIos?.toString() ?? null,
      title,
    )
    .run();

  const created = await getLinksDb()
    .prepare(
      `SELECT id, slug, target_url AS targetUrl, title,
              android_url AS androidUrl, ios_url AS iosUrl,
              click_count AS clickCount, created_at AS createdAt
       FROM links WHERE id = ?`,
    )
    .bind(id)
    .first<LinkRow>();

  return Response.json(created, { status: 201 });
}

function parseWebUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}
