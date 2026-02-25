"use client";
import Link from 'next/link';
import HeroSection from './components/HeroSection';
import { useTheme } from './context/ThemeContext';

export default function Home() {
  const { theme } = useTheme();
  const textColor = theme === 'light' ? '#6a6a6a' : 'white';

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw', 
      height: '100vh',
      overflow: 'hidden',
      zIndex: 0,
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
    }}>
      {/* Hero Section with 3D Animation */}
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%', 
        height: '100%',
        zIndex: 0,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}>
        <HeroSection />
        
        {/* Hero Content Overlay */}
        <div style={{ 
          position: 'absolute', 
          top: '22%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 10,
          width: '100%',
          maxWidth: '90vw',
          padding: '1rem'
        }}>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 10vw, 6rem)', 
            fontWeight: 'bold', 
            marginBottom: '1px',
            color: textColor,
            lineHeight: 1.1,
            letterSpacing: '0.05em'
          }}>
            ZONU
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 3vw, 1.5rem)', 
            color: textColor,
            fontWeight: '400',
            letterSpacing: '0.02em',
            margin: 0,
            opacity: 0.95
          }}>
            Be simple, Be connected
          </p>
        </div>
      </div>
    </div>
  );
}
