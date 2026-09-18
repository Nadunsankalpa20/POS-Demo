import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { soundService } from '../services/audio';
import {
  Lock, User, ArrowRight, ShieldCheck, Sparkles,
  Monitor, Eye, EyeOff, Clock, Wifi,
  ShoppingBag, CheckCircle2, TrendingUp, Package,
  Activity, Maximize2
} from 'lucide-react';
import storePanelImg from '../assets/store-panel.jpg';

/* ──────────────────────────────────────────────────────────────
   HIGH-PERFORMANCE CANVAS PARTICLE NETWORK (particles.js style)
   Pure Canvas · Dynamic Mouse Reactivity · Emerald/Cyan Glow
────────────────────────────────────────────────────────────── */
interface PNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  colorRgb: string;
}

interface ParticleCanvasProps {
  mousePosRef: React.MutableRefObject<{ x: number; y: number }>;
}

const ParticleCanvas: React.FC<ParticleCanvasProps> = ({ mousePosRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodes = useRef<PNode[]>([]);

  const colors = [
    '16, 185, 129', // emerald-500
    '52, 211, 153', // emerald-400
    '20, 184, 166', // teal-500
    '6, 182, 212',  // cyan-500
  ];

  const init = useCallback((w: number, h: number) => {
    const count = Math.min(Math.floor((w * h) / 7500), 75);
    nodes.current = Array.from({ length: Math.max(count, 45) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 1.6 + 1.2,
      alpha: Math.random() * 0.45 + 0.35,
      colorRgb: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      init(w, h);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const LINK_DIST = 115;
    const MOUSE_DIST = 145;

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const pts = nodes.current;
      const mouse = mousePosRef.current;

      // Update positions
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce on boundaries
        if (p.x <= 0 || p.x >= w) p.vx *= -1;
        if (p.y <= 0 || p.y >= h) p.vy *= -1;

        // Gentle repulsion from cursor
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 60 && md > 0) {
          const force = (60 - md) / 60;
          p.x += (mdx / md) * force * 1.2;
          p.y += (mdy / md) * force * 1.2;
        }
      }

      // Draw particle-to-particle links
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.28;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        // Draw particle-to-mouse links
        const mdx = pts[i].x - mouse.x;
        const mdy = pts[i].y - mouse.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < MOUSE_DIST) {
          const alpha = (1 - md / MOUSE_DIST) * 0.6;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw particle nodes with soft neon glow
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.colorRgb}, ${p.alpha})`;
        ctx.shadowColor = `rgba(${p.colorRgb}, 0.75)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [init, mousePosRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.75 }}
    />
  );
};

