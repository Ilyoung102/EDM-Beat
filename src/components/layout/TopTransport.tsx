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
import { Play, Square, Pause, Volume2, ShieldAlert, Cpu, Menu, Sliders, Sparkles, FolderDown, UploadCloud, Trash2, Link, Repeat, VolumeX, AlertCircle } from 'lucide-react';

interface CustomTrackState {
  id: string; // "custom_1" or "custom_2"
  name: string; // file name or default
  volume: number; // 0 to 2
  pan: number; // -1 to 1
  loop: boolean;
  syncWithTransport: boolean;
  isPlaying: boolean;
  mute: boolean;
  solo: boolean;
}

export default function TopTransport() {
  const { state, actions } = useStudioState();
  const [cpuUsage, setCpuUsage] = useState(2);
  const [masterPeak, setMasterPeak] = useState(-60); // dB peak fader
  const meterInterval = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [localBpmStr, setLocalBpmStr] = useState(state.bpm.toString());

  const [customTracks, setCustomTracks] = useState<CustomTrackState[]>([
    {
      id: 'custom_1',
      name: 'Custom Slot 1 (Empty)',
      volume: 0.8,
      pan: 0.0,
      loop: true,
      syncWithTransport: true,
      isPlaying: false,
      mute: false,
      solo: false,
    },
    {
      id: 'custom_2',
      name: 'Custom Slot 2 (Empty)',
      volume: 0.8,
      pan: 0.0,
      loop: true,
      syncWithTransport: true,
      isPlaying: false,
      mute: false,
      solo: false,
    }
  ]);

  const audioRefs = useRef<Record<string, {
    buffer: AudioBuffer | null;
    sourceNode?: AudioBufferSourceNode;
    gainNode?: GainNode;
    pannerNode?: StereoPannerNode;
    startTime?: number;
    pausedAt?: number;
  }>>({
    custom_1: { buffer: null },
    custom_2: { buffer: null }
  });

  const [waveforms, setWaveforms] = useState<Record<string, number[]>>({
    custom_1: [],
    custom_2: []
  });

  const [trackProgress, setTrackProgress] = useState<Record<string, number>>({
    custom_1: 0,
    custom_2: 0
  });

  const [isImporting, setIsImporting] = useState<Record<string, boolean>>({
    custom_1: false,
    custom_2: false
  });

  const generateWaveformPeaks = (buffer: AudioBuffer, id: string) => {
    const channelData = buffer.getChannelData(0);
    const step = Math.ceil(channelData.length / 45); // 45 bars for mini visuals
    const peaks: number[] = [];
    for (let i = 0; i < 45; i++) {
      let max = 0;
      const start = i * step;
      const end = Math.min(start + step, channelData.length);
      for (let j = start; j < end; j++) {
        const val = Math.abs(channelData[j]);
        if (val > max) max = val;
      }
      peaks.push(max);
    }
    setWaveforms(prev => ({ ...prev, [id]: peaks }));
  };

  const initAudioNodesForTrack = (id: string, volume: number, pan: number) => {
    const ctx = audioEngineInstance.ctx;
    if (!ctx) {
      audioEngineInstance.init();
    }
    const safeCtx = audioEngineInstance.ctx!;
    
    const gainNode = safeCtx.createGain();
    gainNode.gain.setValueAtTime(volume, safeCtx.currentTime);
    
    const pannerNode = safeCtx.createStereoPanner();
    pannerNode.pan.setValueAtTime(pan, safeCtx.currentTime);
    
    gainNode.connect(pannerNode);
    audioEngineInstance.connectCustomNode(pannerNode);
    
    audioRefs.current[id].gainNode = gainNode;
    audioRefs.current[id].pannerNode = pannerNode;
  };

  const updateTrackVolume = (id: string, vol: number) => {
    setCustomTracks(prev => prev.map(t => t.id === id ? { ...t, volume: vol } : t));
    const ref = audioRefs.current[id];
    if (ref.gainNode) {
      ref.gainNode.gain.setValueAtTime(vol, audioEngineInstance.ctx!.currentTime);
    }
  };

  const updateTrackPan = (id: string, panVal: number) => {
    setCustomTracks(prev => prev.map(t => t.id === id ? { ...t, pan: panVal } : t));
    const ref = audioRefs.current[id];
    if (ref.pannerNode) {
      ref.pannerNode.pan.setValueAtTime(panVal, audioEngineInstance.ctx!.currentTime);
    }
  };

  const stopTrack = (id: string, resetTime = true) => {
    const ref = audioRefs.current[id];
    if (ref.sourceNode) {
      try {
        ref.sourceNode.stop();
        ref.sourceNode.disconnect();
      } catch (err) {}
      ref.sourceNode = undefined;
    }
    
    if (resetTime) {
      ref.pausedAt = 0;
    } else if (ref.startTime && ref.buffer) {
      const elapsed = audioEngineInstance.ctx!.currentTime - ref.startTime;
      ref.pausedAt = elapsed % ref.buffer.duration;
    }
    
    setCustomTracks(prev => prev.map(t => t.id === id ? { ...t, isPlaying: false } : t));
  };

  const playTrack = (id: string, offset = 0) => {
    const ref = audioRefs.current[id];
    const track = customTracks.find(t => t.id === id);
    if (!ref.buffer || !track) return;

    stopTrack(id, false);

    const ctx = audioEngineInstance.ctx!;
    const sourceNode = ctx.createBufferSource();
    sourceNode.buffer = ref.buffer;
    sourceNode.loop = track.loop;

    if (!ref.gainNode || !ref.pannerNode) {
      initAudioNodesForTrack(id, track.volume, track.pan);
    }

    sourceNode.connect(ref.gainNode!);
    
    const actualOffset = offset % ref.buffer.duration;
    sourceNode.start(ctx.currentTime, actualOffset);
    
    ref.sourceNode = sourceNode;
    ref.startTime = ctx.currentTime - actualOffset;
    
    setCustomTracks(prev => prev.map(t => t.id === id ? { ...t, isPlaying: true } : t));
  };

  const toggleTrackPlay = (id: string) => {
    const track = customTracks.find(t => t.id === id);
    const ref = audioRefs.current[id];
    if (!track || !ref.buffer) return;

    if (track.isPlaying) {
      stopTrack(id, false);
    } else {
      playTrack(id, ref.pausedAt || 0);
    }
  };

  const updateTrackMute = (id: string, muteVal: boolean) => {
    setCustomTracks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, mute: muteVal } : t);
      const anySolo = next.some(t => t.solo);
      
      next.forEach(trackItem => {
        const ref = audioRefs.current[trackItem.id];
        if (ref.gainNode) {
          let targetVol = trackItem.volume;
          if (trackItem.mute) targetVol = 0;
          else if (anySolo && !trackItem.solo) targetVol = 0;
          ref.gainNode.gain.setValueAtTime(targetVol, audioEngineInstance.ctx!.currentTime);
        }
      });
      return next;
    });
  };

  const updateTrackSolo = (id: string, soloVal: boolean) => {
    setCustomTracks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, solo: soloVal } : t);
      const anySolo = next.some(t => t.solo);
      
      next.forEach(trackItem => {
        const ref = audioRefs.current[trackItem.id];
        if (ref.gainNode) {
          let targetVol = trackItem.volume;
          if (trackItem.mute) targetVol = 0;
          else if (anySolo && !trackItem.solo) targetVol = 0;
          ref.gainNode.gain.setValueAtTime(targetVol, audioEngineInstance.ctx!.currentTime);
        }
      });
      return next;
    });
  };

  const clearTrack = (id: string) => {
    stopTrack(id, true);
    const ref = audioRefs.current[id];
    ref.buffer = null;
    ref.pausedAt = 0;
    ref.startTime = 0;
    
    if (ref.gainNode) {
      try { ref.gainNode.disconnect(); } catch (e) {}
      ref.gainNode = undefined;
    }
    if (ref.pannerNode) {
      try { ref.pannerNode.disconnect(); } catch (e) {}
      ref.pannerNode = undefined;
    }
    
    setWaveforms(prev => ({ ...prev, [id]: [] }));
    setCustomTracks(prev => prev.map(t => t.id === id ? {
      ...t,
      name: `Custom Slot ${id === 'custom_1' ? '1' : '2'} (Empty)`,
      isPlaying: false,
      mute: false,
      solo: false
    } : t));
    setTrackProgress(prev => ({ ...prev, [id]: 0 }));
  };

  const handleFileChange = async (id: string, file: File | null) => {
    if (!file) return;
    setIsImporting(prev => ({ ...prev, [id]: true }));
    try {
      if (!audioEngineInstance.ctx) {
        audioEngineInstance.init();
      }
      const safeCtx = audioEngineInstance.ctx!;
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (!e.target?.result) return;
        try {
          const arrayBuffer = e.target.result as ArrayBuffer;
          const decoded = await safeCtx.decodeAudioData(arrayBuffer);
          
          audioRefs.current[id].buffer = decoded;
          generateWaveformPeaks(decoded, id);
          
          setCustomTracks(prev => prev.map(t => t.id === id ? { ...t, name: file.name } : t));
          
          const track = customTracks.find(t => t.id === id)!;
          initAudioNodesForTrack(id, track.volume, track.pan);
        } catch (err) {
          console.error("Failed to decode custom audio:", err);
          alert("오디오 데이터 디코딩에 실패했습니다. 올바른 포맷(MP3/WAV 등)을 선택해 주세요.");
        } finally {
          setIsImporting(prev => ({ ...prev, [id]: false }));
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      setIsImporting(prev => ({ ...prev, [id]: false }));
    }
  };

  // Sync play states with transport changes
  useEffect(() => {
    customTracks.forEach(track => {
      const ref = audioRefs.current[track.id];
      if (track.syncWithTransport && ref.buffer) {
        if (state.isPlaying) {
          playTrack(track.id, 0);
        } else {
          stopTrack(track.id, true);
        }
      }
    });
  }, [state.isPlaying]);

  // Handle active progress bar timing
  useEffect(() => {
    let intervalId: any;
    if (customTracks.some(t => t.isPlaying)) {
      intervalId = setInterval(() => {
        const nextProgress = { ...trackProgress };
        customTracks.forEach(t => {
          const ref = audioRefs.current[t.id];
          if (t.isPlaying && ref.buffer && ref.startTime) {
            const elapsed = audioEngineInstance.ctx!.currentTime - ref.startTime;
            nextProgress[t.id] = (elapsed % ref.buffer.duration) / ref.buffer.duration;
          } else if (!t.isPlaying) {
            nextProgress[t.id] = ref.pausedAt && ref.buffer ? ref.pausedAt / ref.buffer.duration : 0;
          }
        });
        setTrackProgress(nextProgress);
      }, 50);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [customTracks, trackProgress]);

  // Sync state BPM with typed local text
  useEffect(() => {
    setLocalBpmStr(state.bpm.toString());
  }, [state.bpm]);

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
    const rawValue = e.target.value;
    setLocalBpmStr(rawValue);
    const parsed = parseInt(rawValue, 10);
    if (!isNaN(parsed) && parsed >= 30 && parsed <= 300) {
      actions.updateProjectField('bpm', parsed);
    }
  };

  const handleBpmBlur = () => {
    let parsed = parseInt(localBpmStr, 10);
    if (isNaN(parsed)) {
      parsed = 120;
    }
    const clamped = Math.max(40, Math.min(240, parsed));
    setLocalBpmStr(clamped.toString());
    actions.updateProjectField('bpm', clamped);
  };

  // Convert dB peak limit (-60 to 0) into grid bars count
  const peakBarCount = 14;
  const dbRange = 60; // -60 to 0
  const activeBars = Math.max(0, Math.ceil(((masterPeak + 60) / dbRange) * peakBarCount));

  return (
    <header className="flex flex-col border-b border-slate-800 bg-slate-950 sticky top-0 z-50 shadow-md">
      {/* 1. Main Transport Bar Row */}
      <div className="flex flex-col lg:flex-row items-center justify-between px-6 py-4 gap-4 lg:gap-0 w-full">
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
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-sans font-semibold tracking-tighter text-white">
                  EDM Beat Studio
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono leading-none bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-bold select-none tracking-tight">
                  v1.2.0-PRO
                </span>
              </div>
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
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-850">
            <button 
              onClick={() => {
                const prev = Math.max(40, state.bpm - 1);
                actions.updateProjectField('bpm', prev);
              }}
              className="w-4 h-4 flex items-center justify-center rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 text-[10px] font-bold font-mono cursor-pointer transition select-none"
              title="Decrease BPM"
            >
              -
            </button>
            <div className="flex flex-col items-center px-1">
              <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest leading-none mb-0.5">tempo</span>
              <input
                type="text"
                pattern="[0-9]*"
                value={localBpmStr}
                onChange={handleBpmChange}
                onBlur={handleBpmBlur}
                className="w-9 bg-transparent font-mono text-xs text-cyan-400 font-bold focus:outline-none border-none p-0 text-center"
              />
            </div>
            <span className="text-[9px] font-mono text-slate-600 select-none mr-1">BPM</span>
            <button 
              onClick={() => {
                const next = Math.min(240, state.bpm + 1);
                actions.updateProjectField('bpm', next);
              }}
              className="w-4 h-4 flex items-center justify-center rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 text-[10px] font-bold font-mono cursor-pointer transition select-none"
              title="Increase BPM"
            >
              +
            </button>
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
          
          <div className="flex items-center gap-2">
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

            {/* EXTERNAL AUDIO MULTI-CHANNEL MIXER TOGGLE */}
            <button 
              onClick={() => setIsMixerOpen(!isMixerOpen)}
              className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 px-3 font-mono text-[9px] className={isMixerOpen ? 'animate-pulse' : ''} ${
                isMixerOpen 
                  ? 'border-cyan-500/80 bg-cyan-950/40 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]' 
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/20'
              }`}
              title="외부 백 트랙 / 보컬 오디오 불러오기 및 믹싱 센터"
              id="multi-mixer-toggle-btn"
            >
              <UploadCloud size={14} className={isMixerOpen ? 'animate-bounce' : ''} />
              <span className="hidden xl:inline">EXTERNAL TRACKS</span>
              {customTracks.some(t => audioRefs.current[t.id].buffer) && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </button>

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
      </div>

      {/* 2. Collapsible External Audio Loader & Multi-Channel Mixer Console */}
      {isMixerOpen && (
        <div className="bg-slate-950 border-t border-slate-900 p-5 px-6 animate-slide-down flex flex-col gap-4 shadow-[inset_0_4px_12px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
            <div>
              <h2 className="text-xs font-mono font-black text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
                <Sliders size={13} className="text-cyan-400" />
                <span>EXTERNAL AUDIO LOADER & MULTI-CHANNEL MIXER PANEL / 외부 오디오 믹싱 센터</span>
              </h2>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                오디오 파일(MP3, WAV, M4A 등)을 불러와 EDM 비트 스튜디오 마스터 버스에 실시간으로 합성 및 믹스시킬 수 있습니다.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="hidden md:inline px-2 py-0.5 rounded text-[8px] font-bold font-mono bg-indigo-950 text-indigo-400 border border-indigo-500/20">
                DSP INPUT NODE
              </span>
              <span className="px-2 py-0.5 rounded text-[8px] font-bold font-mono bg-cyan-950 text-cyan-400 border border-cyan-500/20">
                MASTER SUMMED
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {customTracks.map((track) => {
              const ref = audioRefs.current[track.id];
              const isLoaded = !!ref.buffer;
              const progress = trackProgress[track.id] || 0;
              const peakList = waveforms[track.id] || [];

              return (
                <div 
                  key={track.id} 
                  className={`flex flex-col gap-3 p-4 rounded-xl border transition-all duration-150 ${
                    isLoaded 
                      ? 'bg-slate-900/40 border-slate-850 hover:border-cyan-500/30 shadow-[0_2px_10px_rgba(0,0,0,0.3)]' 
                      : 'bg-slate-950 border-dashed border-slate-850/60 hover:border-slate-800'
                  }`}
                  id={`audio-mixer-slot-${track.id}`}
                >
                  {/* Slot Title/Header & Status Panel */}
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2 gap-2">
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${isLoaded ? (track.isPlaying ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.7)]' : 'bg-indigo-505 bg-indigo-500') : 'bg-slate-800'}`} />
                      <span className="text-[10px] font-mono font-black text-slate-500 tracking-wider uppercase shrink-0">
                        TRACK {track.id === 'custom_1' ? 'A' : 'B'}:
                      </span>
                      <span 
                        className={`text-xs font-mono font-bold truncate select-all ${isLoaded ? 'text-slate-200' : 'text-slate-600'}`} 
                        title={track.name}
                      >
                        {track.name}
                      </span>
                    </div>

                    {isLoaded && (
                      <button 
                        onClick={() => clearTrack(track.id)}
                        className="p-1 h-6 w-6 rounded bg-slate-950 border border-slate-800 hover:border-rose-500 hover:text-rose-400 text-slate-500 flex items-center justify-center transition active:scale-95 cursor-pointer"
                        title="트랙 및 오디오 소스 비우기"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>

                  {/* Waveform Visualization OR File Dropper Area */}
                  <div className="h-16 relative bg-slate-950/60 border border-slate-900/80 rounded-lg overflow-hidden flex items-center justify-center">
                    {!isLoaded ? (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-900/20 transition group select-none relative p-3">
                        <input 
                          type="file" 
                          accept="audio/*" 
                          className="hidden" 
                          onChange={(e) => handleFileChange(track.id, e.target.files?.[0] || null)}
                        />
                        {isImporting[track.id] ? (
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <div className="w-4 h-4 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent animate-spin" />
                            <span className="text-[8px] font-mono text-cyan-400 font-bold uppercase tracking-widest animate-pulse">
                              제출 파일 디코딩 중...
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <UploadCloud size={18} className="text-slate-500 group-hover:text-cyan-400 transition" />
                            <span className="text-[9px] font-mono font-black text-slate-400 tracking-wider uppercase group-hover:text-slate-200 text-center">
                              오디오 불러오기
                            </span>
                            <span className="text-[7.5px] font-mono text-slate-600 text-center">
                              MP3, WAV, M4A, FLAC, AIFF 지원
                            </span>
                          </div>
                        )}
                      </label>
                    ) : (
                      // Interactive Waveform renderer
                      <div 
                        className="w-full h-full flex items-end justify-between px-3.5 py-1.5 cursor-pointer relative group/wave select-none bg-slate-950"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const ratio = clickX / rect.width;
                          if (ref.buffer) {
                            playTrack(track.id, ratio * ref.buffer.duration);
                          }
                        }}
                        title="클릭하여 오디오 지점 재생 탐색 (Seek)"
                      >
                        {/* Shimmer playing Progress Overlay indicator */}
                        <div 
                          className="absolute inset-y-0 left-0 bg-cyan-500/10 border-r border-cyan-400/50 pointer-events-none transition-all duration-75"
                          style={{ width: `${progress * 100}%` }}
                        />

                        {/* Waveform Bars generator */}
                        {peakList.map((peak, idx) => {
                          const barHeight = Math.max(8, peak * 90); // scale peaks height
                          const isPlayed = progress > (idx / peakList.length);
                          
                          return (
                            <div 
                              key={idx} 
                              className="w-[3px] rounded-t-sm transition-all duration-300 pointer-events-none"
                              style={{ 
                                height: `${barHeight}%`, 
                                backgroundColor: isPlayed 
                                  ? 'rgba(34, 211, 238, 0.85)' // glowing cyan
                                  : 'rgba(71, 85, 105, 0.3)'   // slate gray
                              }}
                            />
                          );
                        })}

                        {/* Timeline Duration numbers indicator */}
                        <div className="absolute top-1.5 right-2 font-mono text-[8.5px] bg-slate-950 border border-slate-900 text-slate-400 px-1.5 py-0.5 rounded leading-none">
                          {ref.buffer ? `${(progress * ref.buffer.duration).toFixed(1)}s / ${ref.buffer.duration.toFixed(1)}s` : '0.0s'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Channel Strip Mix Sliders Group */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Volume Slider with percentage dB readout */}
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-900 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                        <span>VOLUME / 볼륨 fader</span>
                        <span className="font-bold text-cyan-400">{Math.round(track.volume * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <VolumeX size={11} className="text-slate-500 shrink-0" />
                        <input 
                          type="range"
                          min="0"
                          max="2"
                          step="0.02"
                          value={track.volume}
                          onChange={(e) => updateTrackVolume(track.id, parseFloat(e.target.value))}
                          disabled={!isLoaded}
                          className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-slate-900 rounded appearance-none disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                        <Volume2 size={11} className="text-cyan-400 shrink-0" />
                      </div>
                    </div>

                    {/* Panning Balance Center Dial representation */}
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-900 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                        <span>BAL PAN / 좌우 밸런스</span>
                        <span className="font-bold text-indigo-400">
                          {track.pan === 0 ? 'C' : track.pan < 0 ? `L${Math.abs(Math.round(track.pan * 100))}%` : `R${Math.round(track.pan * 100)}%`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold font-mono text-slate-500 shrink-0">L</span>
                        <input 
                          type="range"
                          min="-1"
                          max="1"
                          step="0.05"
                          value={track.pan}
                          onChange={(e) => updateTrackPan(track.id, parseFloat(e.target.value))}
                          disabled={!isLoaded}
                          className="flex-1 accent-indigo-400 cursor-pointer h-1.5 bg-slate-900 rounded appearance-none disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                        <span className="text-[9px] font-bold font-mono text-slate-500 shrink-0">R</span>
                      </div>
                    </div>
                  </div>

                  {/* Channel Mixing Console Buttons Deck (Play, Solo, Mute, Loop, Beat Sync) */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-900 justify-between">
                    <div className="flex items-center gap-1">
                      {/* Play/Pause Trigger */}
                      <button 
                        onClick={() => toggleTrackPlay(track.id)}
                        disabled={!isLoaded}
                        className={`px-3 py-1.5 rounded-md font-mono text-[9px] font-black uppercase flex items-center gap-1 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border ${
                          track.isPlaying 
                            ? 'bg-gradient-to-r from-cyan-950 to-cyan-900 text-cyan-300 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]' 
                            : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {track.isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                        <span>{track.isPlaying ? 'PAUSE' : 'PLAY'}</span>
                      </button>

                      {/* Direct Stop */}
                      <button 
                        onClick={() => stopTrack(track.id, true)}
                        disabled={!isLoaded}
                        className="p-1.5 h-7 w-7 rounded-md bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition active:scale-95 cursor-pointer"
                        title="트랙 연주 중지 및 원점 탐색"
                      >
                        <Square size={9} fill="currentColor" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Mute (M) Toggle */}
                      <button 
                        onClick={() => updateTrackMute(track.id, !track.mute)}
                        disabled={!isLoaded}
                        className={`w-7 h-7 rounded-md font-mono text-[10px] font-black flex items-center justify-center border transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                          track.mute 
                            ? 'bg-rose-950/50 border-rose-500/80 text-rose-400 shadow-[0_0_6px_rgba(239,68,68,0.25)]' 
                            : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        title="음소거 Mute"
                      >
                        M
                      </button>

                      {/* Solo (S) Toggle */}
                      <button 
                        onClick={() => updateTrackSolo(track.id, !track.solo)}
                        disabled={!isLoaded}
                        className={`w-7 h-7 rounded-md font-mono text-[10px] font-black flex items-center justify-center border transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                          track.solo 
                            ? 'bg-amber-950/40 border-amber-500/80 text-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.25)]' 
                            : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        title="솔로 솔로연주"
                      >
                        S
                      </button>

                      {/* Loop Pattern (🔄) */}
                      <button 
                        onClick={() => setCustomTracks(prev => prev.map(t => t.id === track.id ? { ...t, loop: !t.loop } : t))}
                        disabled={!isLoaded}
                        className={`w-7 h-7 rounded-md flex items-center justify-center border transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                          track.loop 
                            ? 'bg-indigo-950/40 border-indigo-500/60 text-indigo-400' 
                            : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                        title="루프 루프반복"
                      >
                        <Repeat size={11} className={track.loop && track.isPlaying ? 'animate-spin-slow' : ''} />
                      </button>

                      {/* Beat Sequencer Play Sync (🔗) */}
                      <button 
                        onClick={() => setCustomTracks(prev => prev.map(t => t.id === track.id ? { ...t, syncWithTransport: !t.syncWithTransport } : t))}
                        disabled={!isLoaded}
                        className={`w-7 h-7 rounded-md flex items-center justify-center border transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                          track.syncWithTransport 
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-400' 
                            : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                        title="시퀀서 재생 시작 및 중지 템포와 연동"
                      >
                        <Link size={11} className={track.syncWithTransport ? 'animate-pulse text-emerald-400' : ''} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
