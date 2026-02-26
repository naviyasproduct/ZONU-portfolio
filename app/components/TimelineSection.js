"use client";

import { useEffect, useRef, useState } from 'react';

// ─── Event data ────────────────────────────────────────────────────────────────
const DEFAULT_EVENTS = [];

// ─── Layout constants ─────────────────────────────────────────────────────────
// START_X is computed dynamically as viewportW/2 so start ball is always centred
const NODE_SPACING = 280;   // px between snap positions
const NODE_R       = 18;    // event ball radius
const START_R      = 30;    // start ball radius (bigger)
const PAD_RIGHT_MIN = 200;  // minimum px after present marker
const LERP_TX      = 0.07;  // translateX smoothing
const LERP_FADE    = 0.06;  // opacity smoothing
const MODAL_ANIM_MS = 520;

// ─── Glow helpers ─────────────────────────────────────────────────────────────
function applyGlow(el, level) {
  if (!el) return;
  const l  = Math.max(0, Math.min(1, level));
  const sz = 4   + 32  * l;
  const sp = 0   + 10  * l;
  const a1 = 0.1 + 0.65 * l;
  el.style.background  = `rgba(255,255,255,${0.3 + 0.7 * l})`;
  el.style.boxShadow   =
    `0 0 ${sz}px ${sp}px rgba(255,255,255,${a1}), ` +
    `0 0 6px rgba(255,255,255,${l * 0.95})`;
}

function formatCurrentDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year} ${month} ${day}`;
}

function formatEventDateLabel(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.replace(/-/g, ' ');
  return value;
}

export default function TimelineSection() {
  const sectionRef    = useRef(null);
  const rafRef        = useRef(null);
  const trackRef      = useRef(null);
  const innerRef      = useRef(null);
  const fillLineRef   = useRef(null);
  const startBallRef  = useRef(null);
  const ballRefs      = useRef([]);
  const modalCloseTimeoutRef = useRef(null);
  const modalOpenRafRef = useRef(null);

  // Raw lerp state (no setState — drives RAF only)
  const targetTX      = useRef(0);
  const currentTX     = useRef(0);
  const targetFade    = useRef(0);
  const currentFade   = useRef(0);

  const targetStopFloat = useRef(0);

  const [viewportW, setViewportW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );
  const [currentDateLabel, setCurrentDateLabel] = useState(
    formatCurrentDate(new Date())
  );
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [activeEventIndex, setActiveEventIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeEvent = activeEventIndex !== null ? events[activeEventIndex] : null;

  // 0 = start(birth), 1..N = events, N+1 = present
  const NUM_STOPS = events.length + 2;

  useEffect(() => {
    let mounted = true;

    async function loadEvents() {
      try {
        const res = await fetch('/api/timeline?limit=250', { cache: 'no-store' });
        const json = await res.json();
        if (!mounted) return;

        if (!res.ok || !json?.success) return;
        const items = Array.isArray(json.items) ? json.items : [];
        if (items.length === 0) return;

        const normalized = items
          .map((item) => ({
            eventDate: formatEventDateLabel(String(item.eventDate || item.year || '')),
            title: typeof item.title === 'string' ? item.title : '',
            shortDescription: typeof item.shortDescription === 'string' ? item.shortDescription : (typeof item.desc === 'string' ? item.desc : ''),
            description: typeof item.description === 'string' ? item.description : (typeof item.details === 'string' ? item.details : ''),
            image: typeof item.image === 'string' ? item.image : '',
          }))
          .filter((item) => item.eventDate && item.title && item.shortDescription && item.description && item.image);

        if (normalized.length > 0) setEvents(normalized);
      } catch (err) {
        console.error('Timeline load failed, using default events:', err);
      }
    }

    loadEvents();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    ballRefs.current = ballRefs.current.slice(0, events.length);
    if (activeEventIndex !== null && activeEventIndex >= events.length) {
      setActiveEventIndex(null);
      setIsModalOpen(false);
    }
  }, [events, activeEventIndex]);

  const openEventModal = (index) => {
    if (modalCloseTimeoutRef.current) {
      clearTimeout(modalCloseTimeoutRef.current);
      modalCloseTimeoutRef.current = null;
    }
    if (modalOpenRafRef.current) {
      cancelAnimationFrame(modalOpenRafRef.current);
      modalOpenRafRef.current = null;
    }

    setActiveEventIndex(index);
    setIsModalOpen(false);
    modalOpenRafRef.current = requestAnimationFrame(() => {
      setIsModalOpen(true);
    });
  };

  const closeEventModal = () => {
    setIsModalOpen(false);
    if (modalCloseTimeoutRef.current) clearTimeout(modalCloseTimeoutRef.current);
    modalCloseTimeoutRef.current = setTimeout(() => {
      setActiveEventIndex(null);
      modalCloseTimeoutRef.current = null;
    }, MODAL_ANIM_MS);
  };

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0
    );
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    let intervalId;

    const timeoutId = setTimeout(() => {
      setCurrentDateLabel(formatCurrentDate(new Date()));
      intervalId = setInterval(() => {
        setCurrentDateLabel(formatCurrentDate(new Date()));
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (activeEventIndex === null) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeEventModal();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeEventIndex]);

  useEffect(() => {
    return () => {
      if (modalCloseTimeoutRef.current) clearTimeout(modalCloseTimeoutRef.current);
      if (modalOpenRafRef.current) cancelAnimationFrame(modalOpenRafRef.current);
    };
  }, []);

  // maxTranslate & viewport width on resize
  useEffect(() => {
    const update = () => setViewportW(window.innerWidth);
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  // All track geometry derived from viewport width so start ball is centred
  const startX      = viewportW / 2;
  const presentX    = startX + (NUM_STOPS - 1) * NODE_SPACING;
  const lineWidth   = presentX - startX;
  const rightPad    = Math.max(PAD_RIGHT_MIN, viewportW / 2);
  const totalTrack  = presentX + rightPad;
  const presentCenterTX = Math.max(0, presentX - viewportW / 2);
  const maxTranslate = Math.max(totalTrack - viewportW, presentCenterTX, 0);

  // ── RAF render loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);

      // ── Lerp fade ───────────────────────────
      const dF = targetFade.current - currentFade.current;
      if (Math.abs(dF) > 0.002) currentFade.current += dF * LERP_FADE;
      else                       currentFade.current  = targetFade.current;

      // ── Snap: only stop on discrete points (start, events, present) ──
      const stopIdx = Math.round(targetStopFloat.current);
      let clampedStop = Math.max(0, Math.min(NUM_STOPS - 1, stopIdx));
      if (targetStopFloat.current >= NUM_STOPS - 1 - 0.001) {
        clampedStop = NUM_STOPS - 1;
      }
      const snapBallX = startX + clampedStop * NODE_SPACING;
      const wantTX    = Math.max(0, Math.min(maxTranslate, snapBallX - viewportW / 2));

      const dTX = wantTX - currentTX.current;
      if (Math.abs(dTX) > 0.15) currentTX.current += dTX * LERP_TX;
      else                       currentTX.current  = wantTX;

      // ── Apply to DOM ─────────────────────────
      if (trackRef.current)
        trackRef.current.style.transform = `translateX(${-currentTX.current}px)`;

      if (innerRef.current)
        innerRef.current.style.opacity = currentFade.current;

      // ── Progress line (discrete to focused stop) ───────────────────────
      const smoothedIdx = (currentTX.current + viewportW / 2 - startX) / NODE_SPACING;
      const focusedStop = Math.max(0, Math.min(NUM_STOPS - 1, Math.round(smoothedIdx)));
      const fillPct     = focusedStop / (NUM_STOPS - 1);
      if (fillLineRef.current)
        fillLineRef.current.style.transform = `translateY(-50%) scaleX(${fillPct})`;

      // ── Ball glows ─────────────────────────────────────────────────────
      applyGlow(startBallRef.current, Math.min(1, smoothedIdx + 0.5));
      ballRefs.current.forEach((el, i) => {
        // event[i] is at stop index i+1; lights up as we arrive at it
        const level = smoothedIdx - (i + 1) + 1;
        applyGlow(el, level);
      });
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [maxTranslate, viewportW, startX]);

  // ── Scroll handler ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect       = section.getBoundingClientRect();
      const scrollable = Math.max(section.offsetHeight - window.innerHeight, 1);
      const scrolled   = Math.min(Math.max(-rect.top, 0), scrollable);

      // Fade phase: complete within first viewport-height of scroll
      const fadeRaw = scrolled / window.innerHeight;
      targetFade.current = Math.min(Math.max(fadeRaw * 2, 0), 1);

      // Timeline phase: only starts after fade is mostly done (>50vh scrolled)
      const timelineScrolled = Math.max(scrolled - window.innerHeight * 0.5, 0);
      const timelineTotal    = scrollable - window.innerHeight * 0.5;
      const timelineProgress = timelineScrolled / Math.max(timelineTotal, 1);

      // Map 0..1 -> stop float 0..(NUM_STOPS-1): start -> events -> present
      targetStopFloat.current = timelineProgress * (NUM_STOPS - 1);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [NUM_STOPS]);

  return (
    <section
      ref={sectionRef}
      style={{
        position:   'relative',
        height:     '700vh',
        width:      '100%',
        background: activeEvent ? '#050b1e' : '#080808',
        transition: `background ${MODAL_ANIM_MS + 180}ms ease`,
      }}
    >
      {/* ── Sticky viewport ─────────────────────────────────────────────── */}
      <div
        ref={innerRef}
        style={{
          position:   'sticky',
          top:        0,
          height:     '100vh',
          width:      '100%',
          overflow:   'hidden',
          display:    'flex',
          alignItems: 'center',
          opacity:    0,
          willChange: 'opacity',
        }}
      >
        {activeEvent && (
          <div
            onClick={closeEventModal}
            style={{
              position:      'absolute',
              inset:         0,
              zIndex:        25,
              background:    'radial-gradient(circle at 50% 45%, rgba(66, 133, 244, 0.28), rgba(7, 20, 54, 0.62) 55%, rgba(2, 7, 18, 0.84) 100%)',
              backdropFilter:'blur(6px)',
              opacity:       isModalOpen ? 1 : 0,
              transition:    `opacity ${MODAL_ANIM_MS}ms ease`,
            }}
          />
        )}

        {/* Right-edge fade mask: nodes fade in as they enter from the right */}
        <div style={{
          position:   'absolute',
          top:        0,
          right:      0,
          width:      '35%',
          height:     '100%',
          background: 'linear-gradient(to left, #080808 0%, rgba(8,8,8,0) 100%)',
          zIndex:     10,
          pointerEvents: 'none',
        }} />
        {/* Left-edge fade mask */}
        <div style={{
          position:   'absolute',
          top:        0,
          left:       0,
          width:      '20%',
          height:     '100%',
          background: 'linear-gradient(to right, #080808 0%, rgba(8,8,8,0) 100%)',
          zIndex:     10,
          pointerEvents: 'none',
        }} />

        {/* ── Moving track ──────────────────────────────────────────────── */}
        <div
          ref={trackRef}
          style={{
            position:   'relative',
            width:      `${totalTrack}px`,
            height:     '320px',
            flexShrink: 0,
            willChange: 'transform',
          }}
        >
          {/* Dim background line */}
          <div style={{
            position:   'absolute',
            top:        '50%',
            left:       `${startX}px`,
            width:      `${lineWidth}px`,
            height:     '1px',
            background: 'rgba(255,255,255,0.12)',
            transform:  'translateY(-50%)',
          }} />

          {/* Animated fill line */}
          <div
            ref={fillLineRef}
            style={{
              position:        'absolute',
              top:             '50%',
              left:            `${startX}px`,
              width:           `${lineWidth}px`,
              height:          '1px',
              background:      'rgba(255,255,255,0.75)',
              transform:       'translateY(-50%) scaleX(0)',
              transformOrigin: 'left center',
            }}
          />

          {/* ── Big start ball ──────────────────────────────────────────── */}
          <div
            style={{
              position:  'absolute',
              left:      `${startX}px`,
              top:       '50%',
              transform: 'translate(-50%, -50%)',
              zIndex:    3,
            }}
          >
            <div
              ref={startBallRef}
              style={{
                width:        `${START_R * 2}px`,
                height:       `${START_R * 2}px`,
                borderRadius: '50%',
                background:   'rgba(255,255,255,0.3)',
                boxShadow:    '0 0 4px rgba(255,255,255,0.1)',
                transition:   'none',
              }}
            />
            <div style={{
              position:      'absolute',
              top:           `${START_R * 2 + 14}px`,
              left:          '50%',
              transform:     'translateX(-50%)',
              fontSize:      '0.76rem',
              fontWeight:    600,
              letterSpacing: '0.04em',
              color:         'white',
              whiteSpace:    'nowrap',
              fontFamily:    'var(--font-main), sans-serif',
            }}>
              Birth
            </div>
            <div style={{
              position:      'absolute',
              top:           `${START_R * 2 + 30}px`,
              left:          '50%',
              transform:     'translateX(-50%)',
              fontSize:      '0.56rem',
              fontWeight:    500,
              letterSpacing: '0.08em',
              opacity:       0.7,
              color:         'white',
              whiteSpace:    'nowrap',
              fontFamily:    'var(--font-main), sans-serif',
            }}>
              2004 12 12
            </div>
          </div>

          {/* ── Event nodes ─────────────────────────────────────────────── */}
          {events.map((event, i) => {
            const cx    = startX + (i + 1) * NODE_SPACING;
            const above = i % 2 === 0;

            return (
              <div
                key={i}
                style={{
                  position:  'absolute',
                  left:      `${cx}px`,
                  top:       '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex:    2,
                }}
              >
                {/* Ball */}
                <button
                  type="button"
                  onClick={() => openEventModal(i)}
                  aria-label={`Open details for ${event.title} (${event.year})`}
                  ref={el => ballRefs.current[i] = el}
                  style={{
                    width:        `${NODE_R * 2}px`,
                    height:       `${NODE_R * 2}px`,
                    borderRadius: '50%',
                    background:   'rgba(255,255,255,0.3)',
                    boxShadow:    '0 0 4px rgba(255,255,255,0.1)',
                    position:     'relative',
                    zIndex:       2,
                    flexShrink:   0,
                    border:       'none',
                    outline:      'none',
                    cursor:       'pointer',
                    padding:      0,
                  }}
                />

                {/* Connector tick */}
                <div style={{
                  position:   'absolute',
                  left:       '50%',
                  transform:  'translateX(-50%)',
                  width:      '1px',
                  background: 'rgba(255,255,255,0.18)',
                  ...(above
                    ? { top:    `${NODE_R * 2}px`,    height: '20px' }
                    : { bottom: `${NODE_R * 2}px`,    height: '20px' }),
                }} />

                {/* Label */}
                <div style={{
                  position:  'absolute',
                  left:      '50%',
                  transform: 'translateX(-50%)',
                  ...(above
                    ? { bottom: `${NODE_R * 2 + 22}px` }
                    : { top:    `${NODE_R * 2 + 22}px` }),
                  textAlign:  'center',
                  color:      'white',
                  whiteSpace: 'nowrap',
                }}>
                  <div style={{
                    fontSize:      '0.58rem',
                    opacity:       0.4,
                    letterSpacing: '0.12em',
                    marginBottom:  '3px',
                    fontFamily:    'var(--font-main), sans-serif',
                  }}>
                    {event.eventDate}
                  </div>
                  <div style={{
                    fontSize:      '0.76rem',
                    fontWeight:    600,
                    marginBottom:  '4px',
                    fontFamily:    'var(--font-main), sans-serif',
                    letterSpacing: '0.04em',
                  }}>
                    {event.title}
                  </div>
                  <div style={{
                    fontSize:   '0.63rem',
                    opacity:    0.5,
                    maxWidth:   '130px',
                    whiteSpace: 'normal',
                    lineHeight: 1.4,
                    fontFamily: 'var(--font-mulish), sans-serif',
                  }}>
                    {event.shortDescription}
                  </div>
                </div>
              </div>
            );
          })}

          {/* ── Present marker ──────────────────────────────────────────── */}
          <div style={{
            position:  'absolute',
            left:      `${presentX}px`,
            top:       '50%',
            transform: 'translateX(-50%)',
            color:     'white',
            zIndex:    3,
          }}>
            <div style={{
              position:      'absolute',
              bottom:        '120px',
              left:          '50%',
              transform:     'translateX(-50%)',
              fontSize:      '0.56rem',
              opacity:       0.4,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontFamily:    'var(--font-main), sans-serif',
              whiteSpace:    'nowrap',
            }}>
              {currentDateLabel}
            </div>
            <div style={{
              width:        '1.5px',
              height:       '110px',
              background:   'linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.05))',
              borderRadius: '1px',
              transform:    'translateY(-100%)',
            }} />
          </div>
        </div>

        {activeEvent && (
          <div
            onClick={closeEventModal}
            style={{
              position:      'absolute',
              inset:         0,
              zIndex:        35,
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              padding:       '1.2rem',
              opacity:       isModalOpen ? 1 : 0,
              transition:    `opacity ${MODAL_ANIM_MS}ms ease`,
            }}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              style={{
                width:         'min(760px, 94vw)',
                maxHeight:     '84vh',
                overflowY:     'auto',
                borderRadius:  '20px',
                border:        '1px solid rgba(255,255,255,0.22)',
                background:    'linear-gradient(160deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))',
                boxShadow:     '0 20px 60px rgba(0, 20, 80, 0.45)',
                backdropFilter:'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                color:         'white',
                transform:     isModalOpen ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.96)',
                opacity:       isModalOpen ? 1 : 0,
                transition:    `transform ${MODAL_ANIM_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${MODAL_ANIM_MS}ms ease`,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxHeight: '58vh',
                  overflow: 'hidden',
                  background: 'rgba(5, 11, 30, 0.65)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={activeEvent.image}
                  alt={`${activeEvent.title} visual`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '58vh',
                    objectFit: 'contain',
                    display: 'block',
                    opacity: 0.92,
                  }}
                />
                <div style={{
                  position:   'absolute',
                  inset:      0,
                  background: 'linear-gradient(to top, rgba(5,11,30,0.85), rgba(5,11,30,0.2) 55%, rgba(5,11,30,0))',
                }} />
                <button
                  type="button"
                  onClick={closeEventModal}
                  aria-label="Close event details"
                  style={{
                    position:      'absolute',
                    top:           '12px',
                    right:         '12px',
                    width:         '34px',
                    height:        '34px',
                    borderRadius:  '999px',
                    border:        '1px solid rgba(255,255,255,0.35)',
                    background:    'rgba(255,255,255,0.15)',
                    color:         'white',
                    cursor:        'pointer',
                    fontSize:      '1.05rem',
                    lineHeight:    1,
                    backdropFilter:'blur(8px)',
                  }}
                >
                  ×
                </button>
                <div style={{ position: 'absolute', left: '1.1rem', bottom: '1rem' }}>
                  <div style={{ fontSize: '0.68rem', opacity: 0.75, letterSpacing: '0.18em', fontFamily: 'var(--font-main), sans-serif' }}>
                    {activeEvent.eventDate}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.35rem', fontFamily: 'var(--font-main), sans-serif' }}>
                    {activeEvent.title}
                  </div>
                </div>
              </div>

              <div style={{ padding: '1.2rem 1.2rem 1.3rem' }}>
                <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.7, fontSize: '0.95rem', fontFamily: 'var(--font-mulish), sans-serif' }}>
                  {activeEvent.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Scroll hint ───────────────────────────────────────────────── */}
        <div style={{
          position:      'absolute',
          bottom:        '2.5rem',
          left:          '50%',
          transform:     'translateX(-50%)',
          fontSize:      '0.58rem',
          opacity:       0.25,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color:         'white',
          fontFamily:    'var(--font-main), sans-serif',
          whiteSpace:    'nowrap',
          pointerEvents: 'none',
        }}>
          scroll to explore
        </div>
      </div>
    </section>
  );
}

