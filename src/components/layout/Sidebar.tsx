/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStudioState } from '../../store/useStudioStore';
import { Drum, Zap, Music, Disc, Sliders, SlidersHorizontal, Settings2, X, Library } from 'lucide-react';
import LED from '../common/LED';

export default function Sidebar() {
  const { state, actions } = useStudioState();

  const menuItems = [
    { id: 'drum', label: 'Drum Machine', icon: Drum, color: 'cyan' as const },
    { id: 'edm-library', label: 'EDM 샘플 (EDM Vault)', icon: Library, color: 'emerald' as const, badge: '샘플 메뉴' },
    { id: 'bass', label: 'Bass Synth', icon: Zap, color: 'purple' as const },
    { id: 'lead', label: 'Lead Synth', icon: Music, color: 'cyan' as const },
    { id: 'chord', label: 'Chord Pad', icon: Disc, color: 'purple' as const },
    { id: 'mixer', label: 'Mixer Console', icon: Sliders, color: 'emerald' as const },
    { id: 'fx', label: 'Master FX', icon: SlidersHorizontal, color: 'amber' as const },
    { id: 'project', label: 'Project Vault', icon: Settings2, color: 'cyan' as const },
  ];

  const isOpen = state.sidebarOpen;

  return (
    <aside 
      className={`fixed md:relative top-0 bottom-0 left-0 h-full max-h-screen z-[60] bg-slate-950 border-r border-slate-800 select-none p-4 flex flex-col justify-between shrink-0 overflow-y-auto pb-16 transition-all duration-300 ${
        isOpen 
          ? 'translate-x-0 w-64 opacity-100 shadow-2xl md:shadow-none' 
          : '-translate-x-full md:hidden w-0 opacity-0 border-r-0 p-0 pointer-events-none'
      }`}
      id="sidebar-layout"
    >
      {/* Menu List */}
      <div className="flex flex-col gap-1.5" id="sidebar-menu-list">
        <div className="flex items-center justify-between px-3 mb-2" id="sidebar-section-header">
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block">
            INSTRUMENT & DECKS
          </span>
          <button 
            onClick={actions.toggleSidebar}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900 md:hidden"
            title="Fold Menu"
          >
            <X size={15} />
          </button>
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = state.activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => actions.setTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border text-left transition select-none ${
                isActive
                  ? 'bg-slate-900 border-slate-700 text-white shadow-lg shadow-black/40'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={15}
                  className={isActive ? `text-${item.color === 'purple' ? 'fuchsia' : item.color}-400` : 'text-slate-500'}
                />
                <span className="text-xs font-mono font-medium tracking-wide flex items-center gap-1.5">
                  {item.label}
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-sans font-black bg-emerald-500 text-slate-950 animate-pulse tracking-tight shrink-0">
                      {item.badge}
                    </span>
                  )}
                </span>
              </div>

              {/* Status active LED indicator */}
              <LED active={isActive} color={item.color} size="xs" />
            </button>
          );
        })}
      </div>

      {/* Brand specs panel */}
      <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-850 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-mono tracking-widest text-slate-500">ENGINE STATE</span>
          <span className="text-[8px] font-mono font-bold text-cyan-400">DSP CORE 1.0</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <LED active={state.isPlaying} color="purple" size="xs" />
          <span className="text-[9px] font-mono text-slate-400">
            {state.isPlaying ? 'SPOOLING CYCLES...' : 'ONLINE (IDLE)'}
          </span>
        </div>
        <div className="text-[7.5px] font-mono text-slate-600 mt-2 hover:text-slate-400 uppercase leading-normal">
          Web Audio Synth Modulator Engine<br />
          Pure Sine Drum Synthesizer
        </div>
      </div>
    </aside>
  );
}
