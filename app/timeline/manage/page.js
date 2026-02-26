"use client";

import { useEffect, useMemo, useState } from 'react';
import AdminTopNav from '../../components/AdminTopNav';

function formatDateLabel(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.replace(/-/g, ' ');
  return value;
}

async function uploadToCloudinary(file) {
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) throw new Error('Image upload failed');
  const data = await res.json();
  return data.secure_url;
}

export default function ManageTimelinePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({
    eventDate: '',
    title: '',
    shortDescription: '',
    description: '',
  });

  const canSubmit = useMemo(() => {
    return (
      form.eventDate.trim() &&
      form.title.trim() &&
      form.shortDescription.trim() &&
      form.description.trim() &&
      !!imageFile
    );
  }, [form, imageFile]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/timeline?limit=250', { cache: 'no-store' });
        const json = await res.json();
        if (!mounted) return;

        if (!res.ok || !json?.success) {
          setError(json?.error || 'Failed to load timeline events.');
          setItems([]);
          return;
        }

        setItems(Array.isArray(json.items) ? json.items : []);
      } catch (err) {
        console.error('[ManageTimeline] load error:', err);
        if (mounted) {
          setError(err?.message || 'Failed to load timeline events.');
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

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    try {
      const image = await uploadToCloudinary(imageFile);

      const payload = {
        eventDate: form.eventDate.trim(),
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        image,
      };

      const res = await fetch('/api/admin/timeline/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        alert(json?.error || 'Failed to create event');
        return;
      }

      const created = {
        id: json.id,
        eventDate: payload.eventDate,
        dateNumber: Number(new Date(payload.eventDate).getTime()),
        title: payload.title,
        shortDescription: payload.shortDescription,
        description: payload.description,
        image: payload.image,
      };

      setItems((prev) =>
        [...prev, created].sort((a, b) => {
          const ad = Number(a.dateNumber || 0);
          const bd = Number(b.dateNumber || 0);
          if (ad !== bd) return ad - bd;
          return String(a.title || '').localeCompare(String(b.title || ''));
        })
      );

      setForm({ eventDate: '', title: '', shortDescription: '', description: '' });
      setImageFile(null);
    } catch (err) {
      console.error('[ManageTimeline] create error:', err);
      alert(err?.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, imageUrl) => {
    if (!id || deleting) return;
    if (!confirm('Delete this timeline event? This cannot be undone.')) return;

    setDeleting(id);
    try {
      const res = await fetch('/api/admin/timeline/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        alert(json?.error || 'Delete failed');
        return;
      }

      if (imageUrl) {
        try {
          await fetch('/api/cloudinary/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: imageUrl }),
          });
        } catch (cloudinaryErr) {
          console.warn('[ManageTimeline] image delete failed (non-fatal):', cloudinaryErr);
        }
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('[ManageTimeline] delete error:', err);
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

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 800, margin: 0 }}>
          Manage Timeline
        </h1>
        <p style={{ marginTop: '0.5rem', opacity: 0.75, lineHeight: 1.6 }}>
          Add date, title, short description, image, and full description.
        </p>

        <form
          onSubmit={handleCreate}
          style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <input
            type="date"
            value={form.eventDate}
            onChange={(e) => updateForm('eventDate', e.target.value)}
            style={inputStyle}
          />
          <input
            value={form.title}
            onChange={(e) => updateForm('title', e.target.value)}
            placeholder="Event title"
            style={inputStyle}
          />
          <input
            value={form.shortDescription}
            onChange={(e) => updateForm('shortDescription', e.target.value)}
            placeholder="Short description"
            style={inputStyle}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            style={inputStyle}
          />

          <textarea
            value={form.description}
            onChange={(e) => updateForm('description', e.target.value)}
            placeholder="Description"
            rows={5}
            style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }}
          />

          <div style={{ gridColumn: '1 / -1' }}>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              style={{
                ...buttonStyle,
                opacity: !canSubmit || submitting ? 0.6 : 1,
                cursor: !canSubmit || submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Adding…' : 'Add Timeline Event'}
            </button>
          </div>
        </form>

        {error && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.9rem 1rem',
              borderRadius: '14px',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: 'rgba(239, 68, 68, 0.10)',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {loading ? (
            <div style={{ opacity: 0.7, padding: '1rem 0' }}>Loading…</div>
          ) : items.length === 0 ? (
            <div style={{ opacity: 0.75, padding: '1rem 0' }}>No timeline events yet.</div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {formatDateLabel(item.eventDate)} • {item.title}
                  </div>
                  <div style={{ marginTop: '0.2rem', opacity: 0.75, fontSize: '0.9rem' }}>
                    {item.shortDescription}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id, item.image)}
                  disabled={deleting === item.id}
                  style={{
                    ...buttonStyle,
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.28)',
                    opacity: deleting === item.id ? 0.6 : 1,
                    cursor: deleting === item.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {deleting === item.id ? 'Removing…' : 'Remove'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '12px',
  color: 'inherit',
  fontSize: '0.95rem',
  outline: 'none',
};

const buttonStyle = {
  padding: '0.55rem 0.9rem',
  borderRadius: '10px',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  background: 'rgba(255, 255, 255, 0.08)',
  color: 'inherit',
  fontWeight: 650,
  fontSize: '0.9rem',
};
