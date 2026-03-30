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
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI * 0.7;
    controls.minPolarAngle = Math.PI * 0.3;
    controls.enableDamping = true;
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

// Arrange steps in a curved arc
const STEP_POSITIONS: Record<PipelineStep, [number, number, number]> = {
  input:     [-5.5, 1.4,  0],
  chunking:  [-3.8, 0.4,  0.8],
  embedding: [-2.0, -0.4, 1.2],
  vectordb:  [-0.4, -0.8, 1.2],
  query:     [ 1.2, -0.8,  0.8],
  retrieval: [ 2.8, -0.4, 0.4],
  prompt:    [ 4.2, 0.4,  -0.2],
  answer:    [ 5.5, 1.4,  -0.4],
};

const STEP_COLORS: Record<PipelineStep, string> = {
  input:     '#818cf8',
  chunking:  '#6366f1',
  embedding: '#8b5cf6',
  vectordb:  '#a78bfa',
  query:     '#f59e0b',
  retrieval: '#3b82f6',
  prompt:    '#06b6d4',
  answer:    '#10b981',
};

const STEP_ORDER: PipelineStep[] = ['input', 'chunking', 'embedding', 'vectordb', 'query', 'retrieval', 'prompt', 'answer'];

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
        camera={{ position: [0, 2, 7], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <directionalLight position={[-5, 3, -5]} intensity={0.3} color="#818cf8" />

      {/* Controls */}
      <CameraControls
        autoRotate={!isRunning && !result}
        autoRotateSpeed={0.3}
      />

      {/* Background particles */}
      <FloatingParticles count={300} radius={10} />

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
        <group position={[0, 1.5, -1]}>
          <ChunkCloud
            similarityResults={result.similarityResults}
            visible={currentStep === 'retrieval' || currentStep === 'embedding'}
          />
        </group>
      )}
    </Canvas>
    </div>
  );
}
