"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';

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

function Section({ title, children }) {
  if (!children) return null;
  return (
    <section style={{ marginTop: '2rem' }}>
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 750,
          margin: '0 0 0.75rem 0',
          opacity: 0.95,
        }}
      >
        {title}
      </h2>
      <div style={{ opacity: 0.9, lineHeight: 1.75 }}>{children}</div>
    </section>
  );
}

function BlockRenderer({ blocks }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  const alignmentMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
      {blocks.map((block, idx) => {
        if (!block || typeof block !== 'object') return null;

        if (block.type === 'text') {
          return (
            <div
              key={idx}
              style={{
                fontSize: '1.05rem',
                lineHeight: '1.85',
                opacity: 0.92,
                whiteSpace: 'pre-wrap',
              }}
            >
              {block.content}
            </div>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              key={idx}
              style={{
                margin: 0,
                padding: '1.1rem 1.25rem',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.06)',
                opacity: 0.92,
              }}
            >
              <div style={{ fontSize: '1.02rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {block.content}
              </div>
              {block.citation && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>
                  — {block.citation}
                </div>
              )}
            </blockquote>
          );
        }

        if (block.type === 'divider') {
          return (
            <div
              key={idx}
              style={{
                width: '100%',
                height: '2px',
                background:
                  'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.45), rgba(168, 85, 247, 0.45), transparent)',
                borderRadius: '2px',
                opacity: 0.9,
              }}
            />
          );
        }

        if (block.type === 'image') {
          const alignment = alignmentMap[block.alignment] || 'center';
          const widthPercent = Number.isFinite(block.widthPercent) ? block.widthPercent : 85;
          const width = Math.min(100, Math.max(30, widthPercent));

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: alignment,
                width: '100%',
              }}
            >
              <div style={{ width: `${width}%` }}>
                <Image
                  src={block.url}
                  alt={block.alt || `Image ${idx + 1}`}
                  width={1200}
                  height={900}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                />
                {block.caption && (
                  <div style={{ marginTop: '0.6rem', fontSize: '0.9rem', opacity: 0.7 }}>
                    {block.caption}
                  </div>
                )}
              </div>
            </div>
          );
        }

        if (block.type === 'video') {
          const alignment = alignmentMap[block.alignment] || 'center';
          const widthPercent = Number.isFinite(block.widthPercent) ? block.widthPercent : 85;
          const width = Math.min(100, Math.max(30, widthPercent));

          return (
            <div key={idx} style={{ display: 'flex', justifyContent: alignment, width: '100%' }}>
              <div style={{ width: `${width}%` }}>
                <video
                  controls
                  src={block.url}
                  style={{
                    width: '100%',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'block',
                  }}
                />
                {block.caption && (
                  <div style={{ marginTop: '0.6rem', fontSize: '0.9rem', opacity: 0.7 }}>
                    {block.caption}
                  </div>
                )}
              </div>
            </div>
          );
        }

        if (block.type === 'audio') {
          return (
            <div key={idx}>
              <audio controls src={block.url} style={{ width: '100%' }} />
              {block.caption && (
                <div style={{ marginTop: '0.6rem', fontSize: '0.9rem', opacity: 0.7 }}>
                  {block.caption}
                </div>
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

export default function ResearchDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/research/${encodeURIComponent(String(id))}`, { cache: 'no-store' });
        const json = await res.json();
        if (!mounted) return;

        if (!res.ok || !json?.success) {
          setError(json?.error || 'Failed to load research item.');
          setItem(null);
          return;
        }

        setItem(json.item || null);
      } catch (err) {
        console.error('[ResearchDetailPage] Error loading research:', err);
        if (mounted) {
          setError(err?.message || 'Failed to load research item.');
          setItem(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const tags = useMemo(() => normalizeTags(item?.tags), [item]);
  const created = toDateLabel(item?.createdAt || item?.publishedAt);
  const links = item?.links && typeof item.links === 'object' ? item.links : {};

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', padding: 'clamp(1.5rem, 4vw, 3rem) 1rem' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            margin: '0 auto',
            padding: '3rem 2rem',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
          }}
        >
          <div className="animate-pulse" style={{ opacity: 0.75 }}>
            Loading…
          </div>
        </div>
      </main>
    );
  }

  if (!item) {
    return (
      <main style={{ minHeight: '100vh', padding: 'clamp(1.5rem, 4vw, 3rem) 1rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Link href="/research" style={{ opacity: 0.8, textDecoration: 'none' }}>
            ← Back to Research
          </Link>
          <div
            style={{
              marginTop: '1rem',
              padding: '3rem 2rem',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
            }}
          >
            {error ? (
              <div>
                <div style={{ fontWeight: 650, marginBottom: '0.5rem' }}>Couldn’t load research</div>
                <div style={{ opacity: 0.75, lineHeight: 1.55 }}>{error}</div>
              </div>
            ) : (
              'Not found.'
            )}
          </div>
        </div>
      </main>
    );
  }

  const title = typeof item.title === 'string' && item.title.trim() ? item.title.trim() : 'Research';
  const subtitle = typeof item.subtitle === 'string' ? item.subtitle.trim() : '';
  const abstract = typeof item.abstract === 'string' ? item.abstract.trim() : '';
  const status = typeof item.status === 'string' ? item.status.trim() : '';
  const category = typeof item.category === 'string' ? item.category.trim() : '';
  const collaborators = Array.isArray(item.collaborators) ? item.collaborators.filter(Boolean) : [];
  const takeaways = Array.isArray(item.takeaways) ? item.takeaways.filter(Boolean) : [];
  const methods = typeof item.methods === 'string' ? item.methods.trim() : '';
  const results = typeof item.results === 'string' ? item.results.trim() : '';
  const references = Array.isArray(item.references) ? item.references.filter(Boolean) : [];

  return (
    <main style={{ minHeight: '100vh', padding: 'clamp(1.5rem, 4vw, 3rem) 1rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Link href="/research" style={{ opacity: 0.8, textDecoration: 'none' }}>
          ← Back to Research
        </Link>

        <header style={{ marginTop: '1rem' }}>
          <h1
            style={{
              fontSize: 'clamp(1.9rem, 4.5vw, 2.6rem)',
              fontWeight: 780,
              margin: 0,
              lineHeight: 1.15,
              background:
                'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(168, 85, 247, 0.95))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {title}
          </h1>

          {subtitle && <div style={{ marginTop: '0.6rem', opacity: 0.86, lineHeight: 1.6 }}>{subtitle}</div>}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.6rem 1rem',
              marginTop: '0.85rem',
              fontSize: '0.9rem',
              opacity: 0.7,
            }}
          >
            {created && <span>{created}</span>}
            {category && <span>• {category}</span>}
            {status && <span>• {status}</span>}
            {collaborators.length > 0 && <span>• {collaborators.join(', ')}</span>}
          </div>

          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.85rem' }}>
              {tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.32rem 0.6rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    opacity: 0.95,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {Object.keys(links).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1.1rem' }}>
              {Object.entries(links)
                .filter(([, v]) => typeof v === 'string' && v.trim())
                .map(([k, v]) => (
                  <a
                    key={k}
                    href={String(v)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      textDecoration: 'none',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: 'inherit',
                      opacity: 0.95,
                    }}
                  >
                    {k}
                  </a>
                ))}
            </div>
          )}
        </header>

        {item.coverUrl && (
          <div
            style={{
              marginTop: '1.25rem',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Image
              src={item.coverUrl}
              alt={title}
              width={1200}
              height={600}
              style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        {abstract && (
          <Section title="Abstract">
            <div style={{ whiteSpace: 'pre-wrap' }}>{abstract}</div>
          </Section>
        )}

        {takeaways.length > 0 && (
          <Section title="Key Takeaways">
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {takeaways.map((t, i) => (
                <div key={i}>• {String(t)}</div>
              ))}
            </div>
          </Section>
        )}

        {methods && (
          <Section title="Methods">
            <div style={{ whiteSpace: 'pre-wrap' }}>{methods}</div>
          </Section>
        )}

        {results && (
          <Section title="Results / Notes">
            <div style={{ whiteSpace: 'pre-wrap' }}>{results}</div>
          </Section>
        )}

        <Section title="Write-up">
          <BlockRenderer blocks={item.blocks} />
          {!Array.isArray(item.blocks) && typeof item.content === 'string' && (
            <div style={{ whiteSpace: 'pre-wrap' }}>{item.content}</div>
          )}
        </Section>

        {references.length > 0 && (
          <Section title="References">
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {references.map((r, i) => (
                <div key={i} style={{ opacity: 0.88 }}>
                  {String(r)}
                </div>
              ))}
            </div>
          </Section>
        )}

        <div style={{ height: '2.5rem' }} />
      </div>
    </main>
  );
}
