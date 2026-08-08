"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ShortLink = {
  id: string;
  slug: string;
  targetUrl: string;
  title: string;
  clickCount: number;
  createdAt: string;
};

const publicOrigin = "https://sooyeol.com";

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function CopyIcon() {
  return <span aria-hidden="true">⎘</span>;
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function Home() {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [slug, setSlug] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [copiedSlug, setCopiedSlug] = useState("");

  async function loadLinks() {
    try {
      const response = await fetch("/api/links", { cache: "no-store" });
      if (!response.ok) throw new Error("목록을 불러오지 못했습니다.");
      setLinks((await response.json()) as ShortLink[]);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLinks();
  }, []);

  const filteredLinks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return links;
    return links.filter((link) =>
      [link.slug, link.title, link.targetUrl]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [links, query]);

  async function createLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, targetUrl, title }),
      });
      const result = (await response.json()) as ShortLink & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "주소를 만들지 못했습니다.");

      setLinks((current) => [result, ...current]);
      setSlug("");
      setTargetUrl("");
      setTitle("");
      setMessage(`sooyeol.com/${result.slug} 주소를 만들었습니다.`);
      await copyLink(result.slug);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink(linkSlug: string) {
    await navigator.clipboard.writeText(`${publicOrigin}/${linkSlug}`);
    setCopiedSlug(linkSlug);
    window.setTimeout(() => setCopiedSlug(""), 1800);
  }

  async function deleteLink(link: ShortLink) {
    if (!window.confirm(`sooyeol.com/${link.slug} 주소를 삭제할까요?`)) return;

    const response = await fetch(`/api/links/${encodeURIComponent(link.slug)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setMessage(result.error ?? "주소를 삭제하지 못했습니다.");
      return;
    }
    setLinks((current) => current.filter((item) => item.slug !== link.slug));
    setMessage(`/${link.slug} 주소를 삭제했습니다.`);
  }

  const previewSlug = slug.trim().toLowerCase() || "your-link";

  return (
    <main>
      <nav className="topbar" aria-label="사이트 헤더">
        <a className="brand" href="#top" aria-label="sooyeol.link 홈">
          <span className="brand-mark">s/</span>
          <span>sooyeol.link</span>
        </a>
        <a className="nav-link" href="#links">
          내 링크 <span className="count">{links.length}</span>
        </a>
      </nav>

      <section className="hero" id="top">
        <div className="eyebrow"><span /> PERSONAL LINK ROUTER</div>
        <h1>
          긴 주소는 짧게.
          <br />
          <em>기억은 오래.</em>
        </h1>
        <p className="hero-copy">
          흩어진 글과 영상을 한 번에 꺼내 쓰세요.
          <br />
          복잡한 링크가 단정한 한 줄이 됩니다.
        </p>

        <form className="creator" onSubmit={createLink}>
          <div className="creator-head">
            <span>NEW SHORT LINK</span>
            <span className="live-dot"><i /> READY</span>
          </div>

          <label className="slug-field">
            <span className="sr-only">짧은 경로</span>
            <span className="domain-prefix">sooyeol.com/</span>
            <input
              autoComplete="off"
              inputMode="url"
              maxLength={32}
              onChange={(event) =>
                setSlug(
                  event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "")
                    .replace(/^-+/, ""),
                )
              }
              placeholder="short-name"
              required
              value={slug}
            />
          </label>

          <div className="form-grid">
            <label>
              <span>긴 주소</span>
              <input
                onChange={(event) => setTargetUrl(event.target.value)}
                placeholder="https://..."
                required
                type="url"
                value={targetUrl}
              />
            </label>
            <label>
              <span>이름 <small>선택</small></span>
              <input
                maxLength={100}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="나중에 알아볼 수 있게"
                value={title}
              />
            </label>
          </div>

          <div className="creator-footer">
            <p>
              완성될 주소 <strong>sooyeol.com/{previewSlug}</strong>
            </p>
            <button disabled={submitting} type="submit">
              {submitting ? "만드는 중..." : "짧은 주소 만들기"}
              <ArrowIcon />
            </button>
          </div>
        </form>

        {message && <p className="notice" role="status">{message}</p>}
      </section>

      <section className="links-section" id="links">
        <div className="section-heading">
          <div>
            <p>COLLECTION</p>
            <h2>내 짧은 주소</h2>
          </div>
          <label className="search">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">링크 검색</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="링크 검색"
              type="search"
              value={query}
            />
          </label>
        </div>

        {loading ? (
          <div className="empty-state">주소를 불러오고 있습니다.</div>
        ) : filteredLinks.length === 0 ? (
          <div className="empty-state">
            {query ? "검색한 주소가 없습니다." : "첫 번째 짧은 주소를 만들어 보세요."}
          </div>
        ) : (
          <div className="link-grid">
            {filteredLinks.map((link, index) => (
              <article className="link-card" key={link.id}>
                <div className="card-topline">
                  <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="domain-chip">{domainOf(link.targetUrl)}</span>
                </div>

                <a className="short-link" href={`/${link.slug}`}>
                  <span>sooyeol.com/</span>{link.slug} <ArrowIcon />
                </a>
                <h3>{link.title || domainOf(link.targetUrl)}</h3>
                <p className="target-url">{link.targetUrl}</p>

                <div className="card-footer">
                  <span>{link.clickCount.toLocaleString("ko-KR")}회 방문</span>
                  <div className="card-actions">
                    <button onClick={() => copyLink(link.slug)} type="button">
                      <CopyIcon /> {copiedSlug === link.slug ? "복사됨" : "복사"}
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => deleteLink(link)}
                      type="button"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer>
        <span>sooyeol.link</span>
        <span>LESS URL · MORE MEMORY</span>
      </footer>
    </main>
  );
}
