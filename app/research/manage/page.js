"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminTopNav from '../../components/AdminTopNav';

function toDateLabel(ts) {
  if (!ts) return '';
  try {
    const d = typeof ts === 'string' || typeof ts === 'number' ? new Date(ts) : ts instanceof Date ? ts : null;
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

export default function ManageResearchPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/research?limit=250', { cache: 'no-store' });
        const json = await res.json();
        if (!mounted) return;

        if (!res.ok || !json?.success) {
          setError(json?.error || 'Failed to load research.');
          setItems([]);
          return;
        }

        setItems(Array.isArray(json.items) ? json.items : []);
      } catch (err) {
        console.error('[ManageResearch] load error:', err);
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

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;
    return items.filter((item) => {
      const tags = normalizeTags(item.tags);
      const hay = [item.title, item.subtitle, item.abstract, item.category, item.status, tags.join(' ')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(s);
    });
  }, [items, search]);

  const handleDelete = async (id, coverUrl) => {
    if (!confirm('Delete this research item? This cannot be undone.')) return;

    setDeleting(id);
    try {
      const res = await fetch('/api/admin/research/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, coverUrl: coverUrl || null }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        alert(json?.error || 'Delete failed');
        return;
      }

      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      console.error('[ManageResearch] delete error:', err);
      alert(err?.message || 'Delete failed');
    } finally {
      setDeleting('');
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 1.5rem)',
      }}
    >
      <AdminTopNav />

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1rem',
          }}
        >
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 800, margin: 0 }}>
            Manage Research
          </h1>
          <Link
            href="/research/admin"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              textDecoration: 'none',
              color: 'inherit',
              display: 'inline-block',
            }}
          >
            + Add New Research
          </Link>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search research..."
          style={{
            width: '100%',
            maxWidth: '900px',
            padding: '0.75rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            fontSize: '1rem',
            color: 'inherit',
            outline: 'none',
            marginBottom: '1rem',
          }}
        />

        {error && (
          <div
            style={{
              maxWidth: '900px',
              padding: '0.9rem 1rem',
              borderRadius: '14px',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: 'rgba(239, 68, 68, 0.10)',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Couldn’t load research</div>
            <div style={{ opacity: 0.85, lineHeight: 1.5 }}>{error}</div>
          </div>
        )}

        {loading ? (
          <div style={{ opacity: 0.7, padding: '2rem 0' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ opacity: 0.75, padding: '2rem 0' }}>No research items found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map((item) => {
              const title = typeof item.title === 'string' && item.title.trim() ? item.title.trim() : 'Research';
              const created = toDateLabel(item.createdAt || item.publishedAt);
              const category = typeof item.category === 'string' ? item.category.trim() : '';
              const status = typeof item.status === 'string' ? item.status.trim() : '';
              const tags = normalizeTags(item.tags);
              const coverUrl = item.coverUrl || item.mediaUrl || '';

              return (
                <div
                  key={item.id}
                  style={{
                    width: '100%',
                    maxWidth: '900px',
                    margin: '0',
                    padding: '1rem 1.1rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ minWidth: '240px', flex: '1 1 520px' }}>
                    <div style={{ fontWeight: 750, fontSize: '1.05rem', lineHeight: 1.35 }}>{title}</div>
                    <div style={{ marginTop: '0.35rem', opacity: 0.7, fontSize: '0.9rem' }}>
                      {created || '—'}
                      {category ? ` • ${category}` : ''}
                      {status ? ` • ${status}` : ''}
                    </div>
                    {tags.length > 0 && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {tags.slice(0, 8).map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.25rem 0.5rem',
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
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link
                      href={`/research/${item.id}`}
                      style={{
                        padding: '0.55rem 0.9rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        background: 'rgba(255, 255, 255, 0.06)',
                        textDecoration: 'none',
                        color: 'inherit',
                        fontWeight: 650,
                        fontSize: '0.9rem',
                      }}
                    >
                      View
                    </Link>

                    <button
                      type="button"
                      disabled={deleting === item.id}
                      onClick={() => handleDelete(item.id, coverUrl)}
                      style={{
                        padding: '0.55rem 0.9rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        background: 'rgba(239, 68, 68, 0.10)',
                        color: 'inherit',
                        fontWeight: 650,
                        fontSize: '0.9rem',
                        cursor: deleting === item.id ? 'not-allowed' : 'pointer',
                        opacity: deleting === item.id ? 0.6 : 1,
                      }}
                    >
                      {deleting === item.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
