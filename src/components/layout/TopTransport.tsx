/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStudioState, EDM_GENRE_PRESETS } from '../../store/useStudioStore';
import { FAMOUS_EDM_SONGS } from '../../store/edmMelodies';
import { audioEngineInstance } from '../../audio/AudioEngine';
import NeonButton from '../common/NeonButton';
import LED from '../common/LED';
import { Play, Square, Pause, Volume2, ShieldAlert, Cpu, Menu, Sliders, Sparkles, FolderDown } from 'lucide-react';

export default function TopTransport() {
  const { state, actions } = useStudioState();
  const [cpuUsage, setCpuUsage] = useState(2);
  const [masterPeak, setMasterPeak] = useState(-60); // dB peak fader
  const meterInterval = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsVaultOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Categorize the 30 presets for nice visual grouping in the dropdown
  const getGenreCategory = (name: string): 'House/Techno' | 'Bass/Breaks' | 'High Energy/Retro' => {
    const nameLower = name.toLowerCase();
    
    const houseTechnoList = [
      'house', 'techno', 'electro house', 'deep house', 'progressive house', 
      'acid techno', 'minimal', 'french house', 'melodic techno', 'future house', 'lo-fi house'
    ];
    
    const bassBreaksList = [
      'dubstep', 'future bass', 'drum & bass', 'trap', 'garage / ukg', 
      'breakbeat', 'phonk', 'hardwave', 'glitch hop'
    ];

    if (houseTechnoList.some(g => nameLower.includes(g))) return 'House/Techno';
    if (bassBreaksList.some(g => nameLower.includes(g))) return 'Bass/Breaks';
    return 'High Energy/Retro';
  };

  const groupedPresets: Record<string, { name: string; bpm: number; description: string; songTitle: string }[]> = {
    'House / Techno Grooves 🏡': [],
    'Bass Heavy / Breakbeats 💥': [],
    'High Energy Sync / Retro 🚀': []
  };

  Object.entries(EDM_GENRE_PRESETS).forEach(([name, data]) => {
    const category = getGenreCategory(name);
    const famous = FAMOUS_EDM_SONGS[name];
    const item = { 
      name, 
      bpm: famous ? famous.bpm : data.bpm, 
      description: famous ? famous.description : data.description,
      songTitle: famous ? famous.title : name
    };
    if (category === 'House/Techno') {
      groupedPresets['House / Techno Grooves 🏡'].push(item);
    } else if (category === 'Bass/Breaks') {
      groupedPresets['Bass Heavy / Breakbeats 💥'].push(item);
    } else {
      groupedPresets['High Energy Sync / Retro 🚀'].push(item);
    }
  });

  const matchedPreset = Object.keys(EDM_GENRE_PRESETS).find(name => {
    const famous = FAMOUS_EDM_SONGS[name];
    const bpm = famous ? famous.bpm : EDM_GENRE_PRESETS[name].bpm;
    return bpm === state.bpm;
  });
  const currentPresetName = matchedPreset ? (FAMOUS_EDM_SONGS[matchedPreset]?.title || matchedPreset) : 'CUSTOM SESSION';

  const handleLoadPreset = (name: string) => {
    actions.applyPreset(name);
    setIsVaultOpen(false);
    actions.play();
  };

  const handleQuickLaunch = (name: string) => {
    actions.applyPreset(name);
    actions.play();
  };

  // Poll Peak Analyser for Visual feedback
  useEffect(() => {
    const bufferLength = 128;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateMeter = () => {
      if (audioEngineInstance.masterAnalyzer && state.isPlaying) {
        audioEngineInstance.masterAnalyzer.getByteFrequencyData(dataArray);
        
        // Find maximum amplitude peak
        let maxVal = 0;
        for (let i = 0; i < bufferLength; i++) {
          if (dataArray[i] > maxVal) maxVal = dataArray[i];
        }
        
        // Convert to rough dB representation
        const norm = maxVal / 255;
        const db = norm > 0 ? Math.round(20 * Math.log10(norm)) : -60;
        setMasterPeak(db);

        // Simulate lightweight jitter CPU usage
        setCpuUsage(Math.round(2 + norm * 15 + Math.random() * 3));
      } else {
        setMasterPeak(-60);
        setCpuUsage(1);
      }
    };

    meterInterval.current = setInterval(updateMeter, 50);

    return () => {
      if (meterInterval.current) clearInterval(meterInterval.current);
    };
  }, [state.isPlaying]);

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (!isNaN(val)) {
      val = Math.max(40, Math.min(240, val));
      actions.updateProjectField('bpm', val);
    }
  };

  // Convert dB peak limit (-60 to 0) into grid bars count
  const peakBarCount = 14;
  const dbRange = 60; // -60 to 0
  const activeBars = Math.max(0, Math.ceil(((masterPeak + 60) / dbRange) * peakBarCount));

  return (
    <header className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4 gap-4 md:gap-0 sticky top-0 z-50 shadow-md">
      {/* Brand Logo & Slogan Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={actions.toggleSidebar}
          className={`p-2 rounded-lg border transition-all ${
            state.sidebarOpen 
              ? 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.15)]' 
              : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/20'
          }`}
          title={state.sidebarOpen ? "Fold Left Menu" : "Unfold Left Menu"}
        >
          <Menu size={15} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-fuchsia-600 shadow-[0_0_12px_rgba(34,211,238,0.4)]">
            <span className="text-black font-bold text-sm tracking-tighter">EDM</span>
          </div>
          <div>
            <h1 className="text-sm font-sans font-semibold tracking-tighter text-white">
              EDM Beat Studio
            </h1>
            <p className="text-[9px] font-mono tracking-widest text-[#22d3ee] uppercase">
              pro pocket rack
            </p>
          </div>
        </div>
      </div>

      {/* 30 Master Preset Vault Dropdown & Quick Play Icons */}
      <div className="flex items-center gap-2 bg-slate-900/40 p-1.5 rounded-xl border border-slate-850/80 max-w-full relative">
        <label className="text-[9px] font-mono font-black text-cyan-400 tracking-wider flex items-center gap-1 shrink-0 pl-1">
          <Sparkles size={11} className="text-cyan-400 animate-pulse" />
          <span>VAULT:</span>
        </label>

        {/* Dropdown Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsVaultOpen(!isVaultOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-lg text-xs font-mono font-bold text-slate-200 transition-all cursor-pointer shadow-[0_0_8px_rgba(0,0,0,0.5)] active:scale-95 select-none"
            title="Open 30 Legendary EDM Preset Master Vault"
            id="preset-vault-dropdown-trigger"
          >
            <FolderDown size={13} className="text-cyan-400" />
            <span className="truncate max-w-[100px] sm:max-w-[130px]">{currentPresetName}</span>
            <span className="px-1 py-0.5 text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-800/40 rounded scale-90 font-black">30 GENRES</span>
          </button>

          {isVaultOpen && (
            <div 
              className="absolute left-0 mt-2 w-72 max-h-[420px] overflow-y-auto bg-slate-950 border border-cyan-500/40 rounded-xl shadow-[0_4px_30px_rgba(0,180,216,0.25)] z-[100] animate-scale-up p-2 scrollbar-thin"
              id="preset-vault-dropdown-menu"
            >
              <div className="text-[9px] font-mono text-cyan-400/70 border-b border-slate-850 pb-1.5 mb-1.5 px-2 tracking-widest font-black uppercase flex items-center justify-between">
                <span>📀 30 COMPLETE MASTER TRACKS</span>
                <span className="text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-800 rounded px-1">AUTO-PLAY</span>
              </div>

              {/* Categorized List */}
              {Object.keys(groupedPresets).map((categoryName) => (
                <div key={categoryName} className="mb-2.5">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block px-2 mb-1">
                    {categoryName}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {groupedPresets[categoryName].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleLoadPreset(preset.name)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left select-none transition-all duration-100 cursor-pointer ${
                          state.bpm === preset.bpm
                            ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-300'
                            : 'hover:bg-slate-900 border border-transparent text-slate-400 hover:text-white'
                        }`}
                        title={preset.description}
                        id={`vault-preset-btn-${preset.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      >
                        <div className="truncate max-w-[170px]">
                          <span className="text-xs font-mono font-bold block truncate text-slate-200">
                            {preset.songTitle}
                          </span>
                          <span className="text-[8.5px] font-mono text-cyan-400 block -mt-0.5 mb-0.5">
                            Genre: {preset.name}
                          </span>
                          <span className="text-[8px] font-mono text-slate-500 truncate block text-ellipsis overflow-hidden">
                            {preset.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">
                            {preset.bpm}
                          </span>
                          <Play size={10} className="text-cyan-400/70" fill={state.bpm === preset.bpm ? 'currentColor' : 'none'} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-slate-800" />

        {/* Quick run buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleQuickLaunch('House')}
            className={`w-7 h-7 rounded border flex items-center justify-center transition active:scale-90 cursor-pointer relative group ${
              state.bpm === 124 && state.isPlaying
                ? 'bg-cyan-950 border-cyan-500 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30'
            }`}
            title="🏡 Load & Play House"
            id="quick-play-house"
          >
            <span className="text-xs group-hover:scale-115 transition-transform font-bold">🏡</span>
            {state.bpm === 124 && state.isPlaying && (
              <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
              </span>
            )}
          </button>

          <button
            onClick={() => handleQuickLaunch('Acid Techno')}
            className={`w-7 h-7 rounded border flex items-center justify-center transition active:scale-90 cursor-pointer relative group ${
              state.bpm === 135 && state.isPlaying
                ? 'bg-fuchsia-950 border-fuchsia-500 text-fuchsia-400 shadow-[0_0_8px_rgba(240,79,250,0.3)]'
                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-fuchsia-400 hover:border-fuchsia-500/30'
            }`}
            title="☢️ Load & Play Acid Techno"
            id="quick-play-acid"
          >
            <span className="text-xs group-hover:scale-115 transition-transform font-bold">☢️</span>
            {state.bpm === 135 && state.isPlaying && (
              <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-fuchsia-500"></span>
              </span>
            )}
          </button>

          <button
            onClick={() => handleQuickLaunch('Future Bass')}
            className={`w-7 h-7 rounded border flex items-center justify-center transition active:scale-90 cursor-pointer relative group ${
              state.bpm === 150 && state.isPlaying
                ? 'bg-amber-950 border-amber-500 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-amber-400 hover:border-amber-500/30'
            }`}
            title="⚡ Load & Play Future Bass"
            id="quick-play-future-bass"
          >
            <span className="text-xs group-hover:scale-115 transition-transform font-bold">⚡</span>
            {state.bpm === 150 && state.isPlaying && (
              <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Transport Controls Deck */}
      <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80">
        <NeonButton
          active={state.isPlaying}
          color="cyan"
          onClick={actions.play}
          className="flex items-center gap-1.5 font-bold"
        >
          <Play size={11} fill={state.isPlaying ? 'currentColor' : 'none'} />
          PLAY
        </NeonButton>

        <NeonButton
          active={!state.isPlaying && state.currentStep > 0}
          color="slate"
          onClick={actions.pause}
          className="flex items-center gap-1.5"
        >
          <Pause size={11} fill={!state.isPlaying && state.currentStep > 0 ? 'currentColor' : 'none'} />
          PAUSE
        </NeonButton>

        <NeonButton
          active={false}
          color="rose"
          onClick={actions.stop}
          className="flex items-center gap-1.5"
        >
          <Square size={11} fill="currentColor" />
          STOP
        </NeonButton>

        <div className="h-6 w-[1px] bg-slate-800 mx-1" />

        {/* BPM & Metronome deck */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-850">
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-none mb-0.5">tempo</span>
            <input
              type="number"
              value={state.bpm}
              onChange={handleBpmChange}
              className="w-11 bg-transparent font-mono text-xs text-cyan-400 font-bold focus:outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <span className="text-[10px] font-mono text-slate-600">BPM</span>
        </div>

        {/* Swing percentage control */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-850">
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-none mb-0.5">swing</span>
            <span className="font-mono text-xs text-fuchsia-400 font-bold">
              {Math.round(state.swing * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={state.swing}
            onChange={(e) => actions.updateProjectField('swing', parseFloat(e.target.value))}
            className="w-14 accent-fuchsia-500 cursor-pointer h-1 bg-slate-800 rounded"
          />
        </div>

        {/* Metronome LED */}
        <button
          onClick={() => actions.updateProjectField('metronome', !state.metronome)}
          className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 transition select-none ${
            state.metronome ? 'bg-emerald-950/20 border-emerald-500/80 text-emerald-400' : 'bg-slate-950 border-slate-850 text-slate-400'
          }`}
        >
          <LED active={state.metronome && state.currentStep % 4 === 0} color="emerald" size="xs" />
          <span className="text-[9px] font-mono tracking-widest">METRO</span>
        </button>
      </div>

      {/* Audio Engine Security Status / Master Meter Panel */}
      <div className="flex items-center gap-4 bg-slate-900/40 px-4 py-2 border border-slate-850 rounded-xl">
        {/* Realtime Stereo Peak Meter */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-[1px]">
            {Array(peakBarCount)
              .fill(0)
              .map((_, i) => {
                const isActive = i < activeBars;
                // Color zones: 0-9 green, 10-12 yellow, 13-14 red (clipping zone)
                let colorClass = 'bg-slate-800';
                if (isActive) {
                  if (i < 9) colorClass = 'bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.3)]';
                  else if (i < 12) colorClass = 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.3)]';
                  else colorClass = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]';
                }
                return <div key={i} className={`w-1.5 h-3.5 rounded-sm transition-all duration-75 ${colorClass}`} />;
              })}
          </div>
          <div className="flex w-full justify-between items-center px-0.5 mt-0.5">
            <span className="text-[7px] font-mono text-slate-500">-60dB</span>
            <span className="text-[7px] font-mono text-slate-500">M-PEAK</span>
            <span className="text-[7px] font-mono text-slate-500">0dB</span>
          </div>
        </div>

        {/* CPU & Unlock Audio indicator */}
        <div className="h-6 w-[1px] bg-slate-800" />
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Cpu className="text-slate-500" size={12} />
              <span className="text-[9px] font-mono text-slate-400">SYS CORE</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold self-end">{cpuUsage}%</span>
          </div>

          {!state.audioUnlocked && (
            <button
              onClick={actions.unlockAudio}
              className="animate-pulse bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-slate-950 font-bold font-mono text-[9px] px-2.5 py-1.5 rounded-lg shadow-[0_0_12px_rgba(34,211,238,0.4)] flex items-center gap-1"
            >
              <Volume2 size={10} />
              UNLOCK AUDIO
            </button>
          )}
          {state.audioUnlocked && (
            <div className="bg-cyan-950/20 border border-cyan-800/60 px-2 py-1 rounded-lg flex items-center gap-1">
              <LED active={true} color="cyan" size="xs" />
              <span className="text-[8px] font-mono text-cyan-400 font-bold">READY</span>
            </div>
          )}

          <div className="h-6 w-[1px] bg-slate-800" />

          <button 
            onClick={actions.toggleInspector}
            className={`p-2 rounded-lg border transition-all ${
              state.inspectorOpen 
                ? 'border-fuchsia-500/30 bg-fuchsia-950/20 text-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.15)]' 
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-fuchsia-400 hover:border-fuchsia-500/20'
            }`}
            title={state.inspectorOpen ? "Fold Right Parameters" : "Unfold Right Parameters"}
          >
            <Sliders size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
