import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(new URL(pathname, "http://localhost/"), {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the public short URL directory", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>sooyeol\.com — 짧은 주소 목록<\/title>/i);
  assert.match(html, /sooyeol\.com/);
  assert.match(html, /주소를 불러오고 있습니다/);
  assert.doesNotMatch(html, /필요한 링크를|CURATED BY SOOYEOL|ACTIVE LINKS/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/i);
});

test("keeps persistence, redirects, and initial links wired", async () => {
  const [page, redirect, linksApi, storage, hosting, staticIndex] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/[slug]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/links/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/links.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8"),
  ]);

  const admin = await readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
  assert.match(page, /fetch\("\/api\/links"/);
  assert.match(page, /navigator\.clipboard\.writeText/);
  assert.match(admin, /method: "POST"/);
  assert.match(redirect, /Response\.redirect\(link\.targetUrl, 302\)/);
  assert.match(redirect, /Response\.redirect\(link\.androidUrl, 302\)/);
  assert.match(redirect, /Response\.redirect\(link\.iosUrl, 302\)/);
  assert.match(redirect, /navigator\.maxTouchPoints/);
  assert.match(redirect, /"triangle-hopscotch": "triangle"/);
  assert.match(redirect, /"tabgroup-browser": "browser"/);
  assert.match(redirect, /export async function HEAD/);
  assert.match(linksApi, /slugPattern/);
  assert.match(linksApi, /android_url AS androidUrl/);
  assert.match(storage, /"eba-video"/);
  assert.match(storage, /"event-message"/);
  assert.match(storage, /"jpa-jsonb"/);
  for (const slug of [
    "sudoku",
    "triangle",
    "memory",
    "puzzle",
    "scanote",
    "reflex",
    "browser",
  ]) {
    assert.match(storage, new RegExp(`slug: "${slug}"`));
  }
  assert.match(staticIndex, /href="\/eba-video"/);
  assert.match(staticIndex, /href="\/event-message"/);
  assert.match(staticIndex, /href="\/jpa-jsonb"/);
  assert.match(staticIndex, /data-copy="\/eba"/);
  assert.match(staticIndex, /navigator\.clipboard\.writeText/);
  const hostingConfig = JSON.parse(hosting);
  assert.equal(hostingConfig.d1, "DB");
  assert.equal(hostingConfig.r2, null);
  assert.match(hostingConfig.project_id, /^appgprj_/);

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await assert.rejects(access(new URL("../public/og.png", import.meta.url)));
});

test("routes all seven static app links by device", async () => {
  const apps = [
    ["sudoku", [], "xyz.sooyeol.apps.solidsudoku", "6759184547", "sudoku"],
    ["triangle", ["triangle-hopscotch"], "xyz.sooyeol.apps.trianglehopscotch", "6759189170", "triangle-hopscotch"],
    ["memory", ["memorygame"], "xyz.sooyeol.apps.memorygame", "6759896288", "memorygame"],
    ["puzzle", ["sliding-puzzle"], "xyz.sooyeol.apps.slidingpuzzle", "6760256107", "sliding-puzzle"],
    ["scanote", [], "xyz.sooyeol.apps.scanote", "6759282130", "scanote"],
    ["reflex", ["reflex-game"], "xyz.sooyeol.apps.reflexgame", "6763530343", "reflex-game"],
    ["browser", ["tabgroup-browser"], "xyz.sooyeol.apps.tabgroup.browser", "6763546370", "tabgroup-browswer"],
  ];
  const home = await readFile(new URL("../index.html", import.meta.url), "utf8");

  for (const [slug, legacySlugs, packageId, appStoreId, introductionSlug] of apps) {
    for (const routeSlug of [slug, ...legacySlugs]) {
      const html = await readFile(
        new URL(`../${routeSlug}/index.html`, import.meta.url),
        "utf8",
      );
      const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
      assert.ok(script, `${routeSlug} redirect script should exist`);

      assert.equal(
        redirectFrom(script, {
          userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9)",
          platform: "Linux armv8l",
          maxTouchPoints: 5,
        }),
        `https://play.google.com/store/apps/details?id=${packageId}`,
      );
      assert.match(
        redirectFrom(script, {
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X)",
          platform: "iPhone",
          maxTouchPoints: 5,
        }),
        new RegExp(`apps\\.apple\\.com/(?:kr/)?app/id${appStoreId}$`),
      );
      assert.equal(
        redirectFrom(script, {
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          platform: "Win32",
          maxTouchPoints: 0,
        }),
        `https://app.sooyeol.com/apps/${introductionSlug}/`,
      );
    }
    assert.match(home, new RegExp(`href="/${slug}"`));
    assert.match(home, new RegExp(`data-copy="/${slug}"`));
  }
});

function redirectFrom(script, navigator) {
  let redirectedTo;
  runInNewContext(script, {
    navigator,
    location: {
      replace(target) {
        redirectedTo = target;
      },
    },
  });
  return redirectedTo;
}
