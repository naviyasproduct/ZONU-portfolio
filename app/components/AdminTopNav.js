"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function isActive(pathname, href) {
  if (!pathname) return false;
  if (href === '/thoughts/manage') return pathname.startsWith('/thoughts');
  if (href === '/research/manage') return pathname.startsWith('/research');
  if (href === '/timeline/manage') return pathname.startsWith('/timeline');
  if (href === '/admin') return pathname.startsWith('/admin');
  return pathname === href;
}

export default function AdminTopNav() {
  const pathname = usePathname();

  const tabStyle = (active) => ({
    padding: '0.55rem 0.9rem',
    borderRadius: '999px',
    textDecoration: 'none',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    background: active ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.06)',
    opacity: active ? 1 : 0.85,
    fontWeight: 650,
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    color: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  });

  const actionStyle = {
    padding: '0.55rem 0.9rem',
    borderRadius: '999px',
    textDecoration: 'none',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    background: 'rgba(255, 255, 255, 0.06)',
    opacity: 0.9,
    fontWeight: 650,
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    color: 'inherit',
    cursor: 'pointer',
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      window.location.href = '/admin/login';
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto 1.25rem auto',
        padding: '0 0 0.25rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Link href="/thoughts/manage" style={tabStyle(isActive(pathname, '/thoughts/manage'))}>
          Thoughts
        </Link>
        <Link href="/research/manage" style={tabStyle(isActive(pathname, '/research/manage'))}>
          Research
        </Link>
        <Link href="/timeline/manage" style={tabStyle(isActive(pathname, '/timeline/manage'))}>
          Timeline
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Link href="/thoughts/admin" style={actionStyle}>
          + Thought
        </Link>
        <Link href="/research/admin" style={actionStyle}>
          + Research
        </Link>
        <Link href="/timeline/manage" style={actionStyle}>
          + Event
        </Link>
        <button type="button" onClick={handleLogout} style={actionStyle}>
          Logout
        </button>
      </div>
    </div>
  );
}
