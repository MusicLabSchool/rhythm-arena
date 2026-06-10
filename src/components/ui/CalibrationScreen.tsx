import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { audioEngine } from '@/game/audio/NativeAudioEngine'

const CLICK_INTERVAL_MS = 60_000 / 90 // steady 90 BPM
const TAPS_NEEDED = 8

/**
 * Plays a steady click; the user taps along on any input.
 * The median signed offset between tap and click becomes the
 * latency compensation applied to hit detection.
 */
export function CalibrationScreen() {
  const setPhase = useGameStore((s) => s.setPhase)
  const latencyOffsetMs = useGameStore((s) => s.latencyOffsetMs)
  const setLatencyOffsetMs = useGameStore((s) => s.setLatencyOffsetMs)

  const [taps, setTaps] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const clickTimesRef = useRef<number[]>([])
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function startClicks() {
      await audioEngine.unlock()
      if (cancelled) return
      const tick = () => {
        clickTimesRef.current.push(performance.now())
        audioEngine.playMetronomeClick(false)
      }
      tick()
      intervalRef.current = window.setInterval(tick, CLICK_INTERVAL_MS)
    }
    startClicks()

    return () => {
      cancelled = true
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [])

  useEffect(() => {
    if (done) return

    const onTap = () => {
      const now = performance.now()
      const clicks = clickTimesRef.current
      if (clicks.length === 0) return
      // Signed delta to the nearest click (positive = tapped late).
      let best = Infinity
      for (const c of clicks) {
        const d = now - c
        if (Math.abs(d) < Math.abs(best)) best = d
      }
      if (Math.abs(best) > CLICK_INTERVAL_MS / 2) return
      setTaps((prev) => [...prev, best])
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      onTap()
    }
    window.addEventListener('pointerdown', onTap)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onTap)
      window.removeEventListener('keydown', onKey)
    }
  }, [done])

  useEffect(() => {
    if (taps.length >= TAPS_NEEDED && !done) {
      const sorted = [...taps].sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      setLatencyOffsetMs(Math.round(median))
      setDone(true)
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [taps, done, setLatencyOffsetMs])

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      style={{ zIndex: 40 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 w-full max-w-sm mx-4 text-center">
        <div className="text-white/40 text-xs tracking-widest uppercase mb-2">Timing Calibration</div>

        {!done ? (
          <>
            <div className="text-white text-lg font-bold mb-4">Tap along with the click</div>
            <div className="text-white/50 text-sm mb-6">
              Tap anywhere (or hit any drum key) in time with the metronome.
              This measures your device's input delay so the game judges you fairly.
            </div>
            <div className="flex justify-center gap-1.5 mb-4">
              {Array.from({ length: TAPS_NEEDED }, (_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full transition-colors"
                  style={{ background: i < taps.length ? '#a855f7' : 'rgba(255,255,255,0.12)' }}
                />
              ))}
            </div>
            <div className="text-white/30 text-xs">{taps.length} / {TAPS_NEEDED} taps</div>
          </>
        ) : (
          <>
            <div className="text-emerald-300 text-lg font-bold mb-2">Calibrated</div>
            <div className="text-white text-3xl font-black mb-1 tabular-nums">
              {latencyOffsetMs > 0 ? '+' : ''}{latencyOffsetMs} ms
            </div>
            <div className="text-white/40 text-xs mb-6">
              {Math.abs(latencyOffsetMs) < 15
                ? 'Tight! Your setup has very low latency.'
                : latencyOffsetMs > 0
                  ? 'Your input arrives a touch late — compensated.'
                  : 'You anticipate the beat — compensated.'}
            </div>
            <button
              onClick={() => setPhase('menu')}
              className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl"
            >
              Done
            </button>
          </>
        )}

        {!done && (
          <button
            onClick={() => setPhase('menu')}
            className="mt-6 text-white/30 hover:text-white/60 text-xs"
          >
            Cancel
          </button>
        )}
      </div>
    </motion.div>
  )
}
