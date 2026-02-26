"use client";
import { useRef } from 'react';
import ScrollScrubVideo from './components/ScrollScrubVideo';
import { useTheme } from './context/ThemeContext';

export default function Home() {
  const { theme } = useTheme();
  const heroSectionRef = useRef(null);
  const textColor = theme === 'light' ? '#6a6a6a' : 'white';

  return (
    <section
      ref={heroSectionRef}
      style={{
        position: 'relative',
        height: '400vh',   /* generous scroll range → ~2.2px per frame per 100px viewport */
        width: '100%',
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
          overflow: 'hidden',
          zIndex: 0,
          willChange: 'transform', /* promote sticky container to its own layer */
        }}
      >
        <ScrollScrubVideo sectionRef={heroSectionRef} />

        <div
          style={{
            position: 'absolute',
            top: '22%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 10,
            width: '100%',
            maxWidth: '90vw',
            padding: '1rem'
          }}
        >
        </div>
      </div>
    </section>
  );
}
