import React from 'react';
import { Wifi, Signal, BatteryCharging, Smartphone, Monitor } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  isDeviceFrame: boolean;
  onToggleFrame: () => void;
}

export const AndroidFrame: React.FC<Props> = ({ children, isDeviceFrame, onToggleFrame }) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!isDeviceFrame) {
    return (
      <div className="w-full h-screen flex flex-col bg-[#070a10]">
        {/* Top Control Strip */}
        <div className="bg-[#05070c] border-b border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">Encrypted Chat</span>
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">| Native Android E2EE Modus</span>
          </div>
          <button
            onClick={onToggleFrame}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition border border-slate-700"
            title="Zu Android Pixel Geräte-Rahmen wechseln"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pixel 9 Rahmen</span>
          </button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#030508] flex flex-col items-center justify-center p-0 sm:p-4 select-none overflow-hidden relative">
      {/* Top Floating Switcher */}
      <div className="absolute top-3 z-50 flex items-center gap-2 bg-[#0c111c]/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-full shadow-2xl text-xs text-slate-300">
        <span className="flex items-center gap-1.5 font-mono text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Android E2EE Aktiv
        </span>
        <span className="text-slate-600">|</span>
        <button
          onClick={onToggleFrame}
          className="flex items-center gap-1 hover:text-cyan-400 transition"
          title="Zu Vollbild-Ansicht wechseln"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Vollbild</span>
        </button>
      </div>

      {/* Android Phone Hardware Shell */}
      <div className="relative w-full max-w-[420px] h-full sm:h-[860px] sm:max-h-[92vh] bg-[#070a10] sm:rounded-[44px] sm:border-[8px] sm:border-[#1e293b] sm:shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_20px_rgba(16,185,129,0.15)] flex flex-col overflow-hidden">
        
        {/* Android Status Bar */}
        <div className="h-10 w-full bg-[#070a10] px-6 flex items-center justify-between text-xs text-slate-300 font-mono shrink-0 select-none z-40">
          <div className="flex items-center gap-1 font-semibold text-[11px] tracking-tight text-slate-200">
            <span>{currentTime}</span>
          </div>

          {/* Centered Camera Punch Hole */}
          <div className="w-4 h-4 rounded-full bg-black border border-slate-800/80 shadow-inner flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
          </div>

          {/* Connectivity Icons */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5 text-emerald-400">
              <BatteryCharging className="w-4 h-4" />
              <span className="text-[10px]">98%</span>
            </div>
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {children}
        </div>

        {/* Android Gesture Navigation Bar (Bottom Inset) */}
        <div className="h-6 w-full bg-[#070a10] flex items-center justify-center shrink-0 z-40">
          <div className="w-32 h-1 rounded-full bg-slate-600/80 hover:bg-slate-400 transition" />
        </div>
      </div>
    </div>
  );
};
