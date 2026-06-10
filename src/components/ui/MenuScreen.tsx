import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { LESSONS } from '@/game/lessons/lessons'
import { attachAudioUnlock } from '@/game/audio/unlockAudio'
import { audioEngine } from '@/game/audio/NativeAudioEngine'
import { gameRuntime } from '@/game/core/GameRuntime'
import type { LessonDef } from '@/types'

const DIFF_COLORS = {
  Beginner:     'border-emerald-400/40 bg-emerald-400/5 text-emerald-300',
  Basic:        'border-blue-400/40 bg-blue-400/5 text-blue-300',
  Intermediate: 'border-yellow-400/40 bg-yellow-400/5 text-yellow-300',
  Advanced:     'border-red-400/40 bg-red-400/5 text-red-300',
}

const SPEEDS = [0.5, 0.75, 1] as const

function MiniStars({ stars }: { stars: number }) {
  if (stars <= 0) return null
  return (
    <span className="text-[10px] tracking-tight" style={{ color: '#fbbf24' }}>
      {'★'.repeat(stars)}
      <span style={{ color: '#33415588' }}>{'★'.repeat(Math.max(0, 5 - stars))}</span>
    </span>
  )
}

export function MenuScreen() {
  const [selected, setSelected] = useState<LessonDef>(LESSONS[0])
  const setPhase = useGameStore((s) => s.setPhase)
  const selectLesson = useGameStore((s) => s.selectLesson)
  const bestResults = useGameStore((s) => s.bestResults)
  const speedMultiplier = useGameStore((s) => s.speedMultiplier)
  const setSpeedMultiplier = useGameStore((s) => s.setSpeedMultiplier)

  async function handleStart() {
    attachAudioUnlock()
    await audioEngine.unlock()
    selectLesson(selected)
    setPhase('playing')
    gameRuntime.start(selected)
  }

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ zIndex: 30, background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Logo */}
      <div className="text-center mb-5">
        <div className="text-white/40 text-sm tracking-[0.4em] uppercase mb-1">Music Lab</div>
        <h1 className="text-white text-5xl font-black tracking-tight leading-none mb-1">
          Rhythm
          <span className="text-purple-400"> Arena</span>
        </h1>
        <div className="text-white/30 text-xs tracking-widest uppercase">First-Person Drum Experience</div>
      </div>

      {/* Lesson selector */}
      <div className="w-full max-w-sm px-4 mb-4">
        <div className="text-white/40 text-[10px] uppercase tracking-widest mb-2 text-center">Choose a Lesson</div>
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {LESSONS.map((lesson) => {
            const best = bestResults[lesson.id]
            return (
              <button
                key={lesson.id}
                onClick={() => setSelected(lesson)}
                className={`text-left rounded-xl border px-4 py-3 transition-all duration-150 ${
                  selected.id === lesson.id
                    ? 'border-purple-400/60 bg-purple-400/10 shadow-lg shadow-purple-900/30'
                    : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold text-sm">{lesson.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${DIFF_COLORS[lesson.difficulty]}`}>
                    {lesson.difficulty}
                  </span>
                </div>
                <div className="text-white/40 text-[10px] mt-0.5">{lesson.description}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-white/30 text-[9px]">{lesson.bpm} BPM · {lesson.bars} bars</span>
                  {best && <MiniStars stars={best.stars} />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Coaching tip for selected lesson */}
      {selected.tip && (
        <div className="w-full max-w-sm px-4 mb-3">
          <div className="text-purple-300/70 text-[10px] italic text-center leading-snug">
            💡 {selected.tip}
          </div>
        </div>
      )}

      {/* Practice speed */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-white/30 text-[10px] uppercase tracking-widest">Speed</span>
        {SPEEDS.map((sp) => (
          <button
            key={sp}
            onClick={() => setSpeedMultiplier(sp)}
            className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
              speedMultiplier === sp
                ? 'border-purple-400/60 bg-purple-400/15 text-purple-200'
                : 'border-white/10 text-white/35 hover:text-white/60'
            }`}
          >
            {Math.round(sp * 100)}%
          </button>
        ))}
        {speedMultiplier < 1 && (
          <span className="text-white/25 text-[9px]">≈ {Math.round(selected.bpm * speedMultiplier)} BPM</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs px-4">
        <button
          onClick={handleStart}
          className="w-full py-4 bg-purple-500 hover:bg-purple-400 active:bg-purple-600 text-white font-black text-lg tracking-wider rounded-2xl transition-all duration-150 shadow-xl shadow-purple-900/50"
        >
          PLAY
        </button>

        <button
          onClick={async () => {
            attachAudioUnlock()
            await audioEngine.unlock()
            setPhase('freeplay')
          }}
          className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-semibold text-sm rounded-xl transition-colors"
        >
          🥁 Free Play / Warm-Up
        </button>

        <div className="flex gap-3 w-full">
          <button
            onClick={() => setPhase('settings')}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 font-medium text-sm rounded-xl transition-colors"
          >
            Settings
          </button>
          <button
            onClick={() => setPhase('midi-setup')}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 font-medium text-sm rounded-xl transition-colors"
          >
            MIDI Setup
          </button>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="mt-5 text-white/20 text-[10px] tracking-widest">
        D · F · J · K &nbsp;|&nbsp; Or use MIDI / Touch
      </div>
    </motion.div>
  )
}
