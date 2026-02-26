"use client";

import { useEffect, useRef } from "react";

const TOTAL_FRAMES = 139;
// Lerp factor: 0.1 = ultra-smooth inertia, increase toward 1.0 for more snappy
const LERP = 0.1;

const frameSrc = (i) => `/hero/frame_${String(i).padStart(4, "0")}.jpg`;

export default function ScrollScrubVideo({ sectionRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef?.current;
    if (!canvas || !section) return;

    // alpha:true so the page background shows around the frame
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });

    let destroyed = false;
    let rafId = null;
    const images = new Array(TOTAL_FRAMES).fill(null);

    // Smooth lerp state — progress is a float 0..1
    let targetProgress = 0;
    let currentProgress = 0;
    let lastDrawnFrame = -1;
    let dpr = 1;

    // ── Canvas sizing: full viewport ─────────────────────────────────────────
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = window.innerWidth;
      const cssH = window.innerHeight;
      canvas.width  = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      lastDrawnFrame = -1; // force redraw after resize
    };
    resize();

    // ── Cover-fit draw (image fills canvas, cropping if needed) ─────────────
    const paint = (img) => {
      if (!img?.complete || img.naturalWidth === 0) return;
      const cw = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth  * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };

    // ── RAF loop: lerp progress, only repaint when frame index changes ───────
    const render = () => {
      if (destroyed) return;
      rafId = requestAnimationFrame(render);

      const diff = targetProgress - currentProgress;
      // Stop micro-lerping when close enough (perf guard)
      if (Math.abs(diff) > 0.0002) {
        currentProgress += diff * LERP;
      } else {
        currentProgress = targetProgress;
      }

      const idx = Math.min(
        Math.round(currentProgress * (TOTAL_FRAMES - 1)),
        TOTAL_FRAMES - 1
      );

      if (idx !== lastDrawnFrame && images[idx]) {
        lastDrawnFrame = idx;
        paint(images[idx]);
      }
    };
    rafId = requestAnimationFrame(render);

    // ── Scroll → update target progress (no frame math here) ─────────────────
    const getProgress = () => {
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(section.offsetHeight - window.innerHeight, 1);
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
      return scrolled / scrollable;
    };

    const onScroll = () => { targetProgress = getProgress(); };
    window.addEventListener("scroll", onScroll, { passive: true });

    // ── Resize (debounced to one rAF) ────────────────────────────────────────
    let resizePending = false;
    const onResize = () => {
      if (resizePending) return;
      resizePending = true;
      requestAnimationFrame(() => { resizePending = false; resize(); });
    };
    window.addEventListener("resize", onResize, { passive: true });

    // ── Frame loading: first frame priority, rest batched immediately ────────
    const loadFrame = (i) => {
      if (destroyed || images[i]) return;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (destroyed) return;
        images[i] = img;
        // If this is the frame currently needed, mark for repaint
        if (i === lastDrawnFrame || lastDrawnFrame === -1) lastDrawnFrame = -1;
      };
      img.src = frameSrc(i + 1);
    };

    loadFrame(0);
    // Small timeout before batching the rest keeps first frame load snappy
    const batchTimer = setTimeout(() => {
      for (let i = 1; i < TOTAL_FRAMES; i++) loadFrame(i);
    }, 50);

    // Set initial state
    targetProgress = getProgress();
    currentProgress = targetProgress;

    return () => {
      destroyed = true;
      clearTimeout(batchTimer);
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [sectionRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="hero-frame-canvas"
    />
  );
}
