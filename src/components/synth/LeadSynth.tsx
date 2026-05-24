/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStudioState } from '../../store/useStudioStore';
import { audioEngineInstance } from '../../audio/AudioEngine';
import Knob from '../common/Knob';
import Select from '../common/Select';
import LED from '../common/LED';
import Toggle from '../common/Toggle';
import { Music, RefreshCw, Zap, Volume2 } from 'lucide-react';

const SCALE_FORMULAS: Record<string, string[]> = {
  'Minor': ['C', 'D', 'D#', 'F', 'G', 'G#', 'A#'],
  'Major': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  'Pentatonic Minor': ['C', 'D#', 'F', 'G', 'A#'],
  'Pentatonic Major': ['C', 'D', 'E', 'G', 'A'],
  'Phrygian': ['C', 'C#', 'D#', 'F', 'G', 'G#', 'A#'],
  'Dorian': ['C', 'D', 'D#', 'F', 'G', 'A', 'A#'],
  'Harmonic Minor': ['C', 'D', 'D#', 'F', 'G', 'G#', 'B']
};

export default function LeadSynth() {
  const { state, actions } = useStudioState();
  const [selectedScale, setSelectedScale] = useState<string>('Minor');
  const [leadOctave, setLeadOctave] = useState<number>(4);

  const lead = state.project.leadSynth;
  const len = state.project.patternLength;

  // Derive active keys based on the scale selection (reverse so high pitch is top)
  const scaleKeys = [...(SCALE_FORMULAS[selectedScale] || SCALE_FORMULAS['Minor'])].reverse();

  const handleLeadStepToggle = (stepIdx: number, noteName: string) => {
    const currentStep = lead.steps[stepIdx];
    const updatedSteps = [...lead.steps];

    if (currentStep && currentStep.active && currentStep.note === noteName) {
      // Toggle off
      updatedSteps[stepIdx] = {
        ...currentStep,
        active: false
      };
    } else {
      // Set to active note
      updatedSteps[stepIdx] = {
        active: true,
        note: noteName,
        octave: leadOctave,
        velocity: 0.8,
        length: 1
      };
    }

    actions.updateLeadSynth('steps', updatedSteps);
  };

  const handleArpRandomGenerator = () => {
    const scaleList = SCALE_FORMULAS[selectedScale];
    const updatedSteps = [...lead.steps];
    
    for (let i = 0; i < len; i++) {
      if (Math.random() < 0.35) {
        updatedSteps[i] = {
          active: true,
          note: scaleList[Math.floor(Math.random() * scaleList.length)],
          octave: leadOctave + (Math.random() > 0.6 ? 1 : 0),
          velocity: 0.7 + Math.random() * 0.3,
          length: 1
        };
      } else {
        updatedSteps[i] = {
          active: false,
          note: 'C',
          octave: leadOctave,
          velocity: 0.8,
          length: 1
        };
      }
    }
    actions.updateLeadSynth('steps', updatedSteps);
  };

  return (
    <div className="flex flex-col gap-6" id="lead-synth-panel">
      {/* 1. Header controls and scale quantizer */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-850">
        <div>
          <h2 className="text-sm font-mono font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <Music className="text-cyan-400 animate-pulse" size={14} />
            SCALE QUANTIZED LEAD SEQUENCER
          </h2>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Toggle notes to write lead arpeggios. All steps constraints strictly lock to the chosen scale context.
          </p>
        </div>

        {/* Quantizer Scale selection */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-2 rounded-lg border border-slate-850">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">scale:</span>
            <Select
              options={Object.keys(SCALE_FORMULAS).map(s => ({ label: s.toUpperCase(), value: s }))}
              value={selectedScale}
              onChange={(e) => setSelectedScale(e.target.value)}
              className="py-1 text-[10px]"
            />
          </div>

          <div className="hidden sm:block h-5 w-[1px] bg-slate-800 mx-1" />

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">base oct:</span>
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
              {[3, 4, 5].map((oct) => (
                <button
                  key={oct}
                  onClick={() => setLeadOctave(oct)}
                  className={`w-5 h-5 rounded font-mono text-[9px] font-bold ${
                    leadOctave === oct ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {oct}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleArpRandomGenerator}
            className="px-2.5 py-1 text-[9px] font-bold font-mono tracking-wide rounded bg-cyan-950/40 border border-cyan-800 text-cyan-400 hover:bg-cyan-400 hover:text-slate-950 transition select-none"
          >
            ⚡ AUTO-ARP
          </button>
        </div>
      </div>

      {/* 2. Synths synthesis ADSR controls (Row 1: Envelopes & Cutoff, Row 2: Unison & Space FX Send) */}
      <div className="flex flex-col gap-4">
        {/* Row 1: Core Voice, VCF, and Amplitude Envelope */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col justify-between">
            <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">1. OSC WAVE</span>
            <Select
              options={[
                { label: '🪚 SAWTOOTH', value: 'sawtooth' },
                { label: '⬜ SQUARE', value: 'square' },
                { label: '🔺 TRIANGLE', value: 'triangle' },
                { label: '🟢 SINE WAVE', value: 'sine' },
                { label: '⚡ PULSE WAVE', value: 'pulse' },
                { label: '🌌 SUPERSAW', value: 'supersaw' },
                { label: '🔔 METALLIC', value: 'metallic' },
                { label: '🎸 GUITAR', value: 'guitar' },
                { label: '🎹 PIANO', value: 'piano' },
              ]}
              value={lead.oscType}
              onChange={(e) => actions.updateLeadSynth('oscType', e.target.value as any)}
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase self-start mb-2">CUTOFF VCF</span>
            <Knob
              min={100}
              max={15000}
              value={lead.filterCutoff}
              onChange={(val) => actions.updateLeadSynth('filterCutoff', val)}
              unit="Hz"
              color="cyan"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase self-start mb-2">RESONANCE</span>
            <Knob
              min={0.1}
              max={8}
              value={lead.filterResonance}
              onChange={(val) => actions.updateLeadSynth('filterResonance', val)}
              unit="Q"
              color="cyan"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase self-start mb-2">ATTACK</span>
            <Knob
              min={0.002}
              max={0.8}
              value={lead.envelope.attack}
              onChange={(val) => actions.updateLeadSynth('envelope', { ...lead.envelope, attack: val })}
              unit="s"
              color="cyan"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase self-start mb-2">RELEASE</span>
            <Knob
              min={0.02}
              max={1.5}
              value={lead.envelope.release}
              onChange={(val) => actions.updateLeadSynth('envelope', { ...lead.envelope, release: val })}
              unit="s"
              color="cyan"
            />
          </div>
        </div>

        {/* Row 2: Stereo Unison and FX Space Send Levels */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase self-start mb-2 font-black text-cyan-400">UNISON CHORUS VOICES</span>
            <Knob
              min={1}
              max={5}
              value={lead.unisonVoices}
              onChange={(val) => actions.updateLeadSynth('unisonVoices', val)}
              unit="v"
              color="cyan"
            />
            <span className="text-[8px] font-mono text-slate-500 mt-1 uppercase">1 (SOLO) to 5 (THICK)</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase self-start mb-2 text-cyan-400">DETUNE CHORUS SPREAD</span>
            <Knob
              min={0}
              max={100}
              value={lead.detune}
              onChange={(val) => actions.updateLeadSynth('detune', val)}
              unit="c"
              color="cyan"
            />
            <span className="text-[8px] font-mono text-slate-500 mt-1 uppercase">DETUNE IN HERTZ/CENTS</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase self-start mb-2">DELAY EFF SEND</span>
            <Knob
              min={0.0}
              max={1.0}
              value={lead.delaySend}
              onChange={(val) => actions.updateLeadSynth('delaySend', val)}
              unit="%"
              color="amber"
            />
            <span className="text-[8px] font-mono text-slate-500 mt-1 uppercase">SEND TO TAPE DELAY</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase self-start mb-2">REVERB EFF SEND</span>
            <Knob
              min={0.0}
              max={1.0}
              value={lead.reverbSend}
              onChange={(val) => actions.updateLeadSynth('reverbSend', val)}
              unit="%"
              color="emerald"
            />
            <span className="text-[8px] font-mono text-slate-500 mt-1 uppercase">SEND TO CONVERB HALL</span>
          </div>
        </div>
      </div>

      {/* 3. 16/32 Step Piano Roll */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 flex flex-col gap-1.5 overflow-x-auto min-w-0" id="lead-grid-drawer">
        <div className="flex flex-col gap-1.5" style={{ minWidth: len * 36 + 80 }}>
          {scaleKeys.map((key) => (
            <div key={key} className="flex items-center gap-2">
              {/* Keyboard Note key label */}
              <div 
                onClick={() => {
                  audioEngineInstance.resume();
                  const ctx = audioEngineInstance.ctx;
                  if (ctx) {
                    audioEngineInstance.playLeadNote(ctx.currentTime, key, leadOctave, 0.4, lead);
                  }
                }}
                className="w-16 h-8 bg-slate-900 hover:bg-slate-800 active:bg-slate-750 active:scale-95 transition-all duration-75 border border-slate-850 rounded flex items-center justify-between px-2 text-slate-400 hover:text-cyan-400 shrink-0 select-none cursor-pointer"
                id={`lead-piano-key-${key.toLowerCase().replace('#', '-sharp')}`}
              >
                <span className="text-[10px] font-mono font-bold text-slate-300">{key}{leadOctave}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${key.includes('#') ? 'bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.7)]' : 'bg-slate-600'}`} />
              </div>

              {/* Step grids */}
              <div className="flex-1 flex gap-1">
                {Array(len)
                  .fill(0)
                  .map((_, stepIdx) => {
                    const stepObj = lead.steps[stepIdx];
                    const isActive = stepObj?.active && stepObj?.note === key;
                    const isCurrent = state.isPlaying && state.currentStep === stepIdx;

                    let cellColor = 'bg-slate-900 border-slate-850';
                    if (isActive) {
                      cellColor = isCurrent
                        ? 'bg-cyan-400 border-cyan-200 text-slate-950 shadow-[0_0_8px_rgba(34,211,238,0.85)]'
                        : 'bg-cyan-950/40 border-cyan-600/75 text-cyan-400 shadow-[inset_0_0_5px_rgba(6,182,212,0.2)]';
                    } else if (isCurrent) {
                      cellColor = 'bg-slate-800 border-slate-700';
                    }

                    return (
                      <button
                        key={stepIdx}
                        onClick={() => handleLeadStepToggle(stepIdx, key)}
                        className={`flex-1 h-8 rounded border transition-all duration-75 text-[9px] flex items-center justify-center select-none cursor-pointer ${cellColor}`}
                      >
                        {isActive ? '●' : ''}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}

          {/* Timings line under grids */}
          <div className="flex items-center gap-2 mt-2 border-t border-slate-900 pt-2 pb-1">
            <div className="w-16 shrink-0" />
            <div className="flex-1 flex gap-1 justify-between">
              {Array(len)
                .fill(0)
                .map((_, i) => (
                  <span
                    key={i}
                    className={`flex-1 text-center font-mono text-[8px] ${
                      i % 4 === 0 ? 'text-cyan-400 font-bold' : 'text-slate-600'
                    }`}
                  >
                    {i % 4 === 0 ? `B-${Math.floor(i / 4) + 1}` : `.${i % 4}`}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
