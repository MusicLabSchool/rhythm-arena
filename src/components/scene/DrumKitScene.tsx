import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { DrumKit } from './DrumKit'
import { StudioEnvironment } from './StudioEnvironment'
import { RhythmHighway } from './RhythmHighway'
import { useGameStore } from '@/store/gameStore'

function CameraSetup() {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(0, 1.25, -2.4)
    camera.lookAt(new THREE.Vector3(0, 0.65, 0.75))
  }, [camera])
  return null
}

function SceneContent() {
  const phase = useGameStore((s) => s.phase)

  return (
    <>
      <CameraSetup />
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[2, 4, -1]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <StudioEnvironment />
      <DrumKit />
      {(phase === 'playing' || phase === 'paused') && <RhythmHighway />}
    </>
  )
}

export function DrumKitScene() {
  return (
    <Canvas
      shadows
      camera={{ fov: 65, near: 0.01, far: 60 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <SceneContent />
    </Canvas>
  )
}
