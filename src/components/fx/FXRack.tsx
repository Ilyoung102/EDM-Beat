/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStudioState } from '../../store/useStudioStore';
import Knob from '../common/Knob';
import Select from '../common/Select';
import Toggle from '../common/Toggle';
import LED from '../common/LED';
import { Sliders, Headphones, RefreshCw, Layers } from 'lucide-react';

export default function FXRack() {
  const { state, actions } = useStudioState();
  const fx = state.project.fxSettings;

  return (
    <div className="flex flex-col gap-6" id="fx-rack-panel">
      {/* 1. Header display */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-850">
        <div>
          <h2 className="text-sm font-mono font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <Sliders className="text-amber-400 animate-pulse" size={14} />
            STUDIO OUTRAGE FX RACK MODULE
          </h2>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Layer algorithmic audio processors. Apply the ducking Sidechain pump trigger to establish famous modern EDM grooves.
          </p>
        </div>
      </div>

      {/* 2. Audio FX Units vertical virtual stack racks */}
      <div className="flex flex-col gap-6" id="rack-stack">
        
        {/* FX MODULE A: Reverb Unit */}
        <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-600" />
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-2.5">
              <LED active={fx.reverb.wet > 0.02} color="purple" size="sm" />
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wide uppercase">REVERB SPACEREFLECT (STUDIONODE)</h3>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Aux Send 1 / Stereo algorithmic space</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 items-center">
              <Knob
                min={0.1}
                max={0.99}
                value={fx.reverb.roomSize}
                onChange={(val) => actions.updateFXSettings('reverb', { roomSize: val })}
                label="ROOM SIZE"
                unit="x"
                color="purple"
              />
              <Knob
                min={0.3}
                max={6.0}
                value={fx.reverb.decay}
                onChange={(val) => actions.updateFXSettings('reverb', { decay: val })}
                label="TAIL DECAY"
                unit="s"
                color="purple"
              />
              <Knob
                min={0.0}
                max={0.05}
                value={fx.reverb.preDelay}
                onChange={(val) => actions.updateFXSettings('reverb', { preDelay: val })}
                label="PRE-DELAY"
                unit="s"
                color="purple"
              />
              <div className="w-[1px] h-10 bg-slate-800" />
              <Knob
                min={0.0}
                max={1.0}
                value={fx.reverb.wet}
                onChange={(val) => actions.updateFXSettings('reverb', { wet: val })}
                label="WET% AUX"
                unit="%"
                color="purple"
              />
            </div>
          </div>
        </div>

        {/* FX MODULE B: Tape Stereo Delay */}
        <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-2.5">
              <LED active={fx.delay.wet > 0.02} color="emerald" size="sm" />
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wide uppercase">TAPE ANALOG ECHO DETECTOR</h3>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Aux Send 2 / Sync Delay Lines</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 items-center">
              <div className="w-28 shrink-0">
                <Select
                  label="DELAY QUANTIZE RATE"
                  options={[
                    { label: '¼ Note (Classic)', value: '1/4' },
                    { label: '⅛ Note (Arp Echo)', value: '1/8' },
                    { label: '⅟₁₆ Note (Gallop)', value: '1/16' },
                    { label: '⅛ Triplet (Psy)', value: '1/8t' },
                    { label: '⅟₁₆ Triplet (DnB)', value: '1/16t' },
                    { label: '⅛ Dotted (Ping)', value: '1/8d' },
                  ]}
                  value={fx.delay.time}
                  onChange={(e) => actions.updateFXSettings('delay', { time: e.target.value as any })}
                />
              </div>
              <Knob
                min={0.0}
                max={0.95}
                value={fx.delay.feedback}
                onChange={(val) => actions.updateFXSettings('delay', { feedback: val })}
                label="FEEDBACK"
                unit="%"
                color="emerald"
              />
              <Knob
                min={100}
                max={14000}
                value={fx.delay.frequency}
                onChange={(val) => actions.updateFXSettings('delay', { frequency: val })}
                label="LOW DAMP VCF"
                unit="Hz"
                color="emerald"
              />
              <div className="w-[1px] h-10 bg-slate-800" />
              <Knob
                min={0.0}
                max={1.0}
                value={fx.delay.wet}
                onChange={(val) => actions.updateFXSettings('delay', { wet: val })}
                label="WET% MIX"
                unit="%"
                color="emerald"
              />
            </div>
          </div>
        </div>

        {/* FX MODULE C: Distortion Saturator */}
        <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-2.5">
              <LED active={fx.distortion.wet > 0.02} color="rose" size="sm" />
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wide uppercase">WAVESHAPING TAPE OVERDRIVE</h3>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Master Saturation / Harmonic Tube distortion</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 items-center">
              <Knob
                min={0.0}
                max={1.0}
                value={fx.distortion.drive}
                onChange={(val) => actions.updateFXSettings('distortion', { drive: val })}
                label="DRIVE VALUE"
                unit="%"
                color="amber"
              />
              <Knob
                min={200}
                max={15000}
                value={fx.distortion.tone}
                onChange={(val) => actions.updateFXSettings('distortion', { tone: val })}
                label="TONE SHELF"
                unit="Hz"
                color="amber"
              />
              <div className="w-[1px] h-10 bg-slate-800" />
              <Knob
                min={0.0}
                max={1.0}
                value={fx.distortion.wet}
                onChange={(val) => actions.updateFXSettings('distortion', { wet: val })}
                label="SATURATION LEVEL"
                unit="%"
                color="amber"
              />
            </div>
          </div>
        </div>

        {/* FX MODULE D: Resonator Sweep Filter */}
        <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500" />

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-2.5">
              <LED active={fx.filter.cutoff < 17000 || fx.filter.type !== 'lowpass'} color="cyan" size="sm" />
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wide uppercase">MASTER SWEEPER RESONATOR</h3>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Dynamic filter / Bus biquad sweep</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 items-center">
              <div className="w-28 shrink-0">
                <Select
                  label="FILTER TYPE"
                  options={[
                    { label: '🎫 LOW PASS', value: 'lowpass' },
                    { label: '🎟️ HIGH PASS', value: 'highpass' },
                    { label: '🎚️ BAND PASS', value: 'bandpass' },
                  ]}
                  value={fx.filter.type}
                  onChange={(e) => actions.updateFXSettings('filter', { type: e.target.value as any })}
                />
              </div>
              <Knob
                min={25}
                max={19500}
                value={fx.filter.cutoff}
                onChange={(val) => actions.updateFXSettings('filter', { cutoff: val })}
                label="CUTOFF SWEEP"
                unit="Hz"
                color="cyan"
              />
              <Knob
                min={0.1}
                max={15.0}
                value={fx.filter.resonance}
                onChange={(val) => actions.updateFXSettings('filter', { resonance: val })}
                label="BIQUAD RESONANCE"
                unit="Q"
                color="cyan"
              />
            </div>
          </div>
        </div>

        {/* FX MODULE E: EDM Sidechain Duck Pump */}
        <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400" />

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-2.5">
              <LED active={fx.sidechain.amount > 0.05} color="amber" size="sm" />
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wide uppercase">AUTOPUMP SIDECHAIN COMPRESSION</h3>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Clubs Duck / Dynamic pump compression</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 items-center">
              <div className="w-32 shrink-0">
                <Select
                  label="DETECTION MODE"
                  options={[
                    { label: '🥁 KICK TRIGGER (EDM)', value: 'kick-trigger' },
                    { label: '🔄 LFO COMP PUMP', value: 'lfo-pump' },
                  ]}
                  value={fx.sidechain.mode}
                  onChange={(e) => actions.updateFXSettings('sidechain', { mode: e.target.value as any })}
                />
              </div>
              
              {fx.sidechain.mode === 'lfo-pump' && (
                <div className="w-24 shrink-0">
                  <Select
                    label="LFO TEMP SPEED"
                    options={[
                      { label: '¼ Beat', value: '1/4' },
                      { label: '⅛ Beat', value: '1/8' },
                      { label: '½ Beat', value: '1/2' },
                    ]}
                    value={fx.sidechain.lfoSpeed}
                    onChange={(e) => actions.updateFXSettings('sidechain', { lfoSpeed: e.target.value as any })}
                  />
                </div>
              )}

              <Knob
                min={0.0}
                max={1.0}
                value={fx.sidechain.amount}
                onChange={(val) => actions.updateFXSettings('sidechain', { amount: val })}
                label="DUCKING DEPTH"
                unit="%"
                color="amber"
              />
              <Knob
                min={0.05}
                max={0.5}
                value={fx.sidechain.release}
                onChange={(val) => actions.updateFXSettings('sidechain', { release: val })}
                label="RELEASE RATE"
                unit="s"
                color="amber"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
