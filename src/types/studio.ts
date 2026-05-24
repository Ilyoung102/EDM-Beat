/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OscType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'pulse' | 'supersaw' | 'metallic' | 'guitar' | 'piano';

export interface EnvelopeSettings {
  attack: number; // seconds
  decay: number; // seconds
  sustain: number; // 0 to 1
  release: number; // seconds
}

export interface DrumStep {
  active: boolean;
  velocity: number; // 0 to 1
}

export interface DrumTrack {
  id: string;
  name: string;
  steps: DrumStep[]; // length 16 or 32
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  mute: boolean;
  solo: boolean;
  sampleType: string; // "synthetic" | "punchy" | "noise" etc.
}

export interface BassSynthSettings {
  oscType: OscType;
  subOsc: boolean;
  detune: number; // in cents (-100 to 100)
  filterCutoff: number; // Hz (20 to 20000)
  filterResonance: number; // Q (0.1 to 30)
  envelope: EnvelopeSettings;
  glide: number; // glide time in seconds (0 to 1)
  distortion: number; // amount (0 to 1)
  steps: {
    active: boolean;
    note: string; // e.g. "C2"
    octave: number; // 1 to 4
    length: number; // step duration multiplier (1 to 4)
  }[]; // 16 steps
}

export interface LeadSynthSettings {
  oscType: OscType;
  unisonVoices: number; // 1 to 5
  detune: number; // detune spread (0 to 100)
  filterCutoff: number;
  filterResonance: number;
  envelope: EnvelopeSettings;
  delaySend: number; // 0 to 1
  reverbSend: number; // 0 to 1
  steps: {
    active: boolean;
    note: string; // e.g. "C4"
    octave: number; // 3 to 6
    velocity: number; // 0 to 1
    length: number; // step length (1 to 4)
  }[]; // 16 or 32 steps
}

export interface ChordPadData {
  id: string;
  label: string; // e.g. "Pad 1"
  rootNote: string; // "C", "D#", etc.
  chordType: 'major' | 'minor' | 'sus2' | 'sus4' | '7th' | 'm7th';
  bassNote: string; // Extra fat sub undercoat
}

export interface FXSettings {
  reverb: {
    roomSize: number; // 0 to 1
    decay: number; // seconds
    wet: number; // 0 to 1
    preDelay: number; // seconds
  };
  delay: {
    time: '1/4' | '1/8' | '1/16' | '1/8t' | '1/16t' | '1/8d';
    feedback: number; // 0 to 1
    wet: number; // 0 to 1
    frequency: number; // filter cutoff in Hz
  };
  distortion: {
    drive: number; // 0 to 1
    tone: number; // filter cutoff (Hz)
    wet: number; // 0 to 1
  };
  filter: {
    type: 'lowpass' | 'highpass' | 'bandpass';
    cutoff: number; // Hz
    resonance: number; // Q
  };
  sidechain: {
    amount: number; // 0 to 1 (ducking depth)
    release: number; // seconds
    mode: 'kick-trigger' | 'lfo-pump';
    lfoSpeed: '1/4' | '1/8' | '1/2';
  };
}

export interface MixerChannel {
  id: string; // 'drum_bus' | 'kick' | 'snare' | 'hats' | 'perc' | 'bass' | 'lead' | 'chord' | 'fx' | 'master'
  name: string;
  volume: number; // 0 to 1.2f (fader)
  pan: number; // -1 to 1
  mute: boolean;
  solo: boolean;
  reverbSend: number; // 0 to 1
  delaySend: number; // 0 to 1
}

export interface StudioProject {
  id: string;
  name: string;
  bpm: number;
  swing: number; // 0 to 1
  patternLength: 16 | 32;
  loop: boolean;
  metronome: boolean;
  drumTracks: DrumTrack[];
  bassSynth: BassSynthSettings;
  leadSynth: LeadSynthSettings;
  chordPads: ChordPadData[];
  chordSteps: {
    active: boolean;
    padId: string | null; // which chord pad plays on this step
  }[]; // 16 steps
  mixerChannels: MixerChannel[];
  fxSettings: FXSettings;
  limiterEnabled: boolean;
  compressorEnabled: boolean;
  softClipEnabled: boolean;
}

export interface TransportState {
  bpm: number;
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  swing: number;
  metronome: boolean;
  loop: boolean;
}
