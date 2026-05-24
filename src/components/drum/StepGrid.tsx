/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStudioState } from '../../store/useStudioStore';
import LED from '../common/LED';
import Knob from '../common/Knob';
import { audioEngineInstance } from '../../audio/AudioEngine';
import { VolumeX, Volume2, Play, Music, Radio } from 'lucide-react';

export default function StepGrid() {
  const { state, actions } = useStudioState();
  const [selectedTrackForVelocity, setSelectedTrackForVelocity] = useState<string | null>('kick');
  const [velocityEditIndex, setVelocityEditIndex] = useState<number | null>(null);

  const tracks = state.project.drumTracks;
  const len = state.project.patternLength;

  const handleAudition = (trackId: string) => {
    audioEngineInstance.triggerLiveDrum(trackId);
  };

  const handleStepClick = (e: React.MouseEvent, trackId: string, idx: number) => {
    if (e.shiftKey) {
      // Show mini velocity editor or toggle selected track for quick fader
      setSelectedTrackForVelocity(trackId);
      setVelocityEditIndex(idx);
    } else {
      actions.toggleDrumStep(trackId, idx);
      setSelectedTrackForVelocity(trackId);
      setVelocityEditIndex(idx);
    }
  };

  return (
    <div className="flex flex-col gap-4" style={{ minWidth: 680 }} id="step-grid-holder">
      {/* 1. Track List Rows */}
      {tracks.map((track) => {
        const hasSolo = tracks.some((t) => t.solo);
        const isActiveSolo = track.solo;
        const isMuted = track.mute || (hasSolo && !isActiveSolo);
        
        return (
          <div
            key={track.id}
            className={`flex items-center gap-3 p-1.5 rounded-xl transition ${
              selectedTrackForVelocity === track.id ? 'bg-slate-900/40 border border-slate-800' : 'border border-transparent'
            }`}
          >
            {/* Left Control Panel / Faders & Mutes */}
            <div className="w-56 shrink-0 flex items-center gap-2 pr-2 border-r border-slate-900 select-none">
              {/* LED Status channel */}
              <LED active={!isMuted && state.isPlaying} color="cyan" size="xs" />

              {/* Pad trigger play audition buttons */}
              <button
                onClick={() => handleAudition(track.id)}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500 active:scale-95 transition"
                title="Tap to audition drum synth"
              >
                <Radio size={12} className="animate-spin-slow" />
              </button>

              {/* Track Name */}
              <div 
                className="flex-1 min-w-0 cursor-pointer flex flex-col justify-center" 
                onClick={() => {
                  setSelectedTrackForVelocity(track.id);
                  handleAudition(track.id);
                }}
              >
                <span className="text-[11px] font-mono font-bold text-slate-200 block truncate hover:text-cyan-400 uppercase tracking-wide">
                  {track.name}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[8px] font-mono text-slate-500 block uppercase">
                    {track.id.replace('_', ' ')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.openVolumeEdit('drum', track.id, track.name, track.volume);
                    }}
                    className="p-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-850 hover:border-cyan-500/50 text-cyan-400 hover:text-cyan-300 transition-all active:scale-90 cursor-pointer flex items-center justify-center"
                    title="Open 300% Giant Volume Slider"
                  >
                    <Volume2 size={8} />
                  </button>
                </div>
              </div>

              {/* Quick Mixer Mute / Solo buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => actions.updateDrumTrackField(track.id, 'mute', !track.mute)}
                  className={`w-5 h-5 rounded text-[8px] font-mono font-bold flex items-center justify-center transition border ${
                    track.mute
                      ? 'bg-rose-950/40 border-rose-500 text-rose-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                  title="Mute Track"
                >
                  M
                </button>
                <button
                  onClick={() => actions.updateDrumTrackField(track.id, 'solo', !track.solo)}
                  className={`w-5 h-5 rounded text-[8px] font-mono font-bold flex items-center justify-center transition border ${
                    track.solo
                      ? 'bg-amber-950/40 border-amber-500 text-amber-400 shadow-[0_0_5px_rgba(245,158,11,0.2)]'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                  title="Solo Track"
                >
                  S
                </button>
              </div>

              {/* Mini Pan / Vol Knob */}
              <div className="flex items-center gap-2">
                <div className="scale-75 origin-right hidden sm:block">
                  <Knob
                    min={0.0}
                    max={1.0}
                    value={track.volume}
                    onChange={(val) => actions.updateDrumTrackField(track.id, 'volume', val)}
                    color="cyan"
                  />
                </div>
              </div>
            </div>

            {/* Right Matrix Nodes (Sequencer button steps) */}
            <div className="flex-1 flex justify-between gap-1">
              {Array(len)
                .fill(0)
                .map((_, idx) => {
                  const step = track.steps[idx];
                  const isActivated = step?.active;
                  const isCurrent = state.isPlaying && state.currentStep === idx;
                  const isBeatDivision = idx % 4 === 0;

                  // Outer color zones for visual grid grouping
                  let borderClass = 'border-slate-850 bg-slate-900/60';
                  if (isBeatDivision) borderClass = 'border-slate-700 bg-slate-900';
                  if (isActivated) {
                    borderClass = isCurrent
                      ? 'border-cyan-300 bg-cyan-400 text-slate-950'
                      : 'border-cyan-500 bg-cyan-950/50 text-cyan-400 shadow-[inset_0_0_4px_rgba(34,211,238,0.3)]';
                  } else if (isCurrent) {
                    borderClass = 'border-slate-400 bg-slate-850';
                  }

                  const velocityPercent = step ? step.velocity : 1.0;

                  return (
                    <button
                      key={idx}
                      onClick={(e) => handleStepClick(e, track.id, idx)}
                      className={`flex-1 h-9 rounded-md border flex flex-col items-center justify-between p-1 transition-all duration-100 transform active:scale-90 select-none ${borderClass}`}
                      title="Click to toggle. Shift + Click to set velocity"
                    >
                      {/* Interactive Velocity Height bar indication */}
                      <div className="w-full flex justify-between items-center px-0.5">
                        <div
                          className={`w-[2px] h-1 rounded ${
                            isCurrent ? 'bg-white' : isBeatDivision ? 'bg-fuchsia-500' : 'bg-slate-600'
                          }`}
                        />
                        <span className="text-[6.5px] font-mono opacity-50 block leading-none">
                          {isCurrent ? '●' : ''}
                        </span>
                      </div>

                      {/* Micro velocity level line bar fill */}
                      <div className="w-full h-1 bg-slate-850 rounded-full overflow-hidden self-end">
                        <div
                          className={`h-full rounded transition-all ${
                            isActivated ? 'bg-cyan-400' : 'bg-slate-700'
                          }`}
                          style={{ width: `${velocityPercent * 100}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        );
      })}

      {/* 2. Micro Velocity Fader overlay when a track is clicked */}
      {selectedTrackForVelocity && (
        <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <LED active={true} color="purple" size="xs" />
            <span className="text-[11px] font-mono text-slate-300">
              Editing: <strong className="text-white uppercase">{(tracks.find(t => t.id === selectedTrackForVelocity)?.name || '')}</strong>
            </span>
            <span className="text-[9px] font-mono text-slate-500 uppercase ml-2">
              (SHIFT+CLICK matrix button to focus step dynamics)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-slate-400">
              Velocity: <strong className="text-fuchsia-400">
                {Math.round((tracks.find(t => t.id === selectedTrackForVelocity)?.steps[velocityEditIndex ?? 0]?.velocity || 1.0) * 100)}%
              </strong>
            </span>
            <input
              type="range"
              min="0.1"
              max="1.2"
              step="0.05"
              value={tracks.find(t => t.id === selectedTrackForVelocity)?.steps[velocityEditIndex ?? 0]?.velocity || 1.0}
              onChange={(e) => {
                const targetVal = parseFloat(e.target.value);
                actions.changeDrumVelocity(selectedTrackForVelocity, velocityEditIndex ?? 0, targetVal);
              }}
              className="w-40 accent-fuchsia-500 cursor-pointer h-1.5 bg-slate-800 rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
