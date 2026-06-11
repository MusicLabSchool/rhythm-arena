import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
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
    cam.fov = portrait ? 74 : 60
    cam.position.set(0, portrait ? 1.32 : 1.2, portrait ? -2.6 : -2.05)
    cam.lookAt(new THREE.Vector3(0, 0.72, 0.75))
    cam.updateProjectionMatrix()
  }, [camera, size])
  return null
}

/**
 * Keeps the HDRI's contribution low so it adds realistic reflections to
 * chrome/cymbals WITHOUT washing out the dark stage-lit mood (setting the
 * environment at full strength relights every PBR material in the scene).
 */
function EnvironmentIntensity({ value }: { value: number }) {
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    scene.environmentIntensity = value
    return () => {
      scene.environmentIntensity = 1
    }
  }, [scene, value])
  return null
}

function SceneContent() {
  const phase = useGameStore((s) => s.phase)

  return (
    <>
      <CameraSetup />
      {/* Near-dark base — the kit is carved out of darkness by the warm spots. */}
      <ambientLight intensity={0.12} color="#5a5468" />
      <hemisphereLight args={['#3a3450', '#1a120a', 0.25]} />
      <directionalLight
        position={[2, 4, -2]}
        intensity={0.7}
        color="#ffdcb4"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* HDRI image-based lighting (Poly Haven "Country Club", CC0) —
          gives chrome, cymbals and lacquer real-world reflections. */}
      <Suspense fallback={null}>
        <Environment files="/hdri/studio_1k.hdr" />
      </Suspense>
      <EnvironmentIntensity value={0.3} />
      <StudioEnvironment />
      <DrumKit />
      {/* Soft contact shadow grounds the kit on the rug. */}
      <ContactShadows position={[0, 0.006, 0.6]} opacity={0.45} scale={6} blur={2.4} far={2} color="#000000" />
      {(phase === 'playing' || phase === 'paused') && <RhythmHighway />}
      {/* Gentle glow on the neon sign / hot spotlights + filmic edge darkening */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.55}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.35}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.2} darkness={0.75} />
      </EffectComposer>
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
        toneMappingExposure: 1.15,
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
