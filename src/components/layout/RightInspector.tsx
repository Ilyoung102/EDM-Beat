/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStudioState } from '../../store/useStudioStore';
import Knob from '../common/Knob';
import Toggle from '../common/Toggle';
import LED from '../common/LED';
import { Settings, Volume2, Flame, RefreshCw, X } from 'lucide-react';

export default function RightInspector() {
  const { state, actions } = useStudioState();

  const isOpen = state.inspectorOpen;

  const renderContent = () => {
    switch (state.activeTab) {
      case 'drum':
        return (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-mono font-bold text-cyan-400">DRUM MASTER GUTS</span>
              <LED active={state.isPlaying} color="cyan" size="xs" />
            </div>

            {/* Quick Mixer Faders */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex flex-col gap-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Bus Pre-Drive</span>
              <Knob
                min={0}
                max={1.5}
                value={state.project.mixerChannels.find(m => m.id === 'drum_bus')?.volume || 0.9}
                onChange={(val) => actions.updateMixerChannel('drum_bus', 'volume', val)}
                label="DRUM BUS VOL"
                unit="x"
              />
            </div>

            {/* Global Clipper options */}
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">GLUE EFFECTS</span>
              <Toggle
                label="Soft Saturation"
                checked={state.project.softClipEnabled}
                onChange={() => actions.toggleSoftClip()}
                color="cyan"
              />
              <Toggle
                label="Bus Compressor"
                checked={state.project.compressorEnabled}
                onChange={() => actions.toggleCompressor()}
                color="purple"
              />
              <Toggle
                label="Brickwall Limiter"
                checked={state.project.limiterEnabled}
                onChange={() => actions.toggleLimiter()}
                color="emerald"
              />
            </div>
          </div>
        );

      case 'bass':
        const bass = state.project.bassSynth;
        return (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-mono font-bold text-fuchsia-400">BASS SYNTH VOICE</span>
              <LED active={state.isPlaying} color="purple" size="xs" />
            </div>

            {/* Filter Envelope Control */}
            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-850 flex flex-col items-center gap-4">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block self-start">ANALOG FILTER</span>
              <div className="grid grid-cols-2 gap-3 w-full">
                <Knob
                  min={50}
                  max={4500}
                  value={bass.filterCutoff}
                  onChange={(val) => actions.updateBassSynth('filterCutoff', val)}
                  label="VCF CUTOFF"
                  unit="Hz"
                  color="purple"
                />
                <Knob
                  min={0.1}
                  max={12}
                  value={bass.filterResonance}
                  onChange={(val) => actions.updateBassSynth('filterResonance', val)}
                  label="RESONANCE"
                  unit="Q"
                  color="purple"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">SUB & SATURATION</span>
              <Toggle
                label="BUMP SUB OSC (Sine -1 Oct)"
                checked={bass.subOsc}
                onChange={(checked) => actions.updateBassSynth('subOsc', checked)}
                color="purple"
              />
              
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex justify-center mt-1">
                <Knob
                  min={0.0}
                  max={1.0}
                  value={bass.distortion}
                  onChange={(val) => actions.updateBassSynth('distortion', val)}
                  label="SHAPE DRIVE"
                  unit="%"
                  color="purple"
                />
              </div>
            </div>
          </div>
        );

      case 'lead':
        const lead = state.project.leadSynth;
        return (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-mono font-bold text-cyan-400">ARP LEAD SYNTH</span>
              <LED active={state.isPlaying} color="cyan" size="xs" />
            </div>

            {/* Unison Voice configuration */}
            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-850 flex flex-col gap-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">STEREO CHORUS</span>
              <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-850">
                <span className="text-[10px] font-mono text-slate-400">UNISON VOICES</span>
                <span className="text-xs font-mono font-bold text-cyan-400">{lead.unisonVoices}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={lead.unisonVoices}
                onChange={(e) => actions.updateLeadSynth('unisonVoices', parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-800 rounded"
              />

              <div className="flex justify-center mt-2">
                <Knob
                  min={0}
                  max={100}
                  value={lead.detune}
                  onChange={(val) => actions.updateLeadSynth('detune', val)}
                  label="CHORUS SPREAD"
                  unit="cents"
                  color="cyan"
                />
              </div>
            </div>

            {/* Quick FX Sends */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex flex-col gap-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">PARALLEL SENDS</span>
              <div className="grid grid-cols-2 gap-3">
                <Knob
                  min={0.0}
                  max={0.9}
                  value={lead.delaySend}
                  onChange={(val) => actions.updateLeadSynth('delaySend', val)}
                  label="DELAY"
                  unit="%"
                  color="cyan"
                />
                <Knob
                  min={0.0}
                  max={0.9}
                  value={lead.reverbSend}
                  onChange={(val) => actions.updateLeadSynth('reverbSend', val)}
                  label="REVERB"
                  unit="%"
                  color="cyan"
                />
              </div>
            </div>
          </div>
        );

      case 'chord':
        return (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-mono font-bold text-teal-400">CHORD PAD PRO</span>
              <LED active={state.isPlaying} color="cyan" size="xs" />
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex flex-col gap-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">CHORD SUB HARMONICS</span>
              <p className="text-[9px] font-mono text-slate-400 leading-normal">
                Adjust the dynamic mix balance of chord voices and auxiliary resonance tracks.
              </p>
              <div className="flex justify-center gap-4 mt-2">
                <Knob
                  min={0.1}
                  max={1.2}
                  value={state.project.mixerChannels.find(m => m.id === 'chord')?.volume || 0.7}
                  onChange={(val) => actions.updateMixerChannel('chord', 'volume', val)}
                  label="VOICING VOL"
                  unit="x"
                  color="cyan"
                />
                <Knob
                  min={-1.0}
                  max={1.0}
                  value={state.project.mixerChannels.find(m => m.id === 'chord')?.pan || 0.0}
                  onChange={(val) => actions.updateMixerChannel('chord', 'pan', val)}
                  label="PAD PANNING"
                  unit="lr"
                  color="cyan"
                />
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex flex-col gap-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">AUX SENDS</span>
              <div className="grid grid-cols-2 gap-3">
                <Knob
                  min={0.0}
                  max={1.0}
                  value={state.project.mixerChannels.find(m => m.id === 'chord')?.reverbSend || 0.4}
                  onChange={(val) => actions.updateMixerChannel('chord', 'reverbSend', val)}
                  label="REVERB"
                  unit="%"
                  color="cyan"
                />
                <Knob
                  min={0.0}
                  max={1.0}
                  value={state.project.mixerChannels.find(m => m.id === 'chord')?.delaySend || 0.2}
                  onChange={(val) => actions.updateMixerChannel('chord', 'delaySend', val)}
                  label="DELAY"
                  unit="%"
                  color="cyan"
                />
              </div>
            </div>
          </div>
        );

      case 'mixer':
        return (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-mono font-bold text-purple-400">MASTER CONSOLE</span>
              <LED active={state.isPlaying} color="purple" size="xs" />
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex flex-col gap-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">FADER DECK</span>
              <div className="flex justify-center gap-4">
                <Knob
                  min={0.0}
                  max={1.2}
                  value={state.project.mixerChannels.find(m => m.id === 'master')?.volume || 0.95}
                  onChange={(val) => actions.updateMixerChannel('master', 'volume', val)}
                  label="MASTER VOL"
                  unit="x"
                  color="purple"
                />
                <Knob
                  min={-1.0}
                  max={1.0}
                  value={state.project.mixerChannels.find(m => m.id === 'master')?.pan || 0.0}
                  onChange={(val) => actions.updateMixerChannel('master', 'pan', val)}
                  label="STEREO BAL"
                  unit="%"
                  color="purple"
                />
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex flex-col gap-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">LIMITING & SAFETY</span>
              <Toggle
                label="Soft Saturation"
                checked={state.project.softClipEnabled}
                onChange={() => actions.toggleSoftClip()}
                color="purple"
              />
              <Toggle
                label="Bus Compressor"
                checked={state.project.compressorEnabled}
                onChange={() => actions.toggleCompressor()}
                color="purple"
              />
              <Toggle
                label="Brickwall Limiter"
                checked={state.project.limiterEnabled}
                onChange={() => actions.toggleLimiter()}
                color="purple"
              />
            </div>
          </div>
        );

      case 'fx':
        const fxSettings = state.project.fxSettings;
        return (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-mono font-bold text-amber-400">AUX MODULATION Rack</span>
              <LED active={state.isPlaying} color="amber" size="xs" />
            </div>

            {/* Sidechain specs */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex flex-col gap-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">LF0 SIDECHAIN PUMP</span>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-slate-400">PUMP DEPTH</span>
                <span className="text-[10px] font-mono font-bold text-amber-400">{Math.floor(fxSettings.sidechain.amount * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={fxSettings.sidechain.amount}
                onChange={(e) => actions.updateFXSettings('sidechain', { amount: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer h-1 bg-slate-800 rounded"
              />

              <div className="flex justify-between items-center bg-slate-950 p-1.5 rounded border border-slate-850">
                <span className="text-[8px] font-mono text-slate-500 uppercase">SPEED RATE</span>
                <select 
                  value={fxSettings.sidechain.lfoSpeed}
                  onChange={(e) => actions.updateFXSettings('sidechain', { lfoSpeed: e.target.value })}
                  className="bg-slate-900 text-[10px] font-mono border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 focus:outline-none"
                >
                  <option value="1/4">1/4 BEAT</option>
                  <option value="1/8">1/8 BEAT</option>
                  <option value="1/2">1/2 BEAT</option>
                </select>
              </div>
            </div>

            {/* Custom Filter decay sliders */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex flex-col gap-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">AUX SPACE REFLECTION</span>
              <div className="grid grid-cols-2 gap-3">
                <Knob
                  min={0.1}
                  max={0.98}
                  value={fxSettings.reverb.roomSize}
                  onChange={(val) => actions.updateFXSettings('reverb', { roomSize: val })}
                  label="ROOM SIZE"
                  unit="x"
                  color="amber"
                />
                <Knob
                  min={0.1}
                  max={0.95}
                  value={fxSettings.delay.feedback}
                  onChange={(val) => actions.updateFXSettings('delay', { feedback: val })}
                  label="DLY FEEDBACK"
                  unit="%"
                  color="amber"
                />
              </div>
            </div>
          </div>
        );

      case 'project':
        return (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-mono font-bold text-rose-400">ENGINE CONFIG</span>
              <LED active={state.isPlaying} color="rose" size="xs" />
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-850 flex flex-col gap-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">SWING GROOVE SHUFFLE</span>
              <p className="text-[9px] font-mono text-slate-400 leading-normal">
                Pushes even 16th beats forward to lock in typical swing feel.
              </p>
              <div className="flex justify-center mt-1">
                <Knob
                  min={0.0}
                  max={1.0}
                  value={state.swing}
                  onChange={(val) => actions.updateProjectField('swing', val)}
                  label="SWING VALUE"
                  unit="%"
                  color="purple"
                />
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex flex-col gap-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1.5">BATCH ACTIONS</span>
              <button
                onClick={actions.generateRandomPatterns}
                className="w-full py-1.5 text-[9px] font-mono font-bold tracking-widest uppercase bg-rose-950/40 text-rose-300 hover:bg-rose-900 border border-rose-800/60 rounded transition active:scale-95"
              >
                🎛️ RANDOM PATTERNS
              </button>
              <button
                onClick={actions.clearAllPatterns}
                className="w-full py-1.5 text-[9px] font-mono font-bold tracking-widest uppercase bg-slate-950 text-slate-400 hover:bg-rose-950 hover:text-rose-400 border border-slate-850 rounded transition active:scale-95"
              >
                🗑️ WIPE STUDIO CLEAN
              </button>
            </div>
          </div>
        );

      default:
        // Global / Mixer Inserts view
        const fx = state.project.fxSettings;
        return (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-mono font-bold text-amber-400">GLOBAL AUX FX</span>
              <LED active={state.isPlaying} color="amber" size="xs" />
            </div>

            {/* Quick Reverb Decay control */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex flex-col items-center gap-3">
              <span className="text-[10px] font-mono text-slate-400 self-start uppercase">SPACE SIZE</span>
              <div className="flex gap-4">
                <Knob
                  min={0.1}
                  max={0.99}
                  value={fx.reverb.roomSize}
                  onChange={(val) => actions.updateFXSettings('reverb', { roomSize: val })}
                  label="ROOM SIZE"
                  unit="x"
                  color="amber"
                />
                <Knob
                  min={0.2}
                  max={5.0}
                  value={fx.reverb.decay}
                  onChange={(val) => actions.updateFXSettings('reverb', { decay: val })}
                  label="REVERB TAIL"
                  unit="s"
                  color="amber"
                />
              </div>
            </div>

            {/* Quick Delay feedback control */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex flex-col items-center gap-3">
              <span className="text-[10px] font-mono text-slate-400 self-start uppercase">ECHO LOOPS</span>
              <div className="flex gap-4">
                <Knob
                  min={0.0}
                  max={0.95}
                  value={fx.delay.feedback}
                  onChange={(val) => actions.updateFXSettings('delay', { feedback: val })}
                  label="FEEDBACK"
                  unit="%"
                  color="amber"
                />
                <Knob
                  min={100}
                  max={12000}
                  value={fx.delay.frequency}
                  onChange={(val) => actions.updateFXSettings('delay', { frequency: val })}
                  label="DAMPING FILTER"
                  unit="Hz"
                  color="amber"
                />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <aside 
      className={`fixed md:relative top-0 bottom-0 right-0 h-full max-h-screen z-[60] bg-slate-950 border-l border-slate-800 select-none p-4 flex flex-col shrink-0 overflow-y-auto pb-16 transition-all duration-300 ${
        isOpen 
          ? 'translate-x-0 w-60 opacity-100 shadow-2xl md:shadow-none' 
          : 'translate-x-full md:hidden w-0 opacity-0 border-l-0 p-0 pointer-events-none'
      }`}
      id="right-inspector-layout"
    >
      {/* Parameter Panel Container */}
      <div className="flex flex-col gap-1.5 mb-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Settings size={14} className="text-slate-400 animate-spin-slow" />
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              PARAMETER RACK
            </span>
          </div>
          <button 
            onClick={actions.toggleInspector}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900 md:hidden"
            title="Fold Parameters"
          >
            <X size={15} />
          </button>
        </div>
        
        {renderContent()}
      </div>

      {/* Mini info overlay */}
      <div className="mt-auto bg-slate-905 p-3 rounded-lg border border-slate-850">
        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block mb-1">PRO-MIX ADVICE</span>
        <p className="text-[9px] font-mono text-slate-400 leading-normal">
          Use the Master Saturation toggles located in the Drum tab or FX Rack to add rich analog grit & warm tape saturations.
        </p>
      </div>
    </aside>
  );
}
