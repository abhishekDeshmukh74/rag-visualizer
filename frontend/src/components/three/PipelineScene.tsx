import { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame, extend } from '@react-three/fiber';
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import StepNode from './StepNode';
import DataFlow from './DataFlow';
import FloatingParticles from './FloatingParticles';
import ChunkCloud from './ChunkCloud';
import type { PipelineStep, PipelineResult } from '../../lib/types';
import { PIPELINE_STEPS } from '../../lib/constants';

// Register OrbitControls so it can be used as JSX
extend({ OrbitControls: ThreeOrbitControls });

/* Custom OrbitControls component */
function CameraControls({
  autoRotate,
  autoRotateSpeed,
}: {
  autoRotate: boolean;
  autoRotateSpeed: number;
}) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<ThreeOrbitControls | null>(null);

  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 4;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI * 0.75;
    controls.minPolarAngle = Math.PI * 0.2;
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;
    return () => controls.dispose();
  }, [camera, gl]);

  useFrame(() => {
    if (!controlsRef.current) return;
    controlsRef.current.autoRotate = autoRotate;
    controlsRef.current.autoRotateSpeed = autoRotateSpeed;
    controlsRef.current.update();
  });

  return null;
}

interface PipelineSceneProps {
  currentStep: PipelineStep;
  completedSteps: PipelineStep[];
  isRunning: boolean;
  processingStep: PipelineStep | null;
  result: PipelineResult | null;
  onStepClick: (step: PipelineStep) => void;
}

// Arrange steps diagonally: bottom-left to top-right
const STEP_POSITIONS: Record<PipelineStep, [number, number, number]> = {
  ingestion: [-4.4, -3.6, 0],
  input:     [-3.3, -2.7, 0],
  chunking:  [-2.2, -1.8, 0],
  embedding: [-1.1, -0.9, 0],
  vectordb:  [ 0.0,  0.0, 0],
  query:     [ 1.1,  0.9, 0],
  retrieval: [ 2.2,  1.8, 0],
  prompt:    [ 3.3,  2.7, 0],
  answer:    [ 4.4,  3.6, 0],
};

const STEP_COLORS: Record<PipelineStep, string> = {
  ingestion: '#f472b6',
  input:     '#818cf8',
  chunking:  '#6366f1',
  embedding: '#8b5cf6',
  vectordb:  '#a78bfa',
  query:     '#f59e0b',
  retrieval: '#3b82f6',
  prompt:    '#06b6d4',
  answer:    '#10b981',
};

const STEP_ORDER: PipelineStep[] = ['ingestion', 'input', 'chunking', 'embedding', 'vectordb', 'query', 'retrieval', 'prompt', 'answer'];

export default function PipelineScene({
  currentStep,
  completedSteps,
  isRunning,
  processingStep,
  result,
  onStepClick,
}: PipelineSceneProps) {
  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 13], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <directionalLight position={[-5, 3, -5]} intensity={0.3} color="#818cf8" />

      {/* Controls — no auto-rotate */}
      <CameraControls
        autoRotate={false}
        autoRotateSpeed={0}
      />

      {/* Background particles */}
      <FloatingParticles count={300} radius={10} />

      {/* Offset group — shifts entire pipeline chain to the left */}
      <group position={[-3.5, -0.5, 0]} scale={[1.2, 1.2, 1.2]}>
        {/* Data flow connections */}
        {STEP_ORDER.slice(0, -1).map((step, i) => {
          const nextStep = STEP_ORDER[i + 1];
          const stepIdx = STEP_ORDER.indexOf(currentStep);
          const isFlowActive = isRunning
            ? STEP_ORDER.indexOf(step) <= stepIdx
            : completedSteps.includes(step) && completedSteps.includes(nextStep);
          const isFlowCompleted = completedSteps.includes(step) && completedSteps.includes(nextStep);

          return (
            <DataFlow
              key={`${step}-${nextStep}`}
              from={STEP_POSITIONS[step]}
              to={STEP_POSITIONS[nextStep]}
              isActive={isFlowActive || currentStep === step || currentStep === nextStep}
              isCompleted={isFlowCompleted}
              color={STEP_COLORS[step]}
            />
          );
        })}

        {/* Step nodes */}
        {PIPELINE_STEPS.map((step) => (
          <group key={step.id}>
            <StepNode
              position={STEP_POSITIONS[step.id]}
              step={step.id}
              label={step.label}
              isActive={currentStep === step.id}
              isCompleted={completedSteps.includes(step.id)}
              isProcessing={processingStep === step.id}
              onClick={() => onStepClick(step.id)}
              color={STEP_COLORS[step.id]}
            />
          </group>
        ))}

        {/* Chunk cloud visualization - visible during retrieval */}
        {result && (
          <group position={[0, 2.5, -1]}>
            <ChunkCloud
              similarityResults={result.similarityResults}
              visible={currentStep === 'retrieval' || currentStep === 'embedding'}
            />
          </group>
        )}
      </group>
    </Canvas>
    </div>
  );
}
