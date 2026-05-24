/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStudioState } from '../../store/useStudioStore';
import LED from '../common/LED';
import { Volume2 } from 'lucide-react';

export default function BottomTimeline() {
  const { state, actions } = useStudioState();

  const len = state.project.patternLength;
  const masterVolume = state.project.mixerChannels.find(m => m.id === 'master')?.volume ?? 0.95;

  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 select-none shrink-0" id="bottom-timeline-layout">
      {/* Pattern length toggle slider */}
      <div className="flex items-center gap-4 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
        <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
          BAR LENGTH
        </span>
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-850">
          <button
            onClick={() => actions.updateProjectField('patternLength', 16)}
            className={`px-3 py-1 font-mono text-[10px] font-bold rounded-md transition ${
              len === 16 ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            16 STEPS (1 Bar)
          </button>
          <button
            onClick={() => actions.updateProjectField('patternLength', 32)}
            className={`px-3 py-1 font-mono text-[10px] font-bold rounded-md transition ${
              len === 32 ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            32 STEPS (2 Bars)
          </button>
        </div>
      </div>

      {/* Visual Step Playhead tracker lights */}
      <div className="flex-1 max-w-xl px-4 hidden md:flex flex-col items-center gap-2">
        <div className="flex items-center justify-between w-full">
          <span className="text-[8px] font-mono tracking-widest text-slate-500 uppercase">LIVE MATRIX PLAYHEAD</span>
          <span className="text-[9px] font-mono text-cyan-400 font-bold">
            STEP {state.currentStep + 1} / {len}
          </span>
        </div>

        {/* Playhead LED Strip */}
        <div className="flex gap-1.5 bg-slate-900 p-2 rounded-lg border border-slate-850 w-full justify-between">
          {Array(len)
            .fill(0)
            .map((_, i) => {
              const isActive = state.isPlaying && state.currentStep === i;
              const isBeat = i % 4 === 0;
              
              let ledColor: 'cyan' | 'purple' = 'cyan';
              if (isBeat) ledColor = 'purple';

              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <LED active={isActive} color={ledColor} size="xs" />
                  <div
                     className={`w-1.5 h-1 rounded ${
                      isActive ? 'bg-cyan-400' : isBeat ? 'bg-slate-700' : 'bg-slate-800'
                    }`}
                  />
                </div>
              );
            })}
        </div>
      </div>

      {/* Master Volume bar & macro buttons block */}
      <div className="flex items-center gap-2.5 bg-slate-900/60 p-1.5 px-3 rounded-xl border border-slate-850 select-none flex-nowrap" id="master-vol-and-macro-line">
        <div className="flex items-center gap-2">
          <Volume2 size={13} className="text-cyan-400 shrink-0" />
          <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase select-none shrink-0 hidden sm:inline">
            MASTER VOL
          </span>
          <input
            type="range"
            min="0"
            max="1.2"
            step="0.01"
            value={masterVolume}
            onChange={(e) => actions.updateMixerChannel('master', 'volume', parseFloat(e.target.value))}
            className="w-16 sm:w-24 md:w-28 accent-cyan-400 cursor-pointer h-1 bg-slate-850 rounded"
            title={`Master Volume: ${Math.round(masterVolume * 100)}%`}
          />
          <span className="text-[9px] font-mono text-cyan-400 font-bold w-8 text-right select-none">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>

        <div className="h-5 w-[1px] bg-slate-800 shrink-0" />

        {/* Quick macro action presets selectors */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={actions.generateRandomPatterns}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded hover:border-cyan-500 hover:text-cyan-400 font-bold font-mono text-[9px] transform active:scale-95 transition cursor-pointer select-none whitespace-nowrap"
            title="Mutate EDM patterns"
          >
            🎲 MUTATE
          </button>
          <button
            onClick={actions.clearAllPatterns}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded hover:border-rose-500 hover:text-rose-400 font-bold font-mono text-[9px] transform active:scale-95 transition cursor-pointer select-none whitespace-nowrap"
            title="Clear all sequences"
          >
            🗑️ CLEAR
          </button>
        </div>
      </div>
    </footer>
  );
}
