export function StudioEnvironment() {
  return (
    <group>
      {/* Floor — warm dark wood */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#1a1208" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Wood grain overlay — slight sheen strips */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial
          color="#221a0e"
          roughness={0.7}
          metalness={0.02}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 2.5, 3.5]}>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color="#0d0d18" roughness={1} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color="#0d0d18" roughness={1} />
      </mesh>

      {/* Right wall */}
      <mesh position={[5, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color="#0d0d18" roughness={1} />
      </mesh>

      {/* Acoustic panels on back wall */}
      <AcousticPanel position={[-2.2, 1.8, 3.45]} />
      <AcousticPanel position={[0, 1.8, 3.45]} />
      <AcousticPanel position={[2.2, 1.8, 3.45]} />

      {/* Warm floor lamps */}
      <pointLight position={[-3, 1.8, 1]} intensity={1.2} color="#c8740a" distance={5} decay={2} castShadow />
      <pointLight position={[3, 1.8, 1]} intensity={1.2} color="#c8740a" distance={5} decay={2} castShadow />

      {/* Cool overhead fill */}
      <pointLight position={[0, 3.5, 0.5]} intensity={0.8} color="#8888cc" distance={8} decay={2} />

      {/* Rim light from behind */}
      <pointLight position={[0, 2, 4]} intensity={0.5} color="#223366" distance={6} decay={2} />

      {/* Ceiling */}
      <mesh position={[0, 4.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#080810" roughness={1} />
      </mesh>
    </group>
  )
}

function AcousticPanel({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[1.8, 1.2, 0.08]} />
      <meshStandardMaterial color="#1a2233" roughness={0.95} />
    </mesh>
  )
}
