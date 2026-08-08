"use client";

import { useEffect, useState } from "react";

type ShortLink = {
  id: string;
  slug: string;
  targetUrl: string;
  title: string;
  clickCount: number;
  createdAt: string;
};

const publicOrigin = "https://sooyeol.com";

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function Home() {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedSlug, setCopiedSlug] = useState("");

  useEffect(() => {
    fetch("/api/links", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("목록을 불러오지 못했습니다.");
        return (await response.json()) as ShortLink[];
      })
      .then(setLinks)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "잠시 후 다시 시도해 주세요."),
      )
      .finally(() => setLoading(false));
  }, []);

  async function copyLink(slug: string) {
    await navigator.clipboard.writeText(`${publicOrigin}/${slug}`);
    setCopiedSlug(slug);
    window.setTimeout(() => setCopiedSlug(""), 1800);
  }

  return (
    <main className="bare-directory">
      <section className="links-section bare-links" aria-label="짧은 주소 목록">
        {loading ? (
          <div className="empty-state">주소를 불러오고 있습니다.</div>
        ) : error ? (
          <div className="empty-state">{error}</div>
        ) : (
          <div className="link-grid">
            {links.map((link, index) => (
              <article className="link-card public-link-card" key={link.id}>
                <div className="card-topline">
                  <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="domain-chip">{domainOf(link.targetUrl)}</span>
                </div>
                <a className="short-link" href={`/${link.slug}`}>
                  <span>sooyeol.com/</span>{link.slug} <span aria-hidden="true">↗</span>
                </a>
                <h3>{link.title || domainOf(link.targetUrl)}</h3>
                <div className="card-footer public-card-footer">
                  <span>{link.clickCount.toLocaleString("ko-KR")}회 방문</span>
                  <div className="public-card-actions">
                    <button
                      className={copiedSlug === link.slug ? "is-copied" : ""}
                      onClick={() => copyLink(link.slug)}
                      type="button"
                    >
                      {copiedSlug === link.slug ? "복사됨 ✓" : "URL 복사"}
                    </button>
                    <a href={`/${link.slug}`}>원문 열기 ↗</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
