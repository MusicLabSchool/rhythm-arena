import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { gameRuntime } from '@/game/core/GameRuntime'
import { RatingFeedback } from './RatingFeedback'

const MILESTONE_LABELS: Record<number, string> = {
  10: 'NICE!',
  25: 'ON FIRE!',
  50: 'UNSTOPPABLE!',
  100: 'GODLIKE!',
  200: 'LEGENDARY!',
  300: 'ABSOLUTELY UNREAL!',
}

function ComboMilestoneBanner() {
  const milestone = useGameStore((s) => s.comboMilestone)
  const clearComboMilestone = useGameStore((s) => s.clearComboMilestone)

  useEffect(() => {
    if (!milestone) return
    const timer = window.setTimeout(() => clearComboMilestone(), 1100)
    return () => window.clearTimeout(timer)
  }, [milestone, clearComboMilestone])

  return (
    <div className="absolute inset-x-0 top-[26%] flex justify-center pointer-events-none" style={{ zIndex: 26 }}>
      <AnimatePresence>
        {milestone && (
          <motion.div
            key={milestone.nonce}
            initial={{ opacity: 0, scale: 0.7, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.15, y: -16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            className="text-center"
          >
            <div
              className="text-2xl sm:text-3xl font-black tracking-[0.15em] uppercase text-glow-perfect"
              style={{ color: '#fbbf24', textShadow: '0 0 24px rgba(250,204,21,0.7), 0 0 48px rgba(250,204,21,0.35)' }}
            >
              {MILESTONE_LABELS[milestone.combo] ?? `${milestone.combo}x COMBO!`}
            </div>
            <div className="text-white/50 text-[10px] tracking-[0.4em] uppercase mt-0.5">
              {milestone.combo} in a row
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const DIFF_COLORS = {
  Beginner: '#86efac',
  Basic: '#60a5fa',
  Intermediate: '#fbbf24',
  Advanced: '#f87171',
}

function CountInOverlay() {
  const countIn = useGameStore((s) => s.countIn)
  const songTimeMs = useGameStore((s) => s.songTimeMs)
  if (!countIn || songTimeMs >= 0) return null
  const beatNumber = Math.min(
    countIn.beats,
    Math.floor((songTimeMs + countIn.beats * countIn.beatMs) / countIn.beatMs) + 1,
  )
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        key={beatNumber}
        className="text-white font-black tabular-nums animate-ping-once"
        style={{ fontSize: 'min(22vw, 9rem)', textShadow: '0 0 60px rgba(168,85,247,0.6)' }}
      >
        {beatNumber}
      </div>
    </div>
  )
}

export function GameHUD() {
  const score = useGameStore((s) => s.score)
  const combo = useGameStore((s) => s.combo)
  const accuracy = useGameStore((s) => s.accuracy)
  const lesson = useGameStore((s) => s.selectedLesson)
  const bpm = useGameStore((s) => s.bpm)
  const setPhase = useGameStore((s) => s.setPhase)
  const isMetronomeOn = useGameStore((s) => s.isMetronomeOn)
  const toggleMetronome = useGameStore((s) => s.toggleMetronome)
  const speedMultiplier = useGameStore((s) => s.speedMultiplier)
  const isMobile = useGameStore((s) => s.isMobile)

  // Mobile: one slim strip at the very top — the big side cards would
  // cover the note highway on a portrait screen.
  if (isMobile) {
    return (
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 20 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute top-2 left-2 right-2 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-3 min-w-0">
              <span className="text-white text-base font-black tabular-nums">{score.toLocaleString()}</span>
              <span className="text-yellow-300 text-xs font-bold tabular-nums">{combo}x</span>
              <span className="text-emerald-300 text-xs font-bold tabular-nums">{accuracy}%</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-white/50 text-[10px] font-semibold tabular-nums">{bpm} BPM</span>
              <button
                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  isMetronomeOn ? 'border-purple-400/60 text-purple-300' : 'border-white/20 text-white/30'
                }`}
                onClick={toggleMetronome}
              >
                Click
              </button>
              <button
                className="text-[10px] px-2 py-0.5 rounded border border-white/20 text-white/50"
                onClick={() => { gameRuntime.pause(); setPhase('paused') }}
              >
                ‖
              </button>
            </div>
          </div>
        </div>

        <CountInOverlay />
        <RatingFeedback />
        <ComboMilestoneBanner />
      </motion.div>
    )
  }

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 20 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Top-left: Music Lab logo + lesson + score */}
      <div className="absolute top-3 left-3 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10 min-w-[160px]">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-purple-300 text-[10px] font-bold tracking-widest uppercase">Music Lab</span>
          </div>
          <div className="text-white/60 text-[9px] tracking-wider uppercase mb-2">Rhythm Studio</div>

          {lesson && (
            <>
              <div className="text-white/40 text-[8px] uppercase mb-0.5">Lesson</div>
              <div className="text-white text-xs font-semibold leading-tight">{lesson.title}</div>
              <div
                className="text-[9px] font-medium mt-0.5"
                style={{ color: DIFF_COLORS[lesson.difficulty] ?? '#ffffff' }}
              >
                {lesson.difficulty}
              </div>
            </>
          )}

          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="text-white/40 text-[8px] uppercase">Score</div>
            <div className="text-white text-lg font-black tabular-nums">{score.toLocaleString()}</div>
          </div>

          <div className="flex gap-3 mt-1">
            <div>
              <div className="text-white/40 text-[8px] uppercase">Combo</div>
              <div className="text-yellow-300 text-sm font-bold tabular-nums">{combo}</div>
            </div>
            <div>
              <div className="text-white/40 text-[8px] uppercase">Accuracy</div>
              <div className="text-emerald-300 text-sm font-bold tabular-nums">{accuracy}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top-right: BPM + time sig + controls */}
      <div className="absolute top-3 right-3 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10 min-w-[120px] text-right">
          <div className="text-white/40 text-[8px] uppercase tracking-wider">Tempo</div>
          <div className="text-white text-xl font-black tabular-nums">{bpm} <span className="text-white/40 text-[10px] font-normal">BPM</span></div>
          {speedMultiplier < 1 && (
            <div className="text-yellow-300/80 text-[9px] font-semibold">{Math.round(speedMultiplier * 100)}% practice speed</div>
          )}
          {lesson && (
            <div className="text-white/50 text-[10px] mt-0.5">{lesson.beatsPerBar}/4</div>
          )}

          <div className="mt-2 pt-2 border-t border-white/10 flex gap-2 justify-end">
            <button
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                isMetronomeOn
                  ? 'border-purple-400/60 text-purple-300'
                  : 'border-white/20 text-white/30'
              }`}
              onClick={toggleMetronome}
            >
              Click
            </button>
            <button
              className="text-[10px] px-2 py-0.5 rounded border border-white/20 text-white/40 hover:text-white/70 transition-colors"
              onClick={() => { gameRuntime.pause(); setPhase('paused') }}
            >
              ‖
            </button>
          </div>
        </div>
      </div>

      {/* Count-in: big beat numbers before the song starts */}
      <CountInOverlay />

      {/* Rating feedback — centered */}
      <RatingFeedback />

      {/* Combo milestone celebration */}
      <ComboMilestoneBanner />

      {/* Key hint — bottom center (desktop) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex gap-3 pointer-events-none">
        {(['J Hi-hat', 'F Snare', 'D Kick', 'K Crash'] as const).map((label) => (
          <div key={label} className="text-white/25 text-[9px] tracking-wider">{label}</div>
        ))}
      </div>
    </motion.div>
  )
}
