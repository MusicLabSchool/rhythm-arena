import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { audioEngine } from '@/game/audio/NativeAudioEngine'

const BPM_MIN = 50
const BPM_MAX = 180

/** Free Play / Warm-Up — jam on the kit with an optional click track, no scoring. */
export function FreePlayScreen() {
  const setPhase = useGameStore((s) => s.setPhase)
  const [metroOn, setMetroOn] = useState(false)
  const [bpm, setBpm] = useState(90)

  useEffect(() => {
    if (!metroOn) return
    let beat = 0
    const id = window.setInterval(() => {
      audioEngine.playMetronomeClick(beat % 4 === 0)
      beat++
    }, 60_000 / bpm)
    return () => window.clearInterval(id)
  }, [metroOn, bpm])

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 20 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Top-left badge */}
      <div className="absolute top-3 left-3 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10 min-w-[160px]">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 text-[10px] font-bold tracking-widest uppercase">Music Lab</span>
          </div>
          <div className="text-white text-sm font-bold">Free Play</div>
          <div className="text-white/40 text-[9px] tracking-wider uppercase mt-0.5">No scoring — just jam</div>
        </div>
      </div>

      {/* Top-right: click track */}
      <div className="absolute top-3 right-3 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10 min-w-[150px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/40 text-[8px] uppercase tracking-wider">Click Track</span>
            <button
              onClick={async () => {
                await audioEngine.unlock()
                setMetroOn((v) => !v)
              }}
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                metroOn ? 'border-emerald-400/60 text-emerald-300' : 'border-white/20 text-white/40'
              }`}
            >
              {metroOn ? 'On' : 'Off'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={BPM_MIN}
              max={BPM_MAX}
              step={1}
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value, 10))}
              className="flex-1 accent-emerald-500"
            />
            <span className="text-white text-xs font-black tabular-nums w-10 text-right">{bpm}</span>
          </div>
        </div>
      </div>

      {/* Back to menu */}
      <div className="absolute bottom-4 right-3 pointer-events-auto">
        <button
          onClick={() => setPhase('menu')}
          className="px-4 py-2 bg-white/8 hover:bg-white/15 border border-white/10 text-white/70 font-medium text-xs rounded-xl transition-colors"
        >
          ← Back to Menu
        </button>
      </div>

      {/* Key hint — bottom center (desktop) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex gap-3 pointer-events-none">
        {(['J Hi-hat', 'F Snare', 'D Kick', 'K Crash'] as const).map((label) => (
          <div key={label} className="text-white/25 text-[9px] tracking-wider">{label}</div>
        ))}
      </div>
    </motion.div>
  )
}
