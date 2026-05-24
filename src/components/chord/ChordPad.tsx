/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStudioState } from '../../store/useStudioStore';
import { ChordPadData } from '../../types/studio';
import { audioEngineInstance } from '../../audio/AudioEngine';
import LED from '../common/LED';
import Select from '../common/Select';
import { Disc, Play, Edit, HelpCircle } from 'lucide-react';

const CHORD_PRESETS: Record<string, { label: string; pads: Omit<ChordPadData, 'id'>[] }> = {
  'Future Bass': {
    label: 'Emotional Future Bass',
    pads: [
      { label: 'E-Min 7th', rootNote: 'E', chordType: 'm7th', bassNote: 'E' },
      { label: 'C-Maj 7th', rootNote: 'C', chordType: '7th', bassNote: 'C' },
      { label: 'G-Maj Sus2', rootNote: 'G', chordType: 'sus2', bassNote: 'G' },
      { label: 'D-Maj 7th', rootNote: 'D', chordType: '7th', bassNote: 'D' },
      { label: 'A-Min 7th', rootNote: 'A', chordType: 'm7th', bassNote: 'A' },
      { label: 'F-Maj 7th', rootNote: 'F', chordType: '7th', bassNote: 'F' },
      { label: 'B-Min 7th', rootNote: 'B', chordType: 'm7th', bassNote: 'B' },
      { label: 'E-Maj Sus4', rootNote: 'E', chordType: 'sus4', bassNote: 'E' },
    ]
  },
  'Trance': {
    label: 'Uplifting Trance',
    pads: [
      { label: 'C-Minor', rootNote: 'C', chordType: 'minor', bassNote: 'C' },
      { label: 'Ab-Major', rootNote: 'G#', chordType: 'major', bassNote: 'G#' },
      { label: 'Eb-Major', rootNote: 'D#', chordType: 'major', bassNote: 'D#' },
      { label: 'Bb-Major', rootNote: 'A#', chordType: 'major', bassNote: 'A#' },
      { label: 'F-Minor', rootNote: 'F', chordType: 'minor', bassNote: 'F' },
      { label: 'Ab-Sus2', rootNote: 'G#', chordType: 'sus2', bassNote: 'G#' },
      { label: 'G-Minor', rootNote: 'G', chordType: 'minor', bassNote: 'G' },
      { label: 'C-Sus4', rootNote: 'C', chordType: 'sus4', bassNote: 'C' },
    ]
  },
  'Deep House': {
    label: 'Deep House Triads',
    pads: [
      { label: 'A-Min 7th', rootNote: 'A', chordType: 'm7th', bassNote: 'A' },
      { label: 'D-Min 7th', rootNote: 'D', chordType: 'm7th', bassNote: 'D' },
      { label: 'G-Maj 7th', rootNote: 'G', chordType: '7th', bassNote: 'G' },
      { label: 'C-Maj 7th', rootNote: 'C', chordType: '7th', bassNote: 'C' },
      { label: 'F-Maj 7th', rootNote: 'F', chordType: '7th', bassNote: 'F' },
      { label: 'B-Minor', rootNote: 'B', chordType: 'minor', bassNote: 'B' },
      { label: 'E-Min 7th', rootNote: 'E', chordType: 'm7th', bassNote: 'E' },
      { label: 'A-Sus2', rootNote: 'A', chordType: 'sus2', bassNote: 'A' },
    ]
  },
  'Dark Techno': {
    label: 'Minimalist Techno',
    pads: [
      { label: 'F#-Minor', rootNote: 'F#', chordType: 'minor', bassNote: 'F#' },
      { label: 'G-Major', rootNote: 'G', chordType: 'major', bassNote: 'G' },
      { label: 'F#-Sus4', rootNote: 'F#', chordType: 'sus4', bassNote: 'F#' },
      { label: 'F-Dim', rootNote: 'F', chordType: 'minor', bassNote: 'F' },
      { label: 'D-Minor', rootNote: 'D', chordType: 'minor', bassNote: 'D' },
      { label: 'C#-Sus2', rootNote: 'C#', chordType: 'sus2', bassNote: 'C#' },
      { label: 'G#-Minor', rootNote: 'G#', chordType: 'minor', bassNote: 'G#' },
      { label: 'F#-Minor', rootNote: 'F#', chordType: 'minor', bassNote: 'F#' },
    ]
  }
};

