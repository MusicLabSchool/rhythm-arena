import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { computeLimbTransform } from '@/game/animation/LimbAnimator'
import { useGameStore, getStore } from '@/store/gameStore'

// Exported for verification — DO NOT change these without updating both feet and pedals
export const DRUM_POSITIONS = {
  kick:        new THREE.Vector3(0.18, 0.28, 0.95),
  snare:       new THREE.Vector3(-0.25, 0.72, 0.42),
  hihat:       new THREE.Vector3(-0.75, 1.05, 0.48),
  crash:       new THREE.Vector3(-1.1, 1.35, 0.65),
  ride:        new THREE.Vector3(1.18, 1.22, 0.72),
  rackTom1:   new THREE.Vector3(-0.32, 1.15, 0.58),
  rackTom2:   new THREE.Vector3(0.32, 1.12, 0.58),
  floorTom:   new THREE.Vector3(0.95, 0.44, 0.72),
  // Pedals — non-negotiable X positions
  'hihat-pedal': new THREE.Vector3(-0.75, 0.01, 0.62),  // VIEWER LEFT
  'kick-pedal':  new THREE.Vector3(0.18, 0.01, 0.66),   // VIEWER RIGHT
  // Feet
  leftFoot:    new THREE.Vector3(-0.75, 0.09, 0.62),     // rests on hihat pedal
  rightFoot:   new THREE.Vector3(0.18, 0.09, 0.66),      // rests on kick pedal
} as const

const CHROME = { color: '#aaaaaa', metalness: 0.95, roughness: 0.06 } as const
const SHELL = { color: '#111122', metalness: 0.12, roughness: 0.75 } as const
const HEAD =  { color: '#ddd8cc', roughness: 0.9, metalness: 0.0 } as const
const CYMBAL = { color: '#b8860b', metalness: 0.88, roughness: 0.22 } as const
const WOOD_DARK = { color: '#2a1a08', roughness: 0.9, metalness: 0.0 } as const

