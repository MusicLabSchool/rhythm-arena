import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { audioEngine } from '@/game/audio/NativeAudioEngine'

function VolumeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/50 text-xs w-24 shrink-0">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-purple-500"
      />
      <span className="text-white/30 text-xs w-8 text-right">{Math.round(value * 100)}</span>
    </div>
  )
}

export function SettingsPanel() {
  const setPhase = useGameStore((s) => s.setPhase)
  const masterVolume = useGameStore((s) => s.masterVolume)
  const drumsVolume = useGameStore((s) => s.drumsVolume)
  const metronomeVolume = useGameStore((s) => s.metronomeVolume)
  const setVolume = useGameStore((s) => s.setVolume)
  const latencyOffsetMs = useGameStore((s) => s.latencyOffsetMs)

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{ zIndex: 35 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">Settings</h2>
          <button onClick={() => setPhase('menu')} className="text-white/40 hover:text-white/70 text-xl">✕</button>
        </div>

        <div className="space-y-4">
          <VolumeSlider
            label="Master"
            value={masterVolume}
            onChange={(v) => { setVolume('master', v); audioEngine.setMasterVolume(v) }}
          />
          <VolumeSlider
            label="Drums"
            value={drumsVolume}
            onChange={(v) => { setVolume('drums', v); audioEngine.setDrumsVolume(v) }}
          />
          <VolumeSlider
            label="Metronome"
            value={metronomeVolume}
            onChange={(v) => { setVolume('metronome', v); audioEngine.setMetronomeVolume(v) }}
          />
        </div>

        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/60 text-xs font-medium">Input Latency</div>
              <div className="text-white/30 text-[10px]">
                {latencyOffsetMs === 0 ? 'Not calibrated' : `${latencyOffsetMs > 0 ? '+' : ''}${latencyOffsetMs}ms compensation`}
              </div>
            </div>
            <button
              onClick={() => setPhase('calibration')}
              className="px-3 py-1.5 bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-semibold rounded-lg hover:bg-purple-500/30 transition-colors"
            >
              Calibrate
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 text-white/20 text-[10px] text-center">
          Keyboard: D=Kick · F=Snare · J=Hi-hat · K=Crash
        </div>
      </div>
    </motion.div>
  )
}
