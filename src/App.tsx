import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { DrumKitScene } from '@/components/scene/DrumKitScene'
import { GameHUD } from '@/components/ui/GameHUD'
import { FreePlayScreen } from '@/components/ui/FreePlayScreen'
import { MenuScreen } from '@/components/ui/MenuScreen'
import { ResultsScreen } from '@/components/ui/ResultsScreen'
import { PauseScreen } from '@/components/ui/PauseScreen'
import { TouchControls } from '@/components/ui/TouchControls'
import { SettingsPanel } from '@/components/ui/SettingsPanel'
import { MIDIMapper } from '@/components/ui/MIDIMapper'
import { CalibrationScreen } from '@/components/ui/CalibrationScreen'
import { KeyboardInput } from '@/game/input/KeyboardInput'
import { midiInput } from '@/game/input/MidiInput'
import { gameRuntime } from '@/game/core/GameRuntime'
import { attachAudioUnlock } from '@/game/audio/unlockAudio'

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const isMobile = useGameStore((s) => s.isMobile)
  const setIsMobile = useGameStore((s) => s.setIsMobile)
  const midiMapping = useGameStore((s) => s.midiMapping)

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [setIsMobile])

  // Audio unlock
  useEffect(() => {
    attachAudioUnlock()
  }, [])

  // Keyboard input
  useEffect(() => {
    const kb = new KeyboardInput((drumId) => gameRuntime.onDrumHit(drumId))
    kb.attach()
    return () => kb.detach()
  }, [])

  // Escape pauses / resumes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const s = useGameStore.getState()
      if (s.phase === 'playing') {
        gameRuntime.pause()
        s.setPhase('paused')
      } else if (s.phase === 'paused') {
        s.setPhase('playing')
        gameRuntime.resume()
      } else if (s.phase === 'freeplay') {
        s.setPhase('menu')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // MIDI input
  useEffect(() => {
    midiInput.init().then((ok) => {
      if (ok) {
        midiInput.listen(midiMapping, (drumId, velocity) => gameRuntime.onDrumHit(drumId, velocity))
      }
    })
  }, [midiMapping])

  return (
    <div className="w-screen h-screen bg-game-bg overflow-hidden relative select-none">
      {/* 3D canvas — always mounted */}
      <DrumKitScene />

      {/* Phase-based overlays */}
      <AnimatePresence mode="wait">
        {phase === 'menu' && <MenuScreen key="menu" />}
        {phase === 'playing' && <GameHUD key="hud" />}
        {phase === 'freeplay' && <FreePlayScreen key="freeplay" />}
        {phase === 'paused' && <PauseScreen key="pause" />}
        {phase === 'results' && <ResultsScreen key="results" />}
        {phase === 'settings' && <SettingsPanel key="settings" />}
        {phase === 'midi-setup' && <MIDIMapper key="midi" />}
        {phase === 'calibration' && <CalibrationScreen key="calibration" />}
      </AnimatePresence>

      {/* Touch controls — during gameplay or free play on mobile */}
      {isMobile && (phase === 'playing' || phase === 'freeplay') && <TouchControls />}
    </div>
  )
}
