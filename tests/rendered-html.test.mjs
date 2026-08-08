import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

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
  assert.match(html, /필요한 링크를/);
  assert.match(html, /짧게, 바로/);
  assert.match(html, /sooyeol\.com/);
  assert.match(html, /짧은 주소 목록/);
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
  assert.match(admin, /method: "POST"/);
  assert.match(redirect, /Response\.redirect\(link\.targetUrl, 302\)/);
  assert.match(redirect, /export async function HEAD/);
  assert.match(linksApi, /slugPattern/);
  assert.match(storage, /"eba-video"/);
  assert.match(storage, /"event-message"/);
  assert.match(storage, /"jpa-jsonb"/);
  assert.match(staticIndex, /href="\/eba-video"/);
  assert.match(staticIndex, /href="\/event-message"/);
  assert.match(staticIndex, /href="\/jpa-jsonb"/);
  const hostingConfig = JSON.parse(hosting);
  assert.equal(hostingConfig.d1, "DB");
  assert.equal(hostingConfig.r2, null);
  assert.match(hostingConfig.project_id, /^appgprj_/);

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await assert.rejects(access(new URL("../public/og.png", import.meta.url)));
});
