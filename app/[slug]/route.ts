import { ensureLinksStorage, getLinksDb } from "../../db/links";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const link = await findLink(slug);

  if (!link) {
    return new Response(
      `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>주소를 찾을 수 없습니다</title><style>body{background:#f3f0e8;color:#151512;font-family:system-ui,sans-serif;display:grid;min-height:100vh;place-items:center;margin:0}.box{max-width:520px;padding:32px;text-align:center}strong{color:#ff5d36;font-size:80px;letter-spacing:-.07em}h1{font-size:28px}p{color:#737067;line-height:1.7}a{background:#151512;border-radius:999px;color:#dfff4f;display:inline-block;margin-top:16px;padding:14px 22px;text-decoration:none}</style></head><body><main class="box"><strong>404</strong><h1>/${escapeHtml(slug)} 주소가 없어요.</h1><p>경로를 다시 확인하거나 짧은 주소 목록으로 돌아가 주세요.</p><a href="/">주소 목록 보기</a></main></body></html>`,
      { status: 404, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }

  await getLinksDb()
    .prepare("UPDATE links SET click_count = click_count + 1 WHERE slug = ?")
    .bind(slug.toLowerCase())
    .run();

  return Response.redirect(link.targetUrl, 302);
}

export async function HEAD(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const link = await findLink(slug);

  if (!link) return new Response(null, { status: 404 });
  return Response.redirect(link.targetUrl, 302);
}

async function findLink(slug: string) {
  await ensureLinksStorage();
  return getLinksDb()
    .prepare("SELECT target_url AS targetUrl FROM links WHERE slug = ? LIMIT 1")
    .bind(slug.toLowerCase())
    .first<{ targetUrl: string }>();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
