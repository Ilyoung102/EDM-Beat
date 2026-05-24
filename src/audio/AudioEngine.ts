/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudioProject, DrumTrack, BassSynthSettings, LeadSynthSettings, ChordPadData, MixerChannel, FXSettings, DrumStep } from '../types/studio';

// Reverb Impulse Response generator
function createReverbImpulseResponse(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);
  for (let i = 0; i < length; i++) {
    const percent = i / length;
    const envelope = Math.pow(1 - percent, decay);
    left[i] = envelope * (Math.random() * 2 - 1);
    right[i] = envelope * (Math.random() * 2 - 1);
  }
  return impulse;
}

// Noise buffer for Snare/Hat/Clap synth
let noiseBufferInstance: AudioBuffer | null = null;
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBufferInstance) return noiseBufferInstance;
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * 2; // 2 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBufferInstance = buffer;
  return buffer;
}

// Conversion table for Delay times
const DELAY_TIMES: Record<string, number> = {
  '1/4': 1.0,
  '1/8': 0.5,
  '1/16': 0.25,
  '1/8t': 1 / 3,
  '1/16t': 1 / 6,
  '1/8d': 0.75,
};

// Map notes to frequencies
const NOTE_FREQS: Record<string, number> = {
  'C': 16.35, 'C#': 17.32, 'D': 18.35, 'D#': 19.45, 'E': 20.60, 'F': 21.83, 'F#': 23.12, 'G': 24.50, 'G#': 25.96, 'A': 27.50, 'A#': 29.14, 'B': 30.87
};

export function getFrequencyForNote(noteName: string, octave: number): number {
  const baseFreq = NOTE_FREQS[noteName] || 16.35;
  return baseFreq * Math.pow(2, octave);
}

// Pulse wave generator helper
let cachedPulseWave: PeriodicWave | null = null;
function getPulseWave(ctx: AudioContext): PeriodicWave {
  if (cachedPulseWave) return cachedPulseWave;
  const size = 64;
  const real = new Float32Array(size);
  const imag = new Float32Array(size);
  const dutyCycle = 0.15; // sweet classic narrow pulse spot
  real[0] = 0;
  imag[0] = 0;
  for (let n = 1; n < size; n++) {
    real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * dutyCycle);
    imag[n] = 0;
  }
  cachedPulseWave = ctx.createPeriodicWave(real, imag);
  return cachedPulseWave;
}

export class AudioEngine {
  public ctx: AudioContext | null = null;

  // Master Limiter / Compressor nodes
  private mainCompressor: DynamicsCompressorNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private postGain: GainNode | null = null;

  // Global Sends (Parallel FX)
  private reverbNode: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayFilter: BiquadFilterNode | null = null;
  private delayWetGain: GainNode | null = null;

  // Global Master Inserts
  private masterFilter: BiquadFilterNode | null = null;
  private waveShaper: WaveShaperNode | null = null;

  // Channels setup
  private channels: Record<string, { gain: GainNode; panner: StereoPannerNode; reverbSend: GainNode; delaySend: GainNode }> = {};

  // Analyzers
  public masterAnalyzer: AnalyserNode | null = null;
  public channelAnalyzers: Record<string, AnalyserNode> = {};

  // Sound Synth options
  private currentProjectState: StudioProject | null = null;

  // Active playing notes (for synth glide/envelope releases)
  private activeBassOscs: { osc: OscillatorNode; subOsc: OscillatorNode | null; gain: GainNode; stopTime: number; note: string; secondaryOscs?: OscillatorNode[] }[] = [];
  private activeLeadVoiceGroups: { oscs: OscillatorNode[]; gain: GainNode; stopTime: number; note: string }[] = [];
  private activeChordOscs: { oscs: OscillatorNode[]; subOsc: OscillatorNode | null; gain: GainNode; stopTime: number }[] = [];

  constructor() {
    // Lazy initialize to bypass user gesture policy on load
  }

