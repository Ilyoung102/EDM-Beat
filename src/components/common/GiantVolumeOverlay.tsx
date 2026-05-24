/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { useStudioState } from '../../store/useStudioStore';
import { Volume2, VolumeX, X, SlidersHorizontal, Activity, Info } from 'lucide-react';

export default function GiantVolumeOverlay() {
  const { state, actions } = useStudioState();
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Close with the escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        actions.closeVolumeEdit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);

  if (!state.activeVolumeEdit) return null;

  const { type, id, name, volume } = state.activeVolumeEdit;

  // Convert raw value (0.0 to 1.2) to percentage representation
  const percent = Math.round((volume / 1.2) * 100);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = parseFloat(e.target.value);
    actions.updateActiveVolume(Math.max(0.0, Math.min(1.2, nextVal)));
  };

  const setFixedVolume = (val: number) => {
    actions.updateActiveVolume(val);
  };

  // Safe dismiss when touching anywhere outside the popup card
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (
      containerRef.current && 
      !containerRef.current.contains(e.target as Node)
    ) {
      actions.closeVolumeEdit();
    }
  };

  return (
    <div
      ref={overlayRef}
      onMouseDown={handleBackdropClick}
      onTouchStart={handleBackdropClick}
      className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none"
      id="giant-volume-overlay"
    >
      <div
        ref={containerRef}
        onMouseDown={(e) => e.stopPropagation()} // stop event from closing when user touches inside the card
        onTouchStart={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-slate-900 border border-cyan-500/80 rounded-2xl p-6 shadow-[0_0_60px_rgba(6,182,212,0.4)] flex flex-col items-center gap-6 animate-scale-up"
        id="giant-volume-popup-card"
      >
        {/* Glowing top line accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 rounded-t-2xl" />

        {/* Header with Title and Dismiss Cross button */}
        <div className="w-full h-12 flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Volume2 className="text-cyan-400 animate-pulse" size={24} />
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-extrabold uppercase tracking-widest block leading-none">
                {type === 'drum' ? '🔊 DRUM TRACK CH LEVEL' : '🎚️ MIXER CONSOLE VOLUME'}
              </span>
              <h3 className="text-base font-mono font-black text-white uppercase mt-1 truncate max-w-[240px]">
                {name}
              </h3>
            </div>
          </div>
          <button
            onClick={actions.closeVolumeEdit}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition active:scale-90 cursor-pointer"
            title="Close Popup"
            id="close-giant-volume-btn"
          >
            <X size={16} />
          </button>
        </div>

        {/* Dynamic Sound Wave indicator */}
        <div className="w-full h-10 bg-slate-950 rounded-xl border border-slate-850 overflow-hidden flex items-center px-4 relative">
          <div 
            className="h-full bg-gradient-to-r from-cyan-950 via-cyan-500/40 to-cyan-400/60 transition-all duration-75"
            style={{ width: `${Math.min(100, Math.max(0, (volume / 1.2) * 100))}%` }}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-cyan-400 font-extrabold flex items-center gap-2">
            <span>LEVEL:</span>
            <span className="text-white text-sm font-black">{percent}%</span>
            <span className="text-[9px] opacity-65">
              {volume === 0 ? '(MUTE)' : volume >= 1.0 ? '(BOOST)' : '(NORMAL)'}
            </span>
          </div>
          <Activity size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/80 animate-ping" />
        </div>

        {/* 300% Larger Tactile Horizontal Volume Fader */}
        <div className="w-full bg-slate-950/80 p-6 rounded-2xl border border-slate-850 flex flex-col items-center gap-4">
          <div className="w-full flex justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest px-1">
            <span>0% Muted</span>
            <span>50% Low</span>
            <span>80% Audition</span>
            <span>100% Boost</span>
          </div>

          <div className="w-full flex items-center gap-4 py-2">
            <VolumeX className={volume === 0 ? 'text-rose-500' : 'text-slate-600'} size={18} />
            
            <input
              type="range"
              min="0.0"
              max="1.2"
              step="0.01"
              value={volume}
              onChange={handleSliderChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              className="flex-1 h-3 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400 outline-none hover:bg-slate-850 transition-all"
              style={{
                background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${Math.min(100, Math.max(0, (volume / 1.2) * 100))}%, #1e293b ${Math.min(100, Math.max(0, (volume / 1.2) * 100))}%, #1e293b 100%)`
              }}
              id="giant-volume-input-range"
            />

            <Volume2 className={volume > 1.0 ? 'text-amber-400 animate-bounce' : 'text-cyan-400'} size={18} />
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <SlidersHorizontal size={14} className="text-cyan-500/80" />
            <span className="font-mono text-xs text-slate-400">
              GAINS VALUE: <strong className="text-white font-black text-sm">{volume.toFixed(2)}x</strong>Db
            </span>
          </div>
        </div>

        {/* One-touch quick volume dials */}
        <div className="grid grid-cols-4 gap-2 w-full">
          <button
            onClick={() => setFixedVolume(0.0)}
            className={`py-2 px-1 rounded-xl border text-[10px] font-mono font-bold transition active:scale-95 cursor-pointer flex flex-col items-center gap-1 ${
              volume === 0 
                ? 'bg-rose-950/40 border-rose-500 text-rose-400' 
                : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <VolumeX size={14} />
            <span>0% MUTE</span>
          </button>
          
          <button
            onClick={() => setFixedVolume(0.6)}
            className={`py-2 px-1 rounded-xl border text-[10px] font-mono font-bold transition active:scale-95 cursor-pointer flex flex-col items-center gap-1 ${
              Math.abs(volume - 0.6) < 0.05 
                ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400' 
                : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 size={14} />
            <span>50% LOW</span>
          </button>

          <button
            onClick={() => setFixedVolume(0.96)}
            className={`py-2 px-1 rounded-xl border text-[10px] font-mono font-bold transition active:scale-95 cursor-pointer flex flex-col items-center gap-1 ${
              Math.abs(volume - 0.96) < 0.05 
                ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400' 
                : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 size={14} />
            <span>80% COMFY</span>
          </button>

          <button
            onClick={() => setFixedVolume(1.2)}
            className={`py-2 px-1 rounded-xl border text-[10px] font-mono font-bold transition active:scale-95 cursor-pointer flex flex-col items-center gap-1 ${
              Math.abs(volume - 1.2) < 0.05 
                ? 'bg-amber-950/40 border-amber-500 text-amber-400' 
                : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-amber-400 hover:text-white'
            }`}
          >
            <Volume2 size={14} className="animate-pulse" />
            <span>100% MAX</span>
          </button>
        </div>

        {/* Tip text */}
        <div className="flex gap-2 items-start text-left bg-slate-950/50 p-3 rounded-xl border border-slate-850/60 w-full text-[10px] font-mono text-slate-400 leading-relaxed">
          <Info size={14} className="text-cyan-400 shrink-0 mt-0.5 animate-bounce" />
          <span>
            Click or drag the horizontal slider block to adjust volume in real-time. Tapping anywhere on the dark background dims of your screen closes the fader.
          </span>
        </div>
      </div>
    </div>
  );
}
