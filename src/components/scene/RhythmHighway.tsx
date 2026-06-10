import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getStore } from '@/store/gameStore'
import type { HitRating } from '@/types'

// Lane colours: [hihat, snare, kick, crash]
const LANE_COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'] as const

const HIT_Z = -0.25
const FAR_Z = -5.5
const HIGHWAY_Y = 1.82
const LANE_WIDTH_NEAR = 1.8
const LANE_WIDTH_FAR = 0.12
const LANE_COUNT = 4
const NOTE_TRAVEL_MS = 2200

function laneXAtZ(lane: number, z: number): number {
  const t = (z - FAR_Z) / (HIT_Z - FAR_Z)
  const totalWidthAtZ = LANE_WIDTH_FAR + (LANE_WIDTH_NEAR - LANE_WIDTH_FAR) * t
  const laneStep = totalWidthAtZ / LANE_COUNT
  const centerOffset = (LANE_COUNT - 1) / 2
  return (lane - centerOffset) * laneStep
}

function noteWidthAtZ(z: number): number {
  const t = Math.max(0, (z - FAR_Z) / (HIT_Z - FAR_Z))
  const totalWidth = LANE_WIDTH_FAR + (LANE_WIDTH_NEAR - LANE_WIDTH_FAR) * t
  return (totalWidth / LANE_COUNT) * 0.82
}

function noteHeightAtZ(z: number): number {
  const t = Math.max(0, (z - FAR_Z) / (HIT_Z - FAR_Z))
  return 0.01 + 0.14 * t
}

