import { useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePipeline } from './hooks/usePipeline';
import PipelineScene from './components/three/PipelineScene';
import StepDetailPanel from './components/StepDetailPanel';
import ControlBar from './components/ControlBar';
import type { PipelineStep } from './lib/types';
import { PIPELINE_STEPS } from './lib/constants';
import { Zap } from 'lucide-react';

export default function App() {
  const {
    documentText,
    setDocumentText,
    query,
    setQuery,
    config,
    updateConfig,
    result,
    currentStep,
    setCurrentStep,
    processingStep,
    completedSteps,
    isRunning,
    error,
    run,
    reset,
  } = usePipeline();

  const [showPanel, setShowPanel] = useState(true);

  // Swipe gesture for mobile step navigation
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const STEP_IDS = PIPELINE_STEPS.map((s) => s.id) as PipelineStep[];

  const goToNextStep = useCallback(() => {
    const idx = STEP_IDS.indexOf(currentStep);
    if (idx < STEP_IDS.length - 1) {
      const next = STEP_IDS[idx + 1];
      setCurrentStep(next);
      setShowPanel(true);
    }
  }, [currentStep, setCurrentStep]);

  const goToPrevStep = useCallback(() => {
    const idx = STEP_IDS.indexOf(currentStep);
    if (idx > 0) {
      const prev = STEP_IDS[idx - 1];
      setCurrentStep(prev);
      setShowPanel(true);
    }
  }, [currentStep, setCurrentStep]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') goToNextStep();
      else if (e.key === 'ArrowLeft') goToPrevStep();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextStep, goToPrevStep]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Only trigger if horizontal swipe is dominant and exceeds threshold
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goToNextStep();
      else goToPrevStep();
    }
  }, [goToNextStep, goToPrevStep]);

  const handleStepClick = (step: PipelineStep) => {
    setCurrentStep(step);
    setShowPanel(true);
  };

  const canRun = !!(documentText.trim() && query.trim());

  return (
    <div
      className="fixed inset-0 bg-gray-950 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Stars background */}
      <div className="stars-layer" />

      {/* Full-viewport 3D scene */}
      <div className="absolute inset-0">
        <PipelineScene
          currentStep={currentStep}
          completedSteps={completedSteps}
          isRunning={isRunning}
          processingStep={processingStep}
          result={result}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Gradient overlays for readability */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-gray-950/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950/80 to-transparent" />
      </div>

      {/* Title */}
      <div className="absolute top-3 left-3 sm:top-5 sm:left-6 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-gray-100 tracking-tight">RAG Visualizer</h1>
            <p className="text-[9px] sm:text-[10px] text-gray-500 hidden sm:block">Interactive 3D Pipeline</p>
          </div>
        </div>
      </div>

      {/* Step detail panel — right side, full overlay on mobile */}
      <div className="absolute inset-3 sm:inset-auto sm:top-5 sm:right-5 sm:bottom-20 z-10 pointer-events-auto flex items-stretch sm:items-start">
        <AnimatePresence>
          {showPanel && (
            <StepDetailPanel
              currentStep={currentStep}
              result={result}
              config={config}
              onConfigChange={updateConfig}
              documentText={documentText}
              onDocumentChange={setDocumentText}
              query={query}
              onQueryChange={setQuery}
              onClose={() => setShowPanel(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Re-open panel button when hidden */}
      <AnimatePresence>
        {!showPanel && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setShowPanel(true)}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10 px-3 py-2 bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-xl text-xs text-gray-300 hover:text-white hover:border-gray-600 transition-all shadow-lg"
          >
            Show Details
          </motion.button>
        )}
      </AnimatePresence>

      {/* Control bar — vertical left on desktop, horizontal bottom on mobile */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 z-10">
        <ControlBar
          isRunning={isRunning}
          processingStep={processingStep}
          completedSteps={completedSteps}
          currentStep={currentStep}
          canRun={canRun}
          error={error}
          onRun={run}
          onReset={reset}
          onStepClick={handleStepClick}
        />
      </div>
    </div>
  );
}