const ROOT_OPTIONS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(n => ({ label: n, value: n }));
const CHORD_TYPE_OPTIONS = [
  { label: 'MAJOR 🟢', value: 'major' },
  { label: 'MINOR 🟣', value: 'minor' },
  { label: 'SUS-2 🟡', value: 'sus2' },
  { label: 'SUS-4 🟠', value: 'sus4' },
  { label: 'DOMINANT 7TH 💎', value: '7th' },
  { label: 'MINOR 7TH 🌸', value: 'm7th' },
];

export default function ChordPad() {
  const { state, actions } = useStudioState();
  const [editingPadId, setEditingPadId] = useState<string | null>('pad0');

  const pads = state.project.chordPads;
  const steps = state.project.chordSteps;

  const handlePadPress = (pad: ChordPadData) => {
    audioEngineInstance.triggerLivePad(pad);
    setEditingPadId(pad.id);
  };

  const handlePresetSelect = (presetName: string) => {
    const selected = CHORD_PRESETS[presetName];
    if (selected) {
      const updatedPads = pads.map((pad, idx) => {
        const source = selected.pads[idx];
        return source ? { ...pad, ...source } : pad;
      });
      actions.updateProjectField('chordPads', updatedPads);
    }
  };

  const handleStepToggle = (stepIdx: number, padId: string) => {
    const matchedStep = steps[stepIdx];
    const updatedSteps = [...steps];

    if (matchedStep && matchedStep.active && matchedStep.padId === padId) {
      // Deactivate
      updatedSteps[stepIdx] = { active: false, padId: null };
    } else {
      // Activate with chosen pad
      updatedSteps[stepIdx] = { active: true, padId: padId };
    }

    actions.updateProjectField('chordSteps', updatedSteps);
  };

  const activePadObj = pads.find(p => p.id === editingPadId);

  return (
    <div className="flex flex-col gap-6" id="chord-pad-panel">
      {/* 1. Header with chord presets */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-850">
        <div>
          <h2 className="text-sm font-mono font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <Disc className="text-fuchsia-400 animate-pulse" size={14} />
            POLYSYNTH CHORD CORES
          </h2>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Tap neon pads below to trigger deep brass chord stacks. Sequence pad triggers onto the 16 step timeline below.
          </p>
        </div>

        {/* Chord progressions dropdown */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-850">
          <span className="text-[8px] font-mono text-slate-500 uppercase px-2">CHORD_HARMONY:</span>
          {Object.keys(CHORD_PRESETS).map((pKey) => (
            <button
              key={pKey}
              onClick={() => handlePresetSelect(pKey)}
              className="px-2.5 py-1 text-[9px] font-mono font-bold rounded bg-slate-900 text-slate-400 hover:text-cyan-400 hover:border hover:border-cyan-500 transition select-none uppercase shrink-0"
            >
              {CHORD_PRESETS[pKey].label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 8 Poly Pads matrix display */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {pads.map((pad, idx) => {
          const isSelectedForEdit = editingPadId === pad.id;
          
          return (
            <div
              key={pad.id}
              onClick={() => handlePadPress(pad)}
              className={`h-24 rounded-2xl border-2 p-3 flex flex-col justify-between cursor-pointer select-none active:scale-95 transition-all duration-100 ${
                isSelectedForEdit
                  ? 'bg-fuchsia-950/20 border-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.4)] text-fuchsia-100'
                  : 'bg-slate-900 border-slate-850 hover:border-slate-700 hover:bg-slate-900/80 text-slate-400'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[8.5px] font-mono text-slate-500 font-bold uppercase">PAD 0{idx + 1}</span>
                <LED active={isSelectedForEdit} color="purple" size="xs" />
              </div>

              <div className="text-center py-1">
                <span className={`text-sm font-mono font-bold tracking-tight block uppercase ${isSelectedForEdit ? 'text-white font-black' : 'text-slate-300'}`}>
                  {pad.rootNote} {pad.chordType}
                </span>
                <span className="text-[8px] font-mono text-slate-500 block uppercase font-bold mt-0.5">
                  Type: {pad.chordType}
                </span>
              </div>

              {/* Edit small cue */}
              <div className="flex justify-between items-center opacity-70">
                <span className="text-[8px] font-mono text-slate-500">Bass: {pad.bassNote}</span>
                <span className="text-[8.5px] font-mono text-slate-500 flex items-center gap-0.5">
                  <Edit size={8} /> edit
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Chord Custom Settings Card & 16-step Sequencer Grid combined */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chord Pad Editor (Left 1/3) */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 flex flex-col gap-4">
          <h3 className="text-xs font-mono font-bold text-slate-200 border-b border-slate-850 pb-2 flex items-center gap-2">
            <Edit size={12} className="text-fuchsia-400" />
            PAD MODULATOR CARD
          </h3>

          {activePadObj ? (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-slate-400">EDITED PAD:</span>
                <span className="text-xs font-mono text-fuchsia-400 font-bold uppercase">{activePadObj.id}</span>
              </div>

              {/* Form elements */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                <Select
                  label="ROOT NOTE"
                  options={ROOT_OPTIONS}
                  value={activePadObj.rootNote}
                  onChange={(e) => {
                    const updated = pads.map(p => p.id === activePadObj.id ? { ...p, rootNote: e.target.value } : p);
                    actions.updateProjectField('chordPads', updated);
                  }}
                />
                
                <Select
                  label="CHORD TYPE"
                  options={CHORD_TYPE_OPTIONS}
                  value={activePadObj.chordType}
                  onChange={(e) => {
                    const updated = pads.map(p => p.id === activePadObj.id ? { ...p, chordType: e.target.value as any } : p);
                    actions.updateProjectField('chordPads', updated);
                  }}
                />
              </div>

              <div className="mt-2.5">
                <Select
                  label="FAT UNDERCOAT SUB (1 Oct down)"
                  options={ROOT_OPTIONS}
                  value={activePadObj.bassNote || activePadObj.rootNote}
                  onChange={(e) => {
                    const updated = pads.map(p => p.id === activePadObj.id ? { ...p, bassNote: e.target.value } : p);
                    actions.updateProjectField('chordPads', updated);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-800 rounded">
              <HelpCircle className="text-slate-600 mb-2" size={18} />
              <span className="text-[10px] font-mono text-slate-500 text-center uppercase leading-normal">
                Click any neon pad above<br />to edit its custom voicings
              </span>
            </div>
          )}
        </div>

        {/* 16 Step Chord trigger matrix (Right 2/3) */}
        <div className="lg:col-span-2 bg-slate-900/40 p-4 rounded-xl border border-slate-850 flex flex-col gap-4 overflow-x-auto min-w-0" id="chord-timeline-box">
          <h3 className="text-xs font-mono font-bold text-slate-200 border-b border-slate-850 pb-2">
            CHORD MATRIX LINE
          </h3>

          <div className="flex flex-col gap-1.5 min-w-[500px]">
            {pads.map((pad, pIdx) => (
              <div key={pad.id} className="flex items-center gap-2">
                {/* Pad anchor identifier */}
                <div
                  onClick={() => handlePadPress(pad)}
                  className={`w-20 h-7.5 rounded text-[10px] font-mono border flex items-center justify-between px-2 cursor-pointer transition select-none uppercase ${
                    editingPadId === pad.id
                      ? 'bg-fuchsia-950/20 border-fuchsia-500 text-fuchsia-400 font-bold'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>PAD 0{pIdx + 1}</span>
                  <span className="text-[8px] opacity-40">{pad.rootNote}</span>
                </div>

                {/* 16 steps */}
                <div className="flex-1 flex gap-1">
                  {Array(16)
                    .fill(0)
                    .map((_, stepIdx) => {
                      const stepObj = steps[stepIdx];
                      const isActive = stepObj?.active && stepObj?.padId === pad.id;
                      const isCurrent = state.isPlaying && state.currentStep % 16 === stepIdx;

                      let cellBg = 'bg-slate-950 border-slate-850';
                      if (isActive) {
                        cellBg = isCurrent
                          ? 'bg-fuchsia-400 border-fuchsia-200 text-slate-950'
                          : 'bg-fuchsia-950/40 border-fuchsia-800 text-fuchsia-400';
                      } else if (isCurrent) {
                        cellBg = 'bg-slate-800 border-slate-700';
                      }

                      return (
                        <button
                          key={stepIdx}
                          onClick={() => handleStepToggle(stepIdx, pad.id)}
                          className={`flex-1 h-7.5 rounded border transition-all duration-75 text-[9px] flex items-center justify-center select-none ${cellBg}`}
                        />
                      );
                    })}
                </div>
              </div>
            ))}

            {/* Timings index */}
            <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-slate-900 select-none">
              <div className="w-20 shrink-0" />
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
                      B-{Math.floor(i / 4) + 1}
                    </span>
                  ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
