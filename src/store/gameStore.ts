import { create } from 'zustand'
import type { GamePhase, ActiveDrumId, Limb, HitRating, LimbAction, NoteEvent, LessonDef, LessonResult, HitEffect } from '@/types'

const DEFAULT_MIDI_MAPPING: Record<number, ActiveDrumId> = {
  36: 'kick',
  38: 'snare',
  40: 'snare',
  42: 'hihat',
  44: 'hihat',
  46: 'hihat',
  49: 'crash',
  57: 'crash',
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveJSON(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

interface GameState {
  phase: GamePhase
  setPhase: (p: GamePhase) => void

  selectedLesson: LessonDef | null
  selectLesson: (l: LessonDef) => void

  bpm: number
  setBpm: (b: number) => void
  songTimeMs: number
  setSongTimeMs: (t: number) => void

  /** Practice speed: 0.5–1.0 multiplier on lesson BPM. */
  speedMultiplier: number
  setSpeedMultiplier: (v: number) => void

  /** Input latency compensation in ms. Positive = device input arrives late. */
  latencyOffsetMs: number
  setLatencyOffsetMs: (v: number) => void

  /** Count-in info, set while the pre-roll bar is playing. */
  countIn: { beats: number; beatMs: number } | null
  setCountIn: (c: { beats: number; beatMs: number } | null) => void

  notes: NoteEvent[]
  setNotes: (notes: NoteEvent[]) => void

  score: number
  combo: number
  maxCombo: number
  accuracy: number
  lastRating: HitRating | null
  totalHits: number
  totalNotes: number
  accurateHits: number
  /** Signed ms deltas for every scored (non-miss) hit. Negative = early/rushing. */
  hitDeltas: number[]

  addHit: (rating: HitRating, deltaMs: number) => void
  addMiss: () => void
  resetScore: () => void

  /** Most recent hit-line impact, for spawning visual burst effects. */
  hitEffect: HitEffect | null
  triggerHitEffect: (lane: number, rating: HitRating) => void

  /** Combo milestone currently being celebrated, if any. */
  comboMilestone: { combo: number; nonce: number } | null
  clearComboMilestone: () => void

  /** Best result per lesson id, persisted. */
  bestResults: Record<string, LessonResult>
  saveResult: (lessonId: string, result: LessonResult) => void

  activeLimbActions: Record<Limb, LimbAction | null>
  triggerLimb: (limb: Limb, action: Omit<LimbAction, 'startTime'>) => void

  midiEnabled: boolean
  midiDeviceName: string | null
  midiMapping: Record<number, ActiveDrumId>
  setMidiMapping: (m: Record<number, ActiveDrumId>) => void
  setMidiEnabled: (v: boolean) => void
  setMidiDeviceName: (n: string | null) => void

  masterVolume: number
  drumsVolume: number
  metronomeVolume: number
  setVolume: (bus: 'master' | 'drums' | 'metronome', v: number) => void

  isMobile: boolean
  setIsMobile: (v: boolean) => void

  isMetronomeOn: boolean
  toggleMetronome: () => void
}

function pointsForRating(r: HitRating) {
  switch (r) {
    case 'PERFECT': return 1000
    case 'GREAT': return 750
    case 'GOOD': return 500
    case 'MISS': return 0
  }
}

function comboMultiplier(combo: number) {
  if (combo >= 50) return 4
  if (combo >= 25) return 3
  if (combo >= 10) return 2
  return 1
}

const COMBO_MILESTONES = [10, 25, 50, 100, 200, 300]
let hitEffectId = 0

export const useGameStore = create<GameState>((set) => ({
  phase: 'menu',
  setPhase: (p) => set({ phase: p }),

  selectedLesson: null,
  selectLesson: (l) => set({ selectedLesson: l, bpm: l.bpm }),

  bpm: 90,
  setBpm: (b) => set({ bpm: b }),
  songTimeMs: 0,
  setSongTimeMs: (t) => set({ songTimeMs: t }),

  speedMultiplier: 1,
  setSpeedMultiplier: (v) => set({ speedMultiplier: v }),

  latencyOffsetMs: loadJSON('muso-latency-ms', 0),
  setLatencyOffsetMs: (v) => {
    saveJSON('muso-latency-ms', v)
    set({ latencyOffsetMs: v })
  },

  countIn: null,
  setCountIn: (c) => set({ countIn: c }),

  notes: [],
  setNotes: (notes) => set({ notes }),

  score: 0,
  combo: 0,
  maxCombo: 0,
  accuracy: 100,
  lastRating: null,
  totalHits: 0,
  totalNotes: 0,
  accurateHits: 0,
  hitDeltas: [],

  addHit: (rating, deltaMs) =>
    set((s) => {
      const newCombo = rating === 'MISS' ? 0 : s.combo + 1
      const mult = comboMultiplier(newCombo)
      const pts = pointsForRating(rating) * mult
      const newAccurateHits = s.accurateHits + (rating === 'PERFECT' ? 1 : rating === 'GREAT' ? 0.75 : rating === 'GOOD' ? 0.5 : 0)
      const newTotalHits = s.totalHits + 1
      const acc = Math.round((newAccurateHits / Math.max(newTotalHits, 1)) * 100)
      const hitMilestone = COMBO_MILESTONES.includes(newCombo)
        ? { combo: newCombo, nonce: ++hitEffectId }
        : s.comboMilestone
      return {
        score: s.score + pts,
        combo: newCombo,
        maxCombo: Math.max(s.maxCombo, newCombo),
        lastRating: rating,
        totalHits: newTotalHits,
        accurateHits: newAccurateHits,
        accuracy: acc,
        hitDeltas: rating === 'MISS' ? s.hitDeltas : [...s.hitDeltas, deltaMs],
        comboMilestone: hitMilestone,
      }
    }),
  addMiss: () =>
    set((s) => ({
      combo: 0,
      lastRating: 'MISS',
      totalHits: s.totalHits + 1,
      accuracy: Math.round((s.accurateHits / Math.max(s.totalHits + 1, 1)) * 100),
    })),
  resetScore: () =>
    set({ score: 0, combo: 0, maxCombo: 0, accuracy: 100, lastRating: null, totalHits: 0, totalNotes: 0, accurateHits: 0, hitDeltas: [], comboMilestone: null }),

  bestResults: loadJSON('muso-best-results', {}),
  saveResult: (lessonId, result) =>
    set((s) => {
      const prev = s.bestResults[lessonId]
      if (prev && prev.score >= result.score && prev.stars >= result.stars) return s
      const merged = {
        ...s.bestResults,
        [lessonId]: {
          stars: Math.max(prev?.stars ?? 0, result.stars),
          score: Math.max(prev?.score ?? 0, result.score),
          accuracy: Math.max(prev?.accuracy ?? 0, result.accuracy),
        },
      }
      saveJSON('muso-best-results', merged)
      return { bestResults: merged }
    }),

  activeLimbActions: { leftHand: null, rightHand: null, leftFoot: null, rightFoot: null },
  triggerLimb: (limb, action) =>
    set((s) => ({
      activeLimbActions: {
        ...s.activeLimbActions,
        [limb]: { ...action, startTime: performance.now() },
      },
    })),

  midiEnabled: false,
  midiDeviceName: null,
  midiMapping: loadJSON('muso-midi-mapping', DEFAULT_MIDI_MAPPING),
  setMidiMapping: (m) => {
    saveJSON('muso-midi-mapping', m)
    set({ midiMapping: m })
  },
  setMidiEnabled: (v) => set({ midiEnabled: v }),
  setMidiDeviceName: (n) => set({ midiDeviceName: n }),

  masterVolume: 0.8,
  drumsVolume: 0.9,
  metronomeVolume: 0.35,
  setVolume: (bus, v) => {
    if (bus === 'master') set({ masterVolume: v })
    else if (bus === 'drums') set({ drumsVolume: v })
    else set({ metronomeVolume: v })
  },

  isMobile: typeof window !== 'undefined' && window.innerWidth < 768,
  setIsMobile: (v) => set({ isMobile: v }),

  isMetronomeOn: true,
  toggleMetronome: () => set((s) => ({ isMetronomeOn: !s.isMetronomeOn })),

  hitEffect: null,
  triggerHitEffect: (lane, rating) => set({ hitEffect: { id: ++hitEffectId, lane, rating } }),

  comboMilestone: null,
  clearComboMilestone: () => set({ comboMilestone: null }),
}))

export function getStore() {
  return useGameStore.getState()
}
