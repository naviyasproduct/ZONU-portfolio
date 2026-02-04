"use client";

import { useState } from 'react';
import Link from 'next/link';
import AdminTopNav from '../components/AdminTopNav';

const BLOCK_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  QUOTE: 'quote',
  DIVIDER: 'divider',
};

function normalizeTagsInput(value) {
  return String(value || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function normalizeLines(value) {
  return String(value || '')
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function ResearchAdminClient() {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [tagsText, setTagsText] = useState('');

  const [takeawaysText, setTakeawaysText] = useState('');
  const [methods, setMethods] = useState('');
  const [results, setResults] = useState('');
  const [writeup, setWriteup] = useState('');
  const [references, setReferences] = useState('');
  const [linksJson, setLinksJson] = useState('');

  const [coverFile, setCoverFile] = useState(null);
  const [contentBlocks, setContentBlocks] = useState([]);

  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function uploadToCloudinary(file) {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: form,
    });

    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();

    return {
      url: data.secure_url,
      type: data.resource_type === 'video' ? 'video/*' : file.type || data.format,
    };
  }

  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type,
      content: '',
      file: null,
      alignment: 'center',
      widthPercent: 80,
      citation: '',
      caption: '',
      alt: '',
    };
    setContentBlocks((prev) => [...prev, newBlock]);
    setShowBlockMenu(false);
  };

  const updateBlock = (id, field, value) => {
    setContentBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const deleteBlock = (id) => {
    setContentBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = (index, direction) => {
    setContentBlocks((prev) => {
      const next = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  async function processForSave() {
    let coverUrl = null;
    let coverType = null;

    if (coverFile) {
      const uploaded = await uploadToCloudinary(coverFile);
      coverUrl = uploaded.url;
      coverType = uploaded.type;
    }

    const blocks = [];

    for (const block of contentBlocks) {
      if (block.type === BLOCK_TYPES.DIVIDER) {
        blocks.push({ type: 'divider' });
        continue;
      }

      if (block.type === BLOCK_TYPES.TEXT) {
        if (block.content && String(block.content).trim()) {
          blocks.push({ type: 'text', content: String(block.content) });
        }
        continue;
      }

      if (block.type === BLOCK_TYPES.QUOTE) {
        if (block.content && String(block.content).trim()) {
          blocks.push({
            type: 'quote',
            content: String(block.content),
            citation: block.citation ? String(block.citation) : undefined,
          });
        }
        continue;
      }

      if ((block.type === BLOCK_TYPES.IMAGE || block.type === BLOCK_TYPES.VIDEO || block.type === BLOCK_TYPES.AUDIO) && block.file) {
        const uploaded = await uploadToCloudinary(block.file);
        blocks.push({
          type: block.type,
          url: uploaded.url,
          alignment: block.alignment || 'center',
          widthPercent: Number(block.widthPercent) || 80,
          caption: block.caption ? String(block.caption) : undefined,
          alt: block.alt ? String(block.alt) : undefined,
        });
        continue;
      }

      // If user already pasted a URL (optional)
      if ((block.type === BLOCK_TYPES.IMAGE || block.type === BLOCK_TYPES.VIDEO || block.type === BLOCK_TYPES.AUDIO) && block.url) {
        blocks.push({
          type: block.type,
          url: String(block.url),
          alignment: block.alignment || 'center',
          widthPercent: Number(block.widthPercent) || 80,
          caption: block.caption ? String(block.caption) : undefined,
          alt: block.alt ? String(block.alt) : undefined,
        });
      }
    }

    let links = undefined;
    const linksText = String(linksJson || '').trim();
    if (linksText) {
      try {
        const parsed = JSON.parse(linksText);
        if (parsed && typeof parsed === 'object') links = parsed;
      } catch {
        throw new Error('Links must be valid JSON (or leave it empty).');
      }
    }

    return {
      coverUrl,
      coverType,
      blocks,
      tags: normalizeTagsInput(tagsText),
      takeaways: normalizeLines(takeawaysText),
      links,
    };
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setLoading(true);
    try {
      const processed = await processForSave();

      const res = await fetch('/api/admin/research/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          abstract: abstract.trim() || null,
          category: category.trim() || null,
          status: status.trim() || null,
          tags: processed.tags,
          coverUrl: processed.coverUrl,
          coverType: processed.coverType,
          blocks: processed.blocks,
          takeaways: processed.takeaways,
          methods: methods.trim() || null,
          results: results.trim() || null,
          writeup: writeup.trim() || null,
          references: references.trim() || null,
          links: processed.links || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Create failed');

      setSuccess('Research item created.');

      // Reset most fields but keep in-page
      setTitle('');
      setSubtitle('');
      setAbstract('');
      setCategory('');
      setStatus('');
      setTagsText('');
      setTakeawaysText('');
      setMethods('');
      setResults('');
      setWriteup('');
      setReferences('');
      setLinksJson('');
      setCoverFile(null);
      setContentBlocks([]);

      // Optionally send them to manage list
      if (json?.id) {
        // small delay for UX
        setTimeout(() => {
          window.location.href = '/research/manage';
        }, 400);
      }
    } catch (err) {
      console.error('[ResearchAdmin] create failed:', err);
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    background: 'rgba(255, 255, 255, 0.06)',
    color: 'inherit',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: 700,
    opacity: 0.9,
    marginBottom: '0.45rem',
  };

  const buttonStyle = {
    padding: '0.7rem 1rem',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    background: 'rgba(255, 255, 255, 0.06)',
    color: 'inherit',
    cursor: 'pointer',
    fontWeight: 650,
  };

  return (
    <main style={{ minHeight: '100vh', padding: 'clamp(1.5rem, 4vw, 3rem) 1rem' }}>
      <AdminTopNav />

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 800, margin: 0 }}>Create Research</h1>
            <p style={{ marginTop: '0.5rem', opacity: 0.75, lineHeight: 1.6, maxWidth: '70ch' }}>
              Add a research entry with rich metadata and optional content blocks.
            </p>
          </div>
          <Link href="/research/manage" style={{ opacity: 0.85, textDecoration: 'none' }}>
            ← Back to Manage
          </Link>
        </div>

        {error && (
          <div style={{ marginTop: '1rem', padding: '0.9rem 1rem', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.35)', background: 'rgba(239, 68, 68, 0.10)' }}>
            <div style={{ fontWeight: 750, marginBottom: '0.25rem' }}>Error</div>
            <div style={{ opacity: 0.85, lineHeight: 1.5 }}>{error}</div>
          </div>
        )}

        {success && (
          <div style={{ marginTop: '1rem', padding: '0.9rem 1rem', borderRadius: '14px', border: '1px solid rgba(34, 197, 94, 0.35)', background: 'rgba(34, 197, 94, 0.10)' }}>
            <div style={{ fontWeight: 750, marginBottom: '0.25rem' }}>Saved</div>
            <div style={{ opacity: 0.85, lineHeight: 1.5 }}>{success}</div>
          </div>
        )}

        <form onSubmit={handleCreate} style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="Title" />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} placeholder="e.g. UX, AI, Security" />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <input value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle} placeholder="e.g. Draft, Published" />
            </div>
            <div>
              <label style={labelStyle}>Tags</label>
              <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} style={inputStyle} placeholder="comma, separated, tags" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Subtitle</label>
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} style={inputStyle} placeholder="Optional subtitle" />
          </div>

          <div>
            <label style={labelStyle}>Abstract</label>
            <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Short abstract…" />
          </div>

          <div>
            <label style={labelStyle}>Cover Media (optional)</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              style={{ ...inputStyle, padding: '0.7rem 1rem' }}
            />
          </div>

          <div style={{ padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.12)', background: 'rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 750, fontSize: '1.05rem' }}>Content Blocks</div>
              <div style={{ position: 'relative' }}>
                <button type="button" onClick={() => setShowBlockMenu((v) => !v)} style={buttonStyle}>
                  + Add Block
                </button>
                {showBlockMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      zIndex: 20,
                      padding: '0.5rem',
                      borderRadius: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      background: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(12px)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      minWidth: '190px',
                    }}
                  >
                    {Object.values(BLOCK_TYPES).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => addBlock(t)}
                        style={{
                          ...buttonStyle,
                          textAlign: 'left',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '10px',
                        }}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {contentBlocks.length === 0 ? (
              <div style={{ opacity: 0.75, marginTop: '0.75rem' }}>No blocks yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.9rem' }}>
                {contentBlocks.map((block, idx) => (
                  <div key={block.id} style={{ padding: '0.85rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)', background: 'rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 750, opacity: 0.95 }}>{block.type.toUpperCase()}</div>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => moveBlock(idx, 'up')} style={buttonStyle}>
                          ↑
                        </button>
                        <button type="button" onClick={() => moveBlock(idx, 'down')} style={buttonStyle}>
                          ↓
                        </button>
                        <button type="button" onClick={() => deleteBlock(block.id)} style={{ ...buttonStyle, borderColor: 'rgba(239, 68, 68, 0.35)', background: 'rgba(239, 68, 68, 0.10)' }}>
                          Delete
                        </button>
                      </div>
                    </div>

                    {block.type === BLOCK_TYPES.TEXT && (
                      <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                        placeholder="Text…"
                        style={{ ...inputStyle, marginTop: '0.6rem', minHeight: '90px', resize: 'vertical' }}
                      />
                    )}

                    {block.type === BLOCK_TYPES.QUOTE && (
                      <div style={{ marginTop: '0.6rem', display: 'grid', gap: '0.6rem' }}>
                        <textarea
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                          placeholder="Quote…"
                          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                        />
                        <input
                          value={block.citation}
                          onChange={(e) => updateBlock(block.id, 'citation', e.target.value)}
                          placeholder="Citation (optional)"
                          style={inputStyle}
                        />
                      </div>
                    )}

                    {(block.type === BLOCK_TYPES.IMAGE || block.type === BLOCK_TYPES.VIDEO || block.type === BLOCK_TYPES.AUDIO) && (
                      <div style={{ marginTop: '0.6rem', display: 'grid', gap: '0.6rem' }}>
                        <input
                          type="file"
                          accept={block.type === BLOCK_TYPES.IMAGE ? 'image/*' : block.type === BLOCK_TYPES.VIDEO ? 'video/*' : 'audio/*'}
                          onChange={(e) => updateBlock(block.id, 'file', e.target.files?.[0] || null)}
                          style={{ ...inputStyle, padding: '0.7rem 1rem' }}
                        />
                        <input value={block.url || ''} onChange={(e) => updateBlock(block.id, 'url', e.target.value)} placeholder="Or paste a URL…" style={inputStyle} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
                          <select value={block.alignment} onChange={(e) => updateBlock(block.id, 'alignment', e.target.value)} style={inputStyle}>
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                          <input value={block.widthPercent} onChange={(e) => updateBlock(block.id, 'widthPercent', e.target.value)} style={inputStyle} placeholder="Width % (e.g. 80)" />
                        </div>
                        <input value={block.caption} onChange={(e) => updateBlock(block.id, 'caption', e.target.value)} style={inputStyle} placeholder="Caption (optional)" />
                        <input value={block.alt} onChange={(e) => updateBlock(block.id, 'alt', e.target.value)} style={inputStyle} placeholder="Alt text (optional)" />
                      </div>
                    )}

                    {block.type === BLOCK_TYPES.DIVIDER && (
                      <div style={{ marginTop: '0.75rem', opacity: 0.75 }}>A gradient divider will be rendered.</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Takeaways (one per line)</label>
              <textarea value={takeawaysText} onChange={(e) => setTakeawaysText(e.target.value)} style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>Links (JSON)</label>
              <textarea value={linksJson} onChange={(e) => setLinksJson(e.target.value)} style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} placeholder='{"paper":"https://...","repo":"https://..."}' />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Methods</label>
            <textarea value={methods} onChange={(e) => setMethods(e.target.value)} style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStyle}>Results / Notes</label>
            <textarea value={results} onChange={(e) => setResults(e.target.value)} style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStyle}>Write-up</label>
            <textarea value={writeup} onChange={(e) => setWriteup(e.target.value)} style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStyle}>References</label>
            <textarea value={references} onChange={(e) => setReferences(e.target.value)} style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.9rem 1.25rem',
                borderRadius: '14px',
                border: 'none',
                background: loading ? 'rgba(255, 255, 255, 0.12)' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(168, 85, 247, 0.95))',
                color: 'white',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Saving…' : 'Create Research'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
