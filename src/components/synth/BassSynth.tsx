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
import { Sparkles, Zap, Minimize } from 'lucide-react';
import { getFrequencyForNote, audioEngineInstance } from '../../audio/AudioEngine';

// Represent 8 distinct sub-bass tones for EDM loops
const BASS_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'A#', 'B'].reverse();

export default function BassSynth() {
  const { state, actions } = useStudioState();
  const bass = state.project.bassSynth;

  const handleStepToggle = (stepIdx: number, keyName: string) => {
    // If clicking the same key that is already active, turn it off. Otherwise shift note to this key
    const currentStep = bass.steps[stepIdx];
    if (currentStep.active && currentStep.note === keyName) {
      const updatedSteps = [...bass.steps];
      updatedSteps[stepIdx] = {
        ...currentStep,
        active: false,
      };
      actions.updateBassSynth('steps', updatedSteps);
    } else {
      const updatedSteps = [...bass.steps];
      updatedSteps[stepIdx] = {
        ...currentStep,
        active: true,
        note: keyName,
      };
      actions.updateBassSynth('steps', updatedSteps);
    }
  };

  const handlePresetSelect = (presetName: string) => {
    if (presetName === 'acid') {
      actions.updateBassSynth('oscType', 'sawtooth');
      actions.updateBassSynth('distortion', 0.85);
      actions.updateBassSynth('filterCutoff', 280);
      actions.updateBassSynth('filterResonance', 9.5);
      actions.updateBassSynth('envelope', { attack: 0.002, decay: 0.08, sustain: 0.12, release: 0.09 });
    } else if (presetName === 'wobble') {
      actions.updateBassSynth('oscType', 'sawtooth');
      actions.updateBassSynth('distortion', 0.45);
      actions.updateBassSynth('filterCutoff', 700);
      actions.updateBassSynth('filterResonance', 3.0);
      actions.updateBassSynth('envelope', { attack: 0.08, decay: 0.28, sustain: 0.7, release: 0.15 });
    } else if (presetName === 'deep') {
      actions.updateBassSynth('oscType', 'sine');
      actions.updateBassSynth('distortion', 0.1);
      actions.updateBassSynth('filterCutoff', 180);
      actions.updateBassSynth('filterResonance', 1.0);
      actions.updateBassSynth('envelope', { attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.2 });
    } else if (presetName === 'trance-bass') {
      actions.updateBassSynth('oscType', 'sawtooth');
      actions.updateBassSynth('distortion', 0.2);
      actions.updateBassSynth('filterCutoff', 450);
      actions.updateBassSynth('filterResonance', 4.5);
      actions.updateBassSynth('envelope', { attack: 0.005, decay: 0.1, sustain: 0.4, release: 0.1 });
    }
  };

  return (
    <div className="flex flex-col gap-6" id="bass-synth-panel">
      {/* 1. Header controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-850">
        <div>
          <h2 className="text-sm font-mono font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <Zap className="text-fuchsia-400 animate-pulse" size={14} />
            OCTAVE-2 BASS PIANO ROLL
          </h2>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Build rolling grooves. Toggle grid points to sketch sub bass rhythms. Click key label to audioplay notes.
          </p>
        </div>

        {/* Quick bass presets */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-850">
          <span className="text-[8px] font-mono text-slate-500 uppercase px-2">BASS_TYPE:</span>
          {['acid', 'wobble', 'deep', 'trance-bass'].map((pName) => (
            <button
              key={pName}
              onClick={() => handlePresetSelect(pName)}
              className="px-2 py-1 text-[9px] font-mono font-bold rounded bg-slate-900 text-slate-400 hover:text-fuchsia-400 hover:border hover:border-fuchsia-500 transition select-none uppercase shrink-0"
            >
              {pName.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Bass Synthesis knobs deck (Row 1: Envelopes, Row 2: VCF & Overdrive) */}
      <div className="flex flex-col gap-4">
        {/* Row 1: Oscillator & Amplitude Envelope */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
          {/* Oscillator Waveform selector */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col justify-between">
            <span className="text-[9px] font-mono text-slate-500 uppercase block mb-2">1. WAVEFORM</span>
            <Select
              options={[
                { label: '🪚 SAWTOOTH', value: 'sawtooth' },
                { label: '⬜ SQUARE', value: 'square' },
                { label: '🔺 TRIANGLE', value: 'triangle' },
                { label: '🟢 SINE WAVE', value: 'sine' },
              ]}
              value={bass.oscType}
              onChange={(e) => actions.updateBassSynth('oscType', e.target.value as any)}
            />
          </div>

          {/* Attack decay knobs */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase self-start mb-2">AMP ATTACK</span>
            <Knob
              min={0.001}
              max={0.5}
              value={bass.envelope.attack}
              onChange={(val) => actions.updateBassSynth('envelope', { ...bass.envelope, attack: val })}
              unit="s"
              color="purple"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase self-start mb-2">AMP DECAY</span>
            <Knob
              min={0.02}
              max={1.0}
              value={bass.envelope.decay}
              onChange={(val) => actions.updateBassSynth('envelope', { ...bass.envelope, decay: val })}
              unit="s"
              color="purple"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase self-start mb-2">AMP SUSTAIN</span>
            <Knob
              min={0.0}
              max={1.0}
              value={bass.envelope.sustain}
              onChange={(val) => actions.updateBassSynth('envelope', { ...bass.envelope, sustain: val })}
              unit="x"
              color="purple"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase self-start mb-2">AMP RELEASE</span>
            <Knob
              min={0.01}
              max={1.2}
              value={bass.envelope.release}
              onChange={(val) => actions.updateBassSynth('envelope', { ...bass.envelope, release: val })}
              unit="s"
              color="purple"
            />
          </div>
        </div>

        {/* Row 2: VCF Filter & Analogue Overdrive distortion */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase self-start mb-2">FILTER CUTOFF</span>
            <Knob
              min={60}
              max={3000}
              value={bass.filterCutoff}
              onChange={(val) => actions.updateBassSynth('filterCutoff', val)}
              unit="Hz"
              color="fuchsia"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase self-start mb-2">RESONANCE VCF</span>
            <Knob
              min={0.5}
              max={15.0}
              value={bass.filterResonance}
              onChange={(val) => actions.updateBassSynth('filterResonance', val)}
              unit="Q"
              color="fuchsia"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase self-start mb-2">OVERDRIVE DISTORTION</span>
            <Knob
              min={0.0}
              max={1.0}
              value={bass.distortion}
              onChange={(val) => actions.updateBassSynth('distortion', val)}
              unit="x"
              color="rose"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col justify-between items-center text-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
              SUB-BASS HARMONICS
            </span>
            <button
              onClick={() => actions.updateBassSynth('subOsc', !bass.subOsc)}
              className={`w-full py-2.5 rounded-xl border font-mono text-xs font-bold transition active:scale-95 cursor-pointer leading-none ${
                bass.subOsc
                  ? 'bg-fuchsia-950/40 border-fuchsia-500 text-fuchsia-400 shadow-[0_0_10px_rgba(240,79,250,0.2)]'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {bass.subOsc ? '🔊 -1 OCT SINE ON' : '🔇 SUB BASS OFF'}
            </button>
            <span className="text-[8px] font-mono text-slate-500 mt-2 block uppercase">
              REINFORCES DEEP SENSATIONS
            </span>
          </div>
        </div>
      </div>

      {/* 3. Bass Keyboard / Piano Roll grids (16 Steps) */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex flex-col gap-1.5 overflow-x-auto" id="pitch-grid-holder">
        {bass.steps && (
          <div className="flex flex-col gap-1.5 min-w-[620px]">
            {BASS_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-2">
                
                {/* Visual piano keyboard label */}
                <div 
                  onClick={() => {
                    audioEngineInstance.resume();
                    const ctx = audioEngineInstance.ctx;
                    if (ctx) {
                      audioEngineInstance.playBassNote(ctx.currentTime, key, 2, 0.45, bass);
                    }
                  }}
                  className="w-14 h-8 bg-slate-900 hover:bg-slate-800 active:bg-slate-750 active:scale-95 transition-all duration-75 rounded border border-slate-850 flex items-center justify-between px-2 shrink-0 cursor-pointer text-slate-300 select-none"
                  id={`bass-piano-key-${key.toLowerCase().replace('#', '-sharp')}`}
                >
                  <span className="text-[10px] font-mono font-bold">{key}2</span>
                  <div className={`w-2 h-2 rounded-full ${key.includes('#') ? 'bg-fuchsia-500 shadow-[0_0_5px_rgba(232,121,249,0.7)]' : 'bg-white shadow'}`} />
                </div>

                {/* 16 Step nodes */}
                <div className="flex-1 flex gap-1">
                  {Array(16)
                    .fill(0)
                    .map((_, stepIdx) => {
                      const stepObj = bass.steps[stepIdx];
                      const isActive = stepObj?.active && stepObj?.note === key;
                      const isCurrent = state.isPlaying && state.currentStep % 16 === stepIdx;

                      let cellBg = 'bg-slate-900 border-slate-850';
                      if (isActive) {
                        cellBg = isCurrent
                          ? 'bg-fuchsia-400 border-fuchsia-300 text-slate-950 shadow-[0_0_8px_rgba(232,121,249,0.8)]'
                          : 'bg-fuchsia-950/40 border-fuchsia-600/75 text-fuchsia-400 shadow-[inset_0_0_5px_rgba(217,70,239,0.2)]';
                      } else if (isCurrent) {
                        cellBg = 'bg-slate-800 border-slate-700';
                      }

                      return (
                        <button
                          key={stepIdx}
                          onClick={() => handleStepToggle(stepIdx, key)}
                          className={`flex-1 h-8 rounded border transition-all duration-75 text-[9px] font-mono font-bold flex items-center justify-center select-none ${cellBg}`}
                        >
                          {isActive ? '●' : ''}
                        </button>
                      );
                    })}
                </div>

              </div>
            ))}

            {/* Timings bottom line bars indicator */}
            <div className="flex items-center gap-2 mt-2 border-t border-slate-900 pt-2 pb-1">
              <div className="w-14 shrink-0 text-right pr-2">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">BEAT</span>
              </div>
              <div className="flex-1 flex gap-1 justify-between">
                {Array(16)
                  .fill(0)
                  .map((_, i) => (
                    <span
                      key={i}
                      className={`flex-1 text-center font-mono text-[8px] ${
                        i % 4 === 0 ? 'text-fuchsia-400 font-bold' : 'text-slate-600'
                      }`}
                    >
                      {i % 4 === 0 ? `B-${Math.floor(i / 4) + 1}` : `.${i % 4}`}
                    </span>
                  ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
