import React, { useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';

type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number, f: number) => void;

function useCanvas(draw: DrawFn) {
  const ref = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const rafRef = useRef(0);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const tick = () => {
      frameRef.current++;
      const ctx = canvas.getContext('2d');
      if (ctx) drawRef.current(ctx, canvas.width, canvas.height, frameRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  return ref;
}

/* ── Dynamic (Generic) Ambient ── */
function DynamicAmbient({ color1, color2, bg }: { color1: string, color2: string, bg: string }) {
  const draw = useCallback<DrawFn>((ctx, w, h, f) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const t = f * 0.003;
    const layers = [
      { x: 0.2, y: 0.3, c: color1, r: w * 0.7, s: 1 },
      { x: 0.8, y: 0.7, c: color2, r: w * 0.6, s: -0.8 }
    ];

    layers.forEach((l, i) => {
      const x = (l.x + Math.sin(t * l.s + i) * 0.1) * w;
      const y = (l.y + Math.cos(t * l.s * 0.8 + i) * 0.1) * h;
      const g = ctx.createRadialGradient(x, y, 0, x, y, l.r);
      g.addColorStop(0, l.c + '08'); 
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; 
      ctx.globalCompositeOperation = 'screen';
      ctx.fillRect(0, 0, w, h);
    });
  }, [color1, color2, bg]);
  const ref = useCanvas(draw);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -50 }} />;
}

/* ── Amber Noir (Golden Dust) ── */
function AmberNoirAmbient() {
  const particles = useRef(Array.from({ length: 40 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.15 + 0.05,
    o: Math.random()
  })));

  const draw = useCallback<DrawFn>((ctx, w, h, f) => {
    ctx.fillStyle = '#050400';
    ctx.fillRect(0, 0, w, h);
    
    const t = f * 0.005;
    const g = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.8);
    g.addColorStop(0, 'rgba(245, 158, 11, 0.05)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    particles.current.forEach(p => {
      p.y -= p.speed * 0.01;
      if (p.y < 0) { p.y = 1; p.x = Math.random(); }
      const px = p.x * w;
      const py = p.y * h;
      const alpha = (Math.sin(t + p.o * 10) * 0.3 + 0.4) * 0.6;
      ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 158, 11, ${alpha})`; ctx.fill();
    });
  }, []);
  const ref = useCanvas(draw);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -50 }} />;
}

/* ── Plasma ── */
function PlasmaAmbient() {
  const draw = useCallback<DrawFn>((ctx, w, h, f) => {
    ctx.fillStyle = 'rgba(4,0,17,0.12)';
    ctx.fillRect(0, 0, w, h);
    const t = f * 0.006;
    ([[0.15, 0.5, '#FF4ECD', 90], [0.85, 0.1, '#7B5EFF', 100], [0.5, 0.9, '#4FFFCE', 60]] as [number, number, string, number][]).forEach(([rx, ry, c, r]) => {
      const x = (Math.sin(t + rx * 3.1) * 0.08 + rx) * w;
      const y = (Math.cos(t * 0.7 + ry * 2) * 0.06 + ry) * h;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, c + '20'); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
  }, []);
  const ref = useCanvas(draw);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -50, opacity: 0.8 }} />;
}

/* ── Deep Sea ── */
function DeepSeaAmbient() {
  const particles = useRef(Array.from({ length: 20 }, (_, i) => ({ x: Math.random(), y: Math.random(), r: Math.random() * 2 + 0.5, speed: Math.random() * 0.25 + 0.08, phase: i * 0.4 })));
  const draw = useCallback<DrawFn>((ctx, w, h, f) => {
    ctx.fillStyle = 'rgba(0,8,20,0.14)';
    ctx.fillRect(0, 0, w, h);
    const t = f * 0.008;
    const g = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.3, h * 0.2, 100);
    g.addColorStop(0, 'rgba(0,180,130,0.07)'); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    particles.current.forEach(p => {
      p.y -= p.speed * 0.0007;
      if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
      const px = (Math.sin(t + p.phase) * 0.04 + p.x) * w;
      const py = p.y * h;
      const alpha = Math.sin(t * 2 + p.phase) * 0.3 + 0.45;
      ctx.beginPath(); ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,200,${alpha})`;
      ctx.shadowBlur = 8; ctx.shadowColor = '#00FFC8';
      ctx.fill(); ctx.shadowBlur = 0;
    });
  }, []);
  const ref = useCanvas(draw);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -50, opacity: 0.75 }} />;
}

