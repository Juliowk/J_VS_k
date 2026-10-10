export class Timer {
  private start = 0;
  private raf = 0;
  private running = false;
  private onTick: (ms: number) => void;
  elapsed = 0;

  constructor(onTick: (ms: number) => void) {
    this.onTick = onTick;
  }

  begin() {
    cancelAnimationFrame(this.raf);
    this.start = performance.now();
    this.elapsed = 0;
    this.running = true;
    this.loop();
  }

  private loop = () => {
    this.elapsed = performance.now() - this.start;
    this.onTick(this.elapsed);
    this.raf = requestAnimationFrame(this.loop);
  };

  /** Soma uma penalidade ao tempo corrente. */
  add(ms: number) {
    this.start -= ms;
  }

  stop() {
    if (this.running) {
      cancelAnimationFrame(this.raf);
      this.elapsed = performance.now() - this.start;
      this.running = false;
      this.onTick(this.elapsed);
    }
    return this.elapsed;
  }

  get isRunning() {
    return this.running;
  }
}

const pad = (n: number) => String(n).padStart(2, '0');

/** mm:ss.cc */
export const fmt = (ms: number) => {
  const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60, c = Math.floor(ms / 10) % 100;
  return `${pad(m)}:${pad(s)}.${pad(c)}`;
};

/** ss.cc (ou m:ss.cc acima de um minuto) */
export const fmtShort = (ms: number) => {
  const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60, c = Math.floor(ms / 10) % 100;
  return m > 0 ? `${m}:${pad(s)}.${pad(c)}` : `${pad(s)}.${pad(c)}`;
};

/** "48,6 s" */
export const fmtTotal = (ms: number) => `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
