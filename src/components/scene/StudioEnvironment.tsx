import { useMemo } from 'react'
import * as THREE from 'three'
import { makeTextTexture } from '@/game/utils/textTexture'
import { makeWoodFloorTexture } from '@/game/utils/woodTexture'

const STAGE_LIGHT_COLORS = ['#a855f7', '#f59e0b', '#38bdf8', '#f43f5e', '#a855f7', '#f59e0b', '#38bdf8']

export function StudioEnvironment() {
  const sign = useMemo(
    () => makeTextTexture('MUSIC LAB', { fill: '#efe0ff', glow: '#a855f7' }),
    [],
  )
  const woodFloor = useMemo(() => makeWoodFloorTexture('#4a2f1a'), [])
  const spotTarget = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(0, 0.7, 0.6)
    return o
  }, [])

  return (
    <group>
      {/* Floor — warm wood planks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial map={woodFloor} roughness={0.65} metalness={0.05} />
      </mesh>

      {/* Rug under the kit */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0.5]} receiveShadow>
        <circleGeometry args={[2.1, 40]} />
        <meshStandardMaterial color="#171210" roughness={0.95} />
      </mesh>

      {/* Back wall — rotated to face the camera */}
      <mesh position={[0, 2.5, 3.5]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color="#2a2138" roughness={1} />
      </mesh>

      {/* Side walls */}
      <mesh position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color="#241c30" roughness={1} />
      </mesh>
      <mesh position={[5, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color="#241c30" roughness={1} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 4.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#080810" roughness={1} />
      </mesh>

      {/* Neon MUSIC LAB sign */}
      <mesh position={[0, 3.05, 3.44]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.2, 0.55]} />
        <meshBasicMaterial map={sign} transparent />
      </mesh>
      <pointLight position={[0, 3.0, 3.2]} intensity={2.5} color="#a855f7" distance={4} decay={2} />

      {/* Stage bokeh lights along the back wall */}
      {STAGE_LIGHT_COLORS.map((color, i) => (
        <mesh key={i} position={[-3 + i, 3.7, 3.45]}>
          <sphereGeometry args={[0.05, 10, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}

      {/* Acoustic panels */}
      <AcousticPanel position={[-2.4, 1.7, 3.45]} />
      <AcousticPanel position={[2.4, 1.7, 3.45]} />
      <AcousticPanel position={[-4.95, 1.8, -0.5]} rotationY={Math.PI / 2} />
      <AcousticPanel position={[4.95, 1.8, -0.5]} rotationY={-Math.PI / 2} />

      {/* Posters on the back wall */}
      <Poster position={[-3.6, 1.9, 3.46]} color="#3b2a4a" />
      <Poster position={[3.6, 1.9, 3.46]} color="#27384a" />

      {/* PA speakers either side of the stage */}
      <Speaker position={[-2.7, 0.55, 3.0]} />
      <Speaker position={[2.7, 0.55, 3.0]} />

      {/* Warm key spotlights aimed at the kit */}
      <primitive object={spotTarget} />
      <spotLight
        position={[-1.8, 3.6, -1.2]}
        angle={0.7}
        penumbra={0.8}
        intensity={50}
        color="#ffc890"
        distance={12}
        decay={2}
        target={spotTarget}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight
        position={[1.8, 3.6, -1.0]}
        angle={0.7}
        penumbra={0.8}
        intensity={35}
        color="#ff9a5a"
        distance={12}
        decay={2}
        target={spotTarget}
      />

      {/* Warm floor lamps */}
      <FloorLamp position={[-3.2, 0, 1.6]} />
      <FloorLamp position={[3.2, 0, 1.6]} />

      {/* Cool rim fill from behind the kit */}
      <pointLight position={[0, 2.2, 3.0]} intensity={6} color="#4a5aa0" distance={8} decay={2} />
    </group>
  )
}

function AcousticPanel({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <boxGeometry args={[1.6, 1.1, 0.08]} />
      <meshStandardMaterial color="#241a2e" roughness={0.95} />
    </mesh>
  )
}

function Poster({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 0, -0.012]}>
        <planeGeometry args={[0.95, 1.35]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.6} />
      </mesh>
      <mesh>
        <planeGeometry args={[0.85, 1.25]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  )
}

function Speaker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.55, 1.1, 0.45]} />
        <meshStandardMaterial color="#0e0e12" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.25, -0.228]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.13, 24]} />
        <meshStandardMaterial color="#1f1f26" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.15, -0.228]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.18, 24]} />
        <meshStandardMaterial color="#1f1f26" roughness={0.6} />
      </mesh>
    </group>
  )
}

function FloorLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.015, 0.025, 1.8, 8]} />
        <meshStandardMaterial color="#222222" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.12, 14, 10]} />
        <meshBasicMaterial color="#ffd9a0" />
      </mesh>
      <pointLight position={[0, 1.85, 0]} intensity={10} color="#ffb070" distance={7} decay={2} />
    </group>
  )
}
