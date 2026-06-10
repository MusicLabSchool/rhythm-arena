import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import type { HitRating } from '@/types'

const RATING_CONFIG: Record<HitRating, { label: string; color: string; glow: string }> = {
  PERFECT: { label: 'PERFECT!', color: '#fbbf24', glow: 'text-glow-perfect' },
  GREAT:   { label: 'GREAT',    color: '#60a5fa', glow: 'text-glow-great' },
  GOOD:    { label: 'GOOD',     color: '#86efac', glow: '' },
  MISS:    { label: 'MISS',     color: '#f87171', glow: '' },
}

export function RatingFeedback() {
  const lastRating = useGameStore((s) => s.lastRating)
  const key = useRef(0)

  useEffect(() => {
    if (lastRating) key.current++
  }, [lastRating])

  const config = lastRating ? RATING_CONFIG[lastRating] : null

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ zIndex: 25 }}>
      <AnimatePresence mode="popLayout">
        {config && (
          <motion.div
            key={key.current}
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: -30 }}
            transition={{ duration: 0.15, exit: { duration: 0.35 } }}
            className="text-center"
            style={{ marginTop: '-8vh' }}
          >
            <div
              className={`text-4xl font-black tracking-widest uppercase ${config.glow}`}
              style={{ color: config.color, textShadow: `0 0 20px ${config.color}88` }}
            >
              {config.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
