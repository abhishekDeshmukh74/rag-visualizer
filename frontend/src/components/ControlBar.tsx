import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Play, RotateCcw, Loader2,
  FileText, Scissors, Binary, Database, Search, Filter, MessageSquare, Sparkles,
} from 'lucide-react';
import type { PipelineStep } from '../lib/types';
import { PIPELINE_STEPS } from '../lib/constants';

const STEP_COLORS: Record<string, string> = {
  input: '#5c7cfa',
  chunking: '#be4bdb',
  embedding: '#20c997',
  vectordb: '#a78bfa',
  query: '#fcc419',
  retrieval: '#ff6b6b',
  prompt: '#ff922b',
  answer: '#51cf66',
};

const stepIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, Scissors, Binary, Database, Search, Filter, MessageSquare, Sparkles,
};

interface ControlBarProps {
  isRunning: boolean;
  processingStep: PipelineStep | null;
  completedSteps: PipelineStep[];
  currentStep: PipelineStep;
  canRun: boolean;
  error: string | null;
  onRun: () => void;
  onReset: () => void;
  onStepClick: (step: PipelineStep) => void;
}

export default function ControlBar({
  isRunning,
  processingStep,
  completedSteps,
  currentStep,
  canRun,
  error,
  onRun,
  onReset,
  onStepClick,
}: ControlBarProps) {
  const showHighlight = canRun && !isRunning && completedSteps.length <= 1;
  const [dismissed, setDismissed] = useState(false);
  const highlight = showHighlight && !dismissed;

  // Reset dismissed state when canRun becomes false (user cleared inputs)
  useEffect(() => {
    if (!canRun) setDismissed(false);
  }, [canRun]);

  const handleRun = () => {
    setDismissed(true);
    onRun();
  };

  return (
    <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-3 bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/40 px-3 py-2.5 sm:px-2.5 sm:py-4 w-full sm:w-auto">
      {/* Pipeline step indicators — horizontal scrollable on mobile, vertical on desktop */}
      <div className="flex flex-row sm:flex-col items-center gap-1 overflow-x-auto sm:overflow-x-visible scrollbar-hide flex-1 sm:flex-none min-w-0 sm:min-w-auto">
        {PIPELINE_STEPS.map((step, i) => {
          const isCompleted = completedSteps.includes(step.id);
          const isProcessing = processingStep === step.id;
          const isActive = currentStep === step.id;
          const color = STEP_COLORS[step.id] || '#5c7cfa';
          const Icon = stepIconMap[step.icon];

          return (
            <div key={step.id} className="flex flex-row sm:flex-col items-center shrink-0">
              <button
                onClick={() => onStepClick(step.id)}
                className="relative group"
              >
                <motion.div
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center transition-all"
                  style={{
                    borderColor: isCompleted || isActive ? color : 'rgba(75, 85, 99, 0.5)',
                    backgroundColor: isCompleted ? `${color}22` : isActive ? `${color}11` : 'transparent',
                    color: isCompleted || isActive ? color : '#6b7280',
                  }}
                  animate={isProcessing ? { scale: [1, 1.1, 1] } : {}}
                  transition={isProcessing ? { repeat: Infinity, duration: 1 } : {}}
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : Icon ? (
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <span className="text-[10px] font-bold">{i + 1}</span>
                  )}
                </motion.div>
                {/* Tooltip — bottom on mobile, right on desktop */}
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 sm:bottom-auto sm:left-full sm:top-1/2 sm:-translate-y-1/2 sm:translate-x-0 sm:ml-2.5 px-2 py-0.5 bg-gray-800 rounded text-[9px] text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {step.label}
                </div>
              </button>

              {/* Connector line — horizontal on mobile, vertical on desktop */}
              {i < PIPELINE_STEPS.length - 1 && (
                <>
                  <div
                    className="w-2 h-0.5 rounded sm:hidden"
                    style={{ backgroundColor: isCompleted ? color : '#374151' }}
                  />
                  <div
                    className="hidden sm:block w-0.5 h-2 rounded"
                    style={{ backgroundColor: isCompleted ? color : '#374151' }}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-8 sm:h-px sm:w-8 bg-gray-700/50 shrink-0" />

      {/* Action buttons */}
      <div className="relative group shrink-0">
        {/* Spotlight highlight overlay */}
        <AnimatePresence>
          {highlight && (
            <>
              {/* Pulsing ring */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 -m-1.5 rounded-2xl pointer-events-none z-0"
              >
                <div className="absolute inset-0 rounded-2xl border-2 border-primary-400 animate-ping opacity-40" />
                <div className="absolute inset-0 rounded-2xl border-2 border-primary-400 opacity-70" />
                <div className="absolute inset-0 rounded-2xl bg-primary-500/10" />
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <button
          onClick={handleRun}
          disabled={!canRun || isRunning}
          className={`relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xs font-semibold transition-all ${
            isRunning
              ? 'bg-primary-500/20 text-primary-400 cursor-wait'
              : canRun
              ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/25'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {/* Tooltip arrow + label — positioned relative to button center */}
          <AnimatePresence>
            {highlight && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="absolute left-full top-1/2 -translate-y-1/2 ml-3 flex items-center gap-1.5 pointer-events-none z-20"
              >
                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-primary-500" />
                <div className="px-3 py-1.5 bg-primary-500 rounded-lg shadow-lg shadow-primary-500/30 whitespace-nowrap">
                  <span className="text-[11px] font-semibold text-white">Click to Run Pipeline</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
        {!highlight && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 rounded-lg text-[10px] text-gray-300 whitespace-nowrap z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {isRunning ? 'Running...' : 'Run Pipeline'}
          </div>
        )}
      </div>

      <div className="relative group shrink-0">
        <button
          onClick={onReset}
          disabled={isRunning}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 rounded-lg text-[10px] text-gray-300 whitespace-nowrap z-10">
          Reset
        </div>
      </div>

      {/* Error badge */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-1.5 py-1 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] text-red-400 max-w-[56px] text-center leading-tight"
          title={error}
        >
          Error
        </motion.div>
      )}
    </div>
  );
}
