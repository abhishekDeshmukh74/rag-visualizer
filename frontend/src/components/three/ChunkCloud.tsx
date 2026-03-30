import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SimilarityResult } from '../../lib/types';

interface ChunkCloudProps {
  similarityResults: SimilarityResult[];
  visible: boolean;
}

export default function ChunkCloud({ similarityResults, visible }: ChunkCloudProps) {
  const groupRef = useRef<THREE.Group>(null);

  const chunkPositions = useMemo(() => {
    return similarityResults.map((r, i) => {
      const angle = (i / similarityResults.length) * Math.PI * 2;
      const radiusScale = 1.2 + (1 - r.score) * 1.5;
      return {
        pos: [
          Math.cos(angle) * radiusScale,
          Math.sin(angle) * radiusScale * 0.6,
          (Math.random() - 0.5) * 0.5,
        ] as [number, number, number],
        score: r.score,
        isTop: r.rank <= 3,
        chunkId: r.chunkId,
      };
    });
  }, [similarityResults]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
  });

  if (!visible || similarityResults.length === 0) return null;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {chunkPositions.map((chunk) => (
        <mesh key={chunk.chunkId} position={chunk.pos}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshStandardMaterial
            color={chunk.isTop ? '#22c55e' : '#5c7cfa'}
            emissive={chunk.isTop ? '#22c55e' : '#5c7cfa'}
            emissiveIntensity={chunk.score * 0.5}
            transparent
            opacity={0.3 + chunk.score * 0.7}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      ))}

      {/* Central query point */}
      <mesh>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fbbf24"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}
