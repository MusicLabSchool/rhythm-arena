export class MidiManager {
  constructor() {
    this.access = null;
    this.onHit = undefined;
  }

  async init() {
    if (!navigator.requestMIDIAccess) {
      throw new Error('Web MIDI is not supported in this browser.');
    }

    this.access = await navigator.requestMIDIAccess({ sysex: false });
    this.bindInputs();

    this.access.onstatechange = () => this.bindInputs();
  }

  bindInputs() {
    if (!this.access) return;

    for (const input of this.access.inputs.values()) {
      input.onmidimessage = (event) => this.handleMessage(event);
    }
  }

  handleMessage(event) {
    const [status, note, velocity] = event.data;
    const command = status & 0xf0;
    const isNoteOn = command === 0x90 && velocity > 0;
    if (!isNoteOn) return;

    const type = this.mapNote(note);
    if (!type) return;
    this.onHit?.(type, velocity / 127, note);
  }

  mapNote(note) {
    const saved = localStorage.getItem('muso-midi-map');
    if (saved) {
      try {
        const map = JSON.parse(saved);
        const found = Object.entries(map).find(([, value]) => value === note);
        if (found) return found[0];
      } catch {
        // ignore invalid map
      }
    }

    if (note === 36) return 'kick';
    if (note === 38 || note === 40) return 'snare';
    if ([42, 44, 46].includes(note)) return 'hihat';
    if ([49, 57].includes(note)) return 'crash';

    return null;
  }
}
