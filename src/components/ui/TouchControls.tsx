import { useCallback } from 'react'
import type { ActiveDrumId } from '@/types'
import { gameRuntime } from '@/game/core/GameRuntime'

interface DrumPad {
  id: ActiveDrumId
  label: string
  sublabel: string
  color: string
  bg: string
}

const PADS: DrumPad[] = [
  { id: 'hihat', label: 'HI-HAT', sublabel: 'Left Foot', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  { id: 'snare', label: 'SNARE',  sublabel: 'Left Hand',  color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  { id: 'kick',  label: 'KICK',   sublabel: 'Right Foot', color: '#ef4444', bg: 'rgba(239,68,68,0.15)'   },
  { id: 'crash', label: 'CRASH',  sublabel: 'Right Hand', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
]

export function TouchControls() {
  const handleHit = useCallback((drumId: ActiveDrumId) => {
    gameRuntime.onDrumHit(drumId)
  }, [])

  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex"
      style={{ zIndex: 22, height: '22vh', maxHeight: 140 }}
    >
      {PADS.map((pad) => (
        <button
          key={pad.id}
          className="flex-1 flex flex-col items-center justify-center border-t select-none active:opacity-70 transition-opacity"
          style={{
            background: pad.bg,
            borderColor: `${pad.color}33`,
            touchAction: 'none',
            WebkitUserSelect: 'none',
          }}
          onPointerDown={(e) => {
            e.preventDefault()
            handleHit(pad.id)
          }}
        >
          <div className="text-[10px] font-black tracking-wider" style={{ color: pad.color }}>
            {pad.label}
          </div>
          <div className="text-white/30 text-[8px] tracking-wide">{pad.sublabel}</div>
        </button>
      ))}
    </div>
  )
}
