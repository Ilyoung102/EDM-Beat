/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { StudioProject, DrumTrack, BassSynthSettings, LeadSynthSettings, ChordPadData, MixerChannel, FXSettings, DrumStep } from '../types/studio';
import { audioEngineInstance, getFrequencyForNote } from '../audio/AudioEngine';
import { FAMOUS_EDM_SONGS, expandBassSteps, expandLeadSteps, expandChordSteps } from './edmMelodies';

// Genre Drum Presets Default Generator
const pP = (arr: number[], vel = 1.0): DrumStep[] => {
  const res = Array(16).fill(0).map(() => ({ active: false, velocity: vel }));
  arr.forEach((v, idx) => {
    if (idx < 16) {
      res[idx] = { active: v > 0, velocity: v === 1 ? vel : (v || vel) };
    }
  });
  return res;
};

export const EDM_GENRE_PRESETS: Record<string, { bpm: number; tracks: DrumStep[][]; description: string }> = {
  'House': {
    bpm: 124,
    description: 'Classic 4-on-the-floor kick with offbeat open hats and groovy claps.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.0), // Kick
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.8), // Snare
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.9), // Clap
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.6), // Closed Hat
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.7), // Open Hat
      pP([0,0,0,1, 0,1,0,0, 0,0,0,1, 0,0,0,0], 0.5), // Perc
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.4), // Ride
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.5)  // FX
    ]
  },
  'Techno': {
    bpm: 128,
    description: 'Driving dark industrial warehouse sub-bumping techno rhythm.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.1),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.8),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.8),
      pP([0,0,1,0, 1,0,1,0, 0,0,1,0, 1,0,1,1], 0.7),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.9),
      pP([0,0,1,0, 0,0,0,1, 0,1,0,0, 0,0,1,0], 0.5),
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 0.4),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.5)
    ]
  },
  'Trance': {
    bpm: 138,
    description: 'Energetic fast hypnotic pacing with thick hats and sidechained rhythm.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.0),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.8),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.8),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.5),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.8),
      pP([0,0,0,0, 0,0,0,1, 0,0,0,0, 1,0,0,0], 0.6),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.5),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.6)
    ]
  },
  'Dubstep': {
    bpm: 140,
    description: 'Half-time heavy beat with high impact clap on step 9 and driving wobble beats.',
    tracks: [
      pP([1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0], 1.1),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.5),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 1.2),
      pP([1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,1,0], 0.7),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.8),
      pP([0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,1], 0.7),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.3),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.8)
    ]
  },
  'Future Bass': {
    bpm: 150,
    description: 'Lush chord patterns with sidechain ducking and syncopated snare cracks.',
    tracks: [
      pP([1,0,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0], 1.0),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.8),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 1.0),
      pP([1,0,1,0, 1,1,1,0, 1,0,1,0, 1,1,1,1], 0.65),
      pP([0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0], 0.7),
      pP([0,0,0,0, 1,0,0,1, 0,0,1,0, 0,0,0,0], 0.6),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.4),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.8)
    ]
  },
  'Drum & Bass': {
    bpm: 174,
    description: 'High tempo syncopated breakbeat patterns with continuous energy.',
    tracks: [
      pP([1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0], 1.0),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 1.1),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.8),
      pP([1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], 0.55),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.75),
      pP([0,0,0,1, 0,0,0,0, 1,0,0,0, 0,1,0,0], 0.6),
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 0.4),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.6)
    ]
  },
  'Trap': {
    bpm: 140,
    description: 'Heavy bass hits with high-speed rolling hi-hat sub-divisions.',
    tracks: [
      pP([1,0,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0], 1.2),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.8),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 1.1),
      pP([1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], 0.6),
      pP([0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0], 0.8),
      pP([0,0,0,1, 0,0,0,0, 0,0,1,0, 0,1,0,0], 0.7),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.4),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.8)
    ]
  },
  'Hardstyle': {
    bpm: 150,
    description: 'Pounding distorted bass-kick on every single quarter beat with high energy.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.3),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.8),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 1.0),
      pP([0,0,1,0, 0,0,1,1, 0,0,1,0, 0,0,1,1], 0.65),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.8),
      pP([0,0,0,0, 0,1,0,0, 0,0,0,0, 0,1,0,0], 0.7),
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 0.5),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.9)
    ]
  },
  'Psytrance': {
    bpm: 142,
    description: 'Tribal high speed running percussion with a deep hypnotic gallop kick.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.15),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.5),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.8),
      pP([0,1,1,1, 0,1,1,1, 0,1,1,1, 0,1,1,1], 0.6),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.75),
      pP([0,0,1,0, 0,1,0,1, 0,0,1,0, 1,0,0,1], 0.7),
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.4),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0], 0.8)
    ]
  },
  'Synthwave': {
    bpm: 110,
    description: 'Retro 80s heavy gated snare with cosmic arpeggios.',
    tracks: [
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 1.0),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.95),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.8),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1], 0.65),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.7),
      pP([0,1,0,0, 0,0,0,0, 0,1,0,0, 0,0,1,0], 0.5),
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.4),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.6)
    ]
  },
  'Electro House': {
    bpm: 128,
    description: 'Aggressive granular electro grooves with high impact claps.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.1),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.7),
      pP([0,0,0,0, 1,0,0,0, 0,0,1,0, 1,0,0,0], 0.9),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,1,1,1], 0.65),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.8),
      pP([1,0,0,1, 0,1,0,0, 1,0,0,1, 0,0,1,0], 0.6),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.5),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.8)
    ]
  },
  'Deep House': {
    bpm: 120,
    description: 'Laid-back warm jazzy drum elements with late night sub-flows.',
    tracks: [
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.95),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.5),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.85),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.55),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.6),
      pP([0,0,0,0, 1,0,0,0, 0,0,1,0, 0,0,1,0], 0.5),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.4),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.5)
    ]
  },
  'Progressive House': {
    bpm: 126,
    description: 'Uplifting massive arena build patterns with strong floating energy.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.05),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.6),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.85),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.6),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.7),
      pP([0,0,0,1, 0,0,0,1, 0,0,1,0, 0,1,0,0], 0.5),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.55),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.65)
    ]
  },
  'Acid Techno': {
    bpm: 135,
    description: 'Peak hour hard acid with running 16th hats and massive steel rides.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.2),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.6),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.8),
      pP([1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], 0.55),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.85),
      pP([0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0], 0.6),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.55),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.7)
    ]
  },
  'Garage / UKG': {
    bpm: 130,
    description: 'Swung 2-step syncopation with snappy snare shuffles and fast slides.',
    tracks: [
      pP([1,0,0,0, 0,0,0,0, 0,1,0,0, 0,0,0,0], 1.05),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.85),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.8),
      pP([1,0,1,1, 0,1,1,0, 1,1,0,1, 0,1,1,1], 0.65),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.75),
      pP([0,0,1,0, 1,0,0,0, 0,1,0,0, 0,0,1,0], 0.6),
      pP([1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0], 0.4),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.6)
    ]
  },
  'Breakbeat': {
    bpm: 132,
    description: 'Old-school chopped up funk break loops with heavy acoustic weight.',
    tracks: [
      pP([1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,0], 1.1),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1], 0.9),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.7),
      pP([1,1,1,1, 1,0,1,1, 1,1,1,1, 1,0,1,1], 0.55),
      pP([0,0,1,0, 0,1,0,0, 0,0,1,0, 0,1,0,0], 0.7),
      pP([0,0,0,1, 0,0,0,0, 1,0,0,0, 0,1,0,0], 0.6),
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.45),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.5)
    ]
  },
  'Hardcore / Gabber': {
    bpm: 170,
    description: 'Extreme pounding distorted industrial kicks with speed trash rides.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.35),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.7),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 1.0),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.6),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.8),
      pP([0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1], 0.65),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.55),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.95)
    ]
  },
  'Minimal': {
    bpm: 125,
    description: 'Hypnotic clean organic micro clicks and crisp space pocket ticks.',
    tracks: [
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.9),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.4),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.75),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.45),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.6),
      pP([0,0,0,1, 0,0,0,0, 0,0,0,0, 1,0,0,0], 0.5),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.4),
      pP([0,0,0,0, 0,1,0,0, 0,0,0,0, 0,1,0,0], 0.6)
    ]
  },
  'Ambient Dub': {
    bpm: 90,
    description: 'Echo-drenched sub heavy space beat with deep reverb traps.',
    tracks: [
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 1.1),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.8),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.8),
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 0.5),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.7),
      pP([0,0,0,0, 1,0,1,0, 0,0,1,0, 0,1,0,0], 0.6),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.3),
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.9)
    ]
  },
  'French House': {
    bpm: 125,
    description: 'Swinging retro disco percussion loops with pumping sidechain sweeps.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.05),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.6),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.9),
      pP([0,0,1,0, 1,0,1,0, 0,0,1,0, 1,0,1,0], 0.6),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.75),
      pP([0,0,0,1, 0,1,0,0, 0,0,1,1, 1,0,0,0], 0.55),
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 0.5),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.75)
    ]
  },
  'Big Room': {
    bpm: 128,
    description: 'Humongous booming stadium-sized reverb kicks with massive festival clap rolls.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.3),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.7),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 1.1),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.6),
      pP([0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0], 0.75),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,1, 1,1,0,0], 0.6),
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 0.55),
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 0.9)
    ]
  },
  'Melodic Techno': {
    bpm: 123,
    description: 'Mysterious afterlife soundscapes with a driving celestial beat.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.1),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.5),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.8),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,1], 0.65),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.7),
      pP([0,1,0,0, 1,0,0,0, 0,1,0,0, 0,0,1,0], 0.55),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.5),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.7)
    ]
  },
  'Future House': {
    bpm: 126,
    description: 'Bouncing elastic FM brass bass beats with clean metallic shies.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.1),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.6),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,1,0], 0.95),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.65),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.7),
      pP([0,0,0,1, 0,1,0,0, 0,0,1,0, 0,1,0,0], 0.6),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.5),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.7)
    ]
  },
  'Phonk': {
    bpm: 120,
    description: 'Drifting sub 808 bumps with heavy cowbells and punchy snaps.',
    tracks: [
      pP([1,0,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0], 1.25),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.9),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.8),
      pP([1,0,1,0, 1,1,0,1, 1,0,1,0, 1,1,0,1], 0.75),
      pP([0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0], 0.7),
      pP([1,0,1,0, 1,1,0,1, 1,0,1,0, 1,1,0,1], 0.65),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.4),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.8)
    ]
  },
  'Hardwave': {
    bpm: 140,
    description: 'Cyber atmospheric spatial beats with hyperfast trap rolling elements.',
    tracks: [
      pP([1,0,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0], 1.15),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.9),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.8),
      pP([1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], 0.6),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.75),
      pP([0,0,0,1, 1,0,0,0, 0,0,1,0, 0,1,0,0], 0.6),
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.4),
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.85)
    ]
  },
  'Electro Swing': {
    bpm: 125,
    description: 'Swelled horn parts with modern bouncy vintage-infused percussion.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.1),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.9),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.8),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.6),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.7),
      pP([0,0,0,1, 0,1,0,0, 0,0,1,1, 1,0,0,1], 0.6),
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 0.5),
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.7)
    ]
  },
  'Glitch Hop': {
    bpm: 115,
    description: 'Granular mechanical swing with heavy sub kicks and micro laser sparks.',
    tracks: [
      pP([1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0], 1.15),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.9),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.85),
      pP([1,0,1,1, 1,0,1,0, 1,1,0,1, 1,0,1,1], 0.65),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.7),
      pP([1,0,1,0, 0,1,0,0, 1,1,0,1, 0,0,1,0], 0.65),
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.45),
      pP([1,0,1,0, 0,0,0,0, 1,0,1,0, 0,0,0,0], 0.8)
    ]
  },
  'Lo-Fi House': {
    bpm: 118,
    description: 'Dusty vintage saturation style with tape head noise and warm claps.',
    tracks: [
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 1.0),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.855),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.8),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.5),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.55),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.45),
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.35),
      pP([1,0,0,0, 1,0,1,0, 0,0,0,0, 1,0,1,0], 0.6)
    ]
  },
  'Eurodance': {
    bpm: 134,
    description: 'Uplifting 90s synthesizers beat with direct claps and high speed rides.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.1),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.5),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.95),
      pP([1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], 0.6),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.8),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.6),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.5),
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.75)
    ]
  },
  'Cyberpunk': {
    bpm: 105,
    description: 'Gritty mechanized industrial with thick low pulse sweeps and dirt.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.25),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.95),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.8),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.6),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.7),
      pP([0,0,1,1, 1,0,0,0, 0,1,1,1, 1,0,0,0], 0.65),
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.5),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.9)
    ]
  },
  'Anthem Trance': {
    bpm: 136,
    description: 'High energy epic build with rapid arpeggios, marching hats, and thunderous 4-on-the-floor kick.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.1),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.8),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.85),
      pP([1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], 0.5),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.7),
      pP([0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1], 0.6),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.4),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.5)
    ]
  },
  'Tech House': {
    bpm: 125,
    description: 'Bouncing minimal tech groove, heavy offbeat clap, infectious cowbell perk, and shuffling hats.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.15),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.8),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.9),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.65),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.85),
      pP([0,0,0,1, 1,0,0,0, 0,1,0,0, 0,0,1,0], 0.6),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.45),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.5)
    ]
  },
  'Electro Classic': {
    bpm: 128,
    description: 'Chugging distortion electro bass grooves, slamming snare and clap overlaps, and metallic rides.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.2),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.9),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.8),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.7),
      pP([0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,1,0], 0.8),
      pP([0,0,1,0, 1,0,0,1, 0,1,0,0, 0,1,0,0], 0.6),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.55),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.5)
    ]
  },
  'Global Deep House': {
    bpm: 120,
    description: 'Hypnotic organic percussion, warm smooth pocket bass sub, and vintage rimshot snare.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.0),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0], 0.6),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.75),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.6),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.7),
      pP([1,0,1,0, 0,1,0,1, 1,0,1,0, 0,1,0,1], 0.65),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.4),
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.5)
    ]
  },
  'Rumble Bass': {
    bpm: 140,
    description: 'Spacious sub-grime dark urban beat, heavy snare on 3rd beat, and rapid trap hihat stutter rolls.',
    tracks: [
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 1.2),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 1.0),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.8),
      pP([1,1,1,1, 1,0,1,1, 1,1,1,0, 1,1,1,1], 0.7),
      pP([0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0], 0.6),
      pP([0,0,0,1, 1,0,1,0, 0,0,0,1, 1,0,0,0], 0.55),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.4),
      pP([1,0,1,0, 0,1,0,0, 1,0,0,0, 0,0,0,0], 0.6)
    ]
  },
  'Big Beat': {
    bpm: 124,
    description: 'Slamming classic breakbeat with heavy driving kick, massive rock snare, and crashing rides.',
    tracks: [
      pP([1,0,0,0, 0,0,1,0, 0,1,0,0, 1,0,0,0], 1.15),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1], 1.05),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.8),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.7),
      pP([0,0,0,1, 0,1,0,0, 0,0,0,1, 0,1,0,0], 0.8),
      pP([0,0,1,0, 1,0,0,1, 0,1,0,0, 0,0,0,0], 0.65),
      pP([1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], 0.6),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.6)
    ]
  },
  'Funk Breakbeat': {
    bpm: 110,
    description: 'Old-school hip-hop funk breakbeat, punchy delayed syncopated snares, and organic shuffles.',
    tracks: [
      pP([1,0,0,0, 0,0,0,0, 0,0,1,0, 0,1,0,0], 1.1),
      pP([0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,1], 0.95),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.6),
      pP([1,1,1,0, 1,1,1,1, 1,0,1,1, 1,1,1,1], 0.65),
      pP([0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,1], 0.75),
      pP([0,0,1,0, 0,1,0,0, 1,1,0,0, 0,0,1,0], 0.6),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.4),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0], 0.5)
    ]
  },
  'Filter Disco House': {
    bpm: 123,
    description: 'Happy looping filter sweeps, punchy 4x4 pumping kick, and bright sizzling disco open hats.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.12),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.5),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.85),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.6),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.9),
      pP([0,0,0,1, 0,1,0,0, 0,0,0,1, 0,1,0,0], 0.5),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.5),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.65)
    ]
  },
  'Festival Progressive': {
    bpm: 128,
    description: 'Mainstage festival energy anthemic buildup, massive snare rolls, and huge euphoric main drop.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.15),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,1,1], 0.8),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.85),
      pP([1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], 0.55),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.85),
      pP([0,0,0,0, 0,0,0,0, 1,0,1,0, 0,0,1,1], 0.6),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.5),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.6)
    ]
  },
  'Chill Step': {
    bpm: 90,
    description: 'Slow dreaming melodic half-time beats, cozy snaps and claps, and atmospheric airy pads.',
    tracks: [
      pP([1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0], 1.05),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.85),
      pP([0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.8),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.55),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.6),
      pP([0,0,1,0, 0,1,0,0, 0,0,0,1, 0,1,0,0], 0.5),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.3),
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.6)
    ]
  },
  'Emotional UK House': {
    bpm: 134,
    description: 'Intense UK style 4x4 shuffling garage rims, heavy emotional sidechained chords, and deep sub bass.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.15),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.7),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.85),
      pP([1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1], 0.65),
      pP([0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,1], 0.8),
      pP([0,0,1,0, 0,0,1,0, 0,1,0,0, 1,0,1,0], 0.6),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.4),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.55)
    ]
  },
  'Italo Dance': {
    bpm: 130,
    description: 'Happy looping melodic arcade retro riffs, galloping synth bass, and high speed crash rides.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.12),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.6),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.8),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.6),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.75),
      pP([0,0,0,1, 0,1,0,0, 0,0,1,0, 0,1,0,0], 0.55),
      pP([1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], 0.5),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.6)
    ]
  },
  'Dancefloor DnB': {
    bpm: 174,
    description: 'Super-high speed roll breakbeats, massive modern dancefloor Snare on 2nd and 4th beats, and ground sub.',
    tracks: [
      pP([1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0], 1.2),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1], 1.1),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.8),
      pP([1,1,1,0, 1,1,1,1, 1,0,1,1, 1,1,1,1], 0.65),
      pP([0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0], 0.85),
      pP([0,0,1,0, 0,1,0,0, 1,0,0,0, 0,0,1,0], 0.6),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.4),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0], 0.55)
    ]
  },
  'Peak Techno': {
    bpm: 135,
    description: 'Fierce prime time peak techno rumble kick, high-resonance modular laser synthesis claps.',
    tracks: [
      pP([1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], 1.2),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.7),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.95),
      pP([0,0,1,0, 1,0,1,0, 0,0,1,0, 1,0,1,1], 0.7),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.9),
      pP([0,0,1,0, 0,1,0,1, 0,0,1,0, 0,1,0,1], 0.6),
      pP([1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], 0.5),
      pP([1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], 0.6)
    ]
  },
  'Hardstyle Anthem': {
    bpm: 150,
    description: 'Distorted screech pitch bending high-pass lead, reversing sub bass sweeps, and colossal head banging drops.',
    tracks: [
      pP([1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], 1.3),
      pP([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.8),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.9),
      pP([0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], 0.7),
      pP([0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], 0.85),
      pP([0,0,0,1, 0,1,0,0, 0,0,0,1, 0,1,0,0], 0.6),
      pP([1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], 0.55),
      pP([1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], 0.7)
    ]
  }
};

