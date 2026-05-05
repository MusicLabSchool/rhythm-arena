export class NativeAudioEngine {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)({
      latencyHint: 'interactive',
    });

    this.masterBus = this.ctx.createGain();
    this.drumBus = this.ctx.createGain();
    this.backingBus = this.ctx.createGain();
    this.metronomeBus = this.ctx.createGain();
    this.uiBus = this.ctx.createGain();

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -12;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 3;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.12;

    this.drumBus.connect(this.masterBus);
    this.backingBus.connect(this.masterBus);
    this.metronomeBus.connect(this.masterBus);
    this.uiBus.connect(this.masterBus);
    this.masterBus.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);

    this.drumBus.gain.value = 0.8;
    this.backingBus.gain.value = 0.6;
    this.metronomeBus.gain.value = 0.25;
    this.uiBus.gain.value = 0.45;
  }

  async unlock() {
    if (this.ctx.state !== 'running') await this.ctx.resume();
  }

  playDrum(type, velocity = 1) {
    const t = this.ctx.currentTime;
    const amp = Math.max(0.05, Math.min(velocity, 1));

    if (type === 'kick') {
      this.playKick(t, amp);
      return;
    }

    if (type === 'snare') {
      this.playSnare(t, amp);
      return;
    }

    if (type === 'hihat') {
      this.playHiHat(t, amp);
      return;
    }

    this.playCrash(t, amp);
  }

  playKick(t, amp) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(132, t);
    osc.frequency.exponentialRampToValueAtTime(44, t + 0.14);

    gain.gain.setValueAtTime(0.95 * amp, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.drumBus);
    osc.start(t);
    osc.stop(t + 0.17);
  }

  playSnare(t, amp) {
    const noise = this.ctx.createBufferSource();
    const buffer = this.ctx.createBuffer(1, 22050, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    noise.buffer = buffer;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1700;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65 * amp, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    noise.connect(hp);
    hp.connect(gain);
    gain.connect(this.drumBus);

    noise.start(t);
    noise.stop(t + 0.12);
  }

  playHiHat(t, amp) {
    const noise = this.ctx.createBufferSource();
    const buffer = this.ctx.createBuffer(1, 12000, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    noise.buffer = buffer;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.42 * amp, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    noise.connect(hp);
    hp.connect(gain);
    gain.connect(this.drumBus);

    noise.start(t);
    noise.stop(t + 0.07);
  }

  playCrash(t, amp) {
    const noise = this.ctx.createBufferSource();
    const buffer = this.ctx.createBuffer(1, 44100, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    noise.buffer = buffer;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.48 * amp, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

    noise.connect(hp);
    hp.connect(gain);
    gain.connect(this.drumBus);

    noise.start(t);
    noise.stop(t + 0.43);
  }

  setDrumVolume(value) {
    this.drumBus.gain.setTargetAtTime(value, this.ctx.currentTime, 0.01);
  }

  setBackingVolume(value) {
    this.backingBus.gain.setTargetAtTime(value, this.ctx.currentTime, 0.01);
  }

  setMetronomeVolume(value) {
    this.metronomeBus.gain.setTargetAtTime(value, this.ctx.currentTime, 0.01);
  }

  setUiVolume(value) {
    this.uiBus.gain.setTargetAtTime(value, this.ctx.currentTime, 0.01);
  }

  getState() {
    return {
      state: this.ctx.state,
      sampleRate: this.ctx.sampleRate,
      baseLatency: this.ctx.baseLatency,
    };
  }
}

export const audioEngine = new NativeAudioEngine();
