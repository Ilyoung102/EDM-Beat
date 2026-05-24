/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStudioState } from '../../store/useStudioStore';
import { EDM_GENRE_PRESETS } from '../../store/useStudioStore';
import { FAMOUS_EDM_SONGS } from '../../store/edmMelodies';
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

  const handleAutoDrumGen = () => {
    // Generate a professional 4-on-the-floor EDM house/progressive drum loop
    state.project.drumTracks.forEach(t => {
      const updatedSteps = Array(32).fill(0).map(() => ({ active: false, velocity: 1.0 }));
      
      for (let i = 0; i < 32; i++) {
        const step16 = i % 16;
        if (t.id === 'kick') {
          // Kick on 1, 5, 9, 13
          if (step16 === 0 || step16 === 4 || step16 === 8 || step16 === 12) {
            updatedSteps[i] = { active: true, velocity: 1.0 };
          }
        } else if (t.id === 'clap' || t.id === 'snare') {
          // Clap/Snare on step 5 and 13 (index 4 and 12)
          if (t.id === 'clap' && (step16 === 4 || step16 === 12)) {
            updatedSteps[i] = { active: true, velocity: 0.9 };
          }
          if (t.id === 'snare' && (step16 === 12 && Math.random() < 0.5)) {
            // Accent snares or rolls on end of progression
            updatedSteps[i] = { active: true, velocity: 0.85 };
          }
        } else if (t.id === 'hats_closed') {
          // 8th or 16th hats
          if (step16 % 2 === 0 && step16 % 4 !== 0) {
            updatedSteps[i] = { active: true, velocity: 0.55 }; // off-beats closed hats
          } else if (Math.random() < 0.25) {
            updatedSteps[i] = { active: true, velocity: 0.4 }; // syncopated shaker-like fill
          }
        } else if (t.id === 'hats_open') {
          // Classic offbeat open hat (index 2, 6, 10, 14 in 16-step matrix)
          if (step16 === 2 || step16 === 6 || step16 === 10 || step16 === 14) {
            updatedSteps[i] = { active: true, velocity: 0.75 };
          }
        } else if (t.id === 'ride') {
          // Driving ride cymbal on every strong beat or offbeats for second phase of loop
          if (i >= 16 && (step16 % 4 === 0)) {
            updatedSteps[i] = { active: true, velocity: 0.6 };
          }
        } else if (t.id === 'perc') {
          // Percussion rhythmic accents on odd frames
          if (step16 === 3 || step16 === 10 || step16 === 11) {
            updatedSteps[i] = { active: true, velocity: 0.65 };
          }
        } else if (t.id === 'fx') {
          // Classic riser/downer strike on step 1
          if (i === 0) {
            updatedSteps[i] = { active: true, velocity: 0.8 };
          }
        }
      }
      actions.changeDrumVelocity(t.id, 0, 1.0); // Simple tickle to store triggers
      t.steps = updatedSteps;
    });
    // Trigger store update to apply changes
    actions.updateDrumTrackField('kick', 'volume', state.project.drumTracks[0].volume);
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
              {Object.keys(EDM_GENRE_PRESETS).map((genre) => {
                const famous = FAMOUS_EDM_SONGS[genre];
                return (
                  <option key={genre} value={genre} className="bg-slate-950 text-slate-300">
                    {genre.toUpperCase()} {famous ? `(${famous.title})` : ''}
                  </option>
                );
              })}
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

          <div className="h-4 w-[1px] bg-slate-800 hidden md:block" />

          {/* Auto Beat button */}
          <button
            onClick={handleAutoDrumGen}
            className="px-3 py-1 bg-cyan-950/40 border border-cyan-800 text-cyan-400 hover:bg-cyan-400 hover:text-slate-950 font-black font-mono text-[9px] rounded tracking-wide transition active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0 animate-pulse"
            title="Algorithmic pro 4-on-the-floor EDM beat filler"
          >
            <Sparkles size={11} />
            ⚡ AUTO-BEAT
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
