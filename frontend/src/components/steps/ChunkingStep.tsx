import { useState } from 'react';
import { motion } from 'framer-motion';
import StepCard from '../StepCard';
import { PIPELINE_STEPS } from '../../lib/constants';
import type { Chunk, PipelineConfig } from '../../lib/types';
import { Layers } from 'lucide-react';

interface ChunkingStepProps {
  chunks: Chunk[];
  documentText: string;
  config: PipelineConfig;
  onConfigChange: (updates: Partial<PipelineConfig>) => void;
}

export default function ChunkingStep({
  chunks,
  documentText,
  config,
  onConfigChange,
}: ChunkingStepProps) {
  const step = PIPELINE_STEPS[1];
  const [hoveredChunk, setHoveredChunk] = useState<number | null>(null);

  return (
    <StepCard
      title={step.label}
      description={step.description}
      educationalText={step.educationalText}
      isActive={true}
    >
      <div className="space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Chunk Size <span className="text-primary-400">{config.chunkSize}</span>
            </label>
            <input
              type="range"
              min={50}
              max={500}
              step={10}
              value={config.chunkSize}
              onChange={(e) => onConfigChange({ chunkSize: Number(e.target.value) })}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>50</span>
              <span>500</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Overlap <span className="text-primary-400">{config.chunkOverlap}</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={config.chunkOverlap}
              onChange={(e) => onConfigChange({ chunkOverlap: Number(e.target.value) })}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0</span>
              <span>100</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Strategy</label>
            <select
              value={config.chunkingStrategy}
              onChange={(e) =>
                onConfigChange({ chunkingStrategy: e.target.value as 'sentence' | 'character' })
              }
              className="input-field py-2 text-sm"
            >
              <option value="sentence">Sentence-based</option>
              <option value="character">Character-based</option>
            </select>
          </div>
        </div>

        {/* Chunks display */}
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-medium text-gray-300">
            {chunks.length} chunks generated
          </span>
        </div>

        {/* Two-column layout: source text + chunks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Source text with highlighting */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 max-h-[400px] overflow-y-auto">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Source Text
            </h3>
            <p className="text-sm leading-relaxed text-gray-400 whitespace-pre-wrap">
              {hoveredChunk !== null ? (
                <>
                  {documentText.slice(0, chunks[hoveredChunk]?.startIndex)}
                  <span className="bg-primary-500/30 text-primary-200 rounded px-0.5">
                    {documentText.slice(
                      chunks[hoveredChunk]?.startIndex,
                      chunks[hoveredChunk]?.endIndex
                    )}
                  </span>
                  {documentText.slice(chunks[hoveredChunk]?.endIndex)}
                </>
              ) : (
                documentText
              )}
            </p>
          </div>

          {/* Chunk list */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Generated Chunks
            </h3>
            {chunks.map((chunk, index) => (
              <motion.div
                key={chunk.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={`
                  p-3 rounded-lg border text-sm cursor-pointer transition-all duration-200
                  ${hoveredChunk === index
                    ? 'border-primary-500 bg-primary-500/10 text-gray-200'
                    : 'border-gray-700/50 bg-gray-800/30 text-gray-400 hover:border-gray-600'
                  }
                `}
                onMouseEnter={() => setHoveredChunk(index)}
                onMouseLeave={() => setHoveredChunk(null)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-primary-400">
                    Chunk #{chunk.id + 1}
                  </span>
                  <span className="text-xs text-gray-600">
                    {chunk.text.length} chars
                  </span>
                </div>
                <p className="line-clamp-3 leading-relaxed">
                  {chunk.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </StepCard>
  );
}
