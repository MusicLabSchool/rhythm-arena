import type { ActiveDrumId, HitRating, LessonDef, NoteEvent } from '@/types'
import { audioEngine } from '@/game/audio/NativeAudioEngine'
import { useGameStore } from '@/store/gameStore'
import { DRUM_LIMB_MAP, getLimbActionForDrum, registerDrumHit } from '@/game/animation/LimbAnimator'
import { LANE_INDICES } from '@/game/lessons/lessons'

const HIT_WINDOWS: [number, HitRating][] = [
  [50, 'PERFECT'],
  [100, 'GREAT'],
  [150, 'GOOD'],
]
const MISS_WINDOW_MS = 160

function buildNotes(lesson: LessonDef, bpm: number): NoteEvent[] {
  const beatMs = 60_000 / bpm
  const notes: NoteEvent[] = []
  let idx = 0

  for (let bar = 0; bar < lesson.bars; bar++) {
    for (const p of lesson.patterns) {
      const barOffsetMs = bar * lesson.beatsPerBar * beatMs
      const timeMs = barOffsetMs + (p.beat + (p.offset ?? 0)) * beatMs

      notes.push({
        id: `${bar}-${p.beat}-${p.offset ?? 0}-${p.drumId}-${idx++}`,
        drumId: p.drumId,
        timeMs,
        lane: LANE_INDICES[p.drumId] ?? 0,
        velocity: p.velocity ?? 1,
        hit: false,
        rating: null,
        scheduled: false,
      })
    }
  }

  notes.sort((a, b) => a.timeMs - b.timeMs)
  return notes
}

export class GameRuntime {
  private notes: NoteEvent[] = []
  private running = false
  private rafId: number | null = null
  private songStartTime = 0
  private pausedAt = 0
  private lastMetronomeBeat = -999
  private metronomeEnabled = true
  private countInMs = 0
  private beatMs = 600
  private beatsPerBar = 4

  start(lesson: LessonDef): void {
    this.stop()
    const store = useGameStore.getState()
    store.resetScore()
    store.setNotes([])

    const effBpm = Math.round(lesson.bpm * store.speedMultiplier)
    store.setBpm(effBpm)

    this.beatMs = 60_000 / effBpm
    this.beatsPerBar = lesson.beatsPerBar
    this.countInMs = this.beatsPerBar * this.beatMs

    this.notes = buildNotes(lesson, effBpm)
    store.setNotes(this.notes)
    store.setCountIn({ beats: this.beatsPerBar, beatMs: this.beatMs })
    this.metronomeEnabled = store.isMetronomeOn

    // Song time starts negative: one full bar of count-in before beat 1.
    this.songStartTime = performance.now() + this.countInMs
    this.running = true
    this.lastMetronomeBeat = -999
    this.loop()
  }

  stop(): void {
    this.running = false
    this.pausedAt = 0
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    useGameStore.getState().setCountIn(null)
  }

  pause(): void {
    if (!this.running) return
    this.running = false
    this.pausedAt = performance.now()
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  resume(): void {
    if (this.pausedAt === 0) return
    // Shift the song clock forward by however long we were paused.
    this.songStartTime += performance.now() - this.pausedAt
    this.pausedAt = 0
    this.running = true
    this.loop()
  }

  onDrumHit(drumId: ActiveDrumId, velocity = 1): void {
    audioEngine.playDrum(drumId, velocity)
    registerDrumHit(drumId)
    this.animateLimbs(drumId)

    if (!this.running) return

    const store = useGameStore.getState()
    const songTimeMs = performance.now() - this.songStartTime - store.latencyOffsetMs

    // Free hits during count-in are not penalised.
    if (songTimeMs < -MISS_WINDOW_MS) return

    const candidate = this.notes
      .filter((n) => !n.hit && n.drumId === drumId)
      .map((n) => ({ n, delta: songTimeMs - n.timeMs }))
      .filter(({ delta }) => Math.abs(delta) <= MISS_WINDOW_MS)
      .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))[0]

    if (!candidate) {
      store.addMiss()
      store.triggerHitEffect(LANE_INDICES[drumId] ?? 0, 'MISS')
      return
    }

    const { n, delta } = candidate
    n.hit = true

    let rating: HitRating = 'GOOD'
    for (const [window, r] of HIT_WINDOWS) {
      if (Math.abs(delta) <= window) { rating = r; break }
    }

    n.rating = rating
    store.addHit(rating, delta)
    store.triggerHitEffect(n.lane, rating)
  }

  private animateLimbs(drumId: ActiveDrumId): void {
    const store = useGameStore.getState()
    const limbs = DRUM_LIMB_MAP[drumId]
    for (const limb of limbs) {
      store.triggerLimb(limb, getLimbActionForDrum(drumId, limb))
    }
  }

  private loop = (): void => {
    if (!this.running) return

    const songTimeMs = performance.now() - this.songStartTime
    const store = useGameStore.getState()
    store.setSongTimeMs(songTimeMs)

    // Clear count-in state once the song proper begins.
    if (songTimeMs >= 0 && store.countIn) store.setCountIn(null)

    this.tickMetronome(songTimeMs)
    this.expireMissedNotes(songTimeMs)

    const totalDuration = this.notes.length > 0
      ? this.notes[this.notes.length - 1].timeMs + 1500
      : 0

    if (songTimeMs >= totalDuration && totalDuration > 0) {
      this.running = false
      store.setPhase('results')
      return
    }

    this.rafId = requestAnimationFrame(this.loop)
  }

  private tickMetronome(songTimeMs: number): void {
    const store = useGameStore.getState()
    const inCountIn = songTimeMs < 0
    // The count-in bar always clicks, even with the metronome off —
    // there is no other way to find beat 1.
    if (!inCountIn && (!this.metronomeEnabled || !store.isMetronomeOn)) return

    const currentBeat = Math.floor((songTimeMs + this.countInMs) / this.beatMs)
    if (currentBeat !== this.lastMetronomeBeat && currentBeat >= 0) {
      this.lastMetronomeBeat = currentBeat
      const isDownbeat = currentBeat % this.beatsPerBar === 0
      audioEngine.playMetronomeClick(isDownbeat)
    }
  }

  private expireMissedNotes(songTimeMs: number): void {
    const store = useGameStore.getState()
    for (const n of this.notes) {
      if (!n.hit && songTimeMs > n.timeMs + MISS_WINDOW_MS) {
        n.hit = true
        n.rating = 'MISS'
        store.addMiss()
        store.triggerHitEffect(n.lane, 'MISS')
      }
    }
  }
}

export const gameRuntime = new GameRuntime()
