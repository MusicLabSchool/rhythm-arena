import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { DrumKit } from './DrumKit'
import { StudioEnvironment } from './StudioEnvironment'
import { RhythmHighway } from './RhythmHighway'
import { useGameStore } from '@/store/gameStore'

function CameraSetup() {
  const { camera, size } = useThree()
  useEffect(() => {
    // Portrait phones crop the horizontal FOV hard — pull back and widen
    // so the whole kit (cymbals to pedals) stays in frame.
    const aspect = size.width / size.height
    const portrait = aspect < 0.9
    const cam = camera as THREE.PerspectiveCamera
    cam.fov = portrait ? 80 : 65
    cam.position.set(0, portrait ? 1.4 : 1.25, portrait ? -3.1 : -2.4)
    cam.lookAt(new THREE.Vector3(0, 0.7, 0.75))
    cam.updateProjectionMatrix()
  }, [camera, size])
  return null
}

function SceneContent() {
  const phase = useGameStore((s) => s.phase)

  return (
    <>
      <CameraSetup />
      <ambientLight intensity={0.55} color="#cdc2b8" />
      <hemisphereLight args={['#9090b8', '#3a2a1a', 0.5]} />
      <directionalLight
        position={[2, 4, -2]}
        intensity={1.3}
        color="#ffe9d2"
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
        toneMappingExposure: 1.3,
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
