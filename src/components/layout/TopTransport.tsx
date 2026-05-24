/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStudioState } from '../../store/useStudioStore';
import { audioEngineInstance } from '../../audio/AudioEngine';
import NeonButton from '../common/NeonButton';
import LED from '../common/LED';
import { Play, Square, Pause, Volume2, ShieldAlert, Cpu, Menu, Sliders } from 'lucide-react';

export default function TopTransport() {
  const { state, actions } = useStudioState();
  const [cpuUsage, setCpuUsage] = useState(2);
  const [masterPeak, setMasterPeak] = useState(-60); // dB peak fader
  const meterInterval = useRef<any>(null);

  // Poll Peak Analyser for Visual feedback
  useEffect(() => {
    const bufferLength = 128;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateMeter = () => {
      if (audioEngineInstance.masterAnalyzer && state.isPlaying) {
        audioEngineInstance.masterAnalyzer.getByteFrequencyData(dataArray);
        
        // Find maximum amplitude peak
        let maxVal = 0;
        for (let i = 0; i < bufferLength; i++) {
          if (dataArray[i] > maxVal) maxVal = dataArray[i];
        }
        
        // Convert to rough dB representation
        const norm = maxVal / 255;
        const db = norm > 0 ? Math.round(20 * Math.log10(norm)) : -60;
        setMasterPeak(db);

        // Simulate lightweight jitter CPU usage
        setCpuUsage(Math.round(2 + norm * 15 + Math.random() * 3));
      } else {
        setMasterPeak(-60);
        setCpuUsage(1);
      }
    };

    meterInterval.current = setInterval(updateMeter, 50);

    return () => {
      if (meterInterval.current) clearInterval(meterInterval.current);
    };
  }, [state.isPlaying]);

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (!isNaN(val)) {
      val = Math.max(40, Math.min(240, val));
      actions.updateProjectField('bpm', val);
    }
  };

  // Convert dB peak limit (-60 to 0) into grid bars count
  const peakBarCount = 14;
  const dbRange = 60; // -60 to 0
  const activeBars = Math.max(0, Math.ceil(((masterPeak + 60) / dbRange) * peakBarCount));

  return (
    <header className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4 gap-4 md:gap-0 sticky top-0 z-50 shadow-md">
      {/* Brand Logo & Slogan Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={actions.toggleSidebar}
          className={`p-2 rounded-lg border transition-all ${
            state.sidebarOpen 
              ? 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.15)]' 
              : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/20'
          }`}
          title={state.sidebarOpen ? "Fold Left Menu" : "Unfold Left Menu"}
        >
          <Menu size={15} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-fuchsia-600 shadow-[0_0_12px_rgba(34,211,238,0.4)]">
            <span className="text-black font-bold text-sm tracking-tighter">EDM</span>
          </div>
          <div>
            <h1 className="text-sm font-sans font-semibold tracking-tighter text-white">
              EDM Beat Studio
            </h1>
            <p className="text-[9px] font-mono tracking-widest text-[#22d3ee] uppercase">
              pro pocket rack
            </p>
          </div>
        </div>
      </div>

      {/* Main Transport Controls Deck */}
      <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80">
        <NeonButton
          active={state.isPlaying}
          color="cyan"
          onClick={actions.play}
          className="flex items-center gap-1.5 font-bold"
        >
          <Play size={11} fill={state.isPlaying ? 'currentColor' : 'none'} />
          PLAY
        </NeonButton>

        <NeonButton
          active={!state.isPlaying && state.currentStep > 0}
          color="slate"
          onClick={actions.pause}
          className="flex items-center gap-1.5"
        >
          <Pause size={11} fill={!state.isPlaying && state.currentStep > 0 ? 'currentColor' : 'none'} />
          PAUSE
        </NeonButton>

        <NeonButton
          active={false}
          color="rose"
          onClick={actions.stop}
          className="flex items-center gap-1.5"
        >
          <Square size={11} fill="currentColor" />
          STOP
        </NeonButton>

        <div className="h-6 w-[1px] bg-slate-800 mx-1" />

        {/* BPM & Metronome deck */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-850">
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-none mb-0.5">tempo</span>
            <input
              type="number"
              value={state.bpm}
              onChange={handleBpmChange}
              className="w-11 bg-transparent font-mono text-xs text-cyan-400 font-bold focus:outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <span className="text-[10px] font-mono text-slate-600">BPM</span>
        </div>

        {/* Swing percentage control */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-850">
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-none mb-0.5">swing</span>
            <span className="font-mono text-xs text-fuchsia-400 font-bold">
              {Math.round(state.swing * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={state.swing}
            onChange={(e) => actions.updateProjectField('swing', parseFloat(e.target.value))}
            className="w-14 accent-fuchsia-500 cursor-pointer h-1 bg-slate-800 rounded"
          />
        </div>

        {/* Metronome LED */}
        <button
          onClick={() => actions.updateProjectField('metronome', !state.metronome)}
          className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 transition select-none ${
            state.metronome ? 'bg-emerald-950/20 border-emerald-500/80 text-emerald-400' : 'bg-slate-950 border-slate-850 text-slate-400'
          }`}
        >
          <LED active={state.metronome && state.currentStep % 4 === 0} color="emerald" size="xs" />
          <span className="text-[9px] font-mono tracking-widest">METRO</span>
        </button>
      </div>

      {/* Audio Engine Security Status / Master Meter Panel */}
      <div className="flex items-center gap-4 bg-slate-900/40 px-4 py-2 border border-slate-850 rounded-xl">
        {/* Realtime Stereo Peak Meter */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-[1px]">
            {Array(peakBarCount)
              .fill(0)
              .map((_, i) => {
                const isActive = i < activeBars;
                // Color zones: 0-9 green, 10-12 yellow, 13-14 red (clipping zone)
                let colorClass = 'bg-slate-800';
                if (isActive) {
                  if (i < 9) colorClass = 'bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.3)]';
                  else if (i < 12) colorClass = 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.3)]';
                  else colorClass = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]';
                }
                return <div key={i} className={`w-1.5 h-3.5 rounded-sm transition-all duration-75 ${colorClass}`} />;
              })}
          </div>
          <div className="flex w-full justify-between items-center px-0.5 mt-0.5">
            <span className="text-[7px] font-mono text-slate-500">-60dB</span>
            <span className="text-[7px] font-mono text-slate-500">M-PEAK</span>
            <span className="text-[7px] font-mono text-slate-500">0dB</span>
          </div>
        </div>

        {/* CPU & Unlock Audio indicator */}
        <div className="h-6 w-[1px] bg-slate-800" />
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Cpu className="text-slate-500" size={12} />
              <span className="text-[9px] font-mono text-slate-400">SYS CORE</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold self-end">{cpuUsage}%</span>
          </div>

          {!state.audioUnlocked && (
            <button
              onClick={actions.unlockAudio}
              className="animate-pulse bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-slate-950 font-bold font-mono text-[9px] px-2.5 py-1.5 rounded-lg shadow-[0_0_12px_rgba(34,211,238,0.4)] flex items-center gap-1"
            >
              <Volume2 size={10} />
              UNLOCK AUDIO
            </button>
          )}
          {state.audioUnlocked && (
            <div className="bg-cyan-950/20 border border-cyan-800/60 px-2 py-1 rounded-lg flex items-center gap-1">
              <LED active={true} color="cyan" size="xs" />
              <span className="text-[8px] font-mono text-cyan-400 font-bold">READY</span>
            </div>
          )}

          <div className="h-6 w-[1px] bg-slate-800" />

          <button 
            onClick={actions.toggleInspector}
            className={`p-2 rounded-lg border transition-all ${
              state.inspectorOpen 
                ? 'border-fuchsia-500/30 bg-fuchsia-950/20 text-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.15)]' 
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-fuchsia-400 hover:border-fuchsia-500/20'
            }`}
            title={state.inspectorOpen ? "Fold Right Parameters" : "Unfold Right Parameters"}
          >
            <Sliders size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
