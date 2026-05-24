/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStudioState } from '../../store/useStudioStore';
import { EDM_GENRE_PRESETS } from '../../store/useStudioStore';
import StepGrid from './StepGrid';
import NeonButton from '../common/NeonButton';
import LED from '../common/LED';
import { Volume2, Play, RefreshCw, Layers, Sparkles } from 'lucide-react';
import { audioEngineInstance } from '../../audio/AudioEngine';

export default function DrumMachine() {
  const { state, actions } = useStudioState();

  const handlePresetSelect = (genre: string) => {
    actions.applyPreset(genre);
  };

  const getActiveSoloTrack = () => {
    return state.project.drumTracks.find(t => t.solo);
  };

  return (
    <div className="flex flex-col gap-6" id="drum-machine-panel">
      {/* 1. Header controls & EDM Genre presets catalog */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4.5 rounded-xl bg-slate-900/60 border border-slate-850">
        <div>
          <h2 className="text-sm font-mono font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <Layers className="text-cyan-400 animate-pulse" size={14} />
            16 / 32 STEP SEQUENCER GRID
          </h2>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Toggle grid nodes to draw EDM beat bars. Click track labels to audition raw synth drums.
          </p>
        </div>

        {/* EDM Genre preset controls */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-850">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest pl-1">QUICK_PRESET:</span>
            <select
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono font-bold text-cyan-400 hover:border-cyan-500 focus:outline-none cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>-- SELECT GENRE --</option>
              {Object.keys(EDM_GENRE_PRESETS).map((genre) => (
                <option key={genre} value={genre} className="bg-slate-950 text-slate-300">
                  {genre.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Jump to Vault Button */}
          <button
            onClick={() => actions.setTab('edm-library')}
            className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black font-mono text-[9px] rounded tracking-wide transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="Browse full EDM Preset Vault"
          >
            <Sparkles size={11} className="animate-spin" />
            BROWSE 30+ MASTER SAMPLES VAULT
          </button>
        </div>
      </div>

      {/* 2. Grid tracks sequencer and strip meters */}
      <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-850/80 flex flex-col gap-3 overflow-x-auto min-w-0" id="step-grid-scroller">
        
        {/* Step numbers bar header align */}
        <div className="flex items-center gap-3 select-none pb-2 border-b border-slate-900" style={{ minWidth: 680 }}>
          {/* Label Spacer */}
          <div className="w-56 shrink-0 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
            SYNTH DRUM CHANNELED BUS
          </div>
          {/* 16 or 32 Step numbers indicators */}
          <div className="flex-1 flex justify-between">
            {Array(state.project.patternLength)
              .fill(0)
              .map((_, i) => {
                const isBeat = i % 4 === 0;
                return (
                  <div
                    key={i}
                    className={`w-7.5 text-center font-mono text-[9px] ${
                      isBeat ? 'text-fuchsia-400 font-bold' : 'text-slate-600'
                    }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Tracks Sequencer Content */}
        <StepGrid />

      </div>

      {/* Grid instruction specs footer card */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/20 p-4 rounded-xl border border-slate-850">
        <div className="flex items-center gap-3">
          <Volume2 className="text-cyan-400" size={16} />
          <span className="text-[10px] font-mono text-slate-400 leading-normal">
            For professional EDM grooves, place the **Punch Kick** on steps **1, 5, 9, 13** (4-on-the-floor) and the **Closed Hat** on **odd step gaps (3, 7, 11, 15)**.
          </span>
        </div>
      </div>
    </div>
  );
}
