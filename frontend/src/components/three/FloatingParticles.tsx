import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FloatingParticlesProps {
  count?: number;
  radius?: number;
}

export default function FloatingParticles({ count = 600, radius = 15 }: FloatingParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const dimPointsRef = useRef<THREE.Points>(null);

  const { positions } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Distribute in a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.4 + Math.random() * 0.6);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      // Varied star sizes
      sz[i] = 0.01 + Math.random() * 0.03;
    }
    return { positions: pos, sizes: sz };
  }, [count, radius]);

  // A second dimmer layer for depth
  const dimPositions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * radius * 3;
      pos[i * 3 + 1] = (Math.random() - 0.5) * radius * 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * radius * 3;
    }
    return pos;
  }, [count, radius]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.008;
      pointsRef.current.rotation.x = Math.sin(t * 0.005) * 0.05;
    }
    if (dimPointsRef.current) {
      dimPointsRef.current.rotation.y = -t * 0.003;
    }
  });

  return (
    <>
      {/* Bright stars */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={count}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#e0e8ff"
          size={0.025}
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Dim distant stars */}
      <points ref={dimPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dimPositions, 3]}
            count={count}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#8090c0"
          size={0.012}
          transparent
          opacity={0.3}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </>
  );
}
