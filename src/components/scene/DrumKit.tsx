import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { strikeProgress, cymbalWobble, drumHitTimes } from '@/game/animation/LimbAnimator'
import { getStore } from '@/store/gameStore'
import { makeTextTexture } from '@/game/utils/textTexture'
import { makeWoodShellTexture, makeBrushedMetalTexture, makeCymbalTexture } from '@/game/utils/materialTextures'
import type { ActiveDrumId } from '@/types'

// Exported for verification — DO NOT change these without updating both feet and pedals.
// NOTE on handedness: the camera sits at -Z looking toward +Z, so the camera's
// screen-left is world +X. Player-left things (hi-hat, hi-hat pedal, left foot)
// therefore live at POSITIVE x — negating these mirrors the kit into a lefty setup.
export const DRUM_POSITIONS = {
  kick:        new THREE.Vector3(-0.18, 0.46, 0.98),
  snare:       new THREE.Vector3(0.25, 0.72, 0.42),
  hihat:       new THREE.Vector3(0.75, 1.05, 0.48),
  crash:       new THREE.Vector3(1.1, 1.35, 0.65),
  ride:        new THREE.Vector3(-1.18, 1.22, 0.72),
  rackTom1:    new THREE.Vector3(0.32, 1.15, 0.58),
  rackTom2:    new THREE.Vector3(-0.32, 1.12, 0.58),
  floorTom:    new THREE.Vector3(-0.95, 0.44, 0.72),
  // Pedals — non-negotiable: hi-hat pedal on the player's LEFT (screen left)
  'hihat-pedal': new THREE.Vector3(0.75, 0.015, 0.40),
  'kick-pedal':  new THREE.Vector3(-0.18, 0.015, 0.45),
  // Feet — group origin at the heel so taps pivot like a real ankle
  leftFoot:    new THREE.Vector3(0.75, 0.07, 0.36),      // rests on hihat pedal
  rightFoot:   new THREE.Vector3(-0.18, 0.07, 0.41),     // rests on kick pedal
} as const

const CHROME = { color: '#b8bcc4', metalness: 0.95, roughness: 0.08 } as const
const SHELL  = { color: '#4a2014', metalness: 0.2, roughness: 0.3 } as const // dark walnut lacquer
const STEEL_SHELL = { color: '#c8ccd4', metalness: 0.85, roughness: 0.25 } as const
const HEAD   = { color: '#b8b0a0', roughness: 0.9, metalness: 0.0 } as const
const CYMBAL = { color: '#d9a838', metalness: 0.95, roughness: 0.18 } as const
const STICK  = { color: '#dcb47e', roughness: 0.5, metalness: 0.0 } as const

// ── Hand pose system ────────────────────────────────────────────────
// Each hand rests near its home drum and swings toward the drum being
// struck. Stick = local +Y; rotation.x tilts the tip forward/down.

interface HandPose {
  pos: readonly [number, number, number]
  rot: readonly [number, number, number]
}

// POV sticks: rest near the camera at the bottom corners of the frame
// (player's left hand = screen-left = world +X) and flick forward toward
// the target drum on a strike, like a first-person drummer.
const LEFT_HAND_REST: HandPose = { pos: [0.36, 0.62, -1.45], rot: [1.18, 0, 0.28] }
const LEFT_HAND_TARGETS: Partial<Record<ActiveDrumId, HandPose>> = {
  snare: { pos: [0.34, 0.56, -1.34], rot: [1.5, 0, 0.3] },
}

const RIGHT_HAND_REST: HandPose = { pos: [-0.36, 0.62, -1.45], rot: [1.18, 0, -0.28] }
const RIGHT_HAND_TARGETS: Partial<Record<ActiveDrumId, HandPose>> = {
  hihat: { pos: [-0.3, 0.58, -1.34], rot: [1.45, 0, -0.55] },
  crash: { pos: [-0.26, 0.64, -1.3], rot: [1.35, 0, -0.7] },
}