  public init() {
    if (this.ctx) return;
    
    // Create audio context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();

    const ctx = this.ctx!;

    // Create Main Master Analyzer
    this.masterAnalyzer = ctx.createAnalyser();
    this.masterAnalyzer.fftSize = 1024;

    // Create Master Limiter & Compressor
    this.masterLimiter = ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-1.0, ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(0.0, ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(20.0, ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.001, ctx.currentTime);
    this.masterLimiter.release.setValueAtTime(0.05, ctx.currentTime);

    this.mainCompressor = ctx.createDynamicsCompressor();
    this.mainCompressor.threshold.setValueAtTime(-16.0, ctx.currentTime);
    this.mainCompressor.knee.setValueAtTime(6.0, ctx.currentTime);
    this.mainCompressor.ratio.setValueAtTime(2.5, ctx.currentTime);
    this.mainCompressor.attack.setValueAtTime(0.01, ctx.currentTime);
    this.mainCompressor.release.setValueAtTime(0.12, ctx.currentTime);

    this.postGain = ctx.createGain();
    this.postGain.gain.setValueAtTime(1.0, ctx.currentTime);

    // Dynamic Master Inserts
    this.masterFilter = ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.setValueAtTime(20000, ctx.currentTime);

    this.waveShaper = ctx.createWaveShaper();
    this.updateDistortionCurve(0.0);

    // Setting up parallel FX sends
    this.reverbNode = ctx.createConvolver();
    this.reverbNode.buffer = createReverbImpulseResponse(ctx, 2.5, 2.2);
    this.reverbWetGain = ctx.createGain();
    this.reverbWetGain.gain.setValueAtTime(0.2, ctx.currentTime);

    this.delayNode = ctx.createDelay(2.0);
    this.delayNode.delayTime.setValueAtTime(0.25, ctx.currentTime);
    this.delayFeedback = ctx.createGain();
    this.delayFeedback.gain.setValueAtTime(0.4, ctx.currentTime);
    this.delayFilter = ctx.createBiquadFilter();
    this.delayFilter.type = 'bandpass';
    this.delayFilter.frequency.setValueAtTime(1200, ctx.currentTime);
    this.delayFilter.Q.setValueAtTime(1.0, ctx.currentTime);

    this.delayWetGain = ctx.createGain();
    this.delayWetGain.gain.setValueAtTime(0.25, ctx.currentTime);

    // Send Loops Routing
    this.reverbNode.connect(this.reverbWetGain);
    this.reverbWetGain.connect(this.masterFilter);

    this.delayNode.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode); // feedback loop
    this.delayNode.connect(this.delayWetGain);
    this.delayWetGain.connect(this.masterFilter);

    // Connect inserts chain: Filter -> WaveShaper -> Compressor -> Limiter -> PostGain -> Analyzer -> Destination
    this.masterFilter.connect(this.waveShaper);
    this.waveShaper.connect(this.mainCompressor);
    this.mainCompressor.connect(this.masterLimiter);
    this.masterLimiter.connect(this.postGain);
    this.postGain.connect(this.masterAnalyzer);
    this.masterAnalyzer.connect(ctx.destination);

    // Set up channels based on standard mixer list
    const channelIds = ['drum_bus', 'kick', 'snare', 'hats', 'perc', 'bass', 'lead', 'chord', 'fx', 'master'];
    channelIds.forEach(cid => {
      const g = ctx.createGain();
      const p = ctx.createStereoPanner();
      const rSend = ctx.createGain();
      const dSend = ctx.createGain();

      g.gain.setValueAtTime(0.8, ctx.currentTime);
      p.pan.setValueAtTime(0.0, ctx.currentTime);
      rSend.gain.setValueAtTime(0.0, ctx.currentTime);
      dSend.gain.setValueAtTime(0.0, ctx.currentTime);

      // Routing
      g.connect(p);
      
      // Send AUX routing
      p.connect(rSend);
      rSend.connect(this.reverbNode!);

      p.connect(dSend);
      dSend.connect(this.delayNode!);

      // Master routing behavior
      if (cid === 'master') {
        p.connect(this.masterFilter!);
      } else if (cid === 'kick' || cid === 'snare' || cid === 'hats' || cid === 'perc') {
        // Drums go to Drum Bus gain, not master directly (unless customized, but routing to bus provides dynamic sidechain and glue)
        // We will connect them to the 'drum_bus' channel input once created or after loop
      } else {
        p.connect(this.masterFilter!);
      }

      // Create channel analyzer
      const cAn = ctx.createAnalyser();
      cAn.fftSize = 256;
      p.connect(cAn);
      this.channelAnalyzers[cid] = cAn;

      this.channels[cid] = { gain: g, panner: p, reverbSend: rSend, delaySend: dSend };
    });

    // Solve cross routing: drum components -> drum bus
    ['kick', 'snare', 'hats', 'perc'].forEach(drumId => {
      this.channels[drumId].panner.disconnect();
      this.channels[drumId].panner.connect(this.channels['drum_bus'].gain);
      // Re-connect to analyzer
      this.channels[drumId].panner.connect(this.channelAnalyzers[drumId]);
    });

    // Route drum bus to master filter
    this.channels['drum_bus'].panner.disconnect();
    this.channels['drum_bus'].panner.connect(this.masterFilter!);
    this.channels['drum_bus'].panner.connect(this.channelAnalyzers['drum_bus']);
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private cleanupOldVoices() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    this.activeBassOscs = this.activeBassOscs.filter(item => {
      if (now > item.stopTime + 0.5) {
        try {
          item.gain.disconnect();
          item.osc.disconnect();
          item.subOsc?.disconnect();
          if (item.secondaryOscs) {
            item.secondaryOscs.forEach(o => {
              try { o.disconnect(); } catch (err) {}
            });
          }
        } catch (e) {}
        return false;
      }
      return true;
    });

    this.activeLeadVoiceGroups = this.activeLeadVoiceGroups.filter(item => {
      if (now > item.stopTime + 0.5) {
        try {
          item.gain.disconnect();
          item.oscs.forEach(o => o.disconnect());
        } catch (e) {}
        return false;
      }
      return true;
    });

    this.activeChordOscs = this.activeChordOscs.filter(item => {
      if (now > item.stopTime + 0.5) {
        try {
          item.gain.disconnect();
          item.oscs.forEach(o => o.disconnect());
          item.subOsc?.disconnect();
        } catch (e) {}
        return false;
      }
      return true;
    });
  }

