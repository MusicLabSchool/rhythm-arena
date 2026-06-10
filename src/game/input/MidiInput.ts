import type { ActiveDrumId } from '@/types'

type DrumHitCallback = (drumId: ActiveDrumId, velocity: number) => void
type RawNoteCallback = (note: number, velocity: number) => void

export class MidiInput {
  private access: MIDIAccess | null = null

  async init(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) return false
    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false })
      return true
    } catch {
      return false
    }
  }

  listen(mapping: Record<number, ActiveDrumId>, onHit: DrumHitCallback): void {
    if (!this.access) return
    for (const input of this.access.inputs.values()) {
      input.onmidimessage = (msg: MIDIMessageEvent) => {
        const data = msg.data ? Array.from(msg.data) : []
        const [status, note, velocity] = data
        if ((status & 0xf0) === 0x90 && velocity > 0) {
          const drumId = mapping[note]
          if (drumId) onHit(drumId, velocity / 127)
        }
      }
    }
  }

  listenRaw(onNote: RawNoteCallback): () => void {
    if (!this.access) return () => {}
    const cleanup: (() => void)[] = []
    for (const input of this.access.inputs.values()) {
      const handler = (msg: MIDIMessageEvent) => {
        const data = msg.data ? Array.from(msg.data) : []
        const [status, note, velocity] = data
        if ((status & 0xf0) === 0x90 && velocity > 0) {
          onNote(note, velocity)
        }
      }
      input.onmidimessage = handler
      cleanup.push(() => { input.onmidimessage = null })
    }
    return () => cleanup.forEach((fn) => fn())
  }

  getDeviceName(): string | null {
    if (!this.access) return null
    for (const input of this.access.inputs.values()) {
      return input.name ?? null
    }
    return null
  }
}

export const midiInput = new MidiInput()