/* ── Lava Forge ── */
function LavaForgeAmbient() {
  const draw = useCallback<DrawFn>((ctx, w, h, f) => {
    ctx.fillStyle = 'rgba(8,1,0,0.18)';
    ctx.fillRect(0, 0, w, h);
    const t = f * 0.007;
    const baseGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
    baseGrad.addColorStop(0, 'transparent'); baseGrad.addColorStop(1, 'rgba(255,50,0,0.08)');
    ctx.fillStyle = baseGrad; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) {
      const bx = (Math.sin(t * 0.8 + i * 2.1) * 0.3 + 0.5) * w;
      const by = h - (Math.abs(Math.sin(t * 0.5 + i * 1.3)) * h * 0.35 + h * 0.05);
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, 80 + i * 20);
      g.addColorStop(0, `rgba(255,${60 + i * 30},0,0.1)`); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    for (let s = 0; s < 2; s++) {
      const sx = (Math.sin(t * 3 + s * 1.7) * 0.4 + 0.5) * w;
      const sy = h - ((f * 0.7 + s * 70) % (h * 0.6));
      const sa = Math.max(0, 1 - (h - sy) / (h * 0.6));
      ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,180,0,${sa * 0.6})`;
      ctx.shadowBlur = 6; ctx.shadowColor = '#FF8C00';
      ctx.fill(); ctx.shadowBlur = 0;
    }
  }, []);
  const ref = useCanvas(draw);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -50, opacity: 0.85 }} />;
}

/* ── Aurora ── */
function AuroraAmbient() {
  const starsRef = useRef<{ x: number; y: number; r: number; phase: number }[]>([]);
  const draw = useCallback<DrawFn>((ctx, w, h, f) => {
    ctx.clearRect(0, 0, w, h);
    if (starsRef.current.length === 0) {
      starsRef.current = Array.from({ length: 35 }, () => ({ x: Math.random() * w, y: Math.random() * h * 0.75, r: Math.random() * 1.5 + 0.3, phase: Math.random() * Math.PI * 2 }));
    }
    const t = f * 0.004;
    starsRef.current.forEach(s => {
      const a = Math.sin(t * 2 + s.phase) * 0.2 + 0.25;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
    });
    ([
      { yBase: 0.2, c1: 'rgba(180,120,255,', c2: 'rgba(100,200,255,', amp: 30 },
      { yBase: 0.48, c1: 'rgba(100,200,255,', c2: 'rgba(150,255,220,', amp: 22 },
      { yBase: 0.7, c1: 'rgba(200,100,255,', c2: 'rgba(120,80,255,', amp: 20 },
    ]).forEach((wave, wi) => {
      ctx.beginPath(); ctx.moveTo(0, wave.yBase * h);
      for (let x = 0; x <= w; x += 3) {
        const y = wave.yBase * h + Math.sin(x * 0.012 + t + wi) * wave.amp + Math.sin(x * 0.007 + t * 0.6 + wi * 1.2) * wave.amp * 0.6;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
      const g = ctx.createLinearGradient(0, wave.yBase * h - wave.amp, 0, wave.yBase * h + wave.amp);
      g.addColorStop(0, wave.c1 + '0.06)'); g.addColorStop(0.5, wave.c1 + '0.1)'); g.addColorStop(1, wave.c2 + '0.02)');
      ctx.fillStyle = g; ctx.fill();
    });
  }, []);
  const ref = useCanvas(draw);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -50, opacity: 0.9 }} />;
}

export default function AmbientBackground() {
  const { theme } = useTheme();
  switch (theme.id) {
    case 'plasma': return <PlasmaAmbient />;
    case 'deepsea': return <DeepSeaAmbient />;
    case 'lavaforge': return <LavaForgeAmbient />;
    case 'aurora': return <AuroraAmbient />;
    case 'amber-noir': return <AmberNoirAmbient />;
    default: return (
      <DynamicAmbient 
        color1={theme.vars['--ct-a1']} 
        color2={theme.vars['--ct-a2']} 
        bg={theme.vars['--ct-bg']} 
      />
    );
  }
}