  private updateDistortionCurve(drive: number) {
    if (!this.waveShaper) return;
    if (drive <= 0) {
      this.waveShaper.curve = null;
      return;
    }
    const k = typeof drive === 'number' ? drive * 80 : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    this.waveShaper.curve = curve;
  }

  // Update DSP Parameters based on incoming state
  public syncState(state: StudioProject) {
    this.currentProjectState = state;
    if (!this.ctx) this.init();

    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Sync Master dynamics
    if (this.mainCompressor && this.masterLimiter && this.postGain) {
      if (state.compressorEnabled) {
        this.mainCompressor.threshold.setValueAtTime(-16.0, now);
      } else {
        this.mainCompressor.threshold.setValueAtTime(0.0, now); // disable compression virtually
      }

      if (state.limiterEnabled) {
        this.masterLimiter.ratio.setValueAtTime(20.0, now);
      } else {
        this.masterLimiter.ratio.setValueAtTime(1.0, now); // disable limit
      }
    }

    // Custom waveshaper clip update
    this.updateDistortionCurve(state.softClipEnabled ? 0.35 : 0.0);

    // Sync FX settings
    const fx = state.fxSettings;
    if (this.reverbWetGain && this.reverbNode) {
      this.reverbWetGain.gain.setValueAtTime(fx.reverb.wet * 0.4, now);
      // Room size changes decay
      const idealDecay = fx.reverb.decay * (0.2 + fx.reverb.roomSize * 2);
      // Convolver node values are static buffer representations, update if drastically different
    }

    if (this.delayNode && this.delayFeedback && this.delayWetGain && this.delayFilter) {
      this.delayWetGain.gain.setValueAtTime(fx.delay.wet * 0.4, now);
      this.delayFeedback.gain.setValueAtTime(fx.delay.feedback * 0.8, now);
      
      this.delayFilter.frequency.setValueAtTime(Math.max(50, fx.delay.frequency), now);

      // Map delay metric back to seconds
      const beatPercent = DELAY_TIMES[fx.delay.time] || 0.25;
      const beatDur = 60 / state.bpm;
      const calculatedSecs = beatDur * beatPercent;
      this.delayNode.delayTime.setValueAtTime(Math.min(2.0, calculatedSecs), now);
    }

    // Master filter parameters
    if (this.masterFilter) {
      this.masterFilter.type = fx.filter.type;
      this.masterFilter.frequency.setValueAtTime(Math.max(20, fx.filter.cutoff), now);
      this.masterFilter.Q.setValueAtTime(fx.filter.resonance, now);
    }

    // Sync Mixer channels
    state.mixerChannels.forEach(c => {
      const channel = this.channels[c.id];
      if (channel) {
        // Gain safety scaling to provide headroom and prevent master clipping
        const gainScale = c.id === 'master' ? 0.70 : 0.60;
        const val = c.mute ? 0 : c.volume * gainScale;
        channel.gain.gain.setValueAtTime(val, now);
        channel.panner.pan.setValueAtTime(c.pan, now);
        channel.reverbSend.gain.setValueAtTime(c.reverbSend * 0.4, now);
        channel.delaySend.gain.setValueAtTime(c.delaySend * 0.4, now);
      }
    });
  }

