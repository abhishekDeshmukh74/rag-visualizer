import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StepCard from '../StepCard';
import { PIPELINE_STEPS } from '../../lib/constants';
import type { SimilarityResult, PipelineConfig } from '../../lib/types';
import { TrendingUp } from 'lucide-react';

interface RetrievalStepProps {
  similarityResults: SimilarityResult[];
  topChunks: SimilarityResult[];
  config: PipelineConfig;
  onConfigChange: (updates: Partial<PipelineConfig>) => void;
}

export default function RetrievalStep({
  similarityResults,
  topChunks,
  config,
  onConfigChange,
}: RetrievalStepProps) {
  const step = PIPELINE_STEPS[4];
  const topChunkIds = new Set(topChunks.map((c) => c.chunkId));

  const chartData = similarityResults.map((r) => ({
    name: `#${r.chunkId + 1}`,
    score: Number((r.score * 100).toFixed(1)),
    isTop: topChunkIds.has(r.chunkId),
  }));

  return (
    <StepCard
      title={step.label}
      description={step.description}
      educationalText={step.educationalText}
      isActive={true}
    >
      <div className="space-y-6">
        {/* Top-K control */}
        <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <label className="text-sm text-gray-400 whitespace-nowrap">
            Top-K <span className="text-primary-400 font-medium">{config.topK}</span>
          </label>
          <input
            type="range"
            min={1}
            max={Math.min(10, similarityResults.length)}
            value={config.topK}
            onChange={(e) => onConfigChange({ topK: Number(e.target.value) })}
            className="flex-1 accent-primary-500"
          />
          <span className="text-xs text-gray-500">
            {config.topK} of {similarityResults.length} chunks selected
          </span>
        </div>

        {/* Similarity chart */}
        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-gray-300">Similarity Scores</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical">
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                }}
                formatter={(value: number) => [`${value}%`, 'Similarity']}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isTop ? '#5c7cfa' : '#374151'}
                    opacity={entry.isTop ? 1 : 0.5}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span><span className="inline-block w-2 h-2 rounded-sm bg-primary-500 mr-1" /> Selected (top-k)</span>
            <span><span className="inline-block w-2 h-2 rounded-sm bg-gray-600 mr-1" /> Not selected</span>
          </div>
        </div>

        {/* Selected chunks */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Top {config.topK} Retrieved Chunks
          </h3>
          <div className="space-y-2">
            {topChunks.map((result, index) => (
              <motion.div
                key={result.chunkId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-primary-500/5 border border-primary-500/20 rounded-lg"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-primary-400">
                    #{result.rank} — Chunk #{result.chunkId + 1}
                  </span>
                  <span className="badge-green">
                    {(result.score * 100).toFixed(1)}% match
                  </span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {result.chunk.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </StepCard>
  );
}
