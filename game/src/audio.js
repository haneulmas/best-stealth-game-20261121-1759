// The Starling Archive: every sound is synthesized with WebAudio.
// No audio files, no network: footsteps, chimes, alarm stings and the
// low archive drone are all oscillators and noise shaped in code.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.drone = null;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol || 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise(dur, vol, lowpass) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 900;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol || 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t);
  }

  footstep(sneaking) {
    this.noise(0.07, sneaking ? 0.03 : 0.09, sneaking ? 400 : 700);
  }

  pebble() { this.noise(0.12, 0.2, 2400); this.tone(1400, 0.08, 'triangle', 0.08, 900); }

  smoke() { this.noise(0.5, 0.18, 500); }

  pickup() {
    this.tone(660, 0.12, 'sine', 0.22);
    setTimeout(() => this.tone(990, 0.18, 'sine', 0.22), 90);
  }

  spotted() {
    this.tone(220, 0.35, 'sawtooth', 0.16, 440);
    this.tone(110, 0.4, 'square', 0.08, 220);
  }

  alarm() {
    this.tone(520, 0.22, 'square', 0.1, 780);
    setTimeout(() => this.tone(780, 0.22, 'square', 0.1, 520), 240);
  }

  caught() {
    this.tone(330, 0.5, 'sawtooth', 0.18, 82);
    this.noise(0.4, 0.2, 500);
  }

  levelClear() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'triangle', 0.2), i * 110));
  }

  victory() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.tone(f, 0.4, 'triangle', 0.2), i * 130));
  }

  click() { this.tone(880, 0.06, 'triangle', 0.12); }

  startDrone() {
    if (!this.ctx || this.drone) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 55;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.035;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    lfo.start();
    this.drone = { osc, lfo };
  }
}
