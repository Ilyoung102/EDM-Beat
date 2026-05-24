/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStudioState } from '../../store/useStudioStore';
import Knob from '../common/Knob';
import Toggle from '../common/Toggle';
import Select from '../common/Select';
import LED from '../common/LED';
import { Sparkles, Activity, Minimize } from 'lucide-react';
import { getFrequencyForNote, audioEngineInstance } from '../../audio/AudioEngine';

// Represent 8 deep sub-bass tones for EDM loops (Octave 1)
const SUB_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'A#', 'B'].reverse();

export default function SubSynth() {
  const { state, actions } = useStudioState();
  
  // Robust state acquisition fallback for subSynth
  const sub = state.project.subSynth || {
    oscType: 'sine',
    filterCutoff: 180,
    filterResonance: 1.0,
    envelope: { attack: 0.02, decay: 0.15, sustain: 0.6, release: 0.2 },
    glide: 0.05,
    distortion: 0.05,
    steps: Array(16).fill(null).map((_, i) => ({
      active: i % 4 === 2,
      note: 'C',
      octave: 1,
      length: 1,
    })),
  };

  const handleStepToggle = (stepIdx: number, keyName: string) => {
    // If clicking the same key that is already active, turn it off. Otherwise shift note to this key
    const currentStep = sub.steps[stepIdx];
    if (currentStep.active && currentStep.note === keyName) {
      const updatedSteps = [...sub.steps];
      updatedSteps[stepIdx] = {
        ...currentStep,
        active: false,
      };
      actions.updateSubSynth('steps', updatedSteps);
    } else {
      const updatedSteps = [...sub.steps];
      updatedSteps[stepIdx] = {
        ...currentStep,
        active: true,
        note: keyName,
      };
      actions.updateSubSynth('steps', updatedSteps);
    }
  };

  const handlePresetSelect = (presetName: string) => {
    if (presetName === 'warm-sine') {
      actions.updateSubSynth('oscType', 'sine');
      actions.updateSubSynth('distortion', 0.02);
      actions.updateSubSynth('filterCutoff', 120);
      actions.updateSubSynth('filterResonance', 1.0);
      actions.updateSubSynth('envelope', { attack: 0.02, decay: 0.12, sustain: 0.7, release: 0.2 });
    } else if (presetName === 'deep-triangle') {
      actions.updateSubSynth('oscType', 'triangle');
      actions.updateSubSynth('distortion', 0.08);
      actions.updateSubSynth('filterCutoff', 160);
      actions.updateSubSynth('filterResonance', 1.2);
      actions.updateSubSynth('envelope', { attack: 0.01, decay: 0.18, sustain: 0.5, release: 0.25 });
    } else if (presetName === 'punchy-offbeat') {
      actions.updateSubSynth('oscType', 'triangle');
      actions.updateSubSynth('distortion', 0.15);
      actions.updateSubSynth('filterCutoff', 220);
      actions.updateSubSynth('filterResonance', 2.0);
      actions.updateSubSynth('envelope', { attack: 0.004, decay: 0.1, sustain: 0.3, release: 0.12 });
    } else if (presetName === 'gritty-analog') {
      actions.updateSubSynth('oscType', 'sawtooth');
      actions.updateSubSynth('distortion', 0.42);
      actions.updateSubSynth('filterCutoff', 150);
      actions.updateSubSynth('filterResonance', 3.5);
      actions.updateSubSynth('envelope', { attack: 0.03, decay: 0.22, sustain: 0.45, release: 0.18 });
    } else if (presetName === 'solid-pulse') {
      actions.updateSubSynth('oscType', 'pulse');
      actions.updateSubSynth('distortion', 0.25);
      actions.updateSubSynth('filterCutoff', 190);
      actions.updateSubSynth('filterResonance', 1.8);
      actions.updateSubSynth('envelope', { attack: 0.01, decay: 0.15, sustain: 0.6, release: 0.2 });
    }
  };

  const handleAutoSubGen = () => {
    const scales = ['C', 'D', 'E', 'F', 'G', 'A', 'A#', 'B'];
    const selectedKey = scales[Math.floor(Math.random() * scales.length)];
    const updatedSteps = Array(16).fill(null).map((_, i) => {
      // Classic EDM sidechained offbeat pattern (mainly step 2, 6, 10, 14 of 16 steps, which is offbeat of bass drum)
      const isOffbeat = i % 4 === 2;
      const isActive = Math.random() < 0.75 ? isOffbeat : (i % 4 === 3);
      return {
        active: isActive,
        note: selectedKey,
        octave: 1, // pristine sub range
        length: Math.random() < 0.25 ? 2 : 1,
      };
    });
    actions.updateSubSynth('steps', updatedSteps);
  };

  return (
    <div className="flex flex-col gap-6" id="sub-synth-panel">
      {/* 1. Header controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-850">
        <div>
          <h2 className="text-sm font-mono font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <Activity className="text-indigo-400 animate-pulse" size={14} />
            SUB SYNC (OCTAVE-1 SUB BASS)
          </h2>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Generate warm, full-bodied sub-bass layers ("풍부한 음"). Use Sine/Triangle waveforms, tweak sub parameters, and toggle grids to sync off-beats.
          </p>
        </div>

        {/* Quick presets and Auto Sub generator */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-850">
          <div className="flex items-center gap-2 overflow-x-auto select-none">
            <span className="text-[8px] font-mono text-slate-500 uppercase px-1 shrink-0">SUB_PRESETS:</span>
            {['warm-sine', 'deep-triangle', 'punchy-offbeat', 'gritty-analog', 'solid-pulse'].map((pName) => (
              <button
                key={pName}
                onClick={() => handlePresetSelect(pName)}
                className="px-2 py-1 text-[9px] font-mono font-bold rounded bg-slate-900 text-slate-400 hover:text-indigo-400 hover:border hover:border-indigo-500 transition select-none uppercase shrink-0 cursor-pointer"
              >
                {pName.replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="h-5 w-[1px] bg-slate-850 hidden md:block" />

          <button
            onClick={handleAutoSubGen}
            className="px-3 py-1 bg-indigo-950/40 border border-indigo-800 text-indigo-400 hover:bg-indigo-400 hover:text-slate-950 font-black font-mono text-[9px] rounded tracking-wide transition active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Generate deep pulsing EDM sub groove"
          >
            <Sparkles size={11} />
            AUTO SUB GROOVE
          </button>
        </div>
      </div>

      {/* 2. Dual Panel: Piano Roll Grid & Analogue Synthesizer Knobs */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" id="sub-synth-grid-desktop">
        {/* Step Sequencer Piano Roll Grid */}
        <div className="xl:col-span-3 flex flex-col gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850 overflow-x-auto" id="sub-synth-sequence-grid">
          <div className="min-w-[640px] flex flex-col gap-1.5">
            {/* Playhead indicators top bar */}
            <div className="flex items-center gap-1 pl-16">
              {Array(16).fill(null).map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 h-1.5 rounded-sm transition-all duration-75 flex flex-col justify-between items-center ${
                    state.currentStep % 16 === i && state.isPlaying 
                      ? 'bg-gradient-to-b from-indigo-400 to-cyan-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]' 
                      : 'bg-slate-800'
                  }`}
                  title={`Step ${i + 1}`}
                />
              ))}
            </div>

            {/* Note pitch keys layout */}
            {SUB_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-1.5" id={`sub-pitch-row-${key}`}>
                {/* Piano Note Label & preview click trigger */}
                <button
                  onClick={() => {
                    audioEngineInstance.resume();
                    const ctx = audioEngineInstance.ctx;
                    if (ctx) {
                      audioEngineInstance.playSubNote(ctx.currentTime, key, 1, 0.45, sub);
                    }
                  }}
                  className="w-14 h-8 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded font-mono text-[10px] font-bold text-slate-400 hover:text-indigo-400 text-left px-2 flex items-center justify-between select-none cursor-pointer"
                  title={`Preview deep ${key}1 note`}
                >
                  <span className="truncate">{key}1</span>
                  <div className="w-1 h-3 rounded bg-indigo-500/30" />
                </button>

                {/* 16 steps row */}
                <div className="flex-1 flex gap-1 h-8">
                  {Array(16).fill(null).map((_, stepIdx) => {
                    const stepItem = sub.steps[stepIdx] || { active: false, note: 'C', octave: 1 };
                    const isNoteActive = stepItem.active && stepItem.note === key;
                    const isPlayhead = state.currentStep % 16 === stepIdx && state.isPlaying;
                    
                    return (
                      <button
                        key={stepIdx}
                        onClick={() => handleStepToggle(stepIdx, key)}
                        className={`flex-1 rounded-md transition-all border select-none cursor-pointer ${
                          isNoteActive
                            ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)]'
                            : isPlayhead
                            ? 'bg-slate-850/80 border-slate-700'
                            : 'bg-slate-950/50 border-slate-900 hover:border-slate-800 hover:bg-slate-900/30'
                        }`}
                        title={`${key}1 step ${stepIdx + 1}${isNoteActive ? ' (Active)' : ''}`}
                      >
                        {isNoteActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 mx-auto animate-ping" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Step Numbers Indicators Footer */}
            <div className="flex items-center gap-1 pl-16 mt-1 text-[8px] font-mono text-slate-500">
              {Array(16).fill(null).map((_, i) => (
                <div key={i} className="flex-1 text-center font-bold">
                  {(i + 1).toString().padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Synthesizer Hardware Knobs Rack */}
        <div className="flex flex-col gap-6 p-4 rounded-xl bg-slate-900/60 border border-slate-850" id="sub-synth-tweaker-rack">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[10px] font-mono tracking-widest text-indigo-400 font-bold uppercase">SUB CONFIG DSP</span>
            <LED active={state.isPlaying} color="purple" size="xs" />
          </div>

          {/* Waveform Selector */}
          <div className="flex flex-col gap-2 bg-slate-950 p-3 rounded-lg border border-slate-850">
            <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">OSC WAVE:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(['sine', 'triangle', 'pulse', 'sawtooth'] as const).map((wt) => (
                <button
                  key={wt}
                  onClick={() => actions.updateSubSynth('oscType', wt)}
                  className={`py-1.5 rounded font-mono text-[9px] font-black uppercase text-center transition select-none cursor-pointer border ${
                    sub.oscType === wt
                      ? 'bg-gradient-to-r from-indigo-950 to-indigo-900 text-indigo-300 border-indigo-700'
                      : 'bg-slate-900 hover:bg-slate-850 text-slate-500 border-transparent hover:border-slate-800'
                  }`}
                >
                  {wt}
                </button>
              ))}
            </div>
          </div>

          {/* Glide & Saturation Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center bg-slate-950/45 p-2 rounded-lg border border-slate-850/60">
              <span className="text-[8px] font-mono text-slate-400 uppercase mb-2">GLIDE TIME</span>
              <Knob
                min={0}
                max={0.8}
                value={sub.glide || 0.05}
                onChange={(val) => actions.updateSubSynth('glide', val)}
                color="purple"
                unit="s"
              />
            </div>

            <div className="flex flex-col items-center bg-slate-950/45 p-2 rounded-lg border border-slate-850/60">
              <span className="text-[8px] font-mono text-slate-400 uppercase mb-2">SATURATION</span>
              <Knob
                min={0}
                max={0.9}
                value={sub.distortion || 0.05}
                onChange={(val) => actions.updateSubSynth('distortion', val)}
                color="purple"
                unit="%"
              />
            </div>
          </div>

          {/* Low-frequency filter configurations */}
          <div className="flex flex-col gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
            <span className="text-[8px] font-mono text-indigo-400 font-black uppercase border-b border-indigo-950/50 pb-1">ANALOG FILTER ENVELOPE</span>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
              <div className="flex flex-col items-center">
                <span className="text-[7.5px] font-mono text-slate-400 uppercase mb-2">CUTOFF</span>
                <Knob
                  min={40}
                  max={450}
                  value={sub.filterCutoff || 180}
                  onChange={(val) => actions.updateSubSynth('filterCutoff', val)}
                  color="purple"
                  unit="Hz"
                />
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[7.5px] font-mono text-slate-400 uppercase mb-2">RESONANCE</span>
                <Knob
                  min={0.5}
                  max={12}
                  value={sub.filterResonance || 1}
                  onChange={(val) => actions.updateSubSynth('filterResonance', val)}
                  color="purple"
                  unit="q"
                />
              </div>
            </div>
          </div>

          {/* ADSR Sliders representation */}
          <div className="flex flex-col gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
            <span className="text-[8px] font-mono text-indigo-400 font-black uppercase border-b border-indigo-950/50 pb-1">VOLUME ADSR ENV</span>
            <div className="grid grid-cols-4 gap-2 pt-2 text-center h-24">
              {([
                { key: 'attack', label: 'A', max: 0.5, step: 0.005 },
                { key: 'decay', label: 'D', max: 1.0, step: 0.01 },
                { key: 'sustain', label: 'S', max: 1.0, step: 0.01 },
                { key: 'release', label: 'R', max: 1.5, step: 0.01 }
              ] as const).map(({ key, label, max, step: adsrStep }) => {
                const currentVal = sub.envelope[key] !== undefined ? sub.envelope[key] : 0.2;
                return (
                  <div key={key} className="flex flex-col items-center justify-between h-full">
                    <input
                      type="range"
                      min={key === 'attack' ? 0.002 : 0}
                      max={max}
                      step={adsrStep}
                      value={currentVal}
                      onChange={(e) => {
                        const nextEnv = { ...sub.envelope, [key]: parseFloat(e.target.value) };
                        actions.updateSubSynth('envelope', nextEnv);
                      }}
                      className="accent-indigo-400 h-14 w-1 bg-slate-800 rounded appearance-none"
                      style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                      title={`${label.toUpperCase()}: ${currentVal}`}
                    />
                    <span className="text-[8px] font-mono text-slate-400 font-bold mt-1.5">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
