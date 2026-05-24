/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helpers to expand compact melody arrays to 16/32-step structures
export const expandBassSteps = (activeSteps: [number, string, number?][]): any[] => {
  const res = Array(16).fill(null).map(() => ({ active: false, note: 'C', octave: 2, length: 1 }));
  activeSteps.forEach(([idx, note, oct]) => {
    if (idx >= 0 && idx < 16) {
      res[idx] = { active: true, note, octave: oct !== undefined ? oct : 2, length: 1 };
    }
  });
  return res;
};

export const expandLeadSteps = (activeSteps: [number, string, number?, number?][]): any[] => {
  const res = Array(32).fill(null).map(() => ({ active: false, note: 'C', octave: 4, velocity: 0.8, length: 1 }));
  activeSteps.forEach(([idx, note, oct, vel]) => {
    if (idx >= 0 && idx < 32) {
      res[idx] = { 
        active: true, 
        note, 
        octave: oct !== undefined ? oct : 4, 
        velocity: vel !== undefined ? vel : 0.8, 
        length: 1 
      };
    }
  });
  return res;
};

export const expandChordSteps = (activePads: [number, string][]): any[] => {
  const res = Array(16).fill(null).map(() => ({ active: false, padId: null }));
  activePads.forEach(([idx, padId]) => {
    if (idx >= 0 && idx < 16) {
      res[idx] = { active: true, padId };
    }
  });
  return res;
};

export interface FamousSongPreset {
  title: string;
  bpm: number;
  description: string;
  bassSettings?: any;
  bassSteps?: [number, string, number?][];
  leadSettings?: any;
  leadSteps?: [number, string, number?, number?][];
  chordSteps?: [number, string][];
}

