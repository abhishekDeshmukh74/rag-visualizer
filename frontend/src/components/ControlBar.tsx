import { motion } from 'framer-motion';
import {
  Play, RotateCcw, Loader2,
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
  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/40 px-3 sm:px-4 py-2.5 w-full sm:w-auto">
      {/* Pipeline step indicators — scrollable on mobile */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 sm:flex-none min-w-0">
        {PIPELINE_STEPS.map((step, i) => {
          const isCompleted = completedSteps.includes(step.id);
          const isProcessing = processingStep === step.id;
          const isActive = currentStep === step.id;
          const color = STEP_COLORS[step.id] || '#5c7cfa';

          return (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              className="relative group shrink-0"
            >
              <motion.div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all"
                style={{
                  borderColor: isCompleted || isActive ? color : 'rgba(75, 85, 99, 0.5)',
                  backgroundColor: isCompleted ? `${color}22` : isActive ? `${color}11` : 'transparent',
                  color: isCompleted || isActive ? color : '#6b7280',
                }}
                animate={isProcessing ? { scale: [1, 1.1, 1] } : {}}
                transition={isProcessing ? { repeat: Infinity, duration: 1 } : {}}
              >
                {isProcessing ? (
                  <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                ) : (
                  i + 1
                )}
              </motion.div>
              {/* Connector line */}
              {i < PIPELINE_STEPS.length - 1 && (
                <div
                  className="absolute top-1/2 -right-1 w-1 h-0.5 rounded"
                  style={{ backgroundColor: isCompleted ? color : '#374151' }}
                />
              )}
              {/* Tooltip */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-800 rounded text-[9px] text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {step.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-700/50 shrink-0" />

      {/* Action buttons */}
      <button
        onClick={onRun}
        disabled={!canRun || isRunning}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
          isRunning
            ? 'bg-primary-500/20 text-primary-400 cursor-wait'
            : canRun
            ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/25'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        }`}
      >
        {isRunning ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">Running...</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Run Pipeline</span>
            <span className="sm:hidden">Run</span>
          </>
        )}
      </button>

      <button
        onClick={onReset}
        disabled={isRunning}
        className="p-2 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all shrink-0"
        title="Reset"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* Error badge */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-2 sm:px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] text-red-400 max-w-[120px] sm:max-w-[200px] truncate shrink-0"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
