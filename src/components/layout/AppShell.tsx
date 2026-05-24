/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useStudioState } from '../../store/useStudioStore';
import TopTransport from './TopTransport';
import Sidebar from './Sidebar';
import RightInspector from './RightInspector';
import BottomTimeline from './BottomTimeline';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import GiantVolumeOverlay from '../common/GiantVolumeOverlay';

// Lazy imports of central panels
import DrumMachine from '../drum/DrumMachine';
import EDMLibrary from '../project/EDMLibrary';
import BassSynth from '../synth/BassSynth';
import SubSynth from '../synth/SubSynth';
import LeadSynth from '../synth/LeadSynth';
import ChordPad from '../chord/ChordPad';
import Mixer from '../mixer/Mixer';
import FXRack from '../fx/FXRack';
import ProjectPanel from '../project/ProjectPanel';

export default function AppShell() {
  const { state, actions } = useStudioState();

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        // Prevent double overlays from simultaneously occupying both sides of narrow screens
        if (state.sidebarOpen && state.inspectorOpen) {
          actions.toggleInspector();
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [state.sidebarOpen, state.inspectorOpen]);

  const renderActiveTab = () => {
    switch (state.activeTab) {
      case 'drum':
        return <DrumMachine />;
      case 'edm-library':
        return <EDMLibrary />;
      case 'bass':
        return <BassSynth />;
      case 'sub':
        return <SubSynth />;
      case 'lead':
        return <LeadSynth />;
      case 'chord':
        return <ChordPad />;
      case 'mixer':
        return <Mixer />;
      case 'fx':
        return <FXRack />;
      case 'project':
        return <ProjectPanel />;
      default:
        return <DrumMachine />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans" id="applet-shell">
      {/* 1. Header transport deck bar */}
      <TopTransport />

      {/* 2. Main workflow desktop */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left Side menu backdrop */}
        {state.sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-[1px] z-[55] md:hidden transition-opacity duration-300" 
            onClick={actions.toggleSidebar}
            id="sidebar-backdrop"
          />
        )}

        {/* Left Side menu */}
        <Sidebar />

        {/* Left smart pull-tab handle */}
        {!state.sidebarOpen && (
          <button
            onClick={actions.toggleSidebar}
            className="fixed left-0 top-[45%] -translate-y-1/2 z-35 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 px-1 py-5 rounded-r-xl border-y border-r border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all duration-300 hover:pl-2.5 active:scale-95 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
            title="Open Left Menu"
            id="smart-left-pull-tab"
          >
            <ChevronRight size={13} className="animate-pulse" />
            <span className="text-[7.5px] font-mono leading-none font-bold tracking-widest [writing-mode:vertical-lr] uppercase select-none">MENU</span>
          </button>
        )}

        {/* Central working station (Active tab dashboard) */}
        <main className="flex-1 overflow-y-auto bg-[#030712] p-6 relative flex flex-col min-w-0 font-sans" id="main-workflow-terminal">
          {renderActiveTab()}
        </main>

        {/* Right smart pull-tab handle */}
        {!state.inspectorOpen && (
          <button
            onClick={actions.toggleInspector}
            className="fixed right-0 top-[45%] -translate-y-1/2 z-35 bg-gradient-to-l from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-fuchsia-400 text-slate-950 px-1 py-5 rounded-l-xl border-y border-l border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.4)] transition-all duration-300 hover:pr-2.5 active:scale-95 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
            title="Open Right Parameters"
            id="smart-right-pull-tab"
          >
            <ChevronLeft size={13} className="animate-pulse" />
            <span className="text-[7.5px] font-mono leading-none font-bold tracking-widest [writing-mode:vertical-lr] uppercase select-none">PARAMS</span>
          </button>
        )}

        {/* Right side Inspector backdrop */}
        {state.inspectorOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-[1px] z-[55] md:hidden transition-opacity duration-300" 
            onClick={actions.toggleInspector}
            id="inspector-backdrop"
          />
        )}

        {/* Right side Inspector parameters rack */}
        <RightInspector />
      </div>

      {/* 3. Footer arranging tracker playhead */}
      <BottomTimeline />

      {/* Global Massive volume slider popover */}
      <GiantVolumeOverlay />
    </div>
  );
}
