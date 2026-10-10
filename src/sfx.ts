// Efeitos sonoros sintetizados com WebAudio: nenhum arquivo para baixar.

const KEY = 'jvk:muted';

let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;
let muted = (() => {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
})();

export const isMuted = () => muted;

export function setMuted(v: boolean) {
  muted = v;
  try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* sem armazenamento */ }
  if (v) stopSpin();
}

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  slideTo?: number;
  delay?: number;
}

function tone(freq: number, dur: number, { type = 'sine', vol = 0.18, slideTo, delay = 0 }: ToneOpts = {}) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(dur: number, { vol = 0.2, freq = 1200, q = 1, delay = 0, sweepTo }: { vol?: number; freq?: number; q?: number; delay?: number; sweepTo?: number } = {}) {
  const a = ac();
  if (!a) return;
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = a.currentTime + delay;
  const src = a.createBufferSource();
  src.buffer = noiseBuf;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(freq, t);
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  filter.Q.value = q;
  const gain = a.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(a.destination);
  src.start(t);
  src.stop(t + dur + 0.02);
}

let spinTimer = 0;

export function startSpin() {
  stopSpin();
  spinTimer = window.setInterval(() => noise(0.03, { vol: 0.08, freq: 2400, q: 4 }), 70);
}

export function stopSpin() {
  clearInterval(spinTimer);
}

export const sfx = {
  key: () => tone(720, 0.06, { type: 'square', vol: 0.05 }),
  error: () => {
    tone(220, 0.12, { type: 'square', vol: 0.07 });
    tone(165, 0.16, { type: 'square', vol: 0.07, delay: 0.1 });
  },
  slam: () => {
    tone(90, 0.35, { type: 'sine', vol: 0.5, slideTo: 40 });
    noise(0.25, { vol: 0.35, freq: 400, q: 0.7 });
  },
  lever: () => noise(0.3, { vol: 0.2, freq: 300, sweepTo: 1600, q: 2 }),
  clack: () => {
    noise(0.05, { vol: 0.35, freq: 1800, q: 2 });
    tone(140, 0.09, { type: 'square', vol: 0.1 });
  },
  jackpot: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.14, delay: i * 0.08 })),
  count: () => tone(440, 0.16, { type: 'triangle', vol: 0.18 }),
  go: () => tone(660, 0.35, { type: 'triangle', vol: 0.2, slideTo: 1320 }),
  hit: () => {
    tone(784, 0.1, { type: 'triangle', vol: 0.18 });
    tone(1175, 0.22, { type: 'triangle', vol: 0.18, delay: 0.07 });
  },
  miss: () => tone(180, 0.2, { type: 'sawtooth', vol: 0.08, slideTo: 90 }),
  whoosh: () => noise(0.45, { vol: 0.22, freq: 300, sweepTo: 3000, q: 1.5 }),
  win: () => [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i === 6 ? 0.6 : 0.16, { type: 'triangle', vol: 0.16, delay: i * 0.12 })),
  tie: () => [523, 523, 659, 523].forEach((f, i) => tone(f, 0.2, { type: 'triangle', vol: 0.14, delay: i * 0.16 })),
};
