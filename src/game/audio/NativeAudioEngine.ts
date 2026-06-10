import type { ActiveDrumId } from '@/types'
import { ProceduralDrumSynth } from './ProceduralDrumSynth'

class NativeAudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private drumsGain: GainNode | null = null
  private metronomeGain: GainNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private synth: ProceduralDrumSynth | null = null
  private initialized = false

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext({ latencyHint: 'interactive' })
      this.buildGraph()
    }
    return this.ctx
  }

  private buildGraph(): void {
    const ctx = this.ctx!
    this.masterGain = ctx.createGain()
    this.drumsGain = ctx.createGain()
    this.metronomeGain = ctx.createGain()
    this.compressor = ctx.createDynamicsCompressor()
    this.compressor.threshold.value = -12
    this.compressor.knee.value = 18
    this.compressor.ratio.value = 3
    this.compressor.attack.value = 0.003
    this.compressor.release.value = 0.12

    this.drumsGain.connect(this.masterGain)
    this.metronomeGain.connect(this.masterGain)
    this.masterGain.connect(this.compressor)
    this.compressor.connect(ctx.destination)

    this.synth = new ProceduralDrumSynth(ctx, this.drumsGain)
    this.initialized = true
  }

  async unlock(): Promise<void> {
    const ctx = this.ensureContext()
    if (ctx.state !== 'running') {
      await ctx.resume()
    }
  }

  playDrum(drum: ActiveDrumId, velocity = 1): void {
    if (!this.initialized) this.ensureContext()
    this.synth?.play(drum, velocity)
  }

  playMetronomeClick(isDownbeat = false): void {
    const ctx = this.ensureContext()
    if (!this.metronomeGain) return
    const t = ctx.currentTime
    const freq = isDownbeat ? 1200 : 900
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.3, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025)
    osc.connect(gain)
    gain.connect(this.metronomeGain)
    osc.start(t)
    osc.stop(t + 0.03)
    osc.onended = () => { osc.disconnect(); gain.disconnect() }
  }

  setDrumsVolume(v: number): void {
    if (this.drumsGain && this.ctx) {
      this.drumsGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01)
    }
  }

  setMasterVolume(v: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01)
    }
  }

  setMetronomeVolume(v: number): void {
    if (this.metronomeGain && this.ctx) {
      this.metronomeGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01)
    }
  }

  get currentTime(): number {
    return this.ctx?.currentTime ?? 0
  }

  get state(): AudioContextState {
    return this.ctx?.state ?? 'suspended'
  }
}

export const audioEngine = new NativeAudioEngine()
