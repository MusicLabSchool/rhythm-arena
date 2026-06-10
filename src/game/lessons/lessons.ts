import type { LessonDef } from '@/types'

// Shorthand builders keep the patterns readable.
type P = LessonDef['patterns'][number]
const k = (beat: number, offset = 0): P => ({ beat, offset, drumId: 'kick' })
const s = (beat: number, offset = 0, velocity = 1): P => ({ beat, offset, drumId: 'snare', velocity })
const h = (beat: number, offset = 0, velocity = 1): P => ({ beat, offset, drumId: 'hihat', velocity })
const c = (beat: number, offset = 0): P => ({ beat, offset, drumId: 'crash' })

/** Hi-hat on every 8th note of a 4/4 bar. */
const eighthHats = (accented = false): P[] =>
  [0, 1, 2, 3].flatMap((b) => [h(b, 0, 1), h(b, 0.5, accented ? 0.6 : 1)])

/** Hi-hat on every 16th note of a 4/4 bar, with downbeat accents. */
const sixteenthHats = (): P[] =>
  [0, 1, 2, 3].flatMap((b) => [h(b, 0, 1), h(b, 0.25, 0.55), h(b, 0.5, 0.8), h(b, 0.75, 0.55)])

export const LESSONS: LessonDef[] = [
  {
    id: 'first-beat',
    title: 'Your First Beat',
    description: 'Kick on 1, snare on 3 — the foundation of all drumming.',
    tip: 'Stay relaxed. Let the stick rebound off the head instead of pressing into it.',
    bpm: 70,
    beatsPerBar: 4,
    bars: 4,
    difficulty: 'Beginner',
    patterns: [k(0), s(2)],
  },
  {
    id: 'quarter-pulse',
    title: 'Quarter Note Pulse',
    description: 'Add quarter-note hi-hat over kick and snare. Lock in with the click.',
    tip: 'Count out loud: 1, 2, 3, 4. Your hi-hat hand is the timekeeper.',
    bpm: 76,
    beatsPerBar: 4,
    bars: 4,
    difficulty: 'Beginner',
    patterns: [h(0), h(1), h(2), h(3), k(0), s(1), k(2), s(3)],
  },
  {
    id: 'money-beat',
    title: 'The Money Beat',
    description: '8th-note hats, kick on 1 & 3, snare on 2 & 4. The most-played beat in history.',
    tip: 'Billie Jean, Back in Black — this groove is everywhere. Keep the hats even.',
    bpm: 88,
    beatsPerBar: 4,
    bars: 4,
    difficulty: 'Basic',
    patterns: [...eighthHats(), k(0), s(1), k(2), s(3)],
  },
  {
    id: 'and-of-three',
    title: 'Kick on the "&"',
    description: 'Add a kick on the & of 3. Your first taste of syncopation.',
    tip: 'Count "1 & 2 & 3 & 4 &" — the extra kick lands right on the & after 3.',
    bpm: 90,
    beatsPerBar: 4,
    bars: 4,
    difficulty: 'Basic',
    patterns: [...eighthHats(), k(0), s(1), k(2), k(2, 0.5), s(3)],
  },
  {
    id: 'four-on-floor',
    title: 'Four on the Floor',
    description: 'Kick on every quarter note, open-feel hats on the off-beats. Dance music 101.',
    tip: 'The kick is relentless — keep it steady and let the off-beat hats float on top.',
    bpm: 112,
    beatsPerBar: 4,
    bars: 4,
    difficulty: 'Basic',
    patterns: [
      k(0), k(1), k(2), k(3),
      h(0, 0.5), h(1, 0.5), h(2, 0.5), h(3, 0.5),
      s(1), s(3),
    ],
  },
  {
    id: 'crash-opener',
    title: 'Crash & Groove',
    description: 'Open the bar with a crash, then lock straight into the money beat.',
    tip: 'Crash and kick land together on beat 1 — two limbs, one moment.',
    bpm: 96,
    beatsPerBar: 4,
    bars: 4,
    difficulty: 'Basic',
    patterns: [
      c(0), k(0),
      h(0, 0.5), h(1), h(1, 0.5), h(2), h(2, 0.5), h(3), h(3, 0.5),
      s(1), k(2), s(3),
    ],
  },
  {
    id: 'sixteenth-hats',
    title: '16th-Note Hats',
    description: 'Double-time hi-hat with a basic kick/snare pattern underneath.',
    tip: 'Alternate your sticking mentally: 1-e-&-a. Accent the downbeats, soften the e and a.',
    bpm: 72,
    beatsPerBar: 4,
    bars: 4,
    difficulty: 'Intermediate',
    patterns: [...sixteenthHats(), k(0), s(1), k(2), s(3)],
  },
  {
    id: 'ghost-notes',
    title: 'Ghost Note Groove',
    description: 'Quiet ghost notes on the snare between the backbeats. The secret to feel.',
    tip: 'Ghosts are felt, not heard. Play them at a whisper — barely lifting the stick.',
    bpm: 84,
    beatsPerBar: 4,
    bars: 4,
    difficulty: 'Intermediate',
    patterns: [
      ...eighthHats(),
      k(0), s(1), k(2, 0.5), s(3),
      s(1, 0.75, 0.35), s(2, 0.25, 0.35),
    ],
  },
  {
    id: 'half-time',
    title: 'Half-Time Feel',
    description: 'Snare only on beat 3. Same tempo, twice the space.',
    tip: 'Resist the urge to fill the space. Half-time grooves breathe.',
    bpm: 86,
    beatsPerBar: 4,
    bars: 4,
    difficulty: 'Intermediate',
    patterns: [
      ...eighthHats(),
      k(0), k(1, 0.5), s(2), k(3, 0.5),
    ],
  },
  {
    id: 'funk-syncopation',
    title: 'Syncopated Funk',
    description: '16th-note kick placements with ghost-note snare. Pure pocket.',
    tip: 'The kick on the "a" of 1 is the hook. Land it late and lazy, right in the pocket.',
    bpm: 92,
    beatsPerBar: 4,
    bars: 4,
    difficulty: 'Advanced',
    patterns: [
      ...eighthHats(),
      k(0), k(0, 0.75), s(1), s(1, 0.75, 0.35),
      k(2, 0.25), s(3), s(3, 0.5, 0.35),
    ],
  },
  {
    id: 'blues-shuffle',
    title: 'Blues Shuffle',
    description: 'Triplet-based shuffle feel on the hats. Swing it, don’t straighten it.',
    tip: 'Count "1-trip-let". You play the 1 and the "let" — the middle stays silent.',
    bpm: 84,
    beatsPerBar: 4,
    bars: 4,
    difficulty: 'Advanced',
    patterns: [
      ...[0, 1, 2, 3].flatMap((b) => [h(b, 0, 1), h(b, 2 / 3, 0.7)]),
      k(0), s(1), k(2), s(3),
    ],
  },
  {
    id: 'crash-accents',
    title: 'Crash Accents',
    description: 'Crashes on 1 and the & of 4 — punctuating phrases like a pro.',
    tip: 'A crash without a kick under it sounds thin. Pair them.',
    bpm: 100,
    beatsPerBar: 4,
    bars: 4,
    difficulty: 'Advanced',
    patterns: [
      c(0), k(0),
      h(0, 0.5), h(1), h(1, 0.5), h(2), h(2, 0.5), h(3),
      s(1), k(2), k(2, 0.5), s(3),
      c(3, 0.5), k(3, 0.5),
    ],
  },
]

export const LANE_INDICES: Record<string, number> = {
  hihat: 0,
  snare: 1,
  kick: 2,
  crash: 3,
}
