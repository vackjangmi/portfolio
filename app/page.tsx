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

  return (
    <main className="public-directory">
      <nav className="topbar" aria-label="사이트 헤더">
        <a className="brand" href="#top" aria-label="sooyeol.com 홈">
          <span className="brand-mark">s/</span>
          <span>sooyeol.com</span>
        </a>
        <span className="directory-label">SHORT LINK DIRECTORY</span>
      </nav>

      <section className="hero public-hero" id="top">
        <div className="eyebrow"><span /> CURATED BY SOOYEOL</div>
        <h1>
          필요한 링크를
          <br />
          <em>짧게, 바로.</em>
        </h1>
        <div className="public-intro">
          <p className="hero-copy">
            글과 영상으로 바로 가는 짧은 입구입니다.
            <br />
            주소를 누르면 원문으로 이동합니다.
          </p>
          <div className="link-total">
            <strong>{String(links.length).padStart(2, "0")}</strong>
            <span>ACTIVE LINKS</span>
          </div>
        </div>
      </section>

      <section className="links-section public-links" id="links">
        <div className="section-heading">
          <div>
            <p>DIRECTORY</p>
            <h2>짧은 주소 목록</h2>
          </div>
          <span className="section-note">클릭하면 원문으로 이동합니다 ↗</span>
        </div>

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
                  <a href={`/${link.slug}`}>원문 열기 ↗</a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer>
        <span>sooyeol.com</span>
        <span>SHORT LINKS · LONG MEMORY</span>
      </footer>
    </main>
  );
}
