import { env } from "cloudflare:workers";

export type LinkRow = {
  id: string;
  slug: string;
  targetUrl: string;
  title: string;
  clickCount: number;
  createdAt: string;
};

const seedLinks = [
  {
    id: "seed-modernize",
    slug: "eba-video",
    targetUrl: "https://www.youtube.com/watch?v=uklmgeERMBk",
    title: "영업관리 시스템과 조직 문화 모더나이제이션 여정",
  },
  {
    id: "seed-eba",
    slug: "eba",
    targetUrl:
      "https://techblog.jobkorea.co.kr/aws-eba%EB%A5%BC-%ED%86%B5%ED%95%9C-%EC%98%81%EC%97%85%EA%B4%80%EB%A6%AC%EC%8B%9C%EC%8A%A4%ED%85%9C-%EB%AA%A8%EB%8D%94%EB%82%98%EC%9D%B4%EC%A0%9C%EC%9D%B4%EC%85%98%EC%9D%98-%EC%8B%9C%EC%9E%91-cf33f504eeb2",
    title: "AWS EBA를 통한 영업관리시스템 모더나이제이션의 시작",
  },
  {
    id: "seed-messaging",
    slug: "event-message",
    targetUrl:
      "https://techblog.jobkorea.co.kr/jobkorea-x-albamon-ee20bc06a2a5",
    title: "이벤트 메시징 플랫폼 비교 — SQS / SNS / Kafka",
  },
  {
    id: "seed-jsonb",
    slug: "jpa-jsonb",
    targetUrl:
      "https://techblog.jobkorea.co.kr/springboot-jpa%ec%97%90%ec%84%9c-postgresql-json-%ec%bb%ac%eb%9f%bc-%ec%82%ac%ec%9a%a9%ed%95%98%ea%b8%b0-feat-jpa-polymorphism-e2a121eca1b2",
    title: "SpringBoot JPA에서 PostgreSQL JSONB 컬럼 사용하기",
  },
  {
    id: "seed-ai-sprint",
    slug: "ai-sprint",
    targetUrl: "https://blog.sooyeol.com/2026/03/ai-codning-assistant.html",
    title: "AI Coding Assistant를 실제 업무와 스프린트에 적용하기",
  },
  {
    id: "seed-ai-app",
    slug: "ai-app",
    targetUrl: "https://blog.sooyeol.com/2026/03/opencode.html",
    title: "AI Agent와 함께 앱을 기획하고 출시한 회고",
  },
] as const;

export async function ensureLinksStorage() {
  const db = getLinksDb();

  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS links (
        id TEXT PRIMARY KEY NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        target_url TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        click_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_links_slug ON links (slug)",
    ),
  ]);

  await db.batch(
    seedLinks.map((link) =>
      db
        .prepare(
          `INSERT INTO links (id, slug, target_url, title)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             slug = excluded.slug,
             target_url = excluded.target_url,
             title = excluded.title`,
        )
        .bind(link.id, link.slug, link.targetUrl, link.title),
    ),
  );
}

export function getLinksDb() {
  return (env as unknown as { DB: D1Database }).DB;
}
