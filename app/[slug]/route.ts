import { ensureLinksStorage, getLinksDb } from "../../db/links";

export async function GET(
  request: Request,
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

  if (isAndroid(request) && link.androidUrl) {
    return Response.redirect(link.androidUrl, 302);
  }

  if (isIos(request) && link.iosUrl) {
    return Response.redirect(link.iosUrl, 302);
  }

  // iPadOS can identify itself as macOS. A tiny client-side check keeps
  // desktop Macs on the introduction page while sending touch iPads to iOS.
  if (isMacintosh(request) && link.iosUrl) {
    return ipadAwareRedirect(link.iosUrl, link.targetUrl);
  }

  return Response.redirect(link.targetUrl, 302);
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const link = await findLink(slug);

  if (!link) return new Response(null, { status: 404 });
  return Response.redirect(targetForRequest(request, link), 302);
}

async function findLink(slug: string) {
  await ensureLinksStorage();
  return getLinksDb()
    .prepare(
      `SELECT target_url AS targetUrl,
              android_url AS androidUrl,
              ios_url AS iosUrl
       FROM links WHERE slug = ? LIMIT 1`,
    )
    .bind(slug.toLowerCase())
    .first<{
      targetUrl: string;
      androidUrl: string | null;
      iosUrl: string | null;
    }>();
}

type LinkTarget = NonNullable<Awaited<ReturnType<typeof findLink>>>;

function targetForRequest(request: Request, link: LinkTarget) {
  if (isAndroid(request) && link.androidUrl) return link.androidUrl;
  if (isIos(request) && link.iosUrl) return link.iosUrl;
  return link.targetUrl;
}

function isAndroid(request: Request) {
  const platform = request.headers.get("sec-ch-ua-platform") ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";
  return /android/i.test(`${platform} ${userAgent}`);
}

function isIos(request: Request) {
  const platform = request.headers.get("sec-ch-ua-platform") ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";
  return /ios|iphone|ipad|ipod/i.test(`${platform} ${userAgent}`);
}

function isMacintosh(request: Request) {
  return /macintosh/i.test(request.headers.get("user-agent") ?? "");
}

function ipadAwareRedirect(iosUrl: string, fallbackUrl: string) {
  const safeIosUrl = jsonForScript(iosUrl);
  const safeFallbackUrl = jsonForScript(fallbackUrl);
  const escapedFallbackUrl = escapeHtml(fallbackUrl);

  return new Response(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>앱 페이지로 이동 중</title></head><body><script>const isIPad=navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1;location.replace(isIPad?${safeIosUrl}:${safeFallbackUrl});</script><noscript><p><a href="${escapedFallbackUrl}">앱 소개 페이지로 이동</a></p></noscript></body></html>`,
    {
      headers: {
        "cache-control": "private, no-store",
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}

function jsonForScript(value: string) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