function applyHandPose(g: THREE.Group | null, rest: HandPose, target: HandPose, s: number): void {
  if (!g) return
  g.position.set(
    rest.pos[0] + (target.pos[0] - rest.pos[0]) * s,
    rest.pos[1] + (target.pos[1] - rest.pos[1]) * s,
    rest.pos[2] + (target.pos[2] - rest.pos[2]) * s,
  )
  g.rotation.set(
    rest.rot[0] + (target.rot[0] - rest.rot[0]) * s,
    rest.rot[1] + (target.rot[1] - rest.rot[1]) * s,
    rest.rot[2] + (target.rot[2] - rest.rot[2]) * s,
  )
}

export function DrumKit() {
  const leftHandRef = useRef<THREE.Group>(null)
  const rightHandRef = useRef<THREE.Group>(null)
  const leftFootRef = useRef<THREE.Group>(null)
  const rightFootRef = useRef<THREE.Group>(null)
  const kickPedalRef = useRef<THREE.Group>(null)
  const hihatPedalRef = useRef<THREE.Group>(null)
  const beaterRef = useRef<THREE.Group>(null)
  const crashRef = useRef<THREE.Group>(null)
  const hihatTopRef = useRef<THREE.Group>(null)

  const kickMat = useRef<THREE.MeshPhysicalMaterial>(null)
  const snareMat = useRef<THREE.MeshPhysicalMaterial>(null)
  const hihatMat = useRef<THREE.MeshStandardMaterial>(null)
  const crashMat = useRef<THREE.MeshStandardMaterial>(null)

  const kickLogo = useMemo(
    () => makeTextTexture('MUSIC LAB', {
      fill: '#efe6d6',
      width: 512,
      height: 512,
      font: '900 64px system-ui, sans-serif',
    }),
    [],
  )

  // Procedural shell/cymbal finishes — wood grain, brushed steel, lathe rings.
  const woodShellTex = useMemo(() => makeWoodShellTexture(SHELL.color), [])
  const brushedSteelTex = useMemo(() => makeBrushedMetalTexture(STEEL_SHELL.color), [])
  const cymbalTex = useMemo(() => makeCymbalTexture(CYMBAL.color), [])

  useFrame(() => {
    const now = performance.now()
    const { activeLimbActions } = getStore()

    // Hands — swing from rest toward the struck drum and back.
    const la = activeLimbActions.leftHand
    applyHandPose(
      leftHandRef.current,
      LEFT_HAND_REST,
      LEFT_HAND_TARGETS[la?.drumId ?? 'snare'] ?? LEFT_HAND_TARGETS.snare!,
      strikeProgress(la, now),
    )
    const ra = activeLimbActions.rightHand
    applyHandPose(
      rightHandRef.current,
      RIGHT_HAND_REST,
      RIGHT_HAND_TARGETS[ra?.drumId ?? 'hihat'] ?? RIGHT_HAND_TARGETS.hihat!,
      strikeProgress(ra, now),
    )

    // Feet & pedals — heel-pivot taps; boards dip with the foot.
    const lf = strikeProgress(activeLimbActions.leftFoot, now)
    if (leftFootRef.current) leftFootRef.current.rotation.x = lf * 0.38
    if (hihatPedalRef.current) hihatPedalRef.current.rotation.x = lf * 0.3

    const rf = strikeProgress(activeLimbActions.rightFoot, now)
    if (rightFootRef.current) rightFootRef.current.rotation.x = rf * 0.42
    if (kickPedalRef.current) kickPedalRef.current.rotation.x = rf * 0.32
    // Beater rests tilted back toward the player, whips forward into the head.
    if (beaterRef.current) beaterRef.current.rotation.x = -0.5 + rf * 0.68

    // Cymbals — decaying wobble after each strike.
    if (crashRef.current) {
      const w = cymbalWobble('crash', now, 0.22)
      crashRef.current.rotation.x = 0.18 + w.x
      crashRef.current.rotation.z = 0.15 + w.z
    }
    if (hihatTopRef.current) {
      const w = cymbalWobble('hihat', now, 0.07)
      hihatTopRef.current.rotation.x = w.x
      hihatTopRef.current.rotation.z = w.z
      // Pedal press "chicks" the top cymbal down onto the bottom one.
      hihatTopRef.current.position.y = 0.018 - lf * 0.016
    }

    // Shell glow flash on hit.
    const flash = (d: ActiveDrumId): number => {
      const h = drumHitTimes[d]
      if (h === undefined) return 0
      const e = now - h
      return e < 0 || e > 300 ? 0 : Math.exp(-e / 90)
    }
    if (kickMat.current) kickMat.current.emissiveIntensity = flash('kick') * 0.5
    if (snareMat.current) snareMat.current.emissiveIntensity = flash('snare') * 0.6
    if (hihatMat.current) hihatMat.current.emissiveIntensity = flash('hihat') * 0.4
    if (crashMat.current) crashMat.current.emissiveIntensity = flash('crash') * 0.5
  })

  return (
    <group>
      {/* === KICK DRUM — axis along Z, batter head faces the player === */}
      <group position={DRUM_POSITIONS.kick.toArray()}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.46, 0.46, 0.58, 40]} />
          <meshPhysicalMaterial
            ref={kickMat}
            {...SHELL}
            map={woodShellTex}
            color="#ffffff"
            clearcoat={0.6}
            clearcoatRoughness={0.2}
            emissive="#ff5533"
            emissiveIntensity={0}
          />
        </mesh>
        {/* Batter head (faces camera) — dark with Music Lab logo */}
        <mesh position={[0, 0, -0.293]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[0.455, 40]} />
          <meshStandardMaterial color="#181614" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, -0.296]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[0.3, 40]} />
          <meshBasicMaterial map={kickLogo} transparent />
        </mesh>
        {/* Reso head */}
        <mesh position={[0, 0, 0.293]}>
          <circleGeometry args={[0.455, 40]} />
          <meshStandardMaterial {...HEAD} />
        </mesh>
        {/* Chrome hoops */}
        <mesh position={[0, 0, -0.29]}>
          <torusGeometry args={[0.465, 0.016, 8, 40]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        <mesh position={[0, 0, 0.29]}>
          <torusGeometry args={[0.465, 0.016, 8, 40]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        {/* Spurs */}
        <DrumLeg position={[-0.4, -0.32, 0.05]} rotZ={-0.35} length={0.35} />
        <DrumLeg position={[0.4, -0.32, 0.05]} rotZ={0.35} length={0.35} />
      </group>

      {/* === KICK PEDAL — board, frame, swinging beater === */}
      <group position={DRUM_POSITIONS['kick-pedal'].toArray()}>
        <group ref={kickPedalRef}>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.16, 0.025, 0.3]} />
            <meshStandardMaterial {...CHROME} />
          </mesh>
        </group>
        {/* Frame posts */}
        <mesh position={[-0.055, 0.045, 0.16]}>
          <cylinderGeometry args={[0.007, 0.007, 0.09, 8]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        <mesh position={[0.055, 0.045, 0.16]}>
          <cylinderGeometry args={[0.007, 0.007, 0.09, 8]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        {/* Beater — pivots at the axle, swings into the batter head */}
        <group ref={beaterRef} position={[0, 0.05, 0.16]} rotation={[-0.5, 0, 0]}>
          <mesh position={[0, 0.19, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.38, 8]} />
            <meshStandardMaterial {...CHROME} />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <sphereGeometry args={[0.045, 12, 10]} />
            <meshStandardMaterial color="#3a3632" roughness={0.95} />
          </mesh>
        </group>
      </group>

      {/* === SNARE — steel shell on a stand === */}
      <group position={DRUM_POSITIONS.snare.toArray()}>
        <ShellDrum
          radius={0.185}
          depth={0.12}
          shell={STEEL_SHELL}
          map={brushedSteelTex}
          emissive="#4488ff"
          matRef={snareMat}
          lugs={8}
          clearcoat={0.4}
          clearcoatRoughness={0.1}
        />
        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.009, 0.009, 0.56, 8]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        <mesh position={[-0.08, -0.58, 0.06]} rotation={[0.2, 0, 0.35]}>
          <cylinderGeometry args={[0.006, 0.006, 0.3, 6]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        <mesh position={[0.1, -0.58, -0.04]} rotation={[-0.15, 0, -0.35]}>
          <cylinderGeometry args={[0.006, 0.006, 0.3, 6]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
      </group>

      {/* === HI-HAT === */}
      <mesh position={[DRUM_POSITIONS.hihat.x, 0.52, DRUM_POSITIONS.hihat.z]}>
        <cylinderGeometry args={[0.01, 0.012, 1.04, 8]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      <group position={DRUM_POSITIONS['hihat-pedal'].toArray()} ref={hihatPedalRef}>
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[0.13, 0.025, 0.3]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
      </group>
      <group position={DRUM_POSITIONS.hihat.toArray()}>
        {/* Top cymbal — wobbles and "chicks" down with the pedal */}
        <group ref={hihatTopRef} position={[0, 0.018, 0]}>
          <Cymbal radius={0.22} matRef={hihatMat} emissive="#33ffaa" map={cymbalTex} />
        </group>
        {/* Bottom cymbal — inverted, static */}
        <mesh position={[0, -0.018, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.22, 0.028, 40, 1, true]} />
          <meshStandardMaterial {...CYMBAL} map={cymbalTex} color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.008, 0.008, 0.14, 8]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
      </group>

      {/* === CRASH — wobbles when struck === */}
      <group position={DRUM_POSITIONS.crash.toArray()} ref={crashRef} rotation={[0.18, 0, 0.15]}>
        <Cymbal radius={0.28} matRef={crashMat} emissive="#ffaa33" map={cymbalTex} />
      </group>
      <mesh position={[1.08, 0.67, 0.63]}>
        <cylinderGeometry args={[0.009, 0.012, 1.34, 8]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>

      {/* === RIDE === */}
      <group position={DRUM_POSITIONS.ride.toArray()} rotation={[0.15, 0, -0.12]}>
        <Cymbal radius={0.32} map={cymbalTex} />
      </group>
      <mesh position={[-1.16, 0.61, 0.7]}>
        <cylinderGeometry args={[0.009, 0.012, 1.22, 8]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>

      {/* === RACK TOMS — tilted toward the player === */}
      <group position={DRUM_POSITIONS.rackTom1.toArray()} rotation={[-0.28, 0, -0.08]}>
        <ShellDrum radius={0.155} depth={0.16} map={woodShellTex} />
      </group>
      <group position={DRUM_POSITIONS.rackTom2.toArray()} rotation={[-0.28, 0, 0.08]}>
        <ShellDrum radius={0.17} depth={0.16} map={woodShellTex} />
      </group>

      {/* === FLOOR TOM === */}
      <group position={DRUM_POSITIONS.floorTom.toArray()}>
        <ShellDrum radius={0.22} depth={0.36} map={woodShellTex} />
        <mesh position={[-0.16, -0.3, 0.1]}>
          <cylinderGeometry args={[0.008, 0.008, 0.32, 6]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        <mesh position={[0.16, -0.3, 0.1]}>
          <cylinderGeometry args={[0.008, 0.008, 0.32, 6]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
        <mesh position={[0, -0.3, -0.18]}>
          <cylinderGeometry args={[0.008, 0.008, 0.32, 6]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
      </group>

      {/* === HANDS & STICKS — posed every frame in useFrame === */}
      <Hand groupRef={leftHandRef} />
      <Hand groupRef={rightHandRef} />

      {/* === LEFT FOOT — hi-hat pedal (player's LEFT), heel pivot === */}
      <Foot groupRef={leftFootRef} position={DRUM_POSITIONS.leftFoot.toArray()} rotationY={0.21} />

      {/* === RIGHT FOOT — kick pedal (player's RIGHT), heel pivot === */}
      <Foot groupRef={rightFootRef} position={DRUM_POSITIONS.rightFoot.toArray()} rotationY={-0.07} />
    </group>
  )
}

// ── Reusable pieces ─────────────────────────────────────────────────

function ShellDrum({
  radius,
  depth,
  shell = SHELL,
  map,
  emissive = '#000000',
  matRef,
  lugs = 6,
  clearcoat = 0.5,
  clearcoatRoughness = 0.2,
}: {
  radius: number
  depth: number
  shell?: { color: string; metalness: number; roughness: number; envMapIntensity?: number }
  map?: THREE.Texture
  emissive?: string
  matRef?: React.Ref<THREE.MeshPhysicalMaterial>
  lugs?: number
  clearcoat?: number
  clearcoatRoughness?: number
}) {
  const lugAngles = Array.from({ length: lugs }, (_, i) => (i / lugs) * Math.PI * 2)
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius, depth, 32]} />
        <meshPhysicalMaterial
          ref={matRef}
          {...shell}
          map={map}
          color={map ? '#ffffff' : shell.color}
          clearcoat={clearcoat}
          clearcoatRoughness={clearcoatRoughness}
          emissive={emissive}
          emissiveIntensity={0}
        />
      </mesh>
      {/* Batter head — horizontal, facing up */}
      <mesh position={[0, depth / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 32]} />
        <meshStandardMaterial {...HEAD} />
      </mesh>
      {/* Hoops */}
      <mesh position={[0, depth / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius + 0.005, 0.011, 8, 32]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      <mesh position={[0, -depth / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius + 0.005, 0.011, 8, 32]} />
        <meshStandardMaterial {...CHROME} />
      </mesh>
      {/* Tension lugs around the shell */}
      {lugAngles.map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * (radius + 0.008), 0, Math.sin(a) * (radius + 0.008)]}>
          <boxGeometry args={[0.018, depth * 0.55, 0.018]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>
      ))}
    </group>
  )
}

function Cymbal({
  radius,
  matRef,
  emissive = '#000000',
  map,
}: {
  radius: number
  matRef?: React.Ref<THREE.MeshStandardMaterial>
  emissive?: string
  map?: THREE.Texture
}) {
  return (
    <group>
      <mesh castShadow>
        <coneGeometry args={[radius, radius * 0.14, 40, 1, true]} />
        <meshStandardMaterial
          ref={matRef}
          {...CYMBAL}
          map={map}
          color={map ? '#ffffff' : CYMBAL.color}
          side={THREE.DoubleSide}
          emissive={emissive}
          emissiveIntensity={0}
        />
      </mesh>
      {/* Bell */}
      <mesh position={[0, radius * 0.07, 0]} scale={[1, 0.55, 1]}>
        <sphereGeometry args={[radius * 0.18, 16, 10]} />
        <meshStandardMaterial {...CYMBAL} />
      </mesh>
    </group>
  )
}

function Hand({ groupRef }: { groupRef: React.Ref<THREE.Group> }) {
  return (
    <group ref={groupRef}>
      {/* Stick — light hickory, slightly oversized so the POV grip reads clearly */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.0095, 0.0072, 0.44, 8]} />
        <meshStandardMaterial {...STICK} />
      </mesh>
      {/* Tip */}
      <mesh position={[0, 0.425, 0]}>
        <sphereGeometry args={[0.013, 8, 6]} />
        <meshStandardMaterial color="#e8d0a0" roughness={0.6} />
      </mesh>
    </group>
  )
}

function Foot({
  groupRef,
  position,
  rotationY,
}: {
  groupRef: React.Ref<THREE.Group>
  position: [number, number, number]
  rotationY: number
}) {
  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      {/* Shin — leans back toward the player */}
      <mesh position={[0, 0.25, -0.2]} rotation={[-0.72, 0, 0]}>
        <cylinderGeometry args={[0.042, 0.038, 0.64, 10]} />
        <meshStandardMaterial color="#23233a" roughness={0.9} />
      </mesh>
      {/* Shoe — extends forward from the heel (group origin) */}
      <mesh position={[0, -0.01, 0.1]} castShadow>
        <boxGeometry args={[0.09, 0.06, 0.24]} />
        <meshStandardMaterial color="#111111" roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.015, 0.215]}>
        <boxGeometry args={[0.088, 0.05, 0.07]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.8} />
      </mesh>
    </group>
  )
}

function DrumLeg({ position, rotZ, length = 0.22 }: { position: [number, number, number]; rotZ: number; length?: number }) {
  return (
    <mesh position={position} rotation={[0, 0, rotZ]}>
      <cylinderGeometry args={[0.01, 0.01, length, 6]} />
      <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
    </mesh>
  )
}
