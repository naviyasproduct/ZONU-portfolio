"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import CursorAnimationToggle from './CursorAnimationToggle';

const INITIAL_COLLAPSE_DELAY = 2000;  // ms after page load before collapsing
const HOVER_COLLAPSE_DELAY   = 1500;  // ms after hover/touch ends before collapsing

const PILL_TRANSITION =
  'max-width 0.7s cubic-bezier(0.4, 0, 0.2, 1), ' +
  'padding 0.7s cubic-bezier(0.4, 0, 0.2, 1)';

const CONTENT_TRANSITION =
  'opacity 0.3s ease, ' +
  'max-width 0.7s cubic-bezier(0.4, 0, 0.2, 1)';

export default function Nav() {
  const pathname = usePathname();
  const isContactPage = pathname === '/contact';

  const [expanded,       setExpanded]       = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const timerRef = useRef(null);

  const scheduleCollapse = useCallback((delay) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setExpanded(false);
      setMobileMenuOpen(false);
    }, delay);
  }, []);

  const cancelCollapse = useCallback(() => clearTimeout(timerRef.current), []);

  // Collapse after initial delay on every mount / refresh
  useEffect(() => {
    scheduleCollapse(INITIAL_COLLAPSE_DELAY);
    return () => clearTimeout(timerRef.current);
  }, [scheduleCollapse]);

  const handleExpand = () => {
    cancelCollapse();
    setExpanded(true);
  };

  const handleLeave = () => {
    scheduleCollapse(HOVER_COLLAPSE_DELAY);
  };

  // Touch: expand immediately, auto-collapse after delay
  const handleTouch = (e) => {
    if (!expanded) {
      e.preventDefault();
      e.stopPropagation();
    }
    cancelCollapse();
    setExpanded(true);
    scheduleCollapse(HOVER_COLLAPSE_DELAY);
  };

  return (
    <nav
      className="w-full fixed top-0 left-0 z-[100]"
      style={{
        padding: '0.5rem clamp(0.5rem, 2vw, 1rem)',
        pointerEvents: 'none',
      }}
    >
      {/* ── Pill container ──────────────────────────────────────────────── */}
      <div
        onMouseEnter={handleExpand}
        onMouseLeave={handleLeave}
        onTouchStart={handleTouch}
        style={{
          margin: 'clamp(15px, 4vw, 30px) auto',
          width: '100%',
          maxWidth: expanded ? '800px' : '52px',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '50px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
          padding: expanded ? '0.5rem 0.85rem' : '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflow: 'hidden',
          transition: PILL_TRANSITION,
          cursor: expanded ? 'default' : 'pointer',
          pointerEvents: 'auto',
        }}
      >
        {/* Logo – always visible */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            flexShrink: 0,
            transition: 'opacity 0.3s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <Image
            src="/logo/Z_logo_new.png"
            alt="ZONU logo"
            width={36}
            height={36}
            priority
          />
        </Link>

        {/* ── Collapsible content ──────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            maxWidth: expanded ? '700px' : '0px',
            opacity: expanded ? 1 : 0,
            transition: CONTENT_TRANSITION,
            pointerEvents: expanded ? 'auto' : 'none',
          }}
        >
          {/* Desktop links */}
          <div className="hidden sm:flex gap-3 text-xs">
            <Link href="/thoughts" className="hover:opacity-70 transition-opacity">Thoughts</Link>
            <Link href="/research" className="hover:opacity-70 transition-opacity">Research</Link>
            <Link href="/contact"  className="hover:opacity-70 transition-opacity">Contact</Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex sm:hidden"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.35rem',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              width: '36px',
              height: '36px',
              flexShrink: 0,
            }}
            aria-label="Toggle menu"
          >
            <span style={{ display: 'block', width: '22px', height: '2.5px', background: 'currentColor', borderRadius: '2px', transition: 'all 0.3s ease', transform: mobileMenuOpen ? 'rotate(45deg) translateY(7.5px)' : 'none' }} />
            <span style={{ display: 'block', width: '22px', height: '2.5px', background: 'currentColor', borderRadius: '2px', transition: 'all 0.3s ease', opacity: mobileMenuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: '22px', height: '2.5px', background: 'currentColor', borderRadius: '2px', transition: 'all 0.3s ease', transform: mobileMenuOpen ? 'rotate(-45deg) translateY(-7.5px)' : 'none' }} />
          </button>

          {/* Cursor toggle – contact page only */}
          {isContactPage && (
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <CursorAnimationToggle />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* ── Mobile dropdown ──────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="sm:hidden"
          style={{
            position: 'absolute',
            top: 'clamp(65px, 12vw, 75px)',
            right: 'clamp(0.5rem, 2vw, 1rem)',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '8px',
            padding: '0.35rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            animation: 'slideDown 0.2s ease',
            zIndex: 90,
            minWidth: '100px',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {[
              { href: '/thoughts', label: 'Thoughts' },
              { href: '/research', label: 'Research' },
              { href: '/contact',  label: 'Contact'  },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  color: 'white',
                  transition: 'opacity 0.2s ease',
                  opacity: pathname === href ? '1' : '0.8',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = pathname === href ? '1' : '0.8'}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

