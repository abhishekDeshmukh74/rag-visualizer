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

// ── Semantic Space 3-D XYZ visualisation ─────────────────────────────────────
function SemanticSpaceViz() {
  const ox = 145, oy = 205; // origin in SVG coords

  // Isometric axis tips
  const axX = { x: 238, y: 248 };   // dim 1  →
  const axY = { x: ox,  y:  85 };   // dim 2  ↑
  const axZ = { x:  52, y: 248 };   // dim 3  ←

  // Words in the leave/time-off semantic cluster
  const cluster = [
    { label: 'time-off', cx: 225, cy: 120 },
    { label: 'vacation',  cx: 243, cy: 134 },
    { label: 'leave',     cx: 213, cy: 143 },
    { label: 'PTO',       cx: 237, cy: 155 },
    { label: 'sick day',  cx: 218, cy: 165 },
  ];

  // Unrelated words — far from cluster
  const others = [
    { label: 'invoice',  cx: 100, cy: 195 },
    { label: 'server',   cx: 116, cy: 180 },
    { label: 'database', cx:  92, cy: 177 },
  ];

  // Query vector endpoint
  const qx = 229, qy = 127;

  return (
    <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
      <div className="flex items-start gap-2 mb-1">
        <span className="text-sm font-medium text-gray-300">Semantic Search in Vector Space</span>
      </div>
      <div className="text-sm text-gray-500 mb-3 space-y-2">
        <p>
          Embeddings place words into a high-dimensional space where <em className="text-gray-400">meaning</em> determines
          distance — not spelling. Cosine similarity finds the nearest neighbours instantly.
        </p>
        <p className="text-gray-400 font-medium">Knowledge base (4 pre-loaded documents):</p>
        <ul className="space-y-1 pl-1">
          {[
            { icon: '🔑', label: 'Password Reset FAQ',       desc: 'account recovery & auth flows' },
            { icon: '↩️', label: 'Return & Refund Policy',   desc: 'order returns, refunds, timelines' },
            { icon: '🧭', label: 'Employee Onboarding Guide', desc: 'day-1 setup, tools, processes' },
            { icon: '🌴', label: 'Leave Policy',              desc: 'PTO, sick days, vacation rules' },
          ].map(({ icon, label, desc }) => (
            <li key={label} className="flex items-start gap-2">
              <span>{icon}</span>
              <span>
                <span className="text-gray-300 font-medium">{label}</span>
                <span className="text-gray-600"> — {desc}</span>
              </span>
            </li>
          ))}
        </ul>
        <p>
          A query about <em className="text-gray-400">"time-off"</em> retrieves chunks
          mentioning <em className="text-gray-400">"vacation"</em>, <em className="text-gray-400">"PTO"</em> and{' '}
          <em className="text-gray-400">"sick day"</em> — even if those exact words never appear in the query.
        </p>
      </div>

      <svg viewBox="0 0 320 265" className="w-full" style={{ height: 230 }}>
        <defs>
          <marker id="qa" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L7,3.5 z" fill="#5c7cfa" />
          </marker>
        </defs>

        {/* Axes */}
        <line x1={ox} y1={oy} x2={axX.x} y2={axX.y} stroke="#374151" strokeWidth={1.5} />
        <line x1={ox} y1={oy} x2={axY.x} y2={axY.y} stroke="#374151" strokeWidth={1.5} />
        <line x1={ox} y1={oy} x2={axZ.x} y2={axZ.y} stroke="#374151" strokeWidth={1.5} />

        {/* Axis tick-marks */}
        {[0.33, 0.66, 1].map((t) => (
          <g key={t}>
            <circle cx={ox + (axX.x - ox) * t} cy={oy + (axX.y - oy) * t} r={2} fill="#374151" />
            <circle cx={ox + (axY.x - ox) * t} cy={oy + (axY.y - oy) * t} r={2} fill="#374151" />
            <circle cx={ox + (axZ.x - ox) * t} cy={oy + (axZ.y - oy) * t} r={2} fill="#374151" />
          </g>
        ))}

        {/* Axis labels */}
        <text x={axX.x + 4} y={axX.y + 4} fontSize={9} fill="#6b7280">dim₁</text>
        <text x={axY.x - 18} y={axY.y - 4} fontSize={9} fill="#6b7280">dim₂</text>
        <text x={axZ.x - 26} y={axZ.y + 4} fontSize={9} fill="#6b7280">dim₃</text>

        {/* Cluster highlight */}
        <ellipse cx={225} cy={143} rx={34} ry={33}
          fill="rgba(92,124,250,0.07)"
          stroke="rgba(92,124,250,0.35)"
          strokeWidth={1}
          strokeDasharray="4,2"
        />

        {/* Query vector */}
        <line x1={ox} y1={oy} x2={qx} y2={qy}
          stroke="#5c7cfa" strokeWidth={1.5}
          strokeDasharray="5,3"
          markerEnd="url(#qa)"
        />
        <text x={ox + (qx - ox) * 0.55 + 6} y={oy + (qy - oy) * 0.55 - 4}
          fontSize={8} fill="#818cf8">query vector</text>

        {/* Cosine similarity label */}
        <text x={180} y={181} fontSize={8} fill="#5c7cfa" opacity={0.85}>
          cosine sim ≈ 0.91
        </text>

        {/* Cluster word dots */}
        {cluster.map((w) => (
          <g key={w.label}>
            <circle cx={w.cx} cy={w.cy} r={5} fill="#5c7cfa" opacity={0.85} />
            <text x={w.cx + 7} y={w.cy + 3} fontSize={9} fill="#a5b4fc">{w.label}</text>
          </g>
        ))}

        {/* Unrelated word dots */}
        {others.map((w) => (
          <g key={w.label}>
            <circle cx={w.cx} cy={w.cy} r={4} fill="#1f2937" stroke="#4b5563" strokeWidth={1.2} />
            <text x={w.cx + 6} y={w.cy + 3} fontSize={9} fill="#4b5563">{w.label}</text>
          </g>
        ))}

        {/* Query endpoint dot */}
        <circle cx={qx} cy={qy} r={5} fill="#facc15" />
        <text x={qx + 7} y={qy - 3} fontSize={9} fill="#fde68a" fontWeight="bold">query</text>
      </svg>

      <div className="flex items-center gap-6 mt-1 text-xs text-gray-500">
        <span><span className="inline-block w-2 h-2 rounded-full bg-primary-500 mr-1" />semantic cluster</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1" />query vector</span>
        <span><span className="inline-block w-2 h-2 rounded-full border border-gray-600 bg-gray-900 mr-1" />unrelated</span>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

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
        {/* Semantic space explainer */}
        <SemanticSpaceViz />

        {/* Top-K control */}
        <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <label className="text-base text-gray-400 whitespace-nowrap">
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
          <span className="text-sm text-gray-500">
            {config.topK} of {similarityResults.length} chunks selected
          </span>
        </div>

        {/* Similarity chart */}
        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary-400" />
            <span className="text-base font-medium text-gray-300">Similarity Scores</span>
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
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span><span className="inline-block w-2 h-2 rounded-sm bg-primary-500 mr-1" /> Selected (top-k)</span>
            <span><span className="inline-block w-2 h-2 rounded-sm bg-gray-600 mr-1" /> Not selected</span>
          </div>
        </div>

        {/* Selected chunks */}
        <div>
          <h3 className="text-base font-medium text-gray-300 mb-3">
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
                  <span className="text-sm font-medium text-primary-400">
                    #{result.rank} — Chunk #{result.chunkId + 1}
                  </span>
                  <span className="badge-green">
                    {(result.score * 100).toFixed(1)}% match
                  </span>
                </div>
                <p className="text-base text-gray-400 leading-relaxed">
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
