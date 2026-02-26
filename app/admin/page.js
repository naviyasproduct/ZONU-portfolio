import Link from 'next/link';
import AdminTopNav from '../components/AdminTopNav';

export default function AdminIndexPage() {
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
          Admin
        </h1>
        <p style={{ marginTop: '0.5rem', opacity: 0.75, lineHeight: 1.6 }}>
          Switch between Thoughts and Research management.
        </p>

        <div
          style={{
            marginTop: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          <Link
            href="/thoughts/manage"
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.05)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ fontWeight: 750, fontSize: '1.1rem' }}>Manage Thoughts</div>
            <div style={{ marginTop: '0.35rem', opacity: 0.75, lineHeight: 1.55 }}>
              Search, delete, and edit existing thoughts.
            </div>
          </Link>

          <Link
            href="/research/manage"
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.05)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ fontWeight: 750, fontSize: '1.1rem' }}>Manage Research</div>
            <div style={{ marginTop: '0.35rem', opacity: 0.75, lineHeight: 1.55 }}>
              Create richer research posts with blocks + metadata.
            </div>
          </Link>

          <Link
            href="/timeline/manage"
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.05)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ fontWeight: 750, fontSize: '1.1rem' }}>Manage Timeline</div>
            <div style={{ marginTop: '0.35rem', opacity: 0.75, lineHeight: 1.55 }}>
              Add new timeline milestones and remove existing events.
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
