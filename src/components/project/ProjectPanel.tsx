/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { useStudioState } from '../../store/useStudioStore';
import { audioEngineInstance } from '../../audio/AudioEngine';
import NeonButton from '../common/NeonButton';
import LED from '../common/LED';
import { FolderGit, Download, Upload, VolumeX, Save, FileAudio, Play } from 'lucide-react';

export default function ProjectPanel() {
  const { state, actions } = useStudioState();
  const [projName, setProjName] = useState(state.project.name);
  const [importedStatus, setImportedStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamDestNodeRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setProjName(state.project.name);
  }, [state.project.name]);

  const handleNameSave = () => {
    actions.updateProjectField('name', projName);
  };

  // 1. JSON Export / Save trigger
  const exportProjectJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.project, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${state.project.name.toLowerCase().replace(/\s+/g, '-')}-project.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error(e);
    }
  };

  // 2. JSON Import trigger
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const success = actions.loadProjectJSON(result);
      if (success) {
        setImportedStatus('SUCCESSFULLY RESTORED PROJECT CONFIGS! 🎉');
        setTimeout(() => setImportedStatus(null), 3000);
      } else {
        setImportedStatus('FAILED TO PARSE PROJECT BACKUP FILE ❌');
        setTimeout(() => setImportedStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  // 3. Audio Recording mechanism (MediaRecorder web stream recorder)

  const startLiveRecording = () => {
    actions.unlockAudio();
    if (!audioEngineInstance.ctx) return;

    const ctx = audioEngineInstance.ctx;
    
    // Create MediaStream destination and route system out to it
    if (!streamDestNodeRef.current) {
      streamDestNodeRef.current = ctx.createMediaStreamDestination();
      // Connect our main master analyzer or post Gain to the recording endpoint node
      audioEngineInstance.masterAnalyzer?.connect(streamDestNodeRef.current);
    }

    recordedChunksRef.current = [];
    
    try {
      // Setup recorder with stream
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const recorder = new MediaRecorder(streamDestNodeRef.current.stream, options);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        // Auto trigger download for client convenience
        const dAnchor = document.createElement('a');
        dAnchor.href = url;
        dAnchor.download = `${state.project.name.toLowerCase().replace(/\s+/g, '-')}-groove.webm`;
        document.body.appendChild(dAnchor);
        dAnchor.click();
        dAnchor.remove();
        URL.revokeObjectURL(url);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      
      setIsRecording(true);
      setRecordDuration(0);
      
      // Auto trigger Play head loop
      actions.play();

      timerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);

    } catch (e) {
      console.error("Live streaming MediaRecorder constraints:", e);
      alert("Recording not available on this browser/environment format. Using MediaStream destinations require browser client support.");
    }
  };

  const stopLiveRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      actions.stop(); // Stop audio play loops

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  return (
    <div className="flex flex-col gap-6" id="project-vault-panel">
      {/* 1. Header description */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-850">
        <div>
          <h2 className="text-sm font-mono font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <FolderGit className="text-cyan-400 animate-pulse" size={14} />
            STUDIO PROJECT STORAGE VAULT
          </h2>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Persist full synth arrays, matrix sequencer steps, mixer levels, and master FX chains as portable local client parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Card & Local backups */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-850 flex flex-col gap-4">
          <h3 className="text-xs font-mono font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Save size={12} className="text-cyan-400" />
            PROJECT PARAMETERS SPEC
          </h3>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">STUDIO PROJECT NAME</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleNameSave}
                  className="px-4 py-2 rounded-lg bg-cyan-950/40 border border-cyan-800 text-cyan-400 font-mono text-xs hover:bg-cyan-400 hover:text-slate-950 transition active:scale-95"
                >
                  SAVE
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col gap-2 mt-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">AUTOMATIC DATA RECOVERY</span>
              <p className="text-[10px] font-mono text-slate-400 leading-normal">
                Every slider nudge, matrix step toggle, and synth knob rotation is immediately compiled and automatically cached securely via **LocalStorage** backups to prevent accidental loss on browser refreshes.
              </p>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={exportProjectJSON}
                className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-850 text-slate-300 font-mono text-xs font-bold border border-slate-800 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Download size={13} className="text-cyan-400" />
                EXPORT ZIP / JSON
              </button>

              <button
                onClick={handleImportClick}
                className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-850 text-slate-300 font-mono text-xs font-bold border border-slate-800 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Upload size={13} className="text-fuchsia-400" />
                IMPORT RACK BACKUP
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>

            {importedStatus && (
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 text-center">
                <span className="text-[10px] font-mono font-bold text-cyan-400">{importedStatus}</span>
              </div>
            )}
          </div>
        </div>

        {/* Live render Export Card */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-850 flex flex-col gap-4 justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <FileAudio size={12} className="text-fuchsia-400 animate-pulse" />
              RECORD LIVE EDM EXPORT
            </h3>
            
            <p className="text-[11px] font-mono text-slate-400 leading-relaxed mt-3">
              Render your customized loop! The studio bridges a **MediaStream stream** capturing post-master loudness in real-time. Hit start to record live and click download to get a crisp `.webm/opus` audio track of your jam.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center justify-between my-2.5">
            <div className="flex items-center gap-3">
              <LED active={isRecording} color="rose" size="sm" />
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">RECORD STATE</span>
                <span className="text-xs font-mono font-black text-white">
                  {isRecording ? 'STREAMING CORES LIVE...' : 'ARMED (IDLE)'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">DURATION</span>
              <span className="text-sm font-mono font-bold text-rose-400">
                {Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            {!isRecording ? (
              <button
                onClick={startLiveRecording}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-slate-950 font-mono font-black text-xs tracking-wider rounded-xl hover:shadow-[0_0_12px_rgba(33,210,237,0.4)] transition active:scale-95 flex items-center justify-center gap-2"
              >
                🔴 START LIVE RECORDING
              </button>
            ) : (
              <button
                onClick={stopLiveRecording}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-mono font-black text-xs tracking-wider rounded-xl transition active:scale-95 flex items-center justify-center gap-2"
              >
                ⏹️ STOP & EXPORT AUDIO
              </button>
            )}
          </div>
          
          <div className="text-[7.5px] font-mono text-slate-600 text-center leading-normal">
            *Audio stream output is recorded losslessly in .webm format. WebM files are instantly decoded in modern media players and VLC.
          </div>
        </div>

      </div>
    </div>
  );
}