export const FAMOUS_EDM_SONGS: Record<string, FamousSongPreset> = {
  'House': {
    title: 'Avicii - Levels',
    bpm: 126,
    description: '전설적인 아비치의 획기적인 하우스 찬가. 가슴을 울리는 복고풍 보컬 신스 리프.',
    bassSettings: { oscType: 'sawtooth', filterCutoff: 400, filterResonance: 3.0, distortion: 0.1, glide: 0.05 },
    bassSteps: [[0,'E',2],[4,'E',2],[8,'C',2],[12,'A',2]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 3, detune: 25, filterCutoff: 2100, delaySend: 0.35, reverbSend: 0.3 },
    leadSteps: [[0,'B',4],[2,'E',5],[4,'G',5],[6,'F#',5],[8,'E',5],[10,'B',4],[12,'D',5],[14,'C#',5],[16,'D',5],[20,'B',4],[22,'A',4],[24,'E',4]],
    chordSteps: [[0,'pad1'],[4,'pad1'],[8,'pad4'],[12,'pad2']]
  },
  'Techno': {
    title: 'Charlotte de Witte - Sgadi Li',
    bpm: 130,
    description: '벨기에 테크노 여제 Charlotte de Witte 스타일의 어두운 창고 감성 저음 럼블 비트.',
    bassSettings: { oscType: 'sine', subOsc: true, filterCutoff: 150, distortion: 0.4, glide: 0.0 },
    bassSteps: [[1,'A',1],[2,'A',1],[3,'A',1],[5,'A',1],[6,'A',1],[7,'A',1],[9,'A',1],[10,'A',1],[11,'A',1],[13,'A',1],[14,'A',1],[15,'A',1]],
    leadSettings: { oscType: 'sine', unisonVoices: 1, detune: 0, filterCutoff: 700, delaySend: 0.4, reverbSend: 0.5 },
    leadSteps: [[0,'A',4],[2,'A',4],[3,'A',4],[5,'A#',4],[8,'A#',4],[10,'A',4],[12,'G',4]],
    chordSteps: []
  },
  'Trance': {
    title: 'Tiësto - Adagio for Strings',
    bpm: 138,
    description: '트랜스의 대부 티에스토의 불후의 클래식. 가슴 터지는 대서사시 하늘 Arp 멜로디.',
    bassSettings: { oscType: 'sawtooth', subOsc: true, filterCutoff: 450, distortion: 0.15, glide: 0.08 },
    bassSteps: [[0,'A',1],[4,'F',1],[8,'C',2],[12,'G',1]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 4, detune: 48, filterCutoff: 3500, delaySend: 0.5, reverbSend: 0.55 },
    leadSteps: [[0,'A',4],[4,'B',4],[8,'C',5],[12,'D',5],[16,'E',5],[20,'F',5],[24,'E',5],[28,'D',5]],
    chordSteps: [[0,'pad4'],[4,'pad0'],[8,'pad1'],[12,'pad2']]
  },
  'Dubstep': {
    title: 'Skrillex - Scary Monsters',
    bpm: 140,
    description: '덥스텝 돌풍을 일으킨 스크릴렉스의 대표곡. 보컬 스크래치 신스와 울부짖는 와블 베이스.',
    bassSettings: { oscType: 'sawtooth', filterCutoff: 600, filterResonance: 6.5, distortion: 0.65, envelope: { attack: 0.02, decay: 0.22, sustain: 0.5, release: 0.25 } },
    bassSteps: [[0,'D',2],[4,'F',2],[8,'G',2],[12,'G#',2]],
    leadSettings: { oscType: 'square', unisonVoices: 2, detune: 15, filterCutoff: 2500, delaySend: 0.3, reverbSend: 0.35 },
    leadSteps: [[0,'D',4],[2,'F',4],[4,'G',4],[6,'G#',4],[8,'G',4],[10,'F',4],[12,'D',4],[16,'G',4],[18,'D',5]],
    chordSteps: [[0,'pad1']]
  },
  'Future Bass': {
    title: 'Marshmello - Alone',
    bpm: 142,
    description: '마시멜로의 독보적 감성 퓨처베이스. 기분 좋은 플럭 멜로디와 하이 텐션 808 글라이드.',
    bassSettings: { oscType: 'sine', subOsc: true, filterCutoff: 200, distortion: 0.05, glide: 0.15 },
    bassSteps: [[0,'F',1],[4,'A',1],[8,'G',1],[12,'C',2]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 5, detune: 45, filterCutoff: 2800, delaySend: 0.3, reverbSend: 0.35 },
    leadSteps: [[0,'F',4],[2,'G',4],[4,'A',4],[6,'C',5],[8,'A',4],[10,'G',4],[12,'F',4],[14,'D',4],[16,'F',4],[18,'G',4],[20,'A',4],[24,'C',5]],
    chordSteps: [[0,'pad1'],[8,'pad4']]
  },
  'Drum & Bass': {
    title: 'Pendulum - The Island',
    bpm: 174,
    description: '드럼앤베이스 전설 펜듈럼의 하이파워 브레이크비트. 날카로운 사이렌 아날로그 스크레치.',
    bassSettings: { oscType: 'sawtooth', subOsc: true, filterCutoff: 300, distortion: 0.45, glide: 0.1 },
    bassSteps: [[0,'A',1],[4,'A',1],[8,'G',1],[12,'F',1]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 3, detune: 25, filterCutoff: 3000, delaySend: 0.45, reverbSend: 0.4 },
    leadSteps: [[0,'A',4],[1,'A',4],[2,'A',4],[4,'G',4],[6,'G',4],[8,'A',4],[10,'C',5],[12,'E',5]],
    chordSteps: [[0,'pad4']]
  },
  'Trap': {
    title: 'DJ Snake - Turn Down for What',
    bpm: 120,
    description: '디제이 스네이크의 무대를 찢는 트랩 불후의 명작. 클럽을 강타한 강력 브라스 플럭 리프.',
    bassSettings: { oscType: 'sine', subOsc: true, filterCutoff: 180, distortion: 0.35, glide: 0.2 },
    bassSteps: [[0,'C#',1],[4,'C#',1],[8,'A#',1],[12,'F#',1]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 3, detune: 35, filterCutoff: 2600, delaySend: 0.3, reverbSend: 0.3 },
    leadSteps: [[0,'C#',5],[2,'C#',5],[4,'C#',5],[6,'C',5],[8,'C#',5],[10,'C#',5],[12,'E',5],[14,'D',5]],
    chordSteps: []
  },
  'Hardstyle': {
    title: 'Showtek - FTS',
    bpm: 150,
    description: '하드스타일 명곡 쇼텍의 FTS! 땅을 흔드는 디스토션 리버스 베이스 킥과 화려한 아프.',
    bassSettings: { oscType: 'sawtooth', filterCutoff: 450, filterResonance: 3.5, distortion: 0.85, glide: 0.08 },
    bassSteps: [[0,'G',2],[4,'G',2],[8,'G',2],[12,'G',2]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 5, detune: 50, filterCutoff: 3800, delaySend: 0.5, reverbSend: 0.5 },
    leadSteps: [[0,'G',4],[2,'A',4],[4,'B',4],[6,'G',4],[8,'F',4],[10,'E',4],[12,'D',4],[14,'C',4],[16,'G',4],[18,'A',4],[20,'B',4]],
    chordSteps: [[0,'pad2']]
  },
  'Psytrance': {
    title: 'Vini Vici - Great Spirit',
    bpm: 138,
    description: '비니비치의 부족 전쟁 감성 싸이트랜스. 하이 스피드 네이티브 챈트와 삼중주 돌격 베이스.',
    bassSettings: { oscType: 'sawtooth', filterCutoff: 400, filterResonance: 3.0, distortion: 0.25, glide: 0.05 },
    bassSteps: [[1,'E',2],[2,'E',2],[3,'E',2],[5,'E',2],[6,'E',2],[7,'E',2],[9,'E',2],[10,'E',2],[11,'E',2],[13,'E',2],[14,'E',2],[15,'E',2]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 4, detune: 30, filterCutoff: 2100, delaySend: 0.55, reverbSend: 0.5 },
    leadSteps: [[0,'E',4],[3,'E',4],[6,'E',4],[8,'G',4],[11,'F#',4],[14,'E',4]],
    chordSteps: []
  },
  'Synthwave': {
    title: 'Kavinsky - Nightcall',
    bpm: 116,
    description: '영화 드라이브 수록곡 카빈스키의 레트로 80s 네온 크루징 무드 감성 신스웨이브.',
    bassSettings: { oscType: 'sawtooth', filterCutoff: 420, distortion: 0.2, glide: 0.1 },
    bassSteps: [[0,'A',2],[2,'A',2],[4,'A',2],[6,'A',2],[8,'G',2],[10,'G',2],[12,'F',2],[14,'F',2]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 3, detune: 20, filterCutoff: 1500, delaySend: 0.4, reverbSend: 0.4 },
    leadSteps: [[0,'A',4],[4,'G',4],[8,'F',4],[12,'E',4],[16,'D',4],[20,'E',4],[24,'A',4]],
    chordSteps: [[0,'pad4'],[8,'pad1']]
  },
  'Electro House': {
    title: 'Benny Benassi - Satisfaction',
    bpm: 130,
    description: '일렉트로 하우스 전설 만족! 기계처럼 완벽하고 강렬한 아날로그 쏘우투스 그라인딩 루프.',
    bassSettings: { oscType: 'sawtooth', filterCutoff: 500, filterResonance: 3.5, distortion: 0.5, glide: 0.04 },
    bassSteps: [[0,'C',2],[2,'C',2],[4,'C#',2],[6,'C',2],[8,'D#',2],[10,'C',2],[12,'F',2],[14,'E',2]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 2, detune: 15, filterCutoff: 1800, delaySend: 0.3, reverbSend: 0.35 },
    leadSteps: [[0,'C',3],[2,'C',3],[4,'C#',3],[6,'C',3],[8,'D#',3],[10,'C',3],[12,'F',3],[14,'E',3]],
    chordSteps: []
  },
  'Deep House': {
    title: 'Disclosure - Latch',
    bpm: 122,
    description: '디스클로저의 전성기 딥하우스. 따뜻하고 차분한 로즈 건반 코드 스윕과 스윙 개러지 베이스.',
    bassSettings: { oscType: 'sine', subOsc: true, filterCutoff: 220, filterResonance: 3.5, distortion: 0.15, glide: 0.05 },
    bassSteps: [[0,'A',2],[4,'C',2],[8,'G',2],[12,'D',2]],
    leadSettings: { oscType: 'sine', unisonVoices: 3, detune: 25, filterCutoff: 1400, delaySend: 0.35, reverbSend: 0.3 },
    leadSteps: [[0,'C',5],[4,'G',4],[8,'A',4],[12,'C',5]],
    chordSteps: [[0,'pad1'],[4,'pad4'],[8,'pad2'],[12,'pad0']]
  },
  'Progressive House': {
    title: 'Swedish House Mafia - DYWC',
    bpm: 126,
    description: '스웨디시 하우스 마피아의 월드와이드 명곡. 가슴 벅차오르는 페스티벌 감동 신스 배킹.',
    bassSettings: { oscType: 'sawtooth', subOsc: true, filterCutoff: 380, filterResonance: 3.0, distortion: 0.2, glide: 0.08 },
    bassSteps: [[0,'A',1],[4,'B',1],[8,'C',2],[12,'G',1]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 3, detune: 35, filterCutoff: 2500, delaySend: 0.45, reverbSend: 0.4 },
    leadSteps: [[0,'E',4],[3,'A',4],[6,'B',4],[9,'C',5],[12,'B',4],[15,'A',4],[18,'G',4],[21,'E',4]],
    chordSteps: [[0,'pad0'],[4,'pad2'],[8,'pad4'],[12,'pad1']]
  },
  'Acid Techno': {
    title: 'Boston 168 - Acid Morning',
    bpm: 135,
    description: '아날로그 Roland 303 하이 레조넌스 필터 스윕이 펼쳐지는 정통 멜로딕 애시드 테크노.',
    bassSettings: { oscType: 'sine', subOsc: true, filterCutoff: 180, distortion: 0.4, glide: 0.01 },
    bassSteps: [[0,'C',1],[4,'C',1],[8,'C',1],[12,'C',1]],
    leadSettings: { oscType: 'square', unisonVoices: 1, detune: 0, filterCutoff: 2400, filterResonance: 12, delaySend: 0.4, reverbSend: 0.5 },
    leadSteps: [[0,'C',4],[2,'D#',4],[3,'C',4],[5,'F',4],[6,'F#',4],[8,'G',4],[10,'F#',4],[13,'D#',4],[15,'C',4]],
    chordSteps: []
  },
  'Garage / UKG': {
    title: 'Disclosure - White Noise',
    bpm: 130,
    description: '영국 개러지 셔플의 진수. 독특한 리듬의 2-step 하이햇 워블과 통통 튀는 FM 리프 플럭.',
    bassSettings: { oscType: 'square', subOsc: true, filterCutoff: 300, distortion: 0.25, glide: 0.1 },
    bassSteps: [[2,'G',2],[6,'G',2],[10,'C',2],[14,'D',2]],
    leadSettings: { oscType: 'square', unisonVoices: 3, detune: 20, filterCutoff: 1600, delaySend: 0.35, reverbSend: 0.3 },
    leadSteps: [[0,'E',4],[3,'G',4],[6,'A',4],[9,'B',4],[12,'A',4],[14,'G',4]],
    chordSteps: [[0,'pad1'],[8,'pad4']]
  },
  'Breakbeat': {
    title: 'The Prodigy - Firestarter',
    bpm: 140,
    description: '영국 전설 프로디지의 불꽃 브레이크 루프. 사이키델릭 알람 소우 신스 질주.',
    bassSettings: { oscType: 'sawtooth', subOsc: true, filterCutoff: 400, distortion: 0.6, glide: 0.08 },
    bassSteps: [[0,'F#',1],[4,'F#',1],[8,'D',1],[12,'E',1]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 3, detune: 40, filterCutoff: 2500, delaySend: 0.45, reverbSend: 0.4 },
    leadSteps: [[0,'F#',4],[3,'G',4],[6,'F#',4],[9,'D',4], [12,'F#',4],[15,'G',4],[18,'A',4]],
    chordSteps: []
  },
  'Hardcore / Gabber': {
    title: 'Angerfist - Chronic Disorder',
    bpm: 170,
    description: '앵거피스트 특유의 하드코어 헤비 왜커 킥과 어두운 서커스 피치 슬레이트 레이브 벨.',
    bassSettings: { oscType: 'sawtooth', filterCutoff: 600, distortion: 0.8, glide: 0.05 },
    bassSteps: [[0,'C',2],[4,'C',2],[8,'C',2],[12,'C',2]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 5, detune: 50, filterCutoff: 4000, delaySend: 0.4, reverbSend: 0.4 },
    leadSteps: [[0,'C',5],[2,'C',5],[4,'C#',5],[6,'C',5],[8,'D',5],[12,'E',5]],
    chordSteps: []
  },
  'Minimal': {
    title: 'Boris Brejcha - Gravity',
    bpm: 125,
    description: '보리스 브레이차 감성의 하이테크 미니멀. 신랄하게 고립된 에코 플럭 멜로디의 마법.',
    bassSettings: { oscType: 'sine', subOsc: true, filterCutoff: 180, distortion: 0.15, glide: 0.0 },
    bassSteps: [[0,'A',1],[3,'A',1],[6,'A',1],[10,'G',1]],
    leadSettings: { oscType: 'sine', unisonVoices: 1, detune: 0, filterCutoff: 1000, delaySend: 0.5, reverbSend: 0.45 },
    leadSteps: [[0,'A',4],[3,'B',4],[6,'C',5],[9,'E',5],[12,'C',5],[15,'B',4]],
    chordSteps: []
  },
  'Ambient Dub': {
    title: 'Aphex Twin - SAW 85-92',
    bpm: 100,
    description: '에이펙스 트윈의 아날로그 오버드라이브 몽환성 앰비언트. 신비롭고 아스라한 감상 우주.',
    bassSettings: { oscType: 'sine', filterCutoff: 150, distortion: 0.05, glide: 0.2 },
    bassSteps: [[0,'E',2],[8,'A',1]],
    leadSettings: { oscType: 'sine', unisonVoices: 3, detune: 10, filterCutoff: 1100, delaySend: 0.45, reverbSend: 0.5 },
    leadSteps: [[0,'E',4],[4,'G',4],[8,'A',4],[12,'B',4],[16,'D',5],[20,'B',4],[24,'A',4]],
    chordSteps: [[0,'pad4'],[8,'pad1']]
  },
  'French House': {
    title: 'Daft Punk - Around the World',
    bpm: 121,
    description: '다프트 펑크 최고의 토크박스 보코더 사운드. 펑키하고 탄탄한 디스코 슬라이드 베이스라인.',
    bassSettings: { oscType: 'sawtooth', subOsc: true, filterCutoff: 400, distortion: 0.1, glide: 0.08 },
    bassSteps: [[0,'A',2],[4,'C',3],[8,'G',2],[12,'D',3]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 2, detune: 25, filterCutoff: 1500, delaySend: 0.45, reverbSend: 0.4 },
    leadSteps: [[0,'A',4],[2,'C',5],[4,'E',5],[6,'D',5],[8,'C',5],[10,'B',4],[12,'A',4]],
    chordSteps: [[0,'pad4'],[8,'pad1']]
  },
  'Big Room': {
    title: 'Martin Garrix - Animals',
    bpm: 128,
    description: '마틴 게릭스를 알린 스타디움 전율의 일등 공신. 울림 가득한 대형 킥과 마블 우드블럭 멜로디.',
    bassSettings: { oscType: 'sawtooth', subOsc: true, filterCutoff: 300, distortion: 0.3, glide: 0.05 },
    bassSteps: [[0,'A',1],[4,'A',1],[8,'A',1],[12,'A',1]],
    leadSettings: { oscType: 'square', unisonVoices: 5, detune: 45, filterCutoff: 1400, delaySend: 0.35, reverbSend: 0.45 },
    leadSteps: [[0,'A',4],[2,'A',4],[4,'A',4],[8,'C',5],[12,'A',4]],
    chordSteps: [[0,'pad4']]
  },
  'Melodic Techno': {
    title: 'ARTBAT - Horizon',
    bpm: 124,
    description: '아트뱃 특유의 시네마틱 우주 공간감 아르페지오. 별자리가 교차하는 황홀한 지평선.',
    bassSettings: { oscType: 'sine', subOsc: true, filterCutoff: 200, distortion: 0.25, glide: 0.02 },
    bassSteps: [[0,'C',1],[8,'E',1]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 3, detune: 30, filterCutoff: 2000, delaySend: 0.4, reverbSend: 0.4 },
    leadSteps: [[0,'C',4],[2,'E',4],[4,'G',4],[6,'B',4],[8,'C',5],[10,'B',4],[12,'G',4],[14,'E',4],[16,'D',4]],
    chordSteps: [[0,'pad1'],[8,'pad5']]
  },
  'Future House': {
    title: 'Oliver Heldens - Gecko',
    bpm: 125,
    description: '올리버 헬덴스의 미래지향적 메탈릭 FM 버블 베이스. 무대를 가볍게 튕기는 쾌활한 러버 사운드.',
    bassSettings: { oscType: 'square', subOsc: true, filterCutoff: 380, distortion: 0.3, glide: 0.05 },
    bassSteps: [[0,'D',2],[2,'D',2],[4,'F',2],[6,'G',2],[8,'F',2],[10,'D',2],[12,'C',2],[14,'D',2]],
    leadSettings: { oscType: 'square', unisonVoices: 4, detune: 35, filterCutoff: 1800, delaySend: 0.35, reverbSend: 0.3 },
    leadSteps: [[0,'D',4],[2,'D',4],[4,'F',4],[6,'G',4],[8,'F',4],[10,'D',4],[12,'C',4],[14,'D',4]],
    chordSteps: [[0,'pad4']]
  },
  'Phonk': {
    title: 'KORDHELL - Murder In My Mind',
    bpm: 130,
    description: '강력한 왜곡 효과의 오버드라이브 카우벨 멜로디와 어그레시브한 레이지 멤피스 지옥 808.',
    bassSettings: { oscType: 'sine', subOsc: true, filterCutoff: 200, distortion: 0.65, glide: 0.15 },
    bassSteps: [[0,'E',1],[4,'G',1],[8,'D',1],[12,'B',1]],
    leadSettings: { oscType: 'square', unisonVoices: 2, detune: 15, filterCutoff: 2800, delaySend: 0.3, reverbSend: 0.35 },
    leadSteps: [[0,'E',5],[2,'E',5],[4,'G',5],[6,'E',5],[8,'D',5],[10,'E',5],[12,'B',4],[14,'C',5]],
    chordSteps: []
  },
  'Hardwave': {
    title: 'Skeler - Arcadia',
    bpm: 140,
    description: '고속 트랩 하이햇 위에 흐르는 미려하고 넓은 잔향의 사이버네틱 슈퍼쏘우 글라이드 멜로디.',
    bassSettings: { oscType: 'sawtooth', subOsc: true, filterCutoff: 400, distortion: 0.25, glide: 0.12 },
    bassSteps: [[0,'A',2],[4,'C',2],[8,'F',2],[12,'G',2]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 4, detune: 45, filterCutoff: 3200, delaySend: 0.4, reverbSend: 0.45 },
    leadSteps: [[0,'A',4],[4,'C',5],[8,'E',5],[12,'D',5],[16,'G',4],[20,'E',4]],
    chordSteps: [[0,'pad2'],[8,'pad4']]
  },
  'Electro Swing': {
    title: 'Caravan Palace - Lone Digger',
    bpm: 124,
    description: '재즈 금관악기 리프와 하우스 4x4 비트가 완벽하게 맞물린 폭발적이고 스펙타클한 레트로 스윙.',
    bassSettings: { oscType: 'sawtooth', filterCutoff: 420, distortion: 0.2, glide: 0.15 },
    bassSteps: [[0,'C',2],[4,'C',3],[8,'G',2],[12,'G',3]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 3, detune: 25, filterCutoff: 2100, delaySend: 0.3, reverbSend: 0.3 },
    leadSteps: [[0,'C',5],[2,'D#',5],[4,'F',5],[6,'F#',5],[8,'F',5],[10,'D#',5],[12,'C',5],[14,'G',4]],
    chordSteps: [[0,'pad1']]
  },
  'Glitch Hop': {
    title: 'The Glitch Mob - Animus Vox',
    bpm: 115,
    description: '더 글리치 몹의 정교하고 거친 하프타임 비트와 신성한 우주 레이저 글리치 아르페지오.',
    bassSettings: { oscType: 'sawtooth', subOsc: true, filterCutoff: 380, distortion: 0.45, glide: 0.15 },
    bassSteps: [[0,'E',1],[4,'G',1],[8,'A',1],[12,'C',1]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 4, detune: 35, filterCutoff: 2300, delaySend: 0.4, reverbSend: 0.4 },
    leadSteps: [[0,'E',4],[2,'G',4],[4,'A',4],[6,'B',4],[8,'A',4],[12,'E',4]],
    chordSteps: [[0,'pad2'],[8,'pad4']]
  },
  'Lo-Fi House': {
    title: 'Mall Grab - I\'ve Been Waiting',
    bpm: 118,
    description: '진공관 릴테이프 가루를 뿌린 듯 아상하고 아스라한 로파이 질감과 따뜻한 아날로그 패드.',
    bassSettings: { oscType: 'sawtooth', filterCutoff: 350, distortion: 0.15, glide: 0.1 },
    bassSteps: [[0,'C',2],[8,'G',2]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 2, detune: 15, filterCutoff: 1200, delaySend: 0.35, reverbSend: 0.4 },
    leadSteps: [[0,'C',4],[4,'E',4],[8,'G',4],[12,'D',4]],
    chordSteps: [[0,'pad1'],[8,'pad4']]
  },
  'Eurodance': {
    title: 'Haddaway - What is Love',
    bpm: 124,
    description: '전 세계의 모든 고개를 흔들게 만든 흥겨운 90s 오르간 리프와 초고속 라이드 룹 클래식.',
    bassSettings: { oscType: 'sawtooth', subOsc: true, filterCutoff: 400, distortion: 0.2, glide: 0.1 },
    bassSteps: [[0,'G',2],[4,'D',2],[8,'C',2],[12,'D',2]],
    leadSettings: { oscType: 'square', unisonVoices: 3, detune: 30, filterCutoff: 1800, delaySend: 0.4, reverbSend: 0.35 },
    leadSteps: [[0,'G',4],[2,'B',4],[4,'D',5],[6,'C',5],[8,'B',4],[10,'G',4],[12,'B',4],[14,'A',4]],
    chordSteps: [[0,'pad1'],[4,'pad0'],[8,'pad5']]
  },
  'Cyberpunk': {
    title: 'REZZ - Edge',
    bpm: 100,
    description: 'REZZ 특유의 무겁게 짓누르는 미래형 슬로테크노. 귀를 후벼파는 시니컬 디스토션 소우.',
    bassSettings: { oscType: 'square', subOsc: true, filterCutoff: 210, filterResonance: 4.5, distortion: 0.7, glide: 0.1 },
    bassSteps: [[0,'A',1],[4,'A',1],[8,'A',1],[12,'A',1]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 3, detune: 45, filterCutoff: 800, delaySend: 0.35, reverbSend: 0.4 },
    leadSteps: [[0,'A',3],[2,'A',3],[4,'G#',3],[6,'A',3],[8,'B',3],[10,'A',3],[12,'D',4]],
    chordSteps: []
  },
  'Anthem Trance': {
    title: 'Darude - Sandstorm',
    bpm: 136,
    description: '전 지구를 뒤흔든 트랜스 기원곡. 브레이크 후 질주하는 초고속 전설적 아날로그 신스 플럭 리프.',
    bassSettings: { oscType: 'sawtooth', filterCutoff: 380, distortion: 0.2, glide: 0.05 },
    bassSteps: [[0,'B',1],[4,'B',1],[8,'B',1],[12,'B',1]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 3, detune: 30, filterCutoff: 2500, delaySend: 0.45, reverbSend: 0.4 },
    leadSteps: [[0,'B',4],[2,'B',4],[4,'B',4],[6,'B',4],[8,'B',4],[10,'D',5],[12,'B',4],[14,'A',4],[16,'B',4],[18,'B',4],[20,'B',4],[22,'B',4],[24,'E',5],[26,'B',4]],
    chordSteps: [[0,'pad4']]
  },
  'Tech House': {
    title: 'Fisher - Losing It',
    bpm: 125,
    description: '테크 하우스 역사를 다시 쓴 Fisher의 메가 히트작. 가슴 관통형 사이렌 리드와 초저역 무거운 그로울 베이스.',
    bassSettings: { oscType: 'sawtooth', subOsc: true, filterCutoff: 220, distortion: 0.4, glide: 0.18 },
    bassSteps: [[0,'F#',1],[4,'F#',1],[8,'F#',1],[12,'F#',2]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 3, detune: 45, filterCutoff: 1100, delaySend: 0.3, reverbSend: 0.35 },
    leadSteps: [[0,'F#',3],[4,'F#',4],[8,'F#',3],[12,'F#',4]],
    chordSteps: []
  },
  'Electro Classic': {
    title: 'Deadmau5 - Ghosts \'n\' Stuff',
    bpm: 128,
    description: '데드마우스 명반의 심장박동수. 탄탄한 무그 톱니파 베이스와 경쾌한 디스코 일렉트로 코드 리프.',
    bassSettings: { oscType: 'sawtooth', filterCutoff: 400, distortion: 0.3, glide: 0.1 },
    bassSteps: [[0,'D',2],[4,'D',2],[8,'F',2],[12,'G',2]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 4, detune: 25, filterCutoff: 2800, delaySend: 0.35, reverbSend: 0.3 },
    leadSteps: [[0,'D',4],[2,'D',4],[4,'F',4],[6,'F',4],[8,'G',4],[10,'G',4],[12,'A',4]],
    chordSteps: [[0,'pad1'],[8,'pad4']]
  },
  'Global Deep House': {
    title: 'Peggy Gou - It Make You Forget (Itgehane)',
    bpm: 120,
    description: '페기 구의 세계적 히트곡. 한국어 가사 무드와 이국적 아프로 오르간 플럭 리드 루프.',
    bassSettings: { oscType: 'sine', subOsc: true, filterCutoff: 200, distortion: 0.1, glide: 0.05 },
    bassSteps: [[0,'A',2],[4,'C',2],[8,'G',2],[12,'D',2]],
    leadSettings: { oscType: 'sine', unisonVoices: 2, detune: 20, filterCutoff: 1200, delaySend: 0.4, reverbSend: 0.4 },
    leadSteps: [[0,'A',4],[3,'C',5],[6,'E',5],[9,'D',5],[12,'C',5]],
    chordSteps: [[0,'pad1'],[8,'pad4']]
  },
  'Rumble Bass': {
    title: 'Skrillex, Fred again.. - Rumble',
    bpm: 140,
    description: 'UK 베이스씬의 혁신. 가슴뼈를 강하게 때리는 기묘한 서브-러버 베이스와 여백의 미학 덥 트랙.',
    bassSettings: { oscType: 'sine', subOsc: true, filterCutoff: 150, distortion: 0.1, glide: 0.2 },
    bassSteps: [[0,'F',1],[4,'F#',1],[8,'D',1],[12,'C',1]],
    leadSettings: { oscType: 'sine', unisonVoices: 1, detune: 0, filterCutoff: 800, delaySend: 0.5, reverbSend: 0.5 },
    leadSteps: [[0,'F',3],[8,'F#',3]],
    chordSteps: []
  },
  'Big Beat': {
    title: 'Fatboy Slim - Right Here, Right Now',
    bpm: 124,
    description: '90s 일렉트로니카 황금기 Big Beat 전설. 서정적 비올라 오케스트라 리프와 하드 록 드럼 질주.',
    bassSettings: { oscType: 'sawtooth', filterCutoff: 350, distortion: 0.45, glide: 0.1 },
    bassSteps: [[0,'D',2],[4,'D',2],[8,'D',2],[12,'D',2]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 4, detune: 40, filterCutoff: 2100, delaySend: 0.4, reverbSend: 0.45 },
    leadSteps: [[0,'D',4],[3,'F',4],[6,'G',4],[9,'F',4],[12,'D',4]],
    chordSteps: [[0,'pad1']]
  },
  'Funk Breakbeat': {
    title: 'The Chemical Brothers - Block Rockin\' Beats',
    bpm: 110,
    description: '그래미를 휩쓴 케미컬 브라더스의 대표작. 뚱뚱하게 울어대는 아날로그 베이스 그루브와 묵직한 드럼.',
    bassSettings: { oscType: 'sawtooth', filterCutoff: 300, distortion: 0.5, glide: 0.15 },
    bassSteps: [[0,'G',2],[2,'G',2],[4,'F',2],[6,'D',2],[8,'A#',1],[12,'A',1]],
    leadSettings: { oscType: 'square', unisonVoices: 2, detune: 20, filterCutoff: 1800, delaySend: 0.35, reverbSend: 0.3 },
    leadSteps: [[0,'G',4],[4,'F',4],[8,'D',4],[12,'A#',4]],
    chordSteps: []
  },
  'Filter Disco House': {
    title: 'Daft Punk - One More Time',
    bpm: 123,
    description: '설명이 필요 없는 프랑스 하우스 거성 다프트 펑크 최고의 파티 오토튠 하우스 멜로디.',
    bassSettings: { oscType: 'sawtooth', subOsc: true, filterCutoff: 380, distortion: 0.15, glide: 0.08 },
    bassSteps: [[0,'G',2],[4,'G',2],[8,'G',2],[12,'G',2]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 3, detune: 35, filterCutoff: 2400, delaySend: 0.35, reverbSend: 0.35 },
    leadSteps: [[0,'B',4],[2,'D',5],[4,'G',5],[6,'F#',5],[8,'E',5],[12,'D',5]],
    chordSteps: [[0,'pad1'],[4,'pad4'],[8,'pad0']]
  },
  'Festival Progressive': {
    title: 'Zedd - Clarity',
    bpm: 128,
    description: '제드의 감성 일렉트로 아카펠라 빌드업. 가슴 먹먹하고 시원하게 폭발하는 메인 보컬 톱 리프.',
    bassSettings: { oscType: 'sawtooth', subOsc: true, filterCutoff: 400, distortion: 0.2, glide: 0.05 },
    bassSteps: [[0,'C',2],[4,'D',2],[8,'E',2],[12,'C',2]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 4, detune: 30, filterCutoff: 3000, delaySend: 0.45, reverbSend: 0.4 },
    leadSteps: [[0,'C',4],[2,'E',4],[4,'G',4],[6,'C',5],[8,'B',4],[10,'G',4],[12,'E',4]],
    chordSteps: [[0,'pad1'],[4,'pad2'],[8,'pad4']]
  },
  'Chill Step': {
    title: 'Alan Walker - Faded',
    bpm: 90,
    description: '앨런 워커 비애감 가득한 북유럽 멜랑콜리. 서서히 감성을 촉촉히 적시는 시그니처 로파이 피아노 후크.',
    bassSettings: { oscType: 'sine', subOsc: true, filterCutoff: 180, distortion: 0.1, glide: 0.15 },
    bassSteps: [[0,'D#',1],[4,'B',1],[8,'F#',1],[12,'C#',1]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 3, detune: 25, filterCutoff: 2200, delaySend: 0.5, reverbSend: 0.45 },
    leadSteps: [[0,'D#',4],[4,'B',4],[8,'F#',4],[12,'C#',4]],
    chordSteps: [[0,'pad4'],[8,'pad1']]
  },
  'Emotional UK House': {
    title: 'Fred again.. - Delilah (pull me out of this)',
    bpm: 134,
    description: '글로벌 EDM 아이콘 픠레드 어게인 신보. 가슴을 에어싸는 고해성사 보컬 리코딩 루프와 테크 하우스 드랍.',
    bassSettings: { oscType: 'sawtooth', subOsc: true, filterCutoff: 300, distortion: 0.25, glide: 0.08 },
    bassSteps: [[0,'A',1],[4,'C',2],[8,'F',1],[12,'G',1]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 3, detune: 30, filterCutoff: 2200, delaySend: 0.45, reverbSend: 0.4 },
    leadSteps: [[0,'A',4],[4,'B',4],[8,'C',5],[12,'B',4],[16,'A',4],[20,'E',4]],
    chordSteps: [[0,'pad4'],[8,'pad5']]
  },
  'Italo Dance': {
    title: 'Gigi D\'Agostino - L\'Amour Toujours',
    bpm: 130,
    description: '세대의 경계를 넘어선 에픽 이탈로 라이트 하우스. 고전 게임 아케이드 풍의 영롱하고 슬픈 멜로디.',
    bassSettings: { oscType: 'sawtooth', subOsc: true, filterCutoff: 380, distortion: 0.15, glide: 0.05 },
    bassSteps: [[0,'A',2],[4,'F',2],[8,'C',3],[12,'G',2]],
    leadSettings: { oscType: 'square', unisonVoices: 3, detune: 25, filterCutoff: 2100, delaySend: 0.4, reverbSend: 0.35 },
    leadSteps: [[0,'A',4],[2,'B',4],[4,'C',5],[6,'B',4],[8,'C',5],[10,'B',4],[12,'G',4]],
    chordSteps: [[0,'pad4'],[4,'pad1'],[8,'pad0']]
  },
  'Dancefloor DnB': {
    title: 'Sub Focus - Desire',
    bpm: 174,
    description: '서브포커스의 메인스트림 초고속 댄스플로어 드럼앤베이스. 숨 가쁘게 뒤쫓는 시그니처 멜로딕 사운드스케이프.',
    bassSettings: { oscType: 'sine', subOsc: true, filterCutoff: 180, distortion: 0.3, glide: 0.1 },
    bassSteps: [[0,'A',1],[4,'A',1],[8,'F',1],[12,'G',1]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 4, detune: 35, filterCutoff: 2800, delaySend: 0.45, reverbSend: 0.45 },
    leadSteps: [[0,'A',4],[4,'B',4],[8,'C',5],[12,'D',5]],
    chordSteps: [[0,'pad4']]
  },
  'Peak Techno': {
    title: 'Amelie Lens - Basiel',
    bpm: 135,
    description: '세계 최고의 테크노 페스티벌 피크 타임. 발바닥을 폭격하는 디스토션 아날로그 머신 비트 리듬.',
    bassSettings: { oscType: 'sine', subOsc: true, filterCutoff: 160, distortion: 0.45, glide: 0.0 },
    bassSteps: [[1,'C',1],[2,'C',1],[3,'C',1],[5,'C',1],[6,'C',1],[7,'C',1],[9,'C',1],[10,'C',1],[11,'C',1],[13,'C',1],[14,'C',1],[15,'C',1]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 1, detune: 0, filterCutoff: 900, delaySend: 0.4, reverbSend: 0.5 },
    leadSteps: [[0,'C',4],[4,'C#',4],[8,'D#',4],[12,'C',4]],
    chordSteps: []
  },
  'Hardstyle Anthem': {
    title: 'Ran-D - Zombie',
    bpm: 150,
    description: '록밴드 크랜베리스 명곡을 엄청난 규모의 디스토션 킥과 초강렬 하드스타일 합창 세션으로 리메이크.',
    bassSettings: { oscType: 'sawtooth', filterCutoff: 480, filterResonance: 3.5, distortion: 0.85, glide: 0.08 },
    bassSteps: [[0,'E',2],[4,'C',2],[8,'G',2],[12,'D',2]],
    leadSettings: { oscType: 'sawtooth', unisonVoices: 5, detune: 50, filterCutoff: 3800, delaySend: 0.5, reverbSend: 0.5 },
    leadSteps: [[0,'E',4],[2,'G',4],[4,'F#',4],[6,'E',4],[8,'D',4]],
    chordSteps: [[0,'pad4'],[4,'pad1']]
  }
};
