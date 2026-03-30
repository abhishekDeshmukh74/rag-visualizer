import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePipeline } from './hooks/usePipeline';
import PipelineScene from './components/three/PipelineScene';
import StepDetailPanel from './components/StepDetailPanel';
import ControlBar from './components/ControlBar';
import type { PipelineStep } from './lib/types';
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

  const handleStepClick = (step: PipelineStep) => {
    setCurrentStep(step);
    setShowPanel(true);
  };

  const canRun = !!(documentText.trim() && query.trim());

  return (
    <div className="fixed inset-0 bg-gray-950 overflow-hidden">
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

      {/* Bottom control bar */}
      <div className="absolute bottom-3 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:bottom-5 z-10">
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
