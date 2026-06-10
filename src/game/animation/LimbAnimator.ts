import type { ActiveDrumId, Limb, LimbAction } from '@/types'

export const DRUM_LIMB_MAP: Record<ActiveDrumId, Limb[]> = {
  kick: ['rightFoot'],
  snare: ['leftHand'],
  hihat: ['rightHand', 'leftFoot'],
  crash: ['rightHand'],
}

const LIMB_DURATIONS: Record<ActiveDrumId, number> = {
  kick: 120,
  snare: 90,
  hihat: 70,
  crash: 150,
}

const LIMB_PEAK_ANGLES: Record<string, number> = {
  leftHand: 0.55,
  rightHand: 0.55,
  leftFoot: 0.28,
  rightFoot: 0.32,
}

export function getLimbActionForDrum(
  drumId: ActiveDrumId,
  limb: Limb
): Omit<LimbAction, 'startTime'> {
  return {
    duration: LIMB_DURATIONS[drumId],
    peakAngle: LIMB_PEAK_ANGLES[limb],
  }
}

export function computeLimbTransform(
  action: LimbAction | null,
  now: number
): { rotation: number; offsetY: number } {
  if (!action) return { rotation: 0, offsetY: 0 }
  const elapsed = now - action.startTime
  const t = Math.min(elapsed / action.duration, 1.0)
  // Parabolic strike: fast down, natural rebound
  const angle = action.peakAngle * 4 * t * (1 - t)
  const offsetY = -Math.sin(angle) * 0.12
  return { rotation: angle, offsetY }
}
