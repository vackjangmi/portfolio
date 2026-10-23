import { env } from "cloudflare:workers";

export type LinkRow = {
  id: string;
  slug: string;
  targetUrl: string;
  androidUrl: string | null;
  iosUrl: string | null;
  title: string;
  clickCount: number;
  createdAt: string;
};

type SeedLink = {
  id: string;
  slug: string;
  targetUrl: string;
  androidUrl?: string;
  iosUrl?: string;
  title: string;
};

const seedLinks: SeedLink[] = [
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
  {
    id: "seed-11st-slack",
    slug: "11st-slack",
    targetUrl: "https://slack.com/intl/ko-kr/customer-stories/11st-story",
    title: "연동할수록 편해지는 시스템, 11번가의 Slack 활용법",
  },
  {
    id: "seed-search-nori",
    slug: "search-nori",
    targetUrl: "https://blog.sooyeol.com/2019/12/elasticsearch-nori.html",
    title: "사내 게시판 검색 — Elasticsearch와 Nori, 사용자·유의어 사전",
  },
  {
    id: "seed-app-sudoku",
    slug: "sudoku",
    targetUrl: "https://app.sooyeol.com/apps/sudoku/",
    androidUrl:
      "https://play.google.com/store/apps/details?id=xyz.sooyeol.apps.solidsudoku",
    iosUrl: "https://apps.apple.com/app/id6759184547",
    title: "할만한 스도쿠",
  },
  {
    id: "seed-app-triangle-hopscotch",
    slug: "triangle-hopscotch",
    targetUrl: "https://app.sooyeol.com/apps/triangle-hopscotch/",
    androidUrl:
      "https://play.google.com/store/apps/details?id=xyz.sooyeol.apps.trianglehopscotch",
    iosUrl: "https://apps.apple.com/app/id6759189170",
    title: "할만한 세모 땅따먹기",
  },
  {
    id: "seed-app-memorygame",
    slug: "memorygame",
    targetUrl: "https://app.sooyeol.com/apps/memorygame/",
    androidUrl:
      "https://play.google.com/store/apps/details?id=xyz.sooyeol.apps.memorygame",
    iosUrl: "https://apps.apple.com/app/id6759896288",
    title: "할만한 메모리 게임",
  },
  {
    id: "seed-app-sliding-puzzle",
    slug: "sliding-puzzle",
    targetUrl: "https://app.sooyeol.com/apps/sliding-puzzle/",
    androidUrl:
      "https://play.google.com/store/apps/details?id=xyz.sooyeol.apps.slidingpuzzle",
    iosUrl: "https://apps.apple.com/app/id6760256107",
    title: "할만한 슬라이딩 퍼즐",
  },
  {
    id: "seed-app-scanote",
    slug: "scanote",
    targetUrl: "https://app.sooyeol.com/apps/scanote/",
    androidUrl:
      "https://play.google.com/store/apps/details?id=xyz.sooyeol.apps.scanote",
    iosUrl: "https://apps.apple.com/kr/app/id6759282130",
    title: "쓸만한 스캔노트",
  },
  {
    id: "seed-app-reflex-game",
    slug: "reflex-game",
    targetUrl: "https://app.sooyeol.com/apps/reflex-game/",
    androidUrl:
      "https://play.google.com/store/apps/details?id=xyz.sooyeol.apps.reflexgame",
    iosUrl: "https://apps.apple.com/app/id6763530343",
    title: "할만한 순발력 게임",
  },
  {
    id: "seed-app-tabgroup-browser",
    slug: "tabgroup-browser",
    targetUrl: "https://app.sooyeol.com/apps/tabgroup-browswer/",
    androidUrl:
      "https://play.google.com/store/apps/details?id=xyz.sooyeol.apps.tabgroup.browser",
    iosUrl: "https://apps.apple.com/app/id6763546370",
    title: "쓸만한 탭그룹 브라우저",
  },
];

let storageReady: Promise<void> | undefined;

export function ensureLinksStorage() {
  storageReady ??= initializeLinksStorage().catch((error) => {
    storageReady = undefined;
    throw error;
  });
  return storageReady;
}

async function initializeLinksStorage() {
  const db = getLinksDb();

  await db.batch(
    seedLinks.map((link) =>
      db
        .prepare(
          `INSERT INTO links
             (id, slug, target_url, android_url, ios_url, title)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             slug = excluded.slug,
             target_url = excluded.target_url,
             android_url = excluded.android_url,
             ios_url = excluded.ios_url,
             title = excluded.title`,
        )
        .bind(
          link.id,
          link.slug,
          link.targetUrl,
          link.androidUrl ?? null,
          link.iosUrl ?? null,
          link.title,
        ),
    ),
  );
}

export function getLinksDb() {
  return (env as unknown as { DB: D1Database }).DB;
}
