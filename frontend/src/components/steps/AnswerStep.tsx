import { motion } from 'framer-motion';
import StepCard from '../StepCard';
import { PIPELINE_STEPS } from '../../lib/constants';
import type { SimilarityResult } from '../../lib/types';
import { Sparkles, BookOpen } from 'lucide-react';

interface AnswerStepProps {
  answer: string;
  topChunks: SimilarityResult[];
  query: string;
}

export default function AnswerStep({ answer, topChunks, query }: AnswerStepProps) {
  const step = PIPELINE_STEPS[6];

  return (
    <StepCard
      title={step.label}
      description={step.description}
      educationalText={step.educationalText}
      isActive={true}
    >
      <div className="space-y-6">
        {/* Question recap */}
        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Question</span>
          <p className="text-gray-300 mt-1">{query}</p>
        </div>

        {/* Answer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-gradient-to-br from-primary-500/10 to-primary-600/5 border border-primary-500/20 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary-400" />
            <span className="text-sm font-semibold text-primary-300">Generated Answer</span>
          </div>
          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{answer}</p>
        </motion.div>

        {/* Source chunks */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-gray-300">
              Source Chunks ({topChunks.length})
            </span>
          </div>
          <div className="space-y-2">
            {topChunks.map((result) => (
              <div
                key={result.chunkId}
                className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-green-400">
                    Chunk #{result.chunkId + 1}
                  </span>
                  <span className="badge-green text-[10px]">
                    {(result.score * 100).toFixed(1)}% relevance
                  </span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{result.chunk.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StepCard>
  );
}