  // Pure Synthetic Drum Triggering

  public playKick(time: number, velocity: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.channels['kick'].gain);

    // Modern punchy EDM kick sweep
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);

    const kickVol = velocity * 1.1;
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(kickVol, time + 0.003); // punchy click start
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.25); // decay trail

    osc.start(time);
    osc.stop(time + 0.26);

    // Apply Sidechain Ducking effect to other synth tracks on kick time!
    this.triggerSidechainPump(time);
  }

  public playSnare(time: number, velocity: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Snare white noise burst
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = getNoiseBuffer(ctx);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1100;
    noiseFilter.Q.value = 1.3;

    const noiseGain = ctx.createGain();
    const snrVol = velocity * 0.65;
    noiseGain.gain.setValueAtTime(snrVol, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.channels['snare'].gain);

    // Snare tonal fundamental
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(175, time);
    snapOsc.frequency.exponentialRampToValueAtTime(95, time + 0.08);

    snapGain.gain.setValueAtTime(velocity * 0.4, time);
    snapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    snapOsc.connect(snapGain);
    snapGain.connect(this.channels['snare'].gain);

    noiseSource.start(time);
    noiseSource.stop(time + 0.2);
    snapOsc.start(time);
    snapOsc.stop(time + 0.1);
  }

  public playClap(time: number, velocity: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Clap multiple noise bursts mimicking human hands clap timing (e.g. 3 micro reflections)
    const bursts = 3;
    const interval = 0.012;

    for (let i = 0; i < bursts; i++) {
        const burstSource = ctx.createBufferSource();
        burstSource.buffer = getNoiseBuffer(ctx);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1400;
        filter.Q.value = 1.8;

        const gain = ctx.createGain();
        const burstVolume = velocity * (0.4 + 0.2 * i); // final burst gets loudest
        const triggerTime = time + i * interval;

        gain.gain.setValueAtTime(burstVolume, triggerTime);
        gain.gain.exponentialRampToValueAtTime(0.001, triggerTime + (i === bursts - 1 ? 0.26 : 0.02));

        burstSource.connect(filter);
        filter.connect(gain);
        gain.connect(this.channels['snare'].gain); // Route to snare fader

        burstSource.start(triggerTime);
        burstSource.stop(triggerTime + 0.3);
    }
  }

  public playHat(time: number, velocity: number, isOpen: boolean) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const source = ctx.createBufferSource();
    source.buffer = getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8500;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(velocity * 0.25, time);
    const decay = isOpen ? 0.28 : 0.05;
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + decay);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.channels['hats'].gain);

    source.start(time);
    source.stop(time + decay + 0.02);
  }

  public playPerc(time: number, velocity: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.channels['perc'].gain);

    // Cowbell/Tom digital vibe
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, time);
    osc.frequency.linearRampToValueAtTime(220, time + 0.08);

    gainNode.gain.setValueAtTime(velocity * 0.4, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  public playRide(time: number, velocity: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    // Metallic splash using combined high frequencies of square oscillators
    const frequencies = [3500, 4200, 5600, 8000];
    const gainTerm = velocity * 0.08;

    frequencies.forEach(f => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = f;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 6000;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(gainTerm, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.channels['hats'].gain);

      osc.start(time);
      osc.stop(time + 0.5);
    });
  }

  public playFXHit(time: number, velocity: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.channels['fx'].gain);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(8000, time);
    filter.frequency.exponentialRampToValueAtTime(200, time + 1.0);
    filter.Q.value = 5.0;

    gain.gain.setValueAtTime(velocity * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.25);

    osc.start(time);
    osc.stop(time + 1.3);
  }

  // Sidechain compression mechanism

  private triggerSidechainPump(time: number) {
    if (!this.ctx || !this.currentProjectState) return;
    const pumpSettings = this.currentProjectState.fxSettings.sidechain;
    
    // Check if sidechain is active
    if (pumpSettings.amount <= 0) return;
    if (pumpSettings.mode !== 'kick-trigger') return;

    const ctx = this.ctx;
    const pumpTime = time;
    const releaseTime = pumpSettings.release;
    const maxDuck = 1.0 - pumpSettings.amount * 0.85; // Duck down by maximum 85%

    // Duck the channels
    ['bass', 'lead', 'chord'].forEach(cid => {
      const channel = this.channels[cid];
      if (channel) {
        const standardGain = this.currentProjectState?.mixerChannels.find(m => m.id === cid)?.volume || 0.8;
        const duckedVal = standardGain * maxDuck;

        channel.gain.gain.setValueAtTime(standardGain, pumpTime);
        channel.gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, duckedVal), pumpTime + 0.02);
        channel.gain.gain.exponentialRampToValueAtTime(standardGain, pumpTime + releaseTime);
      }
    });
  }

  // Manual LFO Pump handler
  public scheduleLfoPump(time: number, beatDuration: number) {
    if (!this.ctx || !this.currentProjectState) return;
    const sf = this.currentProjectState.fxSettings.sidechain;
    if (sf.amount <= 0 || sf.mode !== 'lfo-pump') return;

    const ctx = this.ctx;
    const maxDuck = 1.0 - sf.amount * 0.85;

    let cycleDuration = beatDuration; // default 1/4
    if (sf.lfoSpeed === '1/8') cycleDuration = beatDuration / 2;
    if (sf.lfoSpeed === '1/2') cycleDuration = beatDuration * 2;

    const steps = 4;
    const stepInt = cycleDuration / steps;

    ['bass', 'lead', 'chord'].forEach(cid => {
      const channel = this.channels[cid];
      if (channel) {
        const targetVol = this.currentProjectState?.mixerChannels.find(m => m.id === cid)?.volume || 0.8;
        const minimumVol = Math.max(0.0001, targetVol * maxDuck);

        channel.gain.gain.setValueAtTime(minimumVol, time);
        channel.gain.gain.linearRampToValueAtTime(targetVol, time + cycleDuration * 0.8);
      }
    });
  }

  // Bass Synth Player

  public playBassNote(time: number, noteName: string, octave: number, duration: number, settings: BassSynthSettings) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.cleanupOldVoices();

    // Cleanup active bass notes to execute portamento glide if required
    while (this.activeBassOscs.length > 5) {
      const old = this.activeBassOscs.shift();
      try {
        old?.gain.gain.setValueAtTime(0, ctx.currentTime);
        old?.gain.disconnect();
        old?.osc.stop();
        old?.osc.disconnect();
        old?.subOsc?.stop();
        old?.subOsc?.disconnect();
      } catch (e) {}
    }

    const freq = getFrequencyForNote(noteName, octave);

    const osc = ctx.createOscillator();
    const subOsc = settings.subOsc ? ctx.createOscillator() : null;
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const dist = ctx.createWaveShaper();

    const secondaryOscs: OscillatorNode[] = [];

    if (settings.oscType === 'pulse') {
      try {
        osc.setPeriodicWave(getPulseWave(ctx));
      } catch (e) {
        osc.type = 'square';
      }
    } else if (settings.oscType === 'supersaw') {
      osc.type = 'sawtooth';
      osc.detune.setValueAtTime(settings.detune - 12, time);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq, time);
      osc2.detune.setValueAtTime(settings.detune + 12, time);
      osc2.connect(filter);
      osc2.start(time);
      secondaryOscs.push(osc2);

      const osc3 = ctx.createOscillator();
      osc3.type = 'sawtooth';
      osc3.frequency.setValueAtTime(freq, time);
      osc3.detune.setValueAtTime(settings.detune, time);
      osc3.connect(filter);
      osc3.start(time);
      secondaryOscs.push(osc3);
    } else if (settings.oscType === 'metallic') {
      osc.type = 'triangle';
      
      const ringer = ctx.createOscillator();
      ringer.type = 'sine';
      ringer.frequency.setValueAtTime(freq * 2.83, time);
      
      const ringerGain = ctx.createGain();
      ringerGain.gain.setValueAtTime(0.45, time);
      ringerGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
      
      ringer.connect(ringerGain);
      ringerGain.connect(filter);
      
      ringer.start(time);
      secondaryOscs.push(ringer);
    } else {
      osc.type = settings.oscType as any;
    }

    osc.frequency.setValueAtTime(freq, time);
    if (settings.oscType !== 'supersaw') {
      osc.detune.setValueAtTime(settings.detune, time);
    }

    if (subOsc) {
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq / 2, time); // 1 Octave Down
      subOsc.connect(filter);
    }

    osc.connect(filter);

    if (settings.distortion > 0) {
      // Distortion
      const k = settings.distortion * 50;
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      dist.curve = curve;
      filter.connect(dist);
      dist.connect(gainNode);
    } else {
      filter.connect(gainNode);
    }
    
    gainNode.connect(this.channels['bass'].gain);

    // Apply Synth ADSR Filter
    filter.type = 'lowpass';
    const cutoff = settings.filterCutoff;
    const env = settings.envelope;

    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.exponentialRampToValueAtTime(Math.min(cutoff * 6, 18000), time + env.attack);
    filter.frequency.exponentialRampToValueAtTime(Math.max(50, cutoff * env.sustain), time + env.attack + env.decay);

    filter.Q.setValueAtTime(settings.filterResonance, time);

    // Apply Synth ADSR Volume
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.7, time + Math.max(0.002, env.attack));
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.7 * env.sustain), time + env.attack + env.decay);

    // Stop and Release scheduler
    const noteEndTime = time + duration;
    gainNode.gain.setValueAtTime(Math.max(0.0001, 0.7 * env.sustain), noteEndTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, noteEndTime + env.release);

    osc.start(time);
    osc.stop(noteEndTime + env.release);

    if (subOsc) {
      subOsc.start(time);
      subOsc.stop(noteEndTime + env.release);
    }

    secondaryOscs.forEach(o => {
      try {
        o.stop(noteEndTime + env.release);
      } catch (err) {}
    });

    this.activeBassOscs.push({
      osc,
      subOsc,
      gain: gainNode,
      stopTime: noteEndTime + env.release,
      note: noteName,
      secondaryOscs
    });
  }

  // Lead Synth Player (with dynamic Unison voices)

  public playLeadNote(time: number, noteName: string, octave: number, duration: number, settings: LeadSynthSettings) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.cleanupOldVoices();

    // Prevent excessive overlapping lead voices
    while (this.activeLeadVoiceGroups.length > 8) {
      const old = this.activeLeadVoiceGroups.shift();
      try {
        old?.gain.gain.setValueAtTime(0, ctx.currentTime);
        old?.gain.disconnect();
        old?.oscs.forEach(o => {
          o.stop();
          o.disconnect();
        });
      } catch (e) {}
    }

    const freq = getFrequencyForNote(noteName, octave);
    const env = settings.envelope;

    const voiceCount = settings.unisonVoices;
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(settings.filterCutoff, time);
    filter.frequency.linearRampToValueAtTime(20000, time + env.attack);
    filter.frequency.setValueAtTime(20000, time + env.attack);
    filter.frequency.exponentialRampToValueAtTime(settings.filterCutoff * (0.1 + env.sustain), time + env.attack + env.decay);
    filter.Q.setValueAtTime(settings.filterResonance, time);

    filter.connect(gainNode);
    gainNode.connect(this.channels['lead'].gain);

    // Generate Lead Unison voices with mild detune detuning spread
    const oscs: OscillatorNode[] = [];
    const spreadCents = settings.detune;

    for (let i = 0; i < voiceCount; i++) {
      const osc = ctx.createOscillator();

      // Distribute detuned chorus width
      let detuneOffset = 0;
      if (voiceCount > 1) {
        detuneOffset = -spreadCents + (i / (voiceCount - 1)) * spreadCents * 2;
      }

      if (settings.oscType === 'pulse') {
        try {
          osc.setPeriodicWave(getPulseWave(ctx));
        } catch (e) {
          osc.type = 'square';
        }
      } else if (settings.oscType === 'supersaw') {
        osc.type = 'sawtooth';
        detuneOffset = detuneOffset * 1.6; // wider spread
      } else if (settings.oscType === 'metallic') {
        osc.type = 'triangle';
        
        // Dynamic FM modulator per voice for gorgeous stereo bell sweep
        const modulator = ctx.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.setValueAtTime(freq * 3.14 + (detuneOffset * 0.1), time);
        
        const modGain = ctx.createGain();
        modGain.gain.setValueAtTime(freq * 1.8, time);
        modGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
        
        modulator.connect(modGain);
        modGain.connect(osc.frequency);
        
        modulator.start(time);
        modulator.stop(time + 0.25);
        oscs.push(modulator);
      } else {
        osc.type = settings.oscType as any;
      }

      osc.frequency.setValueAtTime(freq, time);
      osc.detune.setValueAtTime(detuneOffset, time);

      osc.connect(filter);
      osc.start(time);
      const stopLimit = time + duration + env.release;
      osc.stop(stopLimit);
      oscs.push(osc);
    }

    // Apply Gain Envelope
    gainNode.gain.setValueAtTime(0, time);
    const leadTargetLevel = 0.45 / Math.sqrt(voiceCount); // normalize voice stack volume limits
    gainNode.gain.linearRampToValueAtTime(leadTargetLevel, time + Math.max(0.002, env.attack));
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, leadTargetLevel * env.sustain), time + env.attack + env.decay);

    const noteEndTime = time + duration;
    gainNode.gain.setValueAtTime(Math.max(0.0001, leadTargetLevel * env.sustain), noteEndTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, noteEndTime + env.release);

    this.activeLeadVoiceGroups.push({
      oscs,
      gain: gainNode,
      stopTime: noteEndTime + env.release,
      note: noteName
    });
  }

  // Chord Pad Player (Polyphonic chord voicing generator)

  public playChordPad(time: number, item: ChordPadData, duration: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Decode chord note offsets based on chord type
    const root = item.rootNote;
    const chordType = item.chordType;
    let semitoneOffsets: number[] = [0, 4, 7]; // Major default
    if (chordType === 'minor') semitoneOffsets = [0, 3, 7];
    else if (chordType === 'sus2') semitoneOffsets = [0, 2, 7];
    else if (chordType === 'sus4') semitoneOffsets = [0, 5, 7];
    else if (chordType === '7th') semitoneOffsets = [0, 4, 7, 10];
    else if (chordType === 'm7th') semitoneOffsets = [0, 3, 7, 10];

    const keys = Object.keys(NOTE_FREQS);
    const rootIndex = keys.indexOf(root);
    if (rootIndex === -1) return;

    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Soft warm brass chord filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, time);
    filter.frequency.exponentialRampToValueAtTime(12000, time + 0.15);
    filter.frequency.linearRampToValueAtTime(500, time + duration);
    filter.Q.setValueAtTime(1.5, time);

    filter.connect(gainNode);
    gainNode.connect(this.channels['chord'].gain);

    const oscs: OscillatorNode[] = [];

    // Trigger triad / seventh notes
    semitoneOffsets.forEach(offset => {
      const targetMidi = rootIndex + offset;
      const finalNote = keys[targetMidi % 12];
      const octOffset = Math.floor(targetMidi / 12) + 3; // base 3rd octave chord sounds warm for EDM

      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      const f = getFrequencyForNote(finalNote, octOffset);
      osc.frequency.setValueAtTime(f, time);

      osc.connect(filter);
      osc.start(time);
      osc.stop(time + duration + 0.4);
      oscs.push(osc);
    });

    // Sub base anchor pad
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    const subF = getFrequencyForNote(item.bassNote || root, 1);
    subOsc.frequency.setValueAtTime(subF, time);
    subOsc.connect(filter);
    subOsc.start(time);
    subOsc.stop(time + duration + 0.4);

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.3, time + 0.08); // soft lush attack
    gainNode.gain.setValueAtTime(0.3, time + duration);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.35);

    this.activeChordOscs.push({
      oscs,
      subOsc,
      gain: gainNode,
      stopTime: time + duration + 0.4
    });
  }

  // Live Audition triggers
  public triggerLivePad(pad: ChordPadData) {
    this.resume();
    if (!this.ctx) return;
    this.playChordPad(this.ctx.currentTime, pad, 1.2);
  }

  public triggerLiveDrum(trackId: string) {
    this.resume();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (trackId === 'kick') this.playKick(t, 1.0);
    else if (trackId === 'snare') this.playSnare(t, 1.0);
    else if (trackId === 'clap') this.playClap(t, 1.0);
    else if (trackId === 'hats_closed') this.playHat(t, 1.0, false);
    else if (trackId === 'hats_open') this.playHat(t, 1.0, true);
    else if (trackId === 'perc') this.playPerc(t, 1.0);
    else if (trackId === 'ride') this.playRide(t, 1.0);
    else if (trackId === 'fx') this.playFXHit(t, 1.0);
  }

  public stopAllSounds() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Stop and disconnect all active bass synthesizer oscillators
    this.activeBassOscs.forEach(item => {
      try {
        item.gain.gain.cancelScheduledValues(now);
        item.gain.gain.setValueAtTime(0, now);
        
        item.osc.stop();
        item.osc.disconnect();
        
        if (item.subOsc) {
          item.subOsc.stop();
          item.subOsc.disconnect();
        }
        if (item.secondaryOscs) {
          item.secondaryOscs.forEach(osc => {
            try {
              osc.stop();
              osc.disconnect();
            } catch (err) {}
          });
        }
        item.gain.disconnect();
      } catch (e) {
        // Safe catch for already stopped / inactive nodes
      }
    });
    this.activeBassOscs = [];

    // 2. Stop and disconnect all active lead synthesizer voice groups
    this.activeLeadVoiceGroups.forEach(item => {
      try {
        item.gain.gain.cancelScheduledValues(now);
        item.gain.gain.setValueAtTime(0, now);
        
        item.oscs.forEach(osc => {
          osc.stop();
          osc.disconnect();
        });
        item.gain.disconnect();
      } catch (e) {
        // Safe catch
      }
    });
    this.activeLeadVoiceGroups = [];

    // 3. Stop and disconnect all active chord pad voices
    this.activeChordOscs.forEach(item => {
      try {
        item.gain.gain.cancelScheduledValues(now);
        item.gain.gain.setValueAtTime(0, now);
        
        item.oscs.forEach(osc => {
          osc.stop();
          osc.disconnect();
        });
        if (item.subOsc) {
          item.subOsc.stop();
          item.subOsc.disconnect();
        }
        item.gain.disconnect();
      } catch (e) {
        // Safe catch
      }
    });
    this.activeChordOscs = [];
  }
}

// Global engine singleton setup
export const audioEngineInstance = new AudioEngine();
