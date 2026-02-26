"use client";
import { useRef } from 'react';
import ScrollScrubVideo from './components/ScrollScrubVideo';
import TimelineSection from './components/TimelineSection';
import { useTheme } from './context/ThemeContext';

export default function Home() {
  const { theme } = useTheme();
  const heroSectionRef = useRef(null);

  return (
    <>
      {/* ── Hero scroll scrub ─────────────────────────────────────── */}
      <section
        ref={heroSectionRef}
        style={{
          position: 'relative',
          height: '400vh',
          width: '100%',
          background: '#080808',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#080808',
            overflow: 'hidden',
            zIndex: 0,
            willChange: 'transform',
          }}
        >
          <ScrollScrubVideo sectionRef={heroSectionRef} />
        </div>
      </section>

      {/* ── Timeline ─────────────────────────────────────────────── */}
      <TimelineSection />
    </>
  );
}
