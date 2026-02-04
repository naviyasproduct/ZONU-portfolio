"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
// Data loads via server API route to avoid client Firestore permission issues.

function toDateLabel(ts) {
  if (!ts) return '';
  try {
    const d = ts?.toDate
      ? ts.toDate()
      : typeof ts === 'string' || typeof ts === 'number'
        ? new Date(ts)
        : ts && typeof ts === 'object' && typeof ts.seconds === 'number'
          ? new Date(ts.seconds * 1000)
          : ts instanceof Date
            ? ts
            : null;
    if (!d) return '';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function toDateMs(ts) {
  if (!ts) return 0;
  try {
    if (ts?.toDate) return ts.toDate().getTime();
    if (typeof ts === 'string' || typeof ts === 'number') return new Date(ts).getTime();
    if (ts && typeof ts === 'object' && typeof ts.seconds === 'number') return ts.seconds * 1000;
    if (ts instanceof Date) return ts.getTime();
  } catch {
    // ignore
  }
  return 0;
}

function normalizeTags(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

export default function ResearchClient() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/research?limit=200', { cache: 'no-store' });
        const json = await res.json();
        if (!mounted) return;

        if (!res.ok || !json?.success) {
          const message = json?.error || 'Failed to load research.';
          setError(message);
          setItems([]);
          return;
        }

        setItems(Array.isArray(json.items) ? json.items : []);
      } catch (err) {
        console.error('[ResearchClient] Error loading research items:', err);
        if (mounted) {
          setError(err?.message || 'Failed to load research.');
          setItems([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const allTags = useMemo(() => {
    const set = new Set();
    for (const item of items) {
      for (const tag of normalizeTags(item.tags)) set.add(tag);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    let result = items.filter((item) => {
      const tags = normalizeTags(item.tags);
      if (activeTag && !tags.includes(activeTag)) return false;
      if (!s) return true;

      const hay = [
        item.title,
        item.subtitle,
        item.abstract,
        item.category,
        item.status,
        tags.join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return hay.includes(s);
    });

    result = result.slice().sort((a, b) => {
      const aDate = toDateMs(a.createdAt || a.publishedAt);
      const bDate = toDateMs(b.createdAt || b.publishedAt);
      return sort === 'oldest' ? aDate - bDate : bDate - aDate;
    });

    return result;
  }, [items, search, activeTag, sort]);

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          padding: '3rem 2rem',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          margin: '0 auto',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="animate-pulse" style={{ fontSize: '1.1rem', opacity: 0.7 }}>
          Loading research...
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {error && (
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            margin: '0 auto 1rem auto',
            padding: '0.9rem 1rem',
            borderRadius: '14px',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            background: 'rgba(239, 68, 68, 0.10)',
            opacity: 0.95,
          }}
        >
          <div style={{ fontWeight: 650, marginBottom: '0.25rem' }}>Couldn’t load research</div>
          <div style={{ opacity: 0.85, lineHeight: 1.5 }}>{error}</div>
        </div>
      )}
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          margin: '0 auto 1rem auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ flex: '1 1 320px', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search research (title, tags, abstract…)"
            style={{
              width: '100%',
              padding: '0.75rem 0.9rem',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'inherit',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ flex: '0 0 auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: '0.7rem 0.8rem',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'inherit',
              outline: 'none',
            }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>

          <div style={{ fontSize: '0.9rem', opacity: 0.7, whiteSpace: 'nowrap' }}>
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      </div>

      {allTags.length > 0 && (
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            margin: '0 auto 1rem auto',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTag('')}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              background: activeTag ? 'rgba(255, 255, 255, 0.06)' : 'rgba(99, 102, 241, 0.18)',
              cursor: 'pointer',
              color: 'inherit',
              fontSize: '0.85rem',
              opacity: 0.95,
            }}
          >
            All
          </button>
          {allTags.map((tag) => {
            const selected = activeTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(selected ? '' : tag)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  background: selected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                  cursor: 'pointer',
                  color: 'inherit',
                  fontSize: '0.85rem',
                  opacity: 0.95,
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            padding: '4rem 2rem',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            margin: '0 auto',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          }}
        >
          <p style={{ fontSize: '1.05rem', opacity: 0.75, margin: 0 }}>
            No research items yet.
          </p>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.65 }}>
            Add documents to the <span style={{ opacity: 0.9 }}>research</span> collection in Firestore.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          {filtered.map((item) => {
            const title = typeof item.title === 'string' && item.title.trim() ? item.title.trim() : 'Research';
            const subtitle = typeof item.subtitle === 'string' ? item.subtitle.trim() : '';
            const abstract = typeof item.abstract === 'string' ? item.abstract.replace(/\s+/g, ' ').trim() : '';
            const tags = normalizeTags(item.tags);
            const created = toDateLabel(item.createdAt || item.publishedAt);
            const category = typeof item.category === 'string' ? item.category.trim() : '';
            const status = typeof item.status === 'string' ? item.status.trim() : '';
            const takeaways = Array.isArray(item.takeaways) ? item.takeaways.filter(Boolean).slice(0, 3) : [];
            const coverUrl = item.coverUrl || item.mediaUrl || '';
            const coverType = item.coverType || item.mediaType || '';
            const links = item.links && typeof item.links === 'object' ? item.links : {};

            const abstractSnippet = abstract ? abstract.slice(0, 220) : '';

            return (
              <Link
                key={item.id}
                href={`/research/${item.id}`}
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '900px',
                  margin: '0 auto',
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  transition: 'all 0.25s ease',
                  textDecoration: 'none',
                  color: 'inherit',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div>
                    <div
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 760,
                        lineHeight: 1.25,
                        background:
                          'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(168, 85, 247, 0.95))',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        letterSpacing: '-0.2px',
                      }}
                    >
                      {title}
                    </div>

                    {subtitle && (
                      <div style={{ marginTop: '0.35rem', opacity: 0.85, lineHeight: 1.45 }}>
                        {subtitle}
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem 0.9rem',
                        marginTop: '0.55rem',
                        fontSize: '0.85rem',
                        opacity: 0.7,
                      }}
                    >
                      {created && <span>{created}</span>}
                      {category && <span>• {category}</span>}
                      {status && <span>• {status}</span>}
                    </div>
                  </div>

                  {coverUrl && (
                    <div
                      style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {coverType && String(coverType).startsWith('video') ? (
                        <video
                          src={coverUrl}
                          style={{
                            width: '100%',
                            height: '240px',
                            objectFit: 'cover',
                            display: 'block',
                            pointerEvents: 'none',
                          }}
                        />
                      ) : (
                        <Image
                          src={coverUrl}
                          alt={title}
                          width={900}
                          height={320}
                          style={{
                            width: '100%',
                            height: '240px',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      )}
                    </div>
                  )}

                  {(tags.length > 0 || Object.keys(links).length > 0) && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      {tags.slice(0, 6).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '0.78rem',
                            padding: '0.3rem 0.55rem',
                            borderRadius: '999px',
                            border: '1px solid rgba(255, 255, 255, 0.14)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            opacity: 0.95,
                          }}
                        >
                          {tag}
                        </span>
                      ))}

                      {Object.entries(links)
                        .filter(([, v]) => typeof v === 'string' && v.trim())
                        .slice(0, 3)
                        .map(([k]) => (
                          <span
                            key={k}
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.3rem 0.55rem',
                              borderRadius: '999px',
                              border: '1px solid rgba(99, 102, 241, 0.25)',
                              background: 'rgba(99, 102, 241, 0.12)',
                              opacity: 0.95,
                            }}
                          >
                            {k}
                          </span>
                        ))}
                    </div>
                  )}

                  {(abstractSnippet || takeaways.length > 0) && (
                    <div
                      style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        paddingTop: '0.9rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem',
                        opacity: 0.9,
                      }}
                    >
                      {abstractSnippet && (
                        <p style={{ margin: 0, opacity: 0.78, lineHeight: 1.6 }}>
                          {abstractSnippet}
                          {abstract.length > 220 ? '…' : ''}
                        </p>
                      )}

                      {takeaways.length > 0 && (
                        <div style={{ display: 'grid', gap: '0.35rem', opacity: 0.82 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 650, opacity: 0.9 }}>
                            Key takeaways
                          </div>
                          {takeaways.map((t, idx) => (
                            <div key={idx} style={{ fontSize: '0.92rem', lineHeight: 1.45 }}>
                              • {String(t)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