export function DrumKit() {
  const leftHandRef = useRef<THREE.Group>(null)
  const rightHandRef = useRef<THREE.Group>(null)
  const leftFootRef = useRef<THREE.Group>(null)
  const rightFootRef = useRef<THREE.Group>(null)
  const kickPedalRef = useRef<THREE.Group>(null)
  const hihatPedalRef = useRef<THREE.Group>(null)

  const highlightedDrum = useGameStore((s) => s.highlightedDrum)

  useFrame(() => {
    const now = performance.now()
    const { activeLimbActions } = getStore()

    if (leftHandRef.current) {
      const { rotation, offsetY } = computeLimbTransform(activeLimbActions.leftHand, now)
      leftHandRef.current.rotation.x = -rotation
      leftHandRef.current.position.y = DRUM_POSITIONS.snare.y - 0.22 + offsetY
    }
    if (rightHandRef.current) {
      const { rotation, offsetY } = computeLimbTransform(activeLimbActions.rightHand, now)
      rightHandRef.current.rotation.x = -rotation
      rightHandRef.current.position.y = DRUM_POSITIONS.hihat.y - 0.28 + offsetY
    }
    if (leftFootRef.current) {
      const { rotation } = computeLimbTransform(activeLimbActions.leftFoot, now)
      leftFootRef.current.rotation.x = rotation * 0.6
    }
    if (rightFootRef.current) {
      const { rotation } = computeLimbTransform(activeLimbActions.rightFoot, now)
      rightFootRef.current.rotation.x = rotation * 0.6
    }
    if (kickPedalRef.current) {
      const { rotation } = computeLimbTransform(activeLimbActions.rightFoot, now)
      kickPedalRef.current.rotation.x = rotation * 0.4
    }
    if (hihatPedalRef.current) {
      const { rotation } = computeLimbTransform(activeLimbActions.leftFoot, now)
      hihatPedalRef.current.rotation.x = rotation * 0.4
    }
  })

  const isHighlighted = (drum: string) => highlightedDrum === drum

  return (
    <group>
      {/* === KICK DRUM === */}
      <group position={DRUM_POSITIONS.kick.toArray()}>
        {/* Shell — rotated so circular face points toward camera */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.46, 0.46, 0.58, 32]} />
          <meshStandardMaterial {...SHELL} emissive={isHighlighted('kick') ? '#ff2200' : '#000000'} emissiveIntensity={isHighlighted('kick') ? 0.4 : 0} />
        </mesh>
        {/* Batter head — front face */}
        <mesh position={[0, 0, -0.29]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.46, 32]} />
          <meshStandardMaterial {...HEAD} />
        </mesh>
        {/* Reso head — back face */}
        <mesh position={[0, 0, 0.29]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.46, 32]} />
          <meshStandardMaterial {...HEAD} />
        </mesh>
        {/* Chrome hoop */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.46, 0.018, 8, 32]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        {/* Bass drum legs */}
        <DrumLeg position={[-0.35, -0.46, 0]} rotZ={-0.3} />
        <DrumLeg position={[0.35, -0.46, 0]} rotZ={0.3} />
      </group>

      {/* Kick pedal board */}
      <group position={DRUM_POSITIONS['kick-pedal'].toArray()} ref={kickPedalRef}>
        <mesh>
          <boxGeometry args={[0.16, 0.03, 0.38]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        {/* Beater arm */}
        <mesh position={[0, 0.22, -0.16]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.44, 8]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        {/* Beater head */}
        <mesh position={[0, 0.44, -0.28]} rotation={[0.2, 0, 0]}>
          <sphereGeometry args={[0.035, 12, 8]} />
          <meshStandardMaterial color="#111111" roughness={0.8} />
        </mesh>
      </group>

      {/* === SNARE === */}
      <group position={DRUM_POSITIONS.snare.toArray()}>
        <mesh castShadow>
          <cylinderGeometry args={[0.185, 0.185, 0.11, 32]} />
          <meshStandardMaterial {...CHROME} emissive={isHighlighted('snare') ? '#0044ff' : '#000000'} emissiveIntensity={isHighlighted('snare') ? 0.4 : 0} />
        </mesh>
        <mesh position={[0, 0.055, 0]}>
          <circleGeometry args={[0.185, 32]} />
          <meshStandardMaterial {...HEAD} />
        </mesh>
        <mesh position={[0, -0.055, 0]} rotation={[Math.PI, 0, 0]}>
          <circleGeometry args={[0.185, 32]} />
          <meshStandardMaterial {...HEAD} />
        </mesh>
        {/* Snare stand */}
        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.55, 6]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        <mesh position={[-0.08, -0.58, 0.06]}>
          <cylinderGeometry args={[0.006, 0.006, 0.3, 6]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        <mesh position={[0.1, -0.58, -0.04]}>
          <cylinderGeometry args={[0.006, 0.006, 0.3, 6]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
      </group>

      {/* === HI-HAT === */}
      {/* Stand rod */}
      <mesh position={[DRUM_POSITIONS.hihat.x, 0.52, DRUM_POSITIONS.hihat.z]}>
        <cylinderGeometry args={[0.01, 0.01, 1.04, 8]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>

      {/* Hi-hat pedal — LEFT side */}
      <group position={DRUM_POSITIONS['hihat-pedal'].toArray()} ref={hihatPedalRef}>
        <mesh>
          <boxGeometry args={[0.13, 0.03, 0.35]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
      </group>

      {/* Hi-hat cymbals */}
      <group position={DRUM_POSITIONS.hihat.toArray()}>
        {/* Bottom cymbal */}
        <mesh position={[0, -0.04, 0]}>
          <CymbalGeometry radius={0.22} />
          <meshStandardMaterial {...CYMBAL} emissive={isHighlighted('hihat') ? '#00ff88' : '#000000'} emissiveIntensity={isHighlighted('hihat') ? 0.3 : 0} />
        </mesh>
        {/* Top cymbal */}
        <mesh position={[0, 0.015, 0]}>
          <CymbalGeometry radius={0.22} />
          <meshStandardMaterial {...CYMBAL} emissive={isHighlighted('hihat') ? '#00ff88' : '#000000'} emissiveIntensity={isHighlighted('hihat') ? 0.3 : 0} />
        </mesh>
        {/* Center rod */}
        <mesh>
          <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
      </group>

      {/* === CRASH CYMBAL === */}
      <mesh
        position={DRUM_POSITIONS.crash.toArray()}
        rotation={[0.18, 0, -0.15]}
      >
        <CymbalGeometry radius={0.28} />
        <meshStandardMaterial {...CYMBAL} emissive={isHighlighted('crash') ? '#ffaa00' : '#000000'} emissiveIntensity={isHighlighted('crash') ? 0.4 : 0} />
      </mesh>
      {/* Crash stand */}
      <mesh position={[-1.05, 0.78, 0.62]}>
        <cylinderGeometry args={[0.009, 0.009, 1.1, 8]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>

      {/* === RIDE CYMBAL === */}
      <mesh position={DRUM_POSITIONS.ride.toArray()} rotation={[0.15, 0, 0.12]}>
        <CymbalGeometry radius={0.32} />
        <meshStandardMaterial {...CYMBAL} />
      </mesh>
      {/* Ride stand */}
      <mesh position={[1.12, 0.72, 0.7]}>
        <cylinderGeometry args={[0.009, 0.009, 1.0, 8]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>

      {/* === RACK TOM 1 (left) === */}
      <group position={DRUM_POSITIONS.rackTom1.toArray()} rotation={[0, 0, 0.1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.155, 0.155, 0.14, 32]} />
          <meshStandardMaterial {...SHELL} />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <circleGeometry args={[0.155, 32]} />
          <meshStandardMaterial {...HEAD} />
        </mesh>
        <mesh position={[0, -0.07, 0]} rotation={[Math.PI, 0, 0]}>
          <circleGeometry args={[0.155, 32]} />
          <meshStandardMaterial {...HEAD} />
        </mesh>
      </group>

      {/* === RACK TOM 2 (right) === */}
      <group position={DRUM_POSITIONS.rackTom2.toArray()} rotation={[0, 0, -0.1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.14, 32]} />
          <meshStandardMaterial {...SHELL} />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <circleGeometry args={[0.17, 32]} />
          <meshStandardMaterial {...HEAD} />
        </mesh>
        <mesh position={[0, -0.07, 0]} rotation={[Math.PI, 0, 0]}>
          <circleGeometry args={[0.17, 32]} />
          <meshStandardMaterial {...HEAD} />
        </mesh>
      </group>

      {/* === FLOOR TOM === */}
      <group position={DRUM_POSITIONS.floorTom.toArray()}>
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.36, 32]} />
          <meshStandardMaterial {...SHELL} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <circleGeometry args={[0.22, 32]} />
          <meshStandardMaterial {...HEAD} />
        </mesh>
        {/* Tom legs */}
        <mesh position={[-0.14, -0.24, 0.08]}>
          <cylinderGeometry args={[0.008, 0.008, 0.36, 6]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        <mesh position={[0.14, -0.24, 0.08]}>
          <cylinderGeometry args={[0.008, 0.008, 0.36, 6]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        <mesh position={[0, -0.24, -0.16]}>
          <cylinderGeometry args={[0.008, 0.008, 0.36, 6]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
      </group>

      {/* === DRUM THRONE === */}
      <mesh position={[0, 0.62, -0.52]}>
        <cylinderGeometry args={[0.2, 0.16, 0.06, 6]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.3, -0.52]}>
        <cylinderGeometry args={[0.025, 0.025, 0.62, 8]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>

      {/* === LEFT HAND / STICK (snare side) === */}
      <group
        ref={leftHandRef}
        position={[DRUM_POSITIONS.snare.x - 0.06, DRUM_POSITIONS.snare.y - 0.22, DRUM_POSITIONS.snare.z - 0.18]}
        rotation={[0.35, -0.25, 0.1]}
      >
        {/* Hand/wrist */}
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[0.055, 0.09, 0.12]} />
          <meshStandardMaterial color="#c8956a" roughness={0.8} />
        </mesh>
        {/* Stick */}
        <mesh position={[0.004, 0.22, 0]}>
          <cylinderGeometry args={[0.007, 0.005, 0.44, 8]} />
          <meshStandardMaterial {...WOOD_DARK} />
        </mesh>
        {/* Stick tip */}
        <mesh position={[0.004, 0.44, 0]}>
          <sphereGeometry args={[0.009, 8, 6]} />
          <meshStandardMaterial color="#e8d0a0" roughness={0.6} />
        </mesh>
      </group>

      {/* === RIGHT HAND / STICK (hihat side) === */}
      <group
        ref={rightHandRef}
        position={[DRUM_POSITIONS.hihat.x + 0.05, DRUM_POSITIONS.hihat.y - 0.28, DRUM_POSITIONS.hihat.z - 0.18]}
        rotation={[0.35, 0.25, -0.1]}
      >
        {/* Hand/wrist */}
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[0.055, 0.09, 0.12]} />
          <meshStandardMaterial color="#c8956a" roughness={0.8} />
        </mesh>
        {/* Stick */}
        <mesh position={[-0.004, 0.22, 0]}>
          <cylinderGeometry args={[0.007, 0.005, 0.44, 8]} />
          <meshStandardMaterial {...WOOD_DARK} />
        </mesh>
        {/* Stick tip */}
        <mesh position={[-0.004, 0.44, 0]}>
          <sphereGeometry args={[0.009, 8, 6]} />
          <meshStandardMaterial color="#e8d0a0" roughness={0.6} />
        </mesh>
      </group>

      {/* === LEFT FOOT — on hi-hat pedal (VIEWER LEFT) === */}
      <group ref={leftFootRef} position={DRUM_POSITIONS.leftFoot.toArray()}>
        {/* Leg */}
        <mesh position={[0, -0.2, 0.05]}>
          <cylinderGeometry args={[0.04, 0.038, 0.42, 8]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.055, 0.04]}>
          <boxGeometry args={[0.085, 0.08, 0.22]} />
          <meshStandardMaterial color="#111111" roughness={0.85} />
        </mesh>
        {/* Shoe toe cap */}
        <mesh position={[0, -0.07, 0.13]}>
          <boxGeometry args={[0.082, 0.065, 0.06]} />
          <meshStandardMaterial color="#0d0d0d" roughness={0.8} />
        </mesh>
      </group>

      {/* === RIGHT FOOT — on kick pedal (VIEWER RIGHT) === */}
      <group ref={rightFootRef} position={DRUM_POSITIONS.rightFoot.toArray()}>
        {/* Leg */}
        <mesh position={[0, -0.2, 0.05]}>
          <cylinderGeometry args={[0.04, 0.038, 0.42, 8]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.055, 0.04]}>
          <boxGeometry args={[0.085, 0.08, 0.22]} />
          <meshStandardMaterial color="#111111" roughness={0.85} />
        </mesh>
        {/* Shoe toe cap */}
        <mesh position={[0, -0.07, 0.13]}>
          <boxGeometry args={[0.082, 0.065, 0.06]} />
          <meshStandardMaterial color="#0d0d0d" roughness={0.8} />
        </mesh>
      </group>
    </group>
  )
}

function CymbalGeometry({ radius }: { radius: number }) {
  const shape = new THREE.Shape()
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false)
  return <circleGeometry args={[radius, 48]} />
}

function DrumLeg({ position, rotZ }: { position: [number, number, number]; rotZ: number }) {
  return (
    <mesh position={position} rotation={[0, 0, rotZ]}>
      <cylinderGeometry args={[0.01, 0.01, 0.22, 6]} />
      <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
    </mesh>
  )
}
