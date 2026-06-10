export type GamePhase = 'menu' | 'loading' | 'playing' | 'paused' | 'results' | 'midi-setup' | 'settings' | 'calibration' | 'freeplay'

export type DrumId = 'kick' | 'snare' | 'hihat' | 'crash' | 'floor-tom' | 'rack-tom-1' | 'rack-tom-2'

export type ActiveDrumId = 'kick' | 'snare' | 'hihat' | 'crash'

export type Limb = 'leftHand' | 'rightHand' | 'leftFoot' | 'rightFoot'

export type HitRating = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS'

export interface LimbAction {
  startTime: number
  duration: number
  peakAngle: number
}

export interface NoteEvent {
  id: string
  drumId: ActiveDrumId
  timeMs: number
  lane: number
  velocity: number
  hit: boolean
  rating: HitRating | null
  scheduled: boolean
}

export interface PatternNote {
  beat: number
  /** Fraction of a beat after `beat`: 0, 0.25, 0.5, 0.75 for 16ths; 1/3, 2/3 for triplets/shuffle. */
  offset?: number
  drumId: ActiveDrumId
  /** 0–1. Ghost notes ~0.35, accents 1. Defaults to 1. */
  velocity?: number
}

export interface LessonDef {
  id: string
  title: string
  description: string
  /** Short coaching tip shown before playing — written for drummers. */
  tip?: string
  bpm: number
  beatsPerBar: number
  bars: number
  difficulty: 'Beginner' | 'Basic' | 'Intermediate' | 'Advanced'
  patterns: PatternNote[]
}

export interface LessonResult {
  stars: number
  score: number
  accuracy: number
}

export interface HitEffect {
  id: number
  lane: number
  rating: HitRating
}

export interface HudSnapshot {
  score: number
  combo: number
  maxCombo: number
  accuracy: number
  lastRating: HitRating | null
  bpm: number
  songTimeMs: number
}
