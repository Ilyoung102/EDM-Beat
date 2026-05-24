/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStudioState } from '../../store/useStudioStore';
import { audioEngineInstance } from '../../audio/AudioEngine';
import Knob from '../common/Knob';
import Slider from '../common/Slider';
import Toggle from '../common/Toggle';
import LED from '../common/LED';
import { Sliders, Volume2, ShieldAlert } from 'lucide-react';

export default function Mixer() {
  const { state, actions } = useStudioState();
  const [channelPeaks, setChannelPeaks] = useState<Record<string, number>>({});
  const animFrameId = useRef<any>(null);

  // Poll Peak meter values from biquad channel analyzers
  useEffect(() => {
    const buffer = new Uint8Array(32);
    
    const updateAnalyzers = () => {
      const nextPeaks: Record<string, number> = {};
      
      state.project.mixerChannels.forEach(c => {
        const analyzer = audioEngineInstance.channelAnalyzers[c.id];
        if (analyzer && state.isPlaying && !c.mute) {
          analyzer.getByteFrequencyData(buffer);
          let sum = 0;
          for (let i = 0; i < 32; i++) sum += buffer[i];
          const average = sum / 32;
          nextPeaks[c.id] = Math.min(1.0, average / 110); // scale value
        } else {
          nextPeaks[c.id] = 0.05; // tiny jitter idle line
        }
      });

      setChannelPeaks(nextPeaks);
      animFrameId.current = requestAnimationFrame(updateAnalyzers);
    };

    animFrameId.current = requestAnimationFrame(updateAnalyzers);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [state.isPlaying, state.project.mixerChannels]);

  // Height count for fader led peak meter
  const meterNodes = 10;

  return (
    <div className="flex flex-col gap-6" id="mixer-console-panel">
      {/* 1. Header description */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-850">
        <div>
          <h2 className="text-sm font-mono font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <Sliders className="text-emerald-400 animate-pulse" size={14} />
            10-CHANNEL MULTI-BUS MIXER CONSOLE
          </h2>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Route separate drum elements and synths towards master inserts. Attenuate fader heights and balance panning widths.
          </p>
        </div>

        {/* Global toggles inside Mixer */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded border border-slate-850">
          <button
            onClick={actions.toggleLimiter}
            className={`px-3 py-1 font-mono text-[9px] font-bold rounded transition border ${
              state.project.limiterEnabled
                ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400'
                : 'bg-slate-900 border-slate-850 text-slate-500'
            }`}
          >
            🧱 MASTER LIMITER
          </button>
          <button
            onClick={actions.toggleCompressor}
            className={`px-3 py-1 font-mono text-[9px] font-bold rounded transition border ${
              state.project.compressorEnabled
                ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400'
                : 'bg-slate-900 border-slate-850 text-slate-500'
            }`}
          >
            🗜️ BUS GLUE COMP
          </button>
        </div>
      </div>

      {/* 2. Mixer console desk containing channels strip */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 flex gap-4 overflow-x-auto select-none grow min-h-[420px]" id="mixer-strips-carousel">
        {state.project.mixerChannels.map((channel) => {
          const peak = channelPeaks[channel.id] || 0.05;
          const activeNodeCount = Math.ceil(peak * meterNodes);
          const isMaster = channel.id === 'master';
          const isDrumBus = channel.id === 'drum_bus';

          return (
            <div
              key={channel.id}
              className={`w-24 flex flex-col justify-between p-2 rounded-xl border transition ${
                isMaster
                  ? 'bg-slate-900/60 border-cyan-700/50 shadow-[0_0_10px_rgba(6,182,212,0.1)] shrink-0 ml-auto'
                  : isDrumBus
                  ? 'bg-slate-900/40 border-purple-900/40 shrink-0 mr-2'
                  : 'bg-slate-900/10 border-slate-900 hover:bg-slate-900/30'
              }`}
            >
              {/* Channel Label Header */}
              <div className="text-center pb-1.5 border-b border-slate-900 flex flex-col items-center justify-between min-h-[46px]">
                <span className={`text-[10px] font-mono font-bold block truncate tracking-wide w-full ${isMaster ? 'text-cyan-400 font-extrabold' : 'text-slate-300'}`}>
                  {channel.name}
                </span>
                <div className="flex items-center justify-center gap-1.5 mt-1 w-full">
                  <span className="text-[7.5px] font-mono text-slate-500 uppercase truncate max-w-[45px]">
                    {channel.id.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => actions.openVolumeEdit('mixer', channel.id, channel.name, channel.volume)}
                    className="p-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-850 hover:border-cyan-500/50 text-cyan-400 hover:text-cyan-300 transition-all active:scale-90 cursor-pointer flex items-center justify-center"
                    title="Open 300% Giant Volume Slider"
                    id={`mixer-channel-vol-pop-${channel.id}`}
                  >
                    <Volume2 size={9.5} className="animate-pulse" />
                  </button>
                </div>
              </div>

              {/* AUX Sends sends knobs inside each channel */}
              {!isMaster && (
                <div className="flex gap-2 justify-center scale-75 origin-top my-2 mb-1 border-b border-slate-900/40 pb-2">
                  <Knob
                    min={0.0}
                    max={0.9}
                    value={channel.reverbSend}
                    onChange={(val) => actions.updateMixerChannel(channel.id, 'reverbSend', val)}
                    label="RVB"
                    color="amber"
                  />
                  <Knob
                    min={0.0}
                    max={0.9}
                    value={channel.delaySend}
                    onChange={(val) => actions.updateMixerChannel(channel.id, 'delaySend', val)}
                    label="DLY"
                    color="amber"
                  />
                </div>
              )}

              {/* Channel Panning knob */}
              <div className="scale-75 origin-top mb-1">
                <Knob
                  min={-1.0}
                  max={1.0}
                  value={channel.pan}
                  onChange={(val) => actions.updateMixerChannel(channel.id, 'pan', val)}
                  label="PAN WIDTH"
                />
              </div>

              {/* Center volume slider + LED Peak Meter layout */}
              <div className="flex-1 flex gap-2 h-44 justify-center items-stretch py-3 px-1 my-1.5 border-t border-b border-slate-900/40">
                {/* Visual LED Meter */}
                <div className="w-1.5 bg-slate-950 flex flex-col justify-end gap-[1.5px] p-[1px] rounded-sm overflow-hidden shrink-0">
                  {Array(meterNodes)
                    .fill(0)
                    .map((_, nodeIdx) => {
                      const finalIdx = meterNodes - 1 - nodeIdx;
                      const isActive = finalIdx < activeNodeCount;
                      
                      let colorClass = 'bg-slate-850';
                      if (isActive) {
                        if (finalIdx < 6) colorClass = 'bg-emerald-500';
                        else if (finalIdx < 8) colorClass = 'bg-amber-400';
                        else colorClass = 'bg-rose-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]';
                      }
                      
                      return <div key={nodeIdx} className={`w-full flex-1 rounded-sm transition-all duration-75 ${colorClass}`} />;
                    })}
                </div>

                {/* Volume Fader slider */}
                <div className="flex-1 relative flex flex-col items-center justify-between py-2 bg-slate-950/20 rounded">
                  <button
                    onClick={() => actions.openVolumeEdit('mixer', channel.id, channel.name, channel.volume)}
                    className="w-7 h-7 mb-1.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 relative"
                    title="Zoom Volume (Giant 300% Fader)"
                    id={`fader-zoom-btn-${channel.id}`}
                  >
                    <Volume2 size={13} className="animate-pulse" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                    </span>
                  </button>
                  <input
                    type="range"
                    min="0.0"
                    max="1.2"
                    step="0.02"
                    value={channel.mute ? 0 : channel.volume}
                    onChange={(e) => actions.updateMixerChannel(channel.id, 'volume', parseFloat(e.target.value))}
                    className="h-28 [writing-mode:vertical-lr] [direction:rtl] accent-cyan-400 focus:outline-none cursor-pointer"
                    title={`Fader volume level: ${channel.volume}`}
                  />
                </div>
              </div>

              {/* Mute and Solo buttons list */}
              {!isMaster ? (
                <div className="flex gap-1 justify-center mt-1">
                  <button
                    onClick={() => actions.updateMixerChannel(channel.id, 'mute', !channel.mute)}
                    className={`w-8 py-1 rounded text-[8px] font-mono font-bold transition border ${
                      channel.mute
                        ? 'bg-rose-950/40 border-rose-500 text-rose-400'
                        : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300'
                    }`}
                    title="Mute"
                  >
                    MUTE
                  </button>
                  <button
                    onClick={() => actions.updateMixerChannel(channel.id, 'solo', !channel.solo)}
                    className={`w-8 py-1 rounded text-[8px] font-mono font-bold transition border ${
                      channel.solo
                        ? 'bg-amber-950/40 border-amber-500 text-amber-400'
                        : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300'
                    }`}
                    title="Solo"
                  >
                    SOLO
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center p-1 bg-slate-950/40 rounded border border-slate-850">
                  <span className="text-[7.5px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase">PRO OUT</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
