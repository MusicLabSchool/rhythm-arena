import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { gameRuntime } from '@/game/core/GameRuntime'

export function PauseScreen() {
  const setPhase = useGameStore((s) => s.setPhase)
  const lesson = useGameStore((s) => s.selectedLesson)

  function handleResume() {
    setPhase('playing')
    gameRuntime.resume()
  }

  function handleRestart() {
    if (!lesson) return
    setPhase('playing')
    gameRuntime.start(lesson)
  }

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm"
      style={{ zIndex: 35 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-white text-4xl font-black mb-8">PAUSED</div>
      <div className="flex flex-col gap-3 w-64">
        <button
          onClick={handleResume}
          className="py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl"
        >
          Resume
        </button>
        <button
          onClick={handleRestart}
          className="py-3 bg-white/10 hover:bg-white/20 text-white/70 font-medium rounded-xl"
        >
          Restart Lesson
        </button>
        <button
          onClick={() => { gameRuntime.stop(); setPhase('menu') }}
          className="py-3 bg-white/10 hover:bg-white/20 text-white/70 font-medium rounded-xl"
        >
          Quit to Menu
        </button>
      </div>
    </motion.div>
  )
}