// Create a state container for external classes to hook reactive renders efficiently
export class StudioStoreService {
  private listeners: Set<() => void> = new Set();
  
  // App General Settings
  public activeTab: string = 'drum';
  public isRecording: boolean = false;
  
  // Responsive sidebar toggles - default to true to avoid folders being hidden on iframe loads
  public sidebarOpen: boolean = true;
  public inspectorOpen: boolean = true;

  public toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.emit();
  }

  public toggleInspector() {
    this.inspectorOpen = !this.inspectorOpen;
    this.emit();
  }
  
  // Audio state
  public isPlaying: boolean = false;
  public bpm: number = 124;
  public currentStep: number = 0;
  public swing: number = 0.2;
  public loop: boolean = true;
  public metronome: boolean = false;
  public nextStepTime: number = 0.0;
  public audioUnlocked: boolean = false;

  private scheduleAheadTime = 0.12; // 120ms lookahead
  private timerID: any = null;

  // The actual Studio Project configurations
  public project: StudioProject = {
    id: 'default-proj',
    name: 'Neon Horizon',
    bpm: 124,
    swing: 0.2,
    patternLength: 16,
    loop: true,
    metronome: false,
    drumTracks: [
      { id: 'kick', name: 'Punch Kick', steps: Array(32).fill(0).map(() => ({ active: false, velocity: 1.0 })), volume: 1.0, pan: 0.0, mute: false, solo: false, sampleType: 'synthetic' },
      { id: 'snare', name: 'Hyper Snare', steps: Array(32).fill(0).map(() => ({ active: false, velocity: 0.8 })), volume: 0.75, pan: -0.1, mute: false, solo: false, sampleType: 'punchy' },
      { id: 'clap', name: 'Epic Clap', steps: Array(32).fill(0).map(() => ({ active: false, velocity: 0.8 })), volume: 0.7, pan: 0.1, mute: false, solo: false, sampleType: 'noise' },
      { id: 'hats_closed', name: 'Closed Hat', steps: Array(32).fill(0).map(() => ({ active: false, velocity: 0.6 })), volume: 0.65, pan: -0.3, mute: false, solo: false, sampleType: 'clean' },
      { id: 'hats_open', name: 'Open Hat', steps: Array(32).fill(0).map(() => ({ active: false, velocity: 0.7 })), volume: 0.55, pan: 0.3, mute: false, solo: false, sampleType: 'long' },
      { id: 'perc', name: 'Perc Bubble', steps: Array(32).fill(0).map(() => ({ active: false, velocity: 0.6 })), volume: 0.6, pan: 0.4, mute: false, solo: false, sampleType: 'tom' },
      { id: 'ride', name: 'Anode Ride', steps: Array(32).fill(0).map(() => ({ active: false, velocity: 0.5 })), volume: 0.5, pan: 0.2, mute: false, solo: false, sampleType: 'metal' },
      { id: 'fx', name: 'Riser FX', steps: Array(32).fill(0).map(() => ({ active: false, velocity: 0.8 })), volume: 0.7, pan: -0.4, mute: false, solo: false, sampleType: 'sweep' },
    ],
    bassSynth: {
      oscType: 'sawtooth',
      subOsc: true,
      detune: 12,
      filterCutoff: 380,
      filterResonance: 3.5,
      envelope: { attack: 0.01, decay: 0.12, sustain: 0.3, release: 0.15 },
      glide: 0.08,
      distortion: 0.25,
      steps: Array(16).fill(null).map((_, i) => ({
        active: i % 4 === 0,
        note: i % 8 === 0 ? 'C' : 'G',
        octave: 2,
        length: 1,
      })),
    },
    leadSynth: {
      oscType: 'sawtooth',
      unisonVoices: 3,
      detune: 25,
      filterCutoff: 1200,
      filterResonance: 1.5,
      envelope: { attack: 0.04, decay: 0.2, sustain: 0.6, release: 0.35 },
      delaySend: 0.25,
      reverbSend: 0.3,
      steps: Array(32).fill(null).map((_, i) => ({
        active: i % 6 === 0,
        note: i % 12 === 0 ? 'D' : i % 12 === 4 ? 'A' : 'F',
        octave: 4,
        velocity: 0.8,
        length: 1,
      })),
    },
    chordPads: [
      { id: 'pad0', label: 'E-Minor Pad', rootNote: 'E', chordType: 'minor', bassNote: 'E' },
      { id: 'pad1', label: 'C-Major Pad', rootNote: 'C', chordType: 'major', bassNote: 'C' },
      { id: 'pad2', label: 'G-Major Pad', rootNote: 'G', chordType: 'major', bassNote: 'G' },
      { id: 'pad3', label: 'D-Major Pad', rootNote: 'D', chordType: 'major', bassNote: 'D' },
      { id: 'pad4', label: 'A-Minor Pad', rootNote: 'A', chordType: 'minor', bassNote: 'A' },
      { id: 'pad5', label: 'F-Major Pad', rootNote: 'F', chordType: 'major', bassNote: 'F' },
      { id: 'pad6', label: 'B-dim Pad', rootNote: 'B', chordType: 'minor', bassNote: 'B' },
      { id: 'pad7', label: 'E-sus4 Pad', rootNote: 'E', chordType: 'sus4', bassNote: 'E' },
    ],
    chordSteps: Array(16).fill(null).map((_, i) => ({
      active: i % 4 === 0,
      padId: i % 8 === 0 ? 'pad0' : i % 8 === 4 ? 'pad1' : null,
    })),
    mixerChannels: [
      { id: 'drum_bus', name: 'Drum Bus', volume: 0.9, pan: 0.0, mute: false, solo: false, reverbSend: 0.1, delaySend: 0.0 },
      { id: 'kick', name: 'Kick Drum', volume: 1.1, pan: 0.0, mute: false, solo: false, reverbSend: 0.0, delaySend: 0.0 },
      { id: 'snare', name: 'Snare Drum', volume: 0.85, pan: -0.05, mute: false, solo: false, reverbSend: 0.18, delaySend: 0.08 },
      { id: 'hats', name: 'Hats High', volume: 0.7, pan: -0.15, mute: false, solo: false, reverbSend: 0.12, delaySend: 0.1 },
      { id: 'perc', name: 'Percussions', volume: 0.7, pan: 0.25, mute: false, solo: false, reverbSend: 0.2, delaySend: 0.15 },
      { id: 'bass', name: 'Bass Synth', volume: 0.85, pan: 0.0, mute: false, solo: false, reverbSend: 0.05, delaySend: 0.0 },
      { id: 'lead', name: 'Lead Arp', volume: 0.75, pan: 0.15, mute: false, solo: false, reverbSend: 0.3, delaySend: 0.3 },
      { id: 'chord', name: 'Chord Pad', volume: 0.7, pan: -0.15, mute: false, solo: false, reverbSend: 0.4, delaySend: 0.2 },
      { id: 'fx', name: 'Special FX', volume: 0.75, pan: -0.3, mute: false, solo: false, reverbSend: 0.35, delaySend: 0.15 },
      { id: 'master', name: 'Master Out', volume: 0.95, pan: 0.0, mute: false, solo: false, reverbSend: 0.0, delaySend: 0.0 }
    ],
    fxSettings: {
      reverb: { roomSize: 0.6, decay: 1.8, wet: 0.25, preDelay: 0.02 },
      delay: { time: '1/8', feedback: 0.45, wet: 0.25, frequency: 1800 },
      distortion: { drive: 0.15, tone: 1500, wet: 0.05 },
      filter: { type: 'lowpass', cutoff: 18000, resonance: 1.0 },
      sidechain: { amount: 0.65, release: 0.15, mode: 'kick-trigger', lfoSpeed: '1/4' }
    },
    limiterEnabled: true,
    compressorEnabled: true,
    softClipEnabled: true,
  };

  constructor() {
    this.loadFromLocalStorage();
    this.applyPreset('House'); // Load Default House Beat!
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach(l => l());
  }

  public setTab(tab: string) {
    this.activeTab = tab;
    this.emit();
  }

  // Giant / Popup Volume overlay state
  public activeVolumeEdit: {
    type: 'mixer' | 'drum';
    id: string; // e.g., channelId or trackId
    name: string; // display name
    volume: number; // initial value
  } | null = null;

  public openVolumeEdit(type: 'mixer' | 'drum', id: string, name: string, volume: number) {
    this.activeVolumeEdit = { type, id, name, volume };
    this.emit();
  }

  public updateActiveVolume(val: number) {
    if (!this.activeVolumeEdit) return;
    this.activeVolumeEdit.volume = val;
    if (this.activeVolumeEdit.type === 'mixer') {
      this.updateMixerChannel(this.activeVolumeEdit.id, 'volume', val);
    } else {
      this.updateDrumTrackField(this.activeVolumeEdit.id, 'volume', val);
    }
    this.emit();
  }

  public closeVolumeEdit() {
    this.activeVolumeEdit = null;
    this.emit();
  }

  // Audio Engine Lifecycle

  public unlockAudioEngine() {
    audioEngineInstance.resume();
    this.audioUnlocked = true;
    this.emit();
  }

  public play() {
    this.unlockAudioEngine();
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.nextStepTime = audioEngineInstance.ctx!.currentTime + 0.05;
    this.timerID = setInterval(() => this.scheduler(), 25);
    audioEngineInstance.syncState(this.project);
    this.emit();
  }

  public pause() {
    this.isPlaying = false;
    if (this.timerID) {
      clearInterval(this.timerID);
      this.timerID = null;
    }
    audioEngineInstance.stopAllSounds();
    this.emit();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerID) {
      clearInterval(this.timerID);
      this.timerID = null;
    }
    this.currentStep = 0;
    audioEngineInstance.stopAllSounds();
    this.emit();
  }

  // Clock Sequencer Core Scheduling (Lookahead)
  private scheduler() {
    if (!audioEngineInstance.ctx) return;
    const ctx = audioEngineInstance.ctx;
    
    while (this.nextStepTime < ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }
  }

  private advanceStep() {
    if (!audioEngineInstance.ctx) return;
    
    const secondsPerBeat = 60.0 / this.bpm;
    const stepDuration = 0.25 * secondsPerBeat; // 16th note step time

    // Calculate Swing offset: even steps (ticks 1, 3, 5...) are regular, odd indices get pushed back
    const isEvenStep = this.currentStep % 2 === 0;
    let finalStepDur = stepDuration;

    if (isEvenStep) {
      // Push slightly forward based on swing slider (up to 35% of step length delay)
      finalStepDur = stepDuration * (1.0 + this.swing * 0.55);
    } else {
      // Re-adjust odd steps to align with the grid
      finalStepDur = stepDuration * (1.0 - this.swing * 0.55);
    }

    this.nextStepTime += finalStepDur;
    
    // Reset or increment step
    const length = this.project.patternLength;
    this.currentStep = (this.currentStep + 1) % length;
    
    // Quick emit for sequencer playhead light sweep
    this.emit();
  }

  private scheduleStep(step: number, time: number) {
    if (!audioEngineInstance.ctx) return;

    // 1. Drum tracks
    this.project.drumTracks.forEach(track => {
      // Solo / Mute Logic
      const hasSolo = this.project.drumTracks.some(t => t.solo);
      if (hasSolo && !track.solo) return;
      if (track.mute) return;

      const drumStep = track.steps[step];
      if (drumStep && drumStep.active) {
        const vel = drumStep.velocity;
        if (track.id === 'kick') audioEngineInstance.playKick(time, vel);
        else if (track.id === 'snare') audioEngineInstance.playSnare(time, vel);
        else if (track.id === 'clap') audioEngineInstance.playClap(time, vel);
        else if (track.id === 'hats_closed') audioEngineInstance.playHat(time, vel, false);
        else if (track.id === 'hats_open') audioEngineInstance.playHat(time, vel, true);
        else if (track.id === 'perc') audioEngineInstance.playPerc(time, vel);
        else if (track.id === 'ride') audioEngineInstance.playRide(time, vel);
        else if (track.id === 'fx') audioEngineInstance.playFXHit(time, vel);
      }
    });

    // 2. LFO Pump modulation sync
    const secondsPerBeat = 60.0 / this.bpm;
    audioEngineInstance.scheduleLfoPump(time, secondsPerBeat);

    // 3. Bass Synth (Only 16 steps represented in Bass loop)
    const bassStepIndex = step % 16;
    const bass = this.project.bassSynth;
    if (bass && bass.steps[bassStepIndex] && bass.steps[bassStepIndex].active) {
      const bStep = bass.steps[bassStepIndex];
      const duration = (60.0 / this.bpm) * 0.25 * bStep.length; // Step multiplier length duration
      audioEngineInstance.playBassNote(time, bStep.note, bStep.octave, duration, bass);
    }

    // 4. Lead Synth
    const leadStepIndex = step % this.project.patternLength;
    const lead = this.project.leadSynth;
    if (lead && lead.steps[leadStepIndex] && lead.steps[leadStepIndex].active) {
      const lStep = lead.steps[leadStepIndex];
      const duration = (60.0 / this.bpm) * 0.22 * lStep.length;
      audioEngineInstance.playLeadNote(time, lStep.note, lStep.octave, duration, lead);
    }

    // 5. Chord pads sequencer trigger
    const chordStepIndex = step % 16;
    const chStep = this.project.chordSteps[chordStepIndex];
    if (chStep && chStep.active && chStep.padId) {
      const matchedPad = this.project.chordPads.find(p => p.id === chStep.padId);
      if (matchedPad) {
        const duration = (60.0 / this.bpm) * 1.5; // Chords are sustained
        audioEngineInstance.playChordPad(time, matchedPad, duration);
      }
    }

    // 6. Optional Metronome click
    if (this.metronome && (step % 4 === 0)) {
      const osc = audioEngineInstance.ctx.createOscillator();
      const gain = audioEngineInstance.ctx.createGain();
      osc.frequency.setValueAtTime(step === 0 ? 1200 : 800, time);
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
      osc.connect(gain);
      gain.connect(audioEngineInstance.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.06);
    }
  }

  // Update Mutator Actions

  public updateProjectField<K extends keyof StudioProject>(field: K, value: StudioProject[K]) {
    this.project[field] = value;
    if (field === 'bpm' && typeof value === 'number') {
      this.bpm = value;
    }
    if (field === 'swing' && typeof value === 'number') {
      this.swing = value;
    }
    if (field === 'metronome' && typeof value === 'boolean') {
      this.metronome = value;
    }
    if (field === 'loop' && typeof value === 'boolean') {
      this.loop = value;
    }
    audioEngineInstance.syncState(this.project);
    this.emit();
    this.saveToLocalStorage();
  }

  public updateBassSynth<K extends keyof BassSynthSettings>(field: K, value: BassSynthSettings[K]) {
    this.project.bassSynth[field] = value;
    audioEngineInstance.syncState(this.project);
    this.emit();
    this.saveToLocalStorage();
  }

  public updateLeadSynth<K extends keyof LeadSynthSettings>(field: K, value: LeadSynthSettings[K]) {
    this.project.leadSynth[field] = value;
    audioEngineInstance.syncState(this.project);
    this.emit();
    this.saveToLocalStorage();
  }

  // Drum interactions toggles

  public toggleDrumStep(trackId: string, stepIndex: number) {
    const track = this.project.drumTracks.find(t => t.id === trackId);
    if (track) {
      track.steps[stepIndex].active = !track.steps[stepIndex].active;
      this.emit();
      this.saveToLocalStorage();
    }
  }

  public changeDrumVelocity(trackId: string, stepIndex: number, velocity: number) {
    const track = this.project.drumTracks.find(t => t.id === trackId);
    if (track) {
      track.steps[stepIndex].velocity = velocity;
      this.emit();
      this.saveToLocalStorage();
    }
  }

  public updateDrumTrackField<K extends keyof DrumTrack>(trackId: string, field: K, value: DrumTrack[K]) {
    const track = this.project.drumTracks.find(t => t.id === trackId);
    if (track) {
      track[field] = value;
      audioEngineInstance.syncState(this.project);
      this.emit();
      this.saveToLocalStorage();
    }
  }

  // Preset Application

  public applyPreset(genreName: string) {
    const p = EDM_GENRE_PRESETS[genreName];
    if (!p) return;

    const famous = FAMOUS_EDM_SONGS[genreName] || {
      title: genreName,
      bpm: p.bpm,
      description: p.description
    };

    // Update Project Beat setting
    this.project.bpm = famous.bpm;
    this.bpm = famous.bpm;

    this.project.drumTracks.forEach((track, tid) => {
      const pTrackSteps = p.tracks[tid] || [];
      // Set steps (pad out with zeros if 32)
      track.steps = Array(32).fill(0).map((_, i) => {
        const sourceStep = pTrackSteps[i % 16];
        return {
          active: sourceStep ? sourceStep.active : false,
          velocity: sourceStep ? sourceStep.velocity : 1.0
        };
      });
    });

    const bass = this.project.bassSynth;
    const lead = this.project.leadSynth;
    const fx = this.project.fxSettings;

    // Default clean states
    bass.steps = Array(16).fill(null).map(() => ({ active: false, note: 'C', octave: 2, length: 1 }));
    lead.steps = Array(32).fill(null).map(() => ({ active: false, note: 'C', octave: 4, velocity: 0.8, length: 1 }));
    this.project.chordSteps = Array(16).fill(null).map(() => ({ active: false, padId: null }));

    // Load custom bass settings & steps
    if (famous.bassSettings) {
      Object.assign(bass, famous.bassSettings);
    }
    if (famous.bassSteps) {
      bass.steps = expandBassSteps(famous.bassSteps);
    }

    // Load custom lead settings & steps
    if (famous.leadSettings) {
      Object.assign(lead, famous.leadSettings);
    }
    if (famous.leadSteps) {
      lead.steps = expandLeadSteps(famous.leadSteps);
    }

    // Load custom chords
    if (famous.chordSteps) {
      this.project.chordSteps = expandChordSteps(famous.chordSteps);
    }

    // Default master FX adjustments
    fx.distortion.drive = 0.15;
    fx.distortion.wet = 0.05;
    fx.reverb.wet = 0.25;
    fx.delay.wet = 0.2;
    fx.sidechain.amount = 0.6;

    // Sidechain defaults for high-ducking genres
    if (['House', 'Trance', 'Future Bass', 'Hardstyle', 'Psytrance', 'Big Room', 'Progressive House', 'Eurodance', 'Future House', 'Anthem Trance', 'Tech House', 'Electro Classic', 'Filter Disco House', 'Festival Progressive', 'Emotional UK House', 'Italo Dance', 'Dancefloor DnB', 'Hardstyle Anthem'].includes(genreName)) {
      fx.sidechain.amount = 0.85;
      fx.reverb.wet = 0.35;
    }
    if (['Techno', 'Acid Techno', 'Cyberpunk', 'Phonk', 'Peak Techno', 'Hardstyle Anthem', 'Rumble Bass'].includes(genreName)) {
      fx.distortion.drive = 0.55;
      fx.distortion.wet = 0.2;
    }

    audioEngineInstance.syncState(this.project);
    this.emit();
    this.saveToLocalStorage();
  }

  // Project Clear and Random generator patterns
  public clearAllPatterns() {
    this.project.drumTracks.forEach(t => {
      t.steps = Array(32).fill(0).map(() => ({ active: false, velocity: 1.0 }));
    });
    this.project.bassSynth.steps = Array(16).fill(null).map(() => ({
      active: false, note: 'C', octave: 2, length: 1
    }));
    this.project.leadSynth.steps = Array(32).fill(null).map(() => ({
      active: false, note: 'C', octave: 4, velocity: 0.8, length: 1
    }));
    this.project.chordSteps = Array(16).fill(null).map(() => ({
      active: false, padId: null
    }));
    this.emit();
  }

  public generateRandomPatterns() {
    const scales = ['C', 'D', 'E', 'G', 'A'];
    this.project.drumTracks.forEach(t => {
      // Random kick/snare loops
      const probability = t.id === 'kick' ? 0.35 : t.id === 'hats_closed' ? 0.6 : 0.18;
      t.steps = Array(32).fill(0).map(() => ({
        active: Math.random() < probability,
        velocity: 0.5 + Math.random() * 0.5
      }));
    });

    this.project.bassSynth.steps = Array(16).fill(null).map(() => ({
      active: Math.random() < 0.45,
      note: scales[Math.floor(Math.random() * scales.length)],
      octave: Math.random() < 0.5 ? 2 : 1,
      length: Math.random() < 0.3 ? 2 : 1
    }));

    this.project.leadSynth.steps = Array(32).fill(null).map(() => ({
      active: Math.random() < 0.28,
      note: scales[Math.floor(Math.random() * scales.length)],
      octave: Math.random() < 0.5 ? 4 : 5,
      velocity: 0.5 + Math.random() * 0.4,
      length: 1
    }));

    this.emit();
  }

  // Mixer updates
  public updateMixerChannel(channelId: string, field: keyof MixerChannel, value: any) {
    const ch = this.project.mixerChannels.find(c => c.id === channelId);
    if (ch) {
      (ch as any)[field] = value;
      audioEngineInstance.syncState(this.project);
      this.emit();
      this.saveToLocalStorage();
    }
  }

  // FX updates
  public updateFXSettings<K extends keyof FXSettings>(module: K, settings: Partial<FXSettings[K]>) {
    this.project.fxSettings[module] = {
      ...this.project.fxSettings[module],
      ...settings,
    } as any;
    audioEngineInstance.syncState(this.project);
    this.emit();
    this.saveToLocalStorage();
  }

  // Global modifiers for quick limits
  public toggleLimiter() {
    this.project.limiterEnabled = !this.project.limiterEnabled;
    audioEngineInstance.syncState(this.project);
    this.emit();
  }

  public toggleCompressor() {
    this.project.compressorEnabled = !this.project.compressorEnabled;
    audioEngineInstance.syncState(this.project);
    this.emit();
  }

  public toggleSoftClip() {
    this.project.softClipEnabled = !this.project.softClipEnabled;
    audioEngineInstance.syncState(this.project);
    this.emit();
  }

  // Persistence Save/Load

  private saveToLocalStorage() {
    try {
      localStorage.setItem('edm-studio-project', JSON.stringify(this.project));
    } catch (e) {
      console.warn('Storage limits exceeded: ', e);
    }
  }

  private loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('edm-studio-project');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.drumTracks) {
          this.project = {
            ...this.project,
            ...parsed,
          };
          this.bpm = this.project.bpm;
          this.swing = this.project.swing;
        }
      }
    } catch (e) {
      console.error('Error loading project: ', e);
    }
  }

  public loadProjectJSON(jsonString: string) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.drumTracks && parsed.bassSynth) {
        this.project = parsed;
        this.bpm = parsed.bpm;
        this.swing = parsed.swing;
        audioEngineInstance.syncState(this.project);
        this.emit();
        this.saveToLocalStorage();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  }
}

