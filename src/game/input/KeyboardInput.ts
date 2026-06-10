import type { ActiveDrumId } from '@/types'

type DrumHitCallback = (drumId: ActiveDrumId) => void

const KEY_MAP: Record<string, ActiveDrumId> = {
  d: 'kick', D: 'kick',
  f: 'snare', F: 'snare',
  j: 'hihat', J: 'hihat',
  k: 'crash', K: 'crash',
  ' ': 'kick',
}

export class KeyboardInput {
  constructor(private onHit: DrumHitCallback) {}

  attach(): void {
    document.addEventListener('keydown', this.handleKey)
  }

  detach(): void {
    document.removeEventListener('keydown', this.handleKey)
  }

  private handleKey = (e: KeyboardEvent): void => {
    if (e.repeat) return
    const drumId = KEY_MAP[e.key]
    if (drumId) {
      e.preventDefault()
      this.onHit(drumId)
    }
  }
}
