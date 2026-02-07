export class SoundManager {
  private ctx: AudioContext | null = null;
  private _enabled = true;
  private windOsc: OscillatorNode | null = null;
  private windGain: GainNode | null = null;
  private umbrellaOsc: OscillatorNode | null = null;
  private umbrellaGain: GainNode | null = null;

  get enabled() { return this._enabled; }
  set enabled(v: boolean) {
    this._enabled = v;
    if (!v) this.stopUmbrella();
  }

  private init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
  }

  private ensure() {
    if (!this._enabled) return false;
    if (this.ctx && this.ctx.state === 'closed') this.ctx = null;
    this.init();
    if (this.ctx!.state === 'suspended') this.ctx!.resume().catch(() => {});
    return true;
  }

  private chime(freq: number, dur: number, vol: number, delay = 0) {
    if (!this.ensure()) return;
    const c = this.ctx!;
    const t = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.85, t + dur);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  private shimmer(baseFreq: number, count: number, dur: number, vol: number) {
    for (let i = 0; i < count; i++) {
      const ratio = [1, 1.2, 1.5, 1.8, 2, 2.4, 3][i % 7];
      this.chime(baseFreq * ratio, dur, vol * (1 - i * 0.12), i * 0.06);
    }
  }

  playBounce() {
    if (!this.ensure()) return;
    const base = 600 + Math.random() * 200;
    this.chime(base, 0.25, 0.08);
    this.chime(base * 1.5, 0.2, 0.05, 0.05);
    this.chime(base * 2, 0.15, 0.03, 0.08);

    const c = this.ctx!;
    const t = c.currentTime;
    const bufSize = c.sampleRate * 0.1;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.02;
    const noise = c.createBufferSource();
    noise.buffer = buf;
    const nGain = c.createGain();
    nGain.gain.setValueAtTime(0.06, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    const filt = c.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 2000;
    filt.Q.value = 2;
    noise.connect(filt);
    filt.connect(nGain);
    nGain.connect(c.destination);
    noise.start(t);
    noise.stop(t + 0.1);
  }

  playCollect(combo: number) {
    if (!this.ensure()) return;
    const base = 800 + combo * 80;
    this.shimmer(base, 5, 0.4, 0.07);
    this.chime(base * 2.5, 0.5, 0.04, 0.15);
  }

  private umbrellaLfo: OscillatorNode | null = null;

  startUmbrella() {
    if (!this.ensure()) return;
    if (this.umbrellaOsc) return;
    const c = this.ctx!;
    this.umbrellaOsc = c.createOscillator();
    this.umbrellaGain = c.createGain();
    this.umbrellaOsc.type = 'sine';
    this.umbrellaOsc.frequency.value = 280;
    this.umbrellaGain.gain.setValueAtTime(0, c.currentTime);
    this.umbrellaGain.gain.linearRampToValueAtTime(0.03, c.currentTime + 0.3);

    this.umbrellaLfo = c.createOscillator();
    const lfoGain = c.createGain();
    this.umbrellaLfo.type = 'sine';
    this.umbrellaLfo.frequency.value = 3;
    lfoGain.gain.value = 8;
    this.umbrellaLfo.connect(lfoGain);
    lfoGain.connect(this.umbrellaOsc.frequency);
    this.umbrellaLfo.start();

    this.umbrellaOsc.connect(this.umbrellaGain);
    this.umbrellaGain.connect(c.destination);
    this.umbrellaOsc.start();
  }

  stopUmbrella() {
    if (!this.umbrellaOsc) return;
    try {
      if (this.umbrellaGain && this.ctx && this.ctx.state !== 'closed') {
        this.umbrellaGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.umbrellaGain.gain.setValueAtTime(this.umbrellaGain.gain.value, this.ctx.currentTime);
        this.umbrellaGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.15);
      }
    } catch {}
    const osc = this.umbrellaOsc;
    const lfo = this.umbrellaLfo;
    this.umbrellaOsc = null;
    this.umbrellaGain = null;
    this.umbrellaLfo = null;
    setTimeout(() => {
      try { osc.disconnect(); osc.stop(); } catch {}
      try { if (lfo) { lfo.disconnect(); lfo.stop(); } } catch {}
    }, 200);
  }

  playSink() {
    if (!this.ensure()) return;
    const c = this.ctx!;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.6);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.6);

    this.chime(200, 0.4, 0.03, 0.1);
    this.chime(160, 0.5, 0.02, 0.25);
  }

  playWindChime() {
    if (!this.ensure()) return;
    const notes = [523, 587, 659, 784, 880, 1047];
    const note = notes[Math.floor(Math.random() * notes.length)];
    this.chime(note, 1.2, 0.025);
    if (Math.random() > 0.5) {
      const h = notes[Math.floor(Math.random() * notes.length)];
      this.chime(h, 0.8, 0.015, 0.2);
    }
  }

  private gustOsc: OscillatorNode | null = null;
  private gustGain: GainNode | null = null;
  private gustLfo: OscillatorNode | null = null;
  private gustNoiseSource: AudioBufferSourceNode | null = null;
  private gustNoiseGain: GainNode | null = null;

  startWindGust(intensity: number) {
    if (!this.ensure()) return;
    if (this.gustOsc) return;
    const c = this.ctx!;
    const t = c.currentTime;

    this.gustOsc = c.createOscillator();
    this.gustGain = c.createGain();
    this.gustOsc.type = 'sine';
    this.gustOsc.frequency.setValueAtTime(80 + intensity * 40, t);
    this.gustGain.gain.setValueAtTime(0, t);
    this.gustGain.gain.linearRampToValueAtTime(0.015 + intensity * 0.01, t + 0.5);
    this.gustLfo = c.createOscillator();
    const lfoG = c.createGain();
    this.gustLfo.type = 'sine';
    this.gustLfo.frequency.value = 2 + intensity * 3;
    lfoG.gain.value = 15 + intensity * 10;
    this.gustLfo.connect(lfoG);
    lfoG.connect(this.gustOsc.frequency);
    this.gustLfo.start(t);
    this.gustOsc.connect(this.gustGain);
    this.gustGain.connect(c.destination);
    this.gustOsc.start(t);

    const bufSize = c.sampleRate * 2;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
    this.gustNoiseSource = c.createBufferSource();
    this.gustNoiseSource.buffer = buf;
    this.gustNoiseSource.loop = true;
    this.gustNoiseGain = c.createGain();
    this.gustNoiseGain.gain.setValueAtTime(0, t);
    this.gustNoiseGain.gain.linearRampToValueAtTime(0.02 + intensity * 0.015, t + 0.5);
    const filt = c.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 400 + intensity * 200;
    filt.Q.value = 0.5;
    this.gustNoiseSource.connect(filt);
    filt.connect(this.gustNoiseGain);
    this.gustNoiseGain.connect(c.destination);
    this.gustNoiseSource.start(t);
  }

  updateWindGustVolume(proximity: number, intensity: number) {
    if (!this.gustGain || !this.gustNoiseGain || !this.ctx || this.ctx.state === 'closed') return;
    const t = this.ctx.currentTime;
    const vol = proximity * (0.015 + intensity * 0.01);
    const noiseVol = proximity * (0.02 + intensity * 0.015);
    this.gustGain.gain.setTargetAtTime(vol, t, 0.05);
    this.gustNoiseGain.gain.setTargetAtTime(noiseVol, t, 0.05);
  }

  stopWindGust() {
    if (!this.gustOsc) return;
    try {
      if (this.gustGain && this.ctx && this.ctx.state !== 'closed') {
        this.gustGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.gustGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
      if (this.gustNoiseGain && this.ctx && this.ctx.state !== 'closed') {
        this.gustNoiseGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.gustNoiseGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
    } catch {}
    const osc = this.gustOsc;
    const lfo = this.gustLfo;
    const noise = this.gustNoiseSource;
    this.gustOsc = null;
    this.gustGain = null;
    this.gustLfo = null;
    this.gustNoiseSource = null;
    this.gustNoiseGain = null;
    setTimeout(() => {
      try { if (lfo) { lfo.disconnect(); lfo.stop(); } } catch {}
      try { osc.disconnect(); osc.stop(); } catch {}
      try { if (noise) { noise.disconnect(); noise.stop(); } } catch {}
    }, 300);
  }

  destroy() {
    this.stopUmbrella();
    this.stopWindGust();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
  }
}
