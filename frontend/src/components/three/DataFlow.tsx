import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DataFlowProps {
  from: [number, number, number];
  to: [number, number, number];
  isActive: boolean;
  isCompleted: boolean;
  color: string;
}

export default function DataFlow({ from, to, isActive, isCompleted, color }: DataFlowProps) {
  const tubeRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const particleCount = 12;

  const { curve, tubeGeo, positions } = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 0.3,
      (from[2] + to[2]) / 2,
    ];
    const c = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to),
    );

    const tube = new THREE.TubeGeometry(c, 32, 0.02, 6, false);
    const pos = new Float32Array(particleCount * 3);
    return { curve: c, tubeGeo: tube, positions: pos };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from[0], from[1], from[2], to[0], to[1], to[2]]);

  const flowColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state) => {
    // Update tube color
    if (tubeRef.current) {
      const mat = tubeRef.current.material as THREE.MeshStandardMaterial;
      if (isActive) {
        mat.color.copy(flowColor);
        mat.emissive.copy(flowColor);
        mat.emissiveIntensity = 0.4;
        mat.opacity = 0.7;
      } else if (isCompleted) {
        mat.color.set('#22c55e');
        mat.emissive.set('#22c55e');
        mat.emissiveIntensity = 0.2;
        mat.opacity = 0.5;
      } else {
        mat.color.set('#374151');
        mat.emissive.set('#000000');
        mat.emissiveIntensity = 0;
        mat.opacity = 0.15;
      }
    }

    // Animate particles along the curve
    if (!particlesRef.current || !isActive) return;
    const t = state.clock.elapsedTime;
    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const progress = ((t * 0.3 + i / particleCount) % 1);
      const point = curve.getPoint(progress);
      posArray[i * 3] = point.x;
      posArray[i * 3 + 1] = point.y;
      posArray[i * 3 + 2] = point.z;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      {/* Smooth tube connection */}
      <mesh ref={tubeRef} geometry={tubeGeo}>
        <meshStandardMaterial
          color="#374151"
          transparent
          opacity={0.15}
          roughness={0.5}
          metalness={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Flow particles - only when active */}
      {isActive && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[positions, 3]}
              count={particleCount}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color={flowColor}
            size={0.05}
            transparent
            opacity={0.9}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}
