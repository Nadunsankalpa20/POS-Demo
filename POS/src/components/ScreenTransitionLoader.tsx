import React from 'react';
import { Store, Sparkles, CheckCircle2 } from 'lucide-react';

interface ScreenTransitionLoaderProps {
  message?: string;
  subMessage?: string;
}

export const ScreenTransitionLoader: React.FC<ScreenTransitionLoaderProps> = ({
  message = 'Synchronizing Supermarket Terminal...',
  subMessage = 'Connecting to Local Database & Cloud Sync Engine',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl animate-fade-in select-none">
      {/* Background ambient light mesh */}
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Center Frosted Glass Loader Card */}
      <div className="relative p-8 sm:p-10 rounded-3xl ios-glass-card max-w-sm w-full mx-4 text-center shadow-2xl flex flex-col items-center animate-slide-up border border-white/20">
        
        {/* Animated Brand Emblem */}
        <div className="relative mb-6">
          {/* Pulsing ring */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 opacity-40 blur-lg animate-pulse" />
          
          {/* Spinner Border */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-[2px] shadow-xl">
            <div className="w-full h-full rounded-[22px] bg-slate-950/90 flex items-center justify-center text-white relative overflow-hidden">
              <Store className="w-9 h-9 text-emerald-400" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Dynamic Heading */}
        <h3 className="text-lg font-black tracking-tight text-white flex items-center justify-center gap-1.5">
          <span>SUPERMART 3D</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            SYSTEM
          </span>
        </h3>

        {/* Status Message */}
        <p className="text-sm font-extrabold text-emerald-400 mt-2">
          {message}
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-[240px] leading-relaxed">
          {subMessage}
        </p>

        {/* Apple Fluid Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-6 relative">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 animate-shimmer w-full" />
        </div>

        {/* Bottom subtle compliance note */}
        <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Encrypted Session • High Availability</span>
        </div>
      </div>
    </div>
  );
};