/* ──────────────────────────────────────────────────────────────
   STAT CARD (Right Panel Live Metrics)
────────────────────────────────────────────────────────────── */
interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent: string;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, accent, delay }) => (
  <div
    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-lg"
    style={{ animation: `ios-slide-up 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s both` }}
  >
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
      {icon}
    </div>
    <div>
      <div className="text-white font-black text-sm leading-none">{value}</div>
      <div className="text-white/50 text-[10px] mt-0.5 font-medium">{label}</div>
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   MAIN LOGIN SCREEN COMPONENT
────────────────────────────────────────────────────────────── */
export const LoginScreen: React.FC = () => {
  const { login, terminalId } = useAuthStore();
  const [username, setUsername] = useState('cashier');
  const [password, setPassword] = useState('cashier123');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [scanY, setScanY] = useState(0);

  // Mouse coordinate tracker for particle canvas
  const mousePosRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });

  /* Live Clock with seconds */
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(n.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(n.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* Sweeping laser scan line on right panel */
  useEffect(() => {
    let y = 0;
    const id = setInterval(() => {
      y = y >= 100 ? 0 : y + 0.35;
      setScanY(y);
    }, 16);
    return () => clearInterval(id);
  }, []);

  /* Handle form submission */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.login(username, password);
      soundService.playScanBeep();
      login(data.user, data.token);
    } catch (err: any) {
      soundService.playErrorBuzz();
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /* Quick profile selector */
  const quickSelect = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    soundService.playScanBeep();
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden flex font-sans select-none bg-[#070b12]">

      {/* ══════════════════════════════════════════════════════════════
          LEFT PANEL — Sleek Narrow Dark Login Form with Particles
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="relative z-10 w-full lg:w-[410px] xl:w-[440px] 2xl:w-[470px] shrink-0 h-full flex flex-col justify-between overflow-y-auto no-scrollbar bg-[#070b12] border-r border-white/[0.08] shadow-[15px_0_40px_rgba(0,0,0,0.8)]"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          mousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }}
        onMouseLeave={() => {
          mousePosRef.current = { x: -9999, y: -9999 };
        }}
      >
        {/* Interactive Particle Network Canvas */}
        <ParticleCanvas mousePosRef={mousePosRef} />

        {/* Ambient Top Emerald Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent z-30" />

        {/* Subtle Radial Glow */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(16,185,129,0.07) 0%, transparent 70%)',
          }}
        />

        {/* ── 1. Top Header ── */}
        <header className="relative z-20 flex items-center justify-between px-7 py-5">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-white/20">
              <ShoppingBag className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#070b12] animate-green-pulse" />
            </div>
            <div>
              <div className="text-white font-black text-sm tracking-tight leading-none flex items-center gap-1">
                SUPER<span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">MART</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">POS</span>
              </div>
              <div className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                Workstation Edition
              </div>
            </div>
          </div>

          {/* Real-time Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 backdrop-blur-md">
            <Clock className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] font-bold text-emerald-300 tracking-wider">
              {time || '--:--:--'}
            </span>
          </div>
        </header>

        {/* ── 2. Center Form Container ── */}
        <main className="relative z-20 flex-1 flex flex-col justify-center px-7 py-4">

          {/* Heading & Greeting */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-widest uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Shift Access · Terminal {terminalId || '01'}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
              Welcome back,
            </h1>
            <h2 className="text-2xl font-extrabold leading-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Cashier
            </h2>
            <p className="text-slate-400 text-xs mt-1.5 font-medium">
              Terminal <span className="text-emerald-400 font-bold">{terminalId}</span> · Authenticate to continue
            </p>
          </div>

          {/* Error Notification */}
          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <span className="text-sm">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Dark Glassmorphic Form Card */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/10 bg-[#0b121e]/90 backdrop-blur-2xl p-5 space-y-4 shadow-[0_20px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            {/* Cashier ID */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400 mb-1.5">
                Cashier ID
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none transition-colors group-focus-within:text-emerald-300" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-semibold text-white placeholder-slate-500 bg-[#060a12] border border-white/10 focus:border-emerald-500 focus:outline-none transition-all duration-200"
                  style={{
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.18), inset 0 2px 4px rgba(0,0,0,0.4)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.5)';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 pointer-events-none transition-colors group-focus-within:text-cyan-300" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-semibold text-white placeholder-slate-500 bg-[#060a12] border border-white/10 focus:border-cyan-500 focus:outline-none transition-all duration-200"
                  style={{
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.18), inset 0 2px 4px rgba(0,0,0,0.4)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.5)';
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Authenticate Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer group disabled:opacity-50 mt-2 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0891b2 100%)',
                boxShadow: '0 8px 24px -4px rgba(16,185,129,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  '0 12px 32px -4px rgba(16,185,129,0.7), inset 0 1px 0 rgba(255,255,255,0.35)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  '0 8px 24px -4px rgba(16,185,129,0.5), inset 0 1px 0 rgba(255,255,255,0.25)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <span className="tracking-widest uppercase text-[12px]">Authenticate &amp; Enter</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Profiles Switcher */}
          <div className="mt-4">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 text-center mb-2 flex items-center gap-2 justify-center">
              <div className="h-px flex-1 bg-white/5" />
              <span className="flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                Quick Profiles
              </span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { u: 'cashier',  p: 'cashier123', label: 'Cashier 1', sub: 'Lane 01', activeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' },
                { u: 'cashier2', p: 'cashier123', label: 'Cashier 2', sub: 'Lane 02', activeBg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' },
                { u: 'admin',    p: 'admin123',   label: 'Admin',    sub: 'Manager',  activeBg: 'bg-purple-500/15 border-purple-500/40 text-purple-300' },
              ].map((p) => {
                const isCurrent = username === p.u;
                return (
                  <button
                    key={p.u}
                    type="button"
                    onClick={() => quickSelect(p.u, p.p)}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                      isCurrent
                        ? p.activeBg
                        : 'border-white/5 bg-[#0b121e]/60 text-slate-400 hover:text-white hover:border-white/15'
                    }`}
                  >
                    <span className="text-[9px] opacity-65 font-mono">{p.sub}</span>
                    <span className="leading-none">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* ── 3. Bottom Footer ── */}
        <footer className="relative z-20 px-7 py-4 border-t border-white/[0.04] flex items-center justify-between bg-[#060a12]/80 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
            <span>PCI-DSS Compliant · v2.4</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <Wifi className="w-2.5 h-2.5" />
            <span>Cloud Active</span>
          </div>
        </footer>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          RIGHT PANEL — Previous Mathara Stores Store Image & Experience
      ══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block relative flex-1 h-full overflow-hidden">

        {/* Store Photo with Ken-Burns Motion */}
        <img
          src={storePanelImg}
          alt="Mathara Stores"
          className="absolute inset-0 w-full h-full object-cover object-center animate-subtle-zoom"
        />

        {/* Seamless Theme Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b12]/85 via-[#070b12]/25 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b12]/75 via-transparent to-[#070b12]/35 pointer-events-none z-10" />

        {/* Moving Laser Scan Line */}
        <div
          className="absolute left-0 right-0 pointer-events-none z-20"
          style={{
            top: `${scanY}%`,
            height: '2px',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0) 8%, rgba(16,185,129,0.85) 40%, rgba(52,211,153,1) 50%, rgba(16,185,129,0.85) 60%, rgba(16,185,129,0) 92%, transparent 100%)',
            boxShadow: '0 0 18px 4px rgba(16,185,129,0.45)',
          }}
        />

        {/* Dot-Grid Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035] z-10"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(16,185,129,1) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-emerald-500/15 rounded-full blur-[90px] pointer-events-none animate-ambient-green z-10" />
        <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-teal-500/12 rounded-full blur-[80px] pointer-events-none animate-pulse-glow z-10" />

        {/* Content Container */}
        <div className="relative z-30 h-full flex flex-col justify-between p-10">

          {/* Top Right: Terminal Badge & Fullscreen */}
          <div className="flex items-center justify-end gap-2.5">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md text-xs font-mono text-white shadow-lg">
              <Monitor className="w-3.5 h-3.5 text-emerald-400" />
              <span>Terminal: <strong className="text-emerald-300">{terminalId || '01'}</strong></span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-green-pulse" />
            </div>
            <button
              onClick={handleFullscreen}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer shadow-lg"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Center: Glowing Glass Logo Card & Live Stats */}
          <div className="flex flex-col items-center gap-6">

            {/* Frosted Glass Logo Card */}
            <div
              className="p-0.5 rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.7), rgba(6,182,212,0.4), rgba(16,185,129,0.7))',
                animation: 'ios-enter 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s both',
              }}
            >
              <div className="px-10 py-6 rounded-[22px] bg-black/55 backdrop-blur-xl text-center border border-white/10 shadow-2xl">
                <div className="text-[10px] font-extrabold tracking-[0.3em] text-emerald-400 uppercase mb-2">
                  Welcome to
                </div>
                <div className="text-4xl xl:text-5xl font-black text-white leading-tight">
                  මාතර
                </div>
                <div className="text-3xl xl:text-4xl font-black leading-tight mt-1">
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                    ස්ටෝරස්
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-300 mt-1.5 tracking-[0.2em] uppercase">
                  Mathara Stores
                </div>
                <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-emerald-400 font-semibold tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-green-pulse" />
                  <span>Fresh · Quality · Better Life</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-green-pulse" />
                </div>
              </div>
            </div>

            {/* Live Stat Cards */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
              <StatCard
                icon={<TrendingUp className="w-4 h-4 text-emerald-300" />}
                value="2,847"
                label="Today"
                delay={0.25}
                accent="bg-emerald-500/20 border border-emerald-500/30"
              />
              <StatCard
                icon={<Package className="w-4 h-4 text-cyan-300" />}
                value="1,200+"
                label="Products"
                delay={0.35}
                accent="bg-cyan-500/20 border border-cyan-500/30"
              />
              <StatCard
                icon={<Activity className="w-4 h-4 text-amber-300" />}
                value="99.9%"
                label="Uptime"
                delay={0.45}
                accent="bg-amber-500/20 border border-amber-500/30"
              />
            </div>
          </div>

          {/* Bottom Row: Shift Info & Security Badge */}
          <div className="flex items-end justify-between" style={{ animation: 'ios-slide-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.4s both' }}>
            <div>
              <div className="text-xs font-semibold text-white/80">{date}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Morning Shift · Cash Drawer Ready</div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PCI-DSS Secured</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default LoginScreen;
