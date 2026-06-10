import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { gameRuntime } from '@/game/core/GameRuntime'

function starsForAccuracy(accuracy: number): number {
  return accuracy >= 95 ? 5 : accuracy >= 80 ? 4 : accuracy >= 65 ? 3 : accuracy >= 50 ? 2 : 1
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-1 justify-center">
      {Array.from({ length: 5 }, (_, i) => (
        <motion.span
          key={i}
          className="text-3xl"
          style={{ color: i < count ? '#fbbf24' : '#334455' }}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15 + i * 0.12, type: 'spring', stiffness: 300 }}
        >
          ★
        </motion.span>
      ))}
    </div>
  )
}

function TimingAnalysis({ deltas }: { deltas: number[] }) {
  if (deltas.length < 4) return null

  const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length
  const early = deltas.filter((d) => d < -20).length
  const late = deltas.filter((d) => d > 20).length
  const pct = (n: number) => Math.round((n / deltas.length) * 100)

  let verdict: string
  if (Math.abs(mean) < 12) verdict = 'Locked in. Your timing is right in the pocket.'
  else if (mean < 0) verdict = `You tend to rush — hits land ${Math.abs(Math.round(mean))}ms early on average.`
  else verdict = `You tend to drag — hits land ${Math.round(mean)}ms late on average.`

  return (
    <div className="mt-5 pt-4 border-t border-white/10 text-left">
      <div className="text-white/40 text-[9px] uppercase tracking-widest mb-2 text-center">Timing Analysis</div>

      {/* Early / on / late bar */}
      <div className="flex h-2 rounded-full overflow-hidden mb-2">
        <div style={{ width: `${pct(early)}%`, background: '#60a5fa' }} />
        <div style={{ width: `${100 - pct(early) - pct(late)}%`, background: '#34d399' }} />
        <div style={{ width: `${pct(late)}%`, background: '#f87171' }} />
      </div>
      <div className="flex justify-between text-[9px] text-white/40 mb-2">
        <span className="text-blue-300">{pct(early)}% early</span>
        <span className="text-emerald-300">{100 - pct(early) - pct(late)}% on time</span>
        <span className="text-red-300">{pct(late)}% late</span>
      </div>

      <div className="text-white/60 text-[11px] text-center italic">{verdict}</div>
    </div>
  )
}

export function ResultsScreen() {
  const score = useGameStore((s) => s.score)
  const combo = useGameStore((s) => s.maxCombo)
  const accuracy = useGameStore((s) => s.accuracy)
  const lesson = useGameStore((s) => s.selectedLesson)
  const hitDeltas = useGameStore((s) => s.hitDeltas)
  const setPhase = useGameStore((s) => s.setPhase)
  const selectLesson = useGameStore((s) => s.selectLesson)
  const saveResult = useGameStore((s) => s.saveResult)
  const bestResults = useGameStore((s) => s.bestResults)
  const speedMultiplier = useGameStore((s) => s.speedMultiplier)

  const stars = starsForAccuracy(accuracy)
  const prevBest = lesson ? bestResults[lesson.id] : undefined
  const isNewBest = useMemo(
    () => !!lesson && speedMultiplier === 1 && (!prevBest || score > prevBest.score),
    // Captured once on mount: saving the result below must not flip the badge off.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // Persist best result — full speed runs only, slow practice doesn't count.
  useEffect(() => {
    if (lesson && speedMultiplier === 1) {
      saveResult(lesson.id, { stars, score, accuracy })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleRetry() {
    if (!lesson) return
    selectLesson(lesson)
    setPhase('playing')
    gameRuntime.start(lesson)
  }

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{ zIndex: 35 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 w-full max-w-sm mx-4 text-center max-h-[90vh] overflow-y-auto">
        <div className="text-white/40 text-xs tracking-widest uppercase mb-1">Results</div>
        {lesson && <div className="text-white font-bold text-lg mb-1">{lesson.title}</div>}
        {isNewBest && (
          <motion.div
            className="text-yellow-300 text-[11px] font-bold tracking-widest uppercase mb-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            ✦ New Best ✦
          </motion.div>
        )}

        <Stars count={stars} />

        <div className="mt-5 grid grid-cols-3 gap-4">
          <div>
            <div className="text-white/40 text-[9px] uppercase">Score</div>
            <div className="text-white text-xl font-black tabular-nums">{score.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-white/40 text-[9px] uppercase">Accuracy</div>
            <div className="text-emerald-300 text-xl font-black tabular-nums">{accuracy}%</div>
          </div>
          <div>
            <div className="text-white/40 text-[9px] uppercase">Max Combo</div>
            <div className="text-yellow-300 text-xl font-black tabular-nums">{combo}</div>
          </div>
        </div>

        {speedMultiplier < 1 && (
          <div className="mt-3 text-white/30 text-[10px]">
            Practice run at {Math.round(speedMultiplier * 100)}% speed — play at full speed to set a best score.
          </div>
        )}

        <TimingAnalysis deltas={hitDeltas} />

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleRetry}
            className="py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl"
          >
            Play Again
          </button>
          <button
            onClick={() => setPhase('menu')}
            className="py-3 bg-white/8 hover:bg-white/12 border border-white/10 text-white/60 font-medium rounded-xl"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </motion.div>
  )
}
