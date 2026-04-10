import { useState } from 'react';
import { motion } from 'framer-motion';
import StepCard from '../StepCard';
import { PIPELINE_STEPS } from '../../lib/constants';
import type { Chunk, ChunkEmbedding } from '../../lib/types';
import { Eye, EyeOff } from 'lucide-react';

interface EmbeddingStepProps {
  chunks: Chunk[];
  chunkEmbeddings: ChunkEmbedding[];
}

export default function EmbeddingStep({ chunks, chunkEmbeddings }: EmbeddingStepProps) {
  const step = PIPELINE_STEPS[2];
  const [expandedChunk, setExpandedChunk] = useState<number | null>(null);

  return (
    <StepCard
      title={step.label}
      description={step.description}
      educationalText={step.educationalText}
      isActive={true}
    >
      <div className="space-y-4">
        <div className="text-sm text-gray-400">
          Each chunk has been converted into a{' '}
          <span className="text-primary-300 font-medium">
            {chunkEmbeddings[0]?.dimensions || '?'}-dimensional
          </span>{' '}
          vector embedding using{' '}
          <span className="text-primary-300 font-medium">all-MiniLM-L6-v2</span>.
        </div>

        {/* Model comparison table */}
        <div className="rounded-lg border border-gray-700/50 overflow-hidden text-xs">
          <div className="grid grid-cols-2 bg-gray-800/80 px-3 py-2 text-gray-400 font-medium uppercase tracking-wide">
            <span>Model</span>
            <span className="text-right">Dimensions</span>
          </div>
          {[
            { name: 'all-MiniLM-L6-v2', dims: '384D', active: true },
            { name: 'bge-small-en-v1.5', dims: '384D', active: false },
            { name: 'bge-base-en-v1.5', dims: '768D', active: false },
            { name: 'bge-large-en-v1.5', dims: '1024D', active: false },
            { name: 'text-embedding-ada-002', dims: '1536D', active: false },
            { name: 'text-embedding-3-small', dims: '1536D', active: false },
            { name: 'text-embedding-3-large', dims: '3072D', active: false },
          ].map((m) => (
            <div
              key={m.name}
              className={`grid grid-cols-2 px-3 py-2 border-t border-gray-700/40 ${
                m.active ? 'bg-primary-900/30 text-primary-300' : 'text-gray-400'
              }`}
            >
              <span className="font-mono">{m.name}</span>
              <span className={`text-right font-medium ${m.active ? 'text-primary-300' : 'text-gray-300'}`}>
                {m.dims}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {chunkEmbeddings.map((emb, index) => {
            const chunk = chunks.find((c) => c.id === emb.chunkId);
            const isExpanded = expandedChunk === index;

            return (
              <motion.div
                key={emb.chunkId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-primary-400">
                    Chunk #{emb.chunkId + 1}
                  </span>
                  <button
                    onClick={() => setExpandedChunk(isExpanded ? null : index)}
                    className="text-gray-500 hover:text-gray-300 transition-colors"
                    title={isExpanded ? 'Hide vector' : 'Show vector'}
                  >
                    {isExpanded ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                  {chunk?.text}
                </p>

                {/* Embedding visualization bar */}
                <div className="flex gap-px h-6 rounded overflow-hidden">
                  {emb.embedding.slice(0, 60).map((val, i) => (
                    <div
                      key={i}
                      className="flex-1"
                      style={{
                        backgroundColor: val > 0
                          ? `rgba(92, 124, 250, ${Math.min(Math.abs(val) * 5, 1)})`
                          : `rgba(251, 146, 60, ${Math.min(Math.abs(val) * 5, 1)})`,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-600">
                    First 60 of {emb.dimensions} dimensions
                  </span>
                  <span className="text-[10px] text-gray-600">
                    <span className="text-primary-500">■</span> positive{' '}
                    <span className="text-orange-400">■</span> negative
                  </span>
                </div>

                {/* Expanded raw vector */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-3 p-2 bg-gray-900 rounded text-[10px] font-mono text-gray-500 max-h-24 overflow-auto"
                  >
                    [{emb.embedding.slice(0, 20).map((v) => v.toFixed(6)).join(', ')}
                    {emb.dimensions > 20 && `, ... (${emb.dimensions - 20} more)`}]
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </StepCard>
  );
}