// Global hook subscription logic
export const studioStore = new StudioStoreService();

export function useStudioState() {
  const [state, setState] = useState({
    activeTab: studioStore.activeTab,
    isPlaying: studioStore.isPlaying,
    currentStep: studioStore.currentStep,
    bpm: studioStore.bpm,
    swing: studioStore.swing,
    loop: studioStore.loop,
    metronome: studioStore.metronome,
    project: studioStore.project,
    audioUnlocked: studioStore.audioUnlocked,
    isRecording: studioStore.isRecording,
    sidebarOpen: studioStore.sidebarOpen,
    inspectorOpen: studioStore.inspectorOpen,
    activeVolumeEdit: studioStore.activeVolumeEdit,
  });

  useEffect(() => {
    return studioStore.subscribe(() => {
      setState({
        activeTab: studioStore.activeTab,
        isPlaying: studioStore.isPlaying,
        currentStep: studioStore.currentStep,
        bpm: studioStore.bpm,
        swing: studioStore.swing,
        loop: studioStore.loop,
        metronome: studioStore.metronome,
        project: { ...studioStore.project },
        audioUnlocked: studioStore.audioUnlocked,
        isRecording: studioStore.isRecording,
        sidebarOpen: studioStore.sidebarOpen,
        inspectorOpen: studioStore.inspectorOpen,
        activeVolumeEdit: studioStore.activeVolumeEdit ? { ...studioStore.activeVolumeEdit } : null,
      });
    });
  }, []);

  return {
    state,
    actions: {
      setTab: (tab: string) => studioStore.setTab(tab),
      play: () => studioStore.play(),
      pause: () => studioStore.pause(),
      stop: () => studioStore.stop(),
      unlockAudio: () => studioStore.unlockAudioEngine(),
      toggleSidebar: () => studioStore.toggleSidebar(),
      toggleInspector: () => studioStore.toggleInspector(),
      updateProjectField: (f: keyof StudioProject, v: any) => studioStore.updateProjectField(f, v),
      updateBassSynth: (f: keyof BassSynthSettings, v: any) => studioStore.updateBassSynth(f, v),
      updateLeadSynth: (f: keyof LeadSynthSettings, v: any) => studioStore.updateLeadSynth(f, v),
      toggleDrumStep: (trackId: string, idx: number) => studioStore.toggleDrumStep(trackId, idx),
      changeDrumVelocity: (trackId: string, idx: number, vel: number) => studioStore.changeDrumVelocity(trackId, idx, vel),
      updateDrumTrackField: (trackId: string, f: keyof DrumTrack, v: any) => studioStore.updateDrumTrackField(trackId, f, v),
      applyPreset: (genre: string) => studioStore.applyPreset(genre),
      clearAllPatterns: () => studioStore.clearAllPatterns(),
      generateRandomPatterns: () => studioStore.generateRandomPatterns(),
      updateMixerChannel: (channelId: string, f: keyof MixerChannel, v: any) => studioStore.updateMixerChannel(channelId, f, v),
      updateFXSettings: (mod: keyof FXSettings, s: any) => studioStore.updateFXSettings(mod, s),
      toggleLimiter: () => studioStore.toggleLimiter(),
      toggleCompressor: () => studioStore.toggleCompressor(),
      toggleSoftClip: () => studioStore.toggleSoftClip(),
      loadProjectJSON: (json: string) => studioStore.loadProjectJSON(json),
      openVolumeEdit: (type: 'mixer' | 'drum', id: string, name: string, volume: number) => studioStore.openVolumeEdit(type, id, name, volume),
      updateActiveVolume: (val: number) => studioStore.updateActiveVolume(val),
      closeVolumeEdit: () => studioStore.closeVolumeEdit(),
    }
  };
}
