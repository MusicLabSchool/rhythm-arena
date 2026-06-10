import type { ActiveDrumId } from '@/types'

/**
 * Velocity-sensitive procedural drum synthesis.
 * Every hit spawns fresh nodes — fully polyphonic, nothing is ever cut off.
 */
export class ProceduralDrumSynth {
  private noiseBuffer: AudioBuffer

  constructor(private ctx: AudioContext, private outputNode: AudioNode) {
    // One shared 2s noise buffer; each hit plays a slice via a new source node.
    const len = ctx.sampleRate * 2
    this.noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = this.noiseBuffer.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  }

  play(drum: ActiveDrumId, velocity = 1): void {
    const t = this.ctx.currentTime
    const v = Math.max(0.05, Math.min(velocity, 1))
    switch (drum) {
      case 'kick': return this.kick(t, v)
      case 'snare': return this.snare(t, v)
      case 'hihat': return this.hihat(t, v)
      case 'crash': return this.crash(t, v)
    }
  }

  private noiseSource(): AudioBufferSourceNode {
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    // Random start point so rapid hits don't phase-cancel identically.
    src.loopStart = 0
    return src
  }

  private env(gain: GainNode, t: number, peak: number, decay: number, attack = 0.001): void {
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.linearRampToValueAtTime(peak, t + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  }

  private kick(t: number, v: number): void {
    const out = this.outputNode

    // Body: pitched sine drop, 120 → 48 Hz.
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(118 + v * 30, t)
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.09)
    this.env(gain, t, v * 1.0, 0.42)
    osc.connect(gain).connect(out)
    osc.start(t); osc.stop(t + 0.5)

    // Sub layer for weight.
    const sub = this.ctx.createOscillator()
    const subGain = this.ctx.createGain()
    sub.type = 'sine'
    sub.frequency.setValueAtTime(60, t)
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.16)
    this.env(subGain, t, v * 0.55, 0.5)
    sub.connect(subGain).connect(out)
    sub.start(t); sub.stop(t + 0.6)

    // Beater click: short burst of high-passed noise. Harder hits click more.
    const click = this.noiseSource()
    const clickHpf = this.ctx.createBiquadFilter()
    clickHpf.type = 'highpass'
    clickHpf.frequency.value = 1500
    const clickGain = this.ctx.createGain()
    this.env(clickGain, t, v * v * 0.5, 0.012)
    click.connect(clickHpf).connect(clickGain).connect(out)
    click.start(t, Math.random()); click.stop(t + 0.03)

