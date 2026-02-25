"use client";
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import CursorAnimationToggle from './CursorAnimationToggle';

export default function Nav() {
  const pathname = usePathname();
  const isContactPage = pathname === '/contact';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full sticky top-0 z-[100]" style={{ 
      padding: '0.5rem clamp(0.5rem, 2vw, 1rem)',
      marginLeft: 0, 
      marginRight: 0 
    }}>
      <div style={{
        maxWidth: '800px',
        margin: 'clamp(15px, 4vw, 30px) auto',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '50px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        padding: '0.5rem 0.85rem',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          width: '100%',
        }}>
          <Link 
            href="/" 
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              transition: 'opacity 0.3s ease',
              flexShrink: 0,
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
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginLeft: 'auto',
          }}>
            {/* Desktop Links */}
            <div className="hidden sm:flex gap-3 text-xs">
              <Link href="/thoughts" className="hover:opacity-70 transition-opacity">Thoughts</Link>
              <Link href="/research" className="hover:opacity-70 transition-opacity">Research</Link>
              <Link href="/contact" className="hover:opacity-70 transition-opacity">Contact</Link>
            </div>
            
            {/* Mobile Hamburger - Only show on mobile */}
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
              <span style={{
                display: 'block',
                width: '22px',
                height: '2.5px',
                background: 'currentColor',
                borderRadius: '2px',
                transition: 'all 0.3s ease',
                transform: mobileMenuOpen ? 'rotate(45deg) translateY(7.5px)' : 'none',
              }} />
              <span style={{
                display: 'block',
                width: '22px',
                height: '2.5px',
                background: 'currentColor',
                borderRadius: '2px',
                transition: 'all 0.3s ease',
                opacity: mobileMenuOpen ? 0 : 1,
              }} />
              <span style={{
                display: 'block',
                width: '22px',
                height: '2.5px',
                background: 'currentColor',
                borderRadius: '2px',
                transition: 'all 0.3s ease',
                transform: mobileMenuOpen ? 'rotate(-45deg) translateY(-7.5px)' : 'none',
              }} />
            </button>
            
            {/* Cursor Animation Toggle - Show on contact page for all devices */}
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
      </div>
      
      {/* Mobile Menu Dropdown - Simple and compact */}
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
            width: 'auto',
            minWidth: '100px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <Link 
              href="/thoughts" 
              onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                textAlign: 'left',
                color: 'white',
                transition: 'opacity 0.2s ease',
                opacity: pathname === '/thoughts' ? '1' : '0.8',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = pathname === '/thoughts' ? '1' : '0.8'}
            >
              Thoughts
            </Link>
            <Link 
              href="/research" 
              onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                textAlign: 'left',
                color: 'white',
                transition: 'opacity 0.2s ease',
                opacity: pathname === '/research' ? '1' : '0.8',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = pathname === '/research' ? '1' : '0.8'}
            >
              Research
            </Link>
            <Link 
              href="/contact" 
              onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                textAlign: 'left',
                color: 'white',
                transition: 'opacity 0.2s ease',
                opacity: pathname === '/contact' ? '1' : '0.8',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = pathname === '/contact' ? '1' : '0.8'}
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
