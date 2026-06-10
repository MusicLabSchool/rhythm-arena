import type { ActiveDrumId, Limb, LimbAction } from '@/types'

export const DRUM_LIMB_MAP: Record<ActiveDrumId, Limb[]> = {
  kick: ['rightFoot'],
  snare: ['leftHand'],
  hihat: ['rightHand', 'leftFoot'],
  crash: ['rightHand'],
}

const LIMB_DURATIONS: Record<ActiveDrumId, number> = {
  kick: 150,
  snare: 170,
  hihat: 140,
  crash: 280,
}

const LIMB_PEAK_ANGLES: Record<string, number> = {
  leftHand: 1,
  rightHand: 1,
  leftFoot: 0.38,
  rightFoot: 0.42,
}

export function getLimbActionForDrum(
  drumId: ActiveDrumId,
  limb: Limb
): Omit<LimbAction, 'startTime'> {
  return {
    duration: LIMB_DURATIONS[drumId],
    peakAngle: LIMB_PEAK_ANGLES[limb],
    drumId,
  }
}

/**
 * Strike envelope: 0 at rest, 1 at full contact.
 * Fast smooth attack (~25% of duration) to the contact pose,
 * then an eased return to rest.
 */
export function strikeProgress(action: LimbAction | null, now: number): number {
  if (!action) return 0
  const t = (now - action.startTime) / action.duration
  if (t <= 0 || t >= 1) return 0
  const attack = 0.25
  if (t < attack) {
    const u = t / attack
    return u * u * (3 - 2 * u)
  }
  const r = (t - attack) / (1 - attack)
  return 1 - r * r * (3 - 2 * r)
}

/** Wall-clock timestamps of the most recent hit per drum — drives cymbal wobble and shell glow. */
export const drumHitTimes: Partial<Record<ActiveDrumId, number>> = {}

export function registerDrumHit(drumId: ActiveDrumId): void {
  drumHitTimes[drumId] = performance.now()
}

const NO_WOBBLE = { x: 0, z: 0 }

/** Decaying two-axis rock for a cymbal after being struck. */
export function cymbalWobble(drumId: ActiveDrumId, now: number, amplitude: number): { x: number; z: number } {
  const hit = drumHitTimes[drumId]
  if (hit === undefined) return NO_WOBBLE
  const e = now - hit
  if (e < 0 || e > 1500) return NO_WOBBLE
  const decay = Math.exp(-e / 340)
  return {
    x: Math.sin(e * 0.026) * amplitude * decay,
    z: Math.cos(e * 0.021) * amplitude * 0.65 * decay,
  }
}