export function RhythmHighway() {
  const groupRef = useRef<THREE.Group>(null)

  // Precompute lane background trapezoids
  const laneBackgrounds = useMemo(() => {
    return Array.from({ length: LANE_COUNT }, (_, i) => {
      const shape = new THREE.Shape()
      const farX = laneXAtZ(i, FAR_Z)
      const nearX = laneXAtZ(i, HIT_Z)
      const halfWidthFar = (noteWidthAtZ(FAR_Z) / 0.82) * 0.45
      const halfWidthNear = (noteWidthAtZ(HIT_Z) / 0.82) * 0.45
      shape.moveTo(farX - halfWidthFar, FAR_Z)
      shape.lineTo(farX + halfWidthFar, FAR_Z)
      shape.lineTo(nearX + halfWidthNear, HIT_Z)
      shape.lineTo(nearX - halfWidthNear, HIT_Z)
      shape.closePath()
      return { shape, color: LANE_COLORS[i] }
    })
  }, [])

  // Lane divider line geometries
  const dividerGeos = useMemo(() => {
    return Array.from({ length: LANE_COUNT - 1 }, (_, i) => {
      const pts = [
        new THREE.Vector3(laneXAtZ(i + 0.5, FAR_Z), HIGHWAY_Y + 0.01, FAR_Z),
        new THREE.Vector3(laneXAtZ(i + 0.5, HIT_Z), HIGHWAY_Y + 0.01, HIT_Z),
      ]
      return new THREE.BufferGeometry().setFromPoints(pts)
    })
  }, [])

  return (
    <group ref={groupRef}>
      {/* Lane backgrounds */}
      {laneBackgrounds.map(({ shape, color }, i) => {
        const geo = new THREE.ShapeGeometry(shape)
        return (
          <mesh
            key={i}
            position={[0, HIGHWAY_Y - 0.005, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            renderOrder={1}
          >
            <primitive object={geo} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.09}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}

      {/* Lane dividers */}
      {dividerGeos.map((geo, i) => {
        const lineMat = new THREE.LineBasicMaterial({ color: '#334455', transparent: true, opacity: 0.4 })
        const lineObj = new THREE.Line(geo, lineMat)
        return <primitive key={i} object={lineObj} renderOrder={2} />
      })}

      {/* Hit line */}
      <mesh position={[0, HIGHWAY_Y + 0.018, HIT_Z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
        <planeGeometry args={[LANE_WIDTH_NEAR + 0.12, 0.025]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} depthWrite={false} />
      </mesh>

      {/* Hit line glow */}
      <mesh position={[0, HIGHWAY_Y + 0.012, HIT_Z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
        <planeGeometry args={[LANE_WIDTH_NEAR + 0.35, 0.08]} />
        <meshBasicMaterial color="#88aaff" transparent opacity={0.18} depthWrite={false} />
      </mesh>

      {/* Scrolling notes */}
      <ActiveNotes />

      {/* Hit-line impact effects */}
      <HitBurst />
    </group>
  )
}

const RATING_BURST_COLORS: Record<HitRating, string> = {
  PERFECT: '#fbbf24',
  GREAT: '#60a5fa',
  GOOD: '#86efac',
  MISS: '#f87171',
}

const RING_DURATION_MS = 380
const MISS_RING_DURATION_MS = 240
const PARTICLE_LIFETIME_MS = 480
const RING_POOL = 6
const PARTICLE_POOL = 60

interface RingState {
  active: boolean
  start: number
  lane: number
  color: string
  isMiss: boolean
}

interface ParticleState {
  active: boolean
  start: number
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  color: string
}

/** Expanding rings + scattering sparks fired at the hit line on every judged hit. */
function HitBurst() {
  const ringMeshes = useRef<(THREE.Mesh | null)[]>(new Array(RING_POOL).fill(null))
  const ringStates = useRef<RingState[]>(
    Array.from({ length: RING_POOL }, () => ({ active: false, start: 0, lane: 0, color: '#ffffff', isMiss: false })),
  )
  const nextRing = useRef(0)

  const particleMeshes = useRef<(THREE.Mesh | null)[]>(new Array(PARTICLE_POOL).fill(null))
  const particleStates = useRef<ParticleState[]>(
    Array.from({ length: PARTICLE_POOL }, () => ({ active: false, start: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, color: '#ffffff' })),
  )
  const nextParticle = useRef(0)
  const lastEffectId = useRef(0)

  useFrame(() => {
    const { hitEffect } = getStore()
    const now = performance.now()

    if (hitEffect && hitEffect.id !== lastEffectId.current) {
      lastEffectId.current = hitEffect.id
      const isMiss = hitEffect.rating === 'MISS'
      const color = isMiss ? RATING_BURST_COLORS.MISS : (LANE_COLORS[hitEffect.lane] ?? RATING_BURST_COLORS[hitEffect.rating])

      const ri = nextRing.current
      nextRing.current = (ri + 1) % RING_POOL
      ringStates.current[ri] = { active: true, start: now, lane: hitEffect.lane, color, isMiss }

      if (!isMiss) {
        const count = hitEffect.rating === 'PERFECT' ? 12 : hitEffect.rating === 'GREAT' ? 8 : 5
        const x = laneXAtZ(hitEffect.lane, HIT_Z)
        for (let i = 0; i < count; i++) {
          const pi = nextParticle.current
          nextParticle.current = (nextParticle.current + 1) % PARTICLE_POOL
          const angle = Math.random() * Math.PI * 2
          const speed = 0.5 + Math.random() * 1.0
          particleStates.current[pi] = {
            active: true,
            start: now,
            x, y: HIGHWAY_Y + 0.02, z: HIT_Z,
            vx: Math.cos(angle) * speed,
            vy: 0.9 + Math.random() * 1.1,
            vz: Math.sin(angle) * speed * 0.5,
            color,
          }
        }
      }
    }

    for (let i = 0; i < RING_POOL; i++) {
      const st = ringStates.current[i]
      const mesh = ringMeshes.current[i]
      if (!mesh) continue
      if (!st.active) { mesh.visible = false; continue }
      const duration = st.isMiss ? MISS_RING_DURATION_MS : RING_DURATION_MS
      const t = (now - st.start) / duration
      if (t >= 1) { st.active = false; mesh.visible = false; continue }
      mesh.visible = true
      const scale = 0.5 + t * (st.isMiss ? 1.6 : 2.6)
      mesh.scale.set(scale, scale, scale)
      mesh.position.set(laneXAtZ(st.lane, HIT_Z), HIGHWAY_Y + 0.025, HIT_Z)
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.color.set(st.color)
      mat.opacity = (1 - t) * (st.isMiss ? 0.45 : 0.85)
    }

    const GRAVITY = 3.4
    for (let i = 0; i < PARTICLE_POOL; i++) {
      const st = particleStates.current[i]
      const mesh = particleMeshes.current[i]
      if (!mesh) continue
      if (!st.active) { mesh.visible = false; continue }
      const t = (now - st.start) / PARTICLE_LIFETIME_MS
      if (t >= 1) { st.active = false; mesh.visible = false; continue }
      mesh.visible = true
      const dt = t * (PARTICLE_LIFETIME_MS / 1000)
      mesh.position.set(
        st.x + st.vx * dt,
        st.y + st.vy * dt - 0.5 * GRAVITY * dt * dt,
        st.z + st.vz * dt,
      )
      const scale = (1 - t) * 0.045
      mesh.scale.set(scale, scale, scale)
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.color.set(st.color)
      mat.opacity = 1 - t
    }
  })

  return (
    <group>
      {Array.from({ length: RING_POOL }, (_, i) => (
        <mesh
          key={`ring-${i}`}
          visible={false}
          renderOrder={7}
          rotation={[-Math.PI / 2, 0, 0]}
          ref={(m) => { ringMeshes.current[i] = m }}
        >
          <ringGeometry args={[0.16, 0.24, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
      {Array.from({ length: PARTICLE_POOL }, (_, i) => (
        <mesh
          key={`spark-${i}`}
          visible={false}
          renderOrder={7}
          ref={(m) => { particleMeshes.current[i] = m }}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  )
}

const POOL_SIZE = 128

function ActiveNotes() {
  const meshPoolRef = useRef<(THREE.Mesh | null)[]>(new Array(POOL_SIZE).fill(null))
  const assignedIds = useRef<string[]>(new Array(POOL_SIZE).fill(''))
  const refMap = useRef<Map<string, THREE.Mesh>>(new Map())

  useFrame(() => {
    const { notes, songTimeMs } = getStore()
    const pool = meshPoolRef.current
    const assigned = assignedIds.current
    const map = refMap.current

    // Release stale assignments
    for (let i = 0; i < POOL_SIZE; i++) {
      const id = assigned[i]
      if (!id) continue
      const note = notes.find((n) => n.id === id)
      if (!note || note.hit) {
        if (pool[i]) pool[i]!.visible = false
        assigned[i] = ''
        map.delete(id)
      }
    }

    // Assign newly visible notes
    const active = notes.filter((n) => {
      if (n.hit) return false
      const d = n.timeMs - songTimeMs
      return d <= NOTE_TRAVEL_MS && d >= -200
    })

    for (const note of active) {
      if (map.has(note.id)) continue
      const slot = assigned.findIndex((id, i) => !id && pool[i])
      if (slot === -1) continue
      assigned[slot] = note.id
      const mesh = pool[slot]!
      map.set(note.id, mesh)
      ;(mesh.material as THREE.MeshBasicMaterial).color.set(LANE_COLORS[note.lane] ?? '#ffffff')
    }

    // Update positions
    for (let i = 0; i < POOL_SIZE; i++) {
      const id = assigned[i]
      const mesh = pool[i]
      if (!id || !mesh) continue
      const note = notes.find((n) => n.id === id)
      if (!note || note.hit) { mesh.visible = false; continue }

      const d = note.timeMs - songTimeMs
      if (d > NOTE_TRAVEL_MS || d < -200) { mesh.visible = false; continue }

      const t = 1 - d / NOTE_TRAVEL_MS
      const z = FAR_Z + (HIT_Z - FAR_Z) * t
      const x = laneXAtZ(note.lane, z)
      // Ghost notes (low velocity) render smaller and dimmer so dynamics are readable.
      const vScale = 0.55 + 0.45 * note.velocity
      const w = noteWidthAtZ(z) * vScale
      const h = noteHeightAtZ(z) * vScale

      mesh.visible = true
      mesh.position.set(x, HIGHWAY_Y + 0.02, z)
      mesh.scale.set(w, 1, h)
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.42 * note.velocity
    }
  })

  return (
    <group>
      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <mesh
          key={i}
          visible={false}
          renderOrder={6}
          ref={(m) => { meshPoolRef.current[i] = m }}
        >
          <boxGeometry args={[1, 0.028, 1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.92} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
