/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStudioState, EDM_GENRE_PRESETS } from '../../store/useStudioStore';
import { Play, Sparkles, FolderOpen, Tag, Music, Sliders, Search, Activity, HelpCircle } from 'lucide-react';
import { audioEngineInstance } from '../../audio/AudioEngine';
import LED from '../common/LED';

export default function EDMLibrary() {
  const { state, actions } = useStudioState();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubGenre, setSelectedSubGenre] = useState<'All' | 'House/Techno' | 'Bass/Breaks' | 'High Energy/Retro'>('All');
  const [justApplied, setJustApplied] = useState<string | null>(null);

  // Categorize the 30 presets
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

  const allPresets = Object.entries(EDM_GENRE_PRESETS).map(([name, data]) => {
    return {
      name,
      bpm: data.bpm,
      description: data.description,
      category: getGenreCategory(name),
    };
  });

  const filteredPresets = allPresets.filter((preset) => {
    const matchesSearch = preset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          preset.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedSubGenre === 'All' || preset.category === selectedSubGenre;
    return matchesSearch && matchesCategory;
  });

  const handleApplyPreset = (name: string) => {
    actions.applyPreset(name);
    setJustApplied(name);
    
    // Smooth live sound preview of the applied genre preset
    setTimeout(() => {
      audioEngineInstance.resume();
      const ctx = audioEngineInstance.ctx;
      if (ctx) {
        const now = ctx.currentTime;
        // 1. Play the kick for rhythm stamp
        audioEngineInstance.playKick(now, 1.0);
        
        // 2. Play a representative deep bass synth note
        const bassSynth = state.project.bassSynth;
        if (bassSynth) {
          audioEngineInstance.playBassNote(now + 0.05, 'C', 2, 0.45, bassSynth);
        }
        
        // 3. Play a warm lush chords pad progression chord
        if (state.project.chordPads && state.project.chordPads.length > 0) {
          audioEngineInstance.playChordPad(now + 0.1, state.project.chordPads[0], 1.2);
        }
      }
    }, 80);

    setTimeout(() => {
      setJustApplied(null);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6" id="edm-library-browser-panel">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-850">
        <div>
          <h2 className="text-sm font-mono font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <Sparkles className="text-cyan-400 animate-pulse" size={14} />
            MASTER EDM SAMPLES & GENRE VAULT
          </h2>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Exploit 30+ highly-engineered professional EDM presets. Load instant loops, sync-adjusted synths & pre-assigned effects!
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850 text-[10px] font-mono text-slate-400">
          <Activity size={12} className="text-cyan-400 animate-ping" />
          <span>CURRENT TEMPO: <strong className="text-cyan-400">{state.project.bpm} BPM</strong></span>
        </div>
      </div>

      {/* 2. Filters & Search Box */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/30 p-3 rounded-xl border border-slate-850/60">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search genres or descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-9 pr-3 py-1.5 font-mono text-xs text-slate-200 outline-none focus:border-cyan-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
          {(['All', 'House/Techno', 'Bass/Breaks', 'High Energy/Retro'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedSubGenre(cat)}
              className={`px-3 py-1 text-[9.5px] font-mono font-bold tracking-tight rounded transition-all cursor-pointer ${
                selectedSubGenre === cat
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Grid representation of EDM presets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="edm-library-grid-presets">
        {filteredPresets.map((preset) => {
          const isSelected = state.project.bpm === preset.bpm; // loose match as indication
          const isJustApplied = justApplied === preset.name;

          let cardAccentColor = 'border-slate-800';
          let textAccentColor = 'text-cyan-400';
          let badgeBg = 'bg-cyan-950/40 text-cyan-400 border-cyan-900';
          
          if (preset.category === 'House/Techno') {
            cardAccentColor = 'hover:border-cyan-500/50';
            textAccentColor = 'text-cyan-400';
            badgeBg = 'bg-cyan-950/40 text-cyan-400 border-cyan-900';
          } else if (preset.category === 'Bass/Breaks') {
            cardAccentColor = 'hover:border-fuchsia-500/50';
            textAccentColor = 'text-fuchsia-400';
            badgeBg = 'bg-fuchsia-950/40 text-fuchsia-400 border-fuchsia-900';
          } else {
            cardAccentColor = 'hover:border-amber-500/50';
            textAccentColor = 'text-amber-400';
            badgeBg = 'bg-amber-950/40 text-amber-400 border-amber-900';
          }

          return (
            <div
              key={preset.name}
              className={`relative bg-slate-900/40 p-4.5 rounded-xl border ${
                isJustApplied ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)] bg-slate-900/80 scale-[1.01]' : 'border-slate-850'
              } ${cardAccentColor} transition-all duration-300 flex flex-col justify-between gap-4`}
              id={`preset-card-${preset.name.toLowerCase().replace(/[^a-z0-str]/g, '-')}`}
            >
              <div>
                {/* Accent mini light bar */}
                <div className={`absolute top-0 left-4 right-4 h-[1.5px] rounded-b ${
                  isJustApplied ? 'bg-emerald-500' : 
                  preset.category === 'House/Techno' ? 'bg-cyan-500/40' :
                  preset.category === 'Bass/Breaks' ? 'bg-fuchsia-500/40' : 'bg-amber-500/40'
                }`} />

                {/* Subheader category & BPM */}
                <div className="flex items-center justify-between mb-2 mt-1">
                  <span className={`text-[8.5px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded border ${badgeBg}`}>
                    {preset.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-black text-slate-300">{preset.bpm}</span>
                    <span className="text-[8px] font-mono text-slate-500">BPM</span>
                  </div>
                </div>

                {/* Giant Title */}
                <h3 className="text-sm font-mono font-bold text-white tracking-wide flex items-center gap-2">
                  <Music size={13} className={textAccentColor} />
                  {preset.name}
                </h3>

                {/* Description block */}
                <p className="text-[10.5px] font-mono text-slate-400 mt-2.5 leading-relaxed bg-slate-950/40 p-2.5 rounded border border-slate-900 min-h-[56px]">
                  {preset.description}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleApplyPreset(preset.name)}
                className={`w-full py-2 text-[10px] font-mono font-bold tracking-wider uppercase rounded-lg border transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                  isJustApplied
                    ? 'bg-emerald-500 hover:bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {isJustApplied ? (
                  <>
                    <LED active={true} color="emerald" size="xs" />
                    LOADED SUCCESSFULLY!
                  </>
                ) : (
                  <>
                    <FolderOpen size={11} className={`${textAccentColor}`} />
                    💿 LOAD PRESET & BEATS
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 4. Mini Tutorial Footer Information Box */}
      <div className="bg-slate-900/10 border border-slate-850 p-4.5 rounded-xl flex items-start gap-3.5">
        <HelpCircle size={20} className="text-cyan-400 mt-0.5 min-w-[20px]" />
        <div className="flex flex-col gap-1 text-[11px] font-mono text-slate-400 leading-relaxed">
          <span className="font-bold text-slate-200 uppercase tracking-widest text-[10px] block">PRO EDM WORKFLOW TUTORIAL</span>
          <p>
            When you select and load one of the **30 Master Presets**, our AI-engineered engine:
          </p>
          <ul className="list-disc list-inside flex flex-col gap-1 mt-1 pl-1 text-[10.5px]">
            <li>Instantly rewrites the 16/32 step matrix of all 8 Synthesized drum channels.</li>
            <li>Re-adjusts the global project tempo (BPM) to the genre-perfect timing index.</li>
            <li>Configures specialized sound synthesis properties (sawtooth sub-harmonics, filter cuts).</li>
            <li>Injects target spatial acoustic sends (Master Distortion buffers, Reverb width thresholds).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
