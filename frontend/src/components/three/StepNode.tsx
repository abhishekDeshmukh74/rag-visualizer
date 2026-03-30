import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PipelineStep } from '../../lib/types';

/* Creates a texture with the label text rendered on a transparent canvas */
function createTextTexture(text: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 36px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/* Creates a flat hexagonal shape (BufferGeometry) */
function createHexGeometry(radius: number, depth: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
}

interface StepNodeProps {
  position: [number, number, number];
  step: PipelineStep;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
  isProcessing: boolean;
  onClick: () => void;
  color: string;
}

export default function StepNode({
  position,
  step: _step,
  label,
  isActive,
  isCompleted,
  isProcessing,
  onClick,
  color,
}: StepNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const borderRef = useRef<THREE.LineSegments>(null);

  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  const activeColor = useMemo(() => new THREE.Color(color).multiplyScalar(1.5), [color]);
  const completedColor = useMemo(() => new THREE.Color('#22c55e'), []);

  const hexGeo = useMemo(() => createHexGeometry(0.4, 0.08), []);
  const borderGeo = useMemo(() => new THREE.EdgesGeometry(createHexGeometry(0.44, 0.1)), []);

  const labelColor = isActive ? '#ffffff' : isCompleted ? '#86efac' : '#9ca3af';
  const labelTexture = useMemo(() => createTextTexture(label, labelColor), [label, labelColor]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Gentle floating
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8 + position[0]) * 0.06;

    // Active pulse scale
    if (meshRef.current) {
      if (isActive) {
        const scale = 1 + Math.sin(t * 2.5) * 0.06;
        meshRef.current.scale.setScalar(scale);
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }

    // Processing: gentle spin, otherwise face camera
    if (groupRef.current) {
      if (isProcessing) {
        groupRef.current.rotation.y += 0.02;
      } else {
        // Slow gentle rotation
        groupRef.current.rotation.y = Math.sin(t * 0.3 + position[0]) * 0.15;
      }
    }

    // Border glow pulse
    if (borderRef.current) {
      const mat = borderRef.current.material as THREE.LineBasicMaterial;
      if (isActive) {
        mat.opacity = 0.6 + Math.sin(t * 3) * 0.3;
      } else if (isCompleted) {
        mat.opacity = 0.4;
      } else {
        mat.opacity = 0.15;
      }
    }
  });

  const currentColor = isActive ? activeColor : isCompleted ? completedColor : baseColor;

  return (
    <group ref={groupRef} position={position}>
      {/* Main hexagonal chip */}
      <mesh
        ref={meshRef}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -0.04]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
        geometry={hexGeo}
      >
        <meshStandardMaterial
          color={currentColor}
          emissive={currentColor}
          emissiveIntensity={isActive ? 0.5 : isCompleted ? 0.25 : 0.08}
          roughness={0.4}
          metalness={0.6}
          transparent
          opacity={isActive ? 0.95 : 0.75}
        />
      </mesh>

      {/* Border outline */}
      <lineSegments
        ref={borderRef}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -0.05]}
        geometry={borderGeo}
      >
        <lineBasicMaterial
          color={currentColor}
          transparent
          opacity={0.3}
        />
      </lineSegments>

      {/* Soft point light for active / completed */}
      {(isActive || isCompleted) && (
        <pointLight
          color={currentColor}
          intensity={isActive ? 1.5 : 0.4}
          distance={2.5}
          decay={2}
        />
      )}

      {/* Text label in front of the node */}
      <sprite position={[0, -0.65, 0.5]} scale={[1.8, 0.45, 1]}>
        <spriteMaterial
          map={labelTexture}
          transparent
          depthWrite={false}
          opacity={isActive ? 1 : 0.85}
        />
      </sprite>

    </group>
  );
}