    osc.onended = () => { osc.disconnect(); gain.disconnect() }
    sub.onended = () => { sub.disconnect(); subGain.disconnect() }
    click.onended = () => { click.disconnect(); clickHpf.disconnect(); clickGain.disconnect() }
  }

  private snare(t: number, v: number): void {
    const out = this.outputNode
    const ghost = v < 0.5 // ghost notes are darker and shorter

    // Snap: bright band of noise — this is the wires.
    const snap = this.noiseSource()
    const snapBpf = this.ctx.createBiquadFilter()
    snapBpf.type = 'bandpass'
    snapBpf.frequency.value = ghost ? 1400 : 1900 + v * 800
    snapBpf.Q.value = 0.9
    const snapGain = this.ctx.createGain()
    this.env(snapGain, t, v * 0.85, ghost ? 0.08 : 0.16)
    snap.connect(snapBpf).connect(snapGain).connect(out)
    snap.start(t, Math.random()); snap.stop(t + 0.25)

    // Sizzle: high-passed noise tail.
    const sizzle = this.noiseSource()
    const sizzleHpf = this.ctx.createBiquadFilter()
    sizzleHpf.type = 'highpass'
    sizzleHpf.frequency.value = 5500
    const sizzleGain = this.ctx.createGain()
    this.env(sizzleGain, t, v * 0.4, ghost ? 0.06 : 0.13)
    sizzle.connect(sizzleHpf).connect(sizzleGain).connect(out)
    sizzle.start(t, Math.random()); sizzle.stop(t + 0.2)

    // Shell modes: two detuned drum-head resonances.
    for (const [freq, level, decay] of [[186, 0.5, 0.1], [330, 0.25, 0.06]] as const) {
      const mode = this.ctx.createOscillator()
      const modeGain = this.ctx.createGain()
      mode.type = 'triangle'
      mode.frequency.setValueAtTime(freq * (1 + v * 0.04), t)
      mode.frequency.exponentialRampToValueAtTime(freq * 0.92, t + decay)
      this.env(modeGain, t, v * level, decay)
      mode.connect(modeGain).connect(out)
      mode.start(t); mode.stop(t + decay + 0.05)
      mode.onended = () => { mode.disconnect(); modeGain.disconnect() }
    }

    snap.onended = () => { snap.disconnect(); snapBpf.disconnect(); snapGain.disconnect() }
    sizzle.onended = () => { sizzle.disconnect(); sizzleHpf.disconnect(); sizzleGain.disconnect() }
  }

  private hihat(t: number, v: number): void {
    const out = this.outputNode

    // Classic 808-style metallic stack: six square oscillators at
    // inharmonic ratios, through bandpass + highpass.
    const fundamental = 40
    const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21]

    const bpf = this.ctx.createBiquadFilter()
    bpf.type = 'bandpass'
    bpf.frequency.value = 10_000
    bpf.Q.value = 0.8

    const hpf = this.ctx.createBiquadFilter()
    hpf.type = 'highpass'
    hpf.frequency.value = 7000

    const gain = this.ctx.createGain()
    this.env(gain, t, v * 0.32, 0.045 + v * 0.02)

    bpf.connect(hpf).connect(gain).connect(out)

    const oscs = ratios.map((r) => {
      const o = this.ctx.createOscillator()
      o.type = 'square'
      o.frequency.value = fundamental * r * 25
      o.connect(bpf)
      o.start(t); o.stop(t + 0.12)
      return o
    })

    // A touch of noise blends the metal into a believable stick attack.
    const noise = this.noiseSource()
    const noiseGain = this.ctx.createGain()
    this.env(noiseGain, t, v * 0.12, 0.03)
    noise.connect(noiseGain).connect(hpf)
    noise.start(t, Math.random()); noise.stop(t + 0.08)

    oscs[0].onended = () => {
      oscs.forEach((o) => o.disconnect())
      bpf.disconnect(); hpf.disconnect(); gain.disconnect()
    }
    noise.onended = () => { noise.disconnect(); noiseGain.disconnect() }
  }

  private crash(t: number, v: number): void {
    const out = this.outputNode

    // Wash: long bright noise with a falling filter sweep.
    const wash = this.noiseSource()
    const washHpf = this.ctx.createBiquadFilter()
    washHpf.type = 'highpass'
    washHpf.frequency.setValueAtTime(6500, t)
    washHpf.frequency.exponentialRampToValueAtTime(2800, t + 1.4)
    const washGain = this.ctx.createGain()
    this.env(washGain, t, v * 0.5, 1.8, 0.002)
    wash.connect(washHpf).connect(washGain).connect(out)
    wash.start(t, Math.random() * 0.3); wash.stop(t + 2)

    // Shimmer: inharmonic square partials ringing underneath.
    const shimmerGain = this.ctx.createGain()
    this.env(shimmerGain, t, v * 0.07, 1.2, 0.002)
    const shimmerHpf = this.ctx.createBiquadFilter()
    shimmerHpf.type = 'highpass'
    shimmerHpf.frequency.value = 5000
    shimmerHpf.connect(shimmerGain).connect(out)

    const partials = [3211, 4781, 6437, 8190].map((f) => {
      const o = this.ctx.createOscillator()
      o.type = 'square'
      o.frequency.value = f * (0.98 + Math.random() * 0.04)
      o.connect(shimmerHpf)
      o.start(t); o.stop(t + 1.5)
      return o
    })

    // Attack transient.
    const attack = this.noiseSource()
    const attackBpf = this.ctx.createBiquadFilter()
    attackBpf.type = 'bandpass'
    attackBpf.frequency.value = 9000
    attackBpf.Q.value = 0.5
    const attackGain = this.ctx.createGain()
    this.env(attackGain, t, v * 0.6, 0.05)
    attack.connect(attackBpf).connect(attackGain).connect(out)
    attack.start(t, Math.random()); attack.stop(t + 0.1)

    wash.onended = () => { wash.disconnect(); washHpf.disconnect(); washGain.disconnect() }
    partials[0].onended = () => {
      partials.forEach((o) => o.disconnect())
      shimmerHpf.disconnect(); shimmerGain.disconnect()
    }
    attack.onended = () => { attack.disconnect(); attackBpf.disconnect(); attackGain.disconnect() }
  }
}
