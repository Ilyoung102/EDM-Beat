# 🎧 EDM Beat Studio (v1.2.0-PRO)

> **Pure Web-Synthesizer & Multi-Track Sequencer for Electronic Music Production.**
> Build rhythm patterns, shape raw bass and lead waves, design custom chord progressions, and sequence EDM anthems instantly in your browser.

---

## 🌟 Core Features

### 1. 🥁 Drum Machine (Pure Drum Synthesis)
- Multi-channel sequencer for **Kick Drum**, **Snare Drum**, **High Hats**, and **Percussion**.
- Formutative synthesizer modeling for pure sine kicks and analog noise snares/hats.
- Velocity customization per step for organic micro-rhythm dynamics and groove accents.

### 2. ⚡ Pro Preset Vault (EDM 샘플 라이브러리)
- Loaded with **30 signature EDM genre presets** spanning House, Techno, Future Bass, Trap, Phonk, Dubstep, Drum & Bass, and Synthwave.
- **Dynamic Audition/Preview Engine:** Each preset generates a mathematical note/melody signature and authentic chord pad preview that sounds completely unique on click.

### 3. 🎸 Dual Synthesized Voice Engines
- **Bass Synth Voice:** An emulation of legendary analog bass synthesizers. Features adjustable low-pass resonant VCF filters, sub-oscillator boost controls, and adjustable shape overdrive.
- **Arp Lead Synth:** Detuned unison chorus vocals, delay/reverb parallel sends, and detune chorus stereo spreads.

### 4. 🎛️ Chord Pad Pro & Custom Progressions
- Highly customizable chord pads (e.g., Major 7th, Minor 9th, Suspended 4th ratios).
- Real-time audition trigger buttons and sequenced chord triggers for lush harmonic landscapes.

### 5. 🎚️ Studio Mixer Console & Master FX Rack
- Dynamic channel strip styling with Volume Faders, Pan Controls, and parallel sends.
- **LFO Sidechain Pump:** Modeled compression pump linked automatically to kick drums or LFO cycle lengths.
- Mastering Glue: Soft tape Saturation, Brickwall Limiters, and Stereo bus Compressors for loud, release-ready mixes.

---

## 🚀 How to Use / Play Settings

### 1. Shaping the Rhythm (Drum Grid)
- Toggle the colored grids inside the **Drum Machine** to schedule hits.
- Clicking any active indicator opens the **Velocity Dial**. Adjust the volume weight (0% - 100%) to create realistic drum rolls or accent drops.

### 2. Crafting Melodies & Progressions
- Use the **Bass Synth** and **Lead Synth** grids to sequence notes. The height determines the pitch; the duration and filter envelopes can be modified on the right-hand **Parameter Rack**.
- Trigger or select pre-programmed chord types inside **Chord Pad**, then paint them onto the 16/32 step playhead line.

### 3. Tempo & Master Volume Safety
- **Tempo Control (BPM):** Enter any stable tempo or tap the increment (`+`) and decrement (`-`) buttons inside the header. State clamp guards from `40` to `240` BPM on blur.
- **Master Volume Bar:** Located right in the bottom transport bar for immediate volume adjustments during dense mixes.
- **Bypass / Clear Controls:** Click **MUTATE (🎲)** in the bottom menu to randomize steps for swift ideas or **CLEAR (🗑️)** to wipe the board.

---

## 📱 Responsive Layout Constraint (세로 모드 지원)
- **Auto-Collapsing Deck Architecture:** On tablet, mobile, or portrait view layouts, the left-hand menu and right-hand Parameter Rack automatically initialize as folded.
- **Double-Overlap Guard:** Opening the left sidebar on narrow screens automatically slides back the right inspector (and vice-versa), ensuring you always have an unobstructed view of the sequencer matrix.
- **Smart Pull-Tabs:** Click the glowing neon pull-tabs (`MENU` / `PARAMS`) on the margins to slide open sidebars with a tap, then tap outside on the dark backdrop to slide them out of view cleanly.

---

## 🛠️ Technical Specifications
- **Client DSP Renderer:** Compiled utilizing pure **Web Audio API** oscillators, gain nodes, biquad filters, and custom wave-shapers.
- **Front-End Stack:** React 18+, TypeScript (strong type-safety), Vite server-bundler, and custom Tailwind CSS.
- **Storage Protection:** Auto-saves the grid state and channel configs to `localStorage`. You can modify and return anytime without losing your loops.

---
*Created with Passion for Electronic Music Producers. Version v1.2.0-PRO.*
