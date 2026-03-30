import { motion } from 'framer-motion';
import { PIPELINE_STEPS } from '../lib/constants';
import type { PipelineStep } from '../lib/types';
import {
  FileText,
  Scissors,
  Binary,
  Search,
  Filter,
  MessageSquare,
  Sparkles,
  Check,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, Scissors, Binary, Search, Filter, MessageSquare, Sparkles,
};

interface PipelineNavProps {
  currentStep: PipelineStep;
  onStepClick: (step: PipelineStep) => void;
  completedSteps: PipelineStep[];
}

export default function PipelineNav({ currentStep, onStepClick, completedSteps }: PipelineNavProps) {
  return (
    <div className="w-full overflow-x-auto py-4 scrollbar-hide">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-max px-3 sm:px-4">
        {PIPELINE_STEPS.map((step, index) => {
          const Icon = iconMap[step.icon];
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);

          return (
            <div key={step.id} className="flex items-center">
              <motion.button
                onClick={() => onStepClick(step.id)}
                className={`
                  flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium
                  transition-all duration-200 whitespace-nowrap
                  ${isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                    : isCompleted
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
                      : 'bg-gray-800/50 text-gray-500 border border-gray-800 hover:bg-gray-800 hover:text-gray-400'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isCompleted && !isActive ? (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : Icon ? (
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : null}
                <span className="hidden sm:inline">{step.label}</span>
              </motion.button>

              {index < PIPELINE_STEPS.length - 1 && (
                <div className={`w-4 sm:w-8 h-px mx-0.5 sm:mx-1 ${
                  isCompleted ? 'bg-green-500/50' : 'bg-gray-800'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
