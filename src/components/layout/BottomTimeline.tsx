/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStudioState } from '../../store/useStudioStore';
import LED from '../common/LED';

export default function BottomTimeline() {
  const { state, actions } = useStudioState();

  const len = state.project.patternLength;

  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 select-none shrink-0" id="bottom-timeline-layout">
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
      <div className="flex-1 max-w-2xl px-4 hidden md:flex flex-col items-center gap-2">
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

      {/* Quick macro action presets selectors */}
      <div className="flex items-center gap-3">
        <button
          onClick={actions.generateRandomPatterns}
          className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 font-mono text-[10px] text-slate-300 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transform active:scale-95 transition"
        >
          🎲 MUTATE (RANDOM)
        </button>
        <button
          onClick={actions.clearAllPatterns}
          className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 font-mono text-[10px] text-slate-300 rounded-lg hover:border-rose-500 hover:text-rose-400 transform active:scale-95 transition"
        >
          🗑️ CLEAR ALL
        </button>
      </div>
    </footer>
  );
}
