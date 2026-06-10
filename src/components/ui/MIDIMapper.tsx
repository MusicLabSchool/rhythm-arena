import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { midiInput } from '@/game/input/MidiInput'
import type { ActiveDrumId } from '@/types'

const DRUM_SLOTS: { id: ActiveDrumId; label: string }[] = [
  { id: 'kick',  label: 'Kick Drum' },
  { id: 'snare', label: 'Snare Drum' },
  { id: 'hihat', label: 'Hi-hat' },
  { id: 'crash', label: 'Crash Cymbal' },
]

export function MIDIMapper() {
  const setPhase = useGameStore((s) => s.setPhase)
  const midiMapping = useGameStore((s) => s.midiMapping)
  const setMidiMapping = useGameStore((s) => s.setMidiMapping)
  const setMidiEnabled = useGameStore((s) => s.setMidiEnabled)
  const setMidiDeviceName = useGameStore((s) => s.setMidiDeviceName)

  const [midiAvailable, setMidiAvailable] = useState<boolean | null>(null)
  const [listening, setListening] = useState<ActiveDrumId | null>(null)
  const [localMapping, setLocalMapping] = useState<Record<number, ActiveDrumId>>({ ...midiMapping })
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    midiInput.init().then((ok) => {
      setMidiAvailable(ok)
      if (ok) {
        setMidiEnabled(true)
        setMidiDeviceName(midiInput.getDeviceName())
      }
    })
  }, [setMidiEnabled, setMidiDeviceName])

  function startListening(drumId: ActiveDrumId) {
    if (cleanupRef.current) cleanupRef.current()
    setListening(drumId)
    cleanupRef.current = midiInput.listenRaw((note) => {
      setLocalMapping((prev) => {
        const next = { ...prev, [note]: drumId }
        return next
      })
      setListening(null)
      if (cleanupRef.current) cleanupRef.current()
    })
  }

  function handleSave() {
    setMidiMapping(localMapping)
    setPhase('menu')
  }

  const reverseMap: Partial<Record<ActiveDrumId, number[]>> = {}
  for (const [note, drum] of Object.entries(localMapping)) {
    if (!reverseMap[drum]) reverseMap[drum] = []
    reverseMap[drum]!.push(Number(note))
  }

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      style={{ zIndex: 35 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">MIDI / Aerodrums</h2>
          <button onClick={() => setPhase('menu')} className="text-white/40 hover:text-white/70 text-xl">✕</button>
        </div>

        {midiAvailable === null && (
          <div className="text-white/40 text-sm text-center py-4">Checking MIDI…</div>
        )}

        {midiAvailable === false && (
          <div className="text-red-300/80 text-sm text-center py-4">
            Web MIDI not available in this browser.<br />
            <span className="text-white/40 text-xs">Try Chrome, Edge, or Firefox with a MIDI extension.</span>
          </div>
        )}

        {midiAvailable === true && (
          <>
            <div className="text-emerald-400 text-xs mb-4">
              ✓ MIDI connected — {midiInput.getDeviceName() ?? 'Unknown device'}
            </div>

            <div className="text-white/40 text-[10px] mb-3">
              Click "Listen" next to a drum, then hit your pad to auto-map.
            </div>

            <div className="space-y-2 mb-4">
              {DRUM_SLOTS.map(({ id, label }) => (
                <div key={id} className="flex items-center justify-between gap-3">
                  <span className="text-white text-sm w-24">{label}</span>
                  <span className="text-white/30 text-xs flex-1">
                    {reverseMap[id]?.join(', ') ?? '—'}
                  </span>
                  <button
                    onClick={() => startListening(id)}
                    className={`text-[10px] px-3 py-1 rounded-lg border transition-colors ${
                      listening === id
                        ? 'border-yellow-400/60 text-yellow-300 animate-pulse'
                        : 'border-white/20 text-white/50 hover:text-white/80'
                    }`}
                  >
                    {listening === id ? 'Listening…' : 'Listen'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-3">
          {midiAvailable && (
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-sm"
            >
              Save & Back
            </button>
          )}
          <button
            onClick={() => setPhase('menu')}
            className="flex-1 py-2.5 bg-white/8 hover:bg-white/12 border border-white/10 text-white/60 rounded-xl text-sm"
          >
            {midiAvailable ? 'Cancel' : 'Back'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
