import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Scissors, Binary, Search, Filter, MessageSquare, Sparkles,
  X, ChevronRight, Copy, Check, Eye, EyeOff, BookOpen, Database,
} from 'lucide-react';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { PipelineStep, PipelineResult, PipelineConfig, SampleDocument } from '../lib/types';
import { PIPELINE_STEPS, SAMPLE_DOCUMENTS } from '../lib/constants';

const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, Scissors, Binary, Search, Filter, MessageSquare, Sparkles, Database,
};

interface StepDetailPanelProps {
  currentStep: PipelineStep;
  result: PipelineResult | null;
  config: PipelineConfig;
  onConfigChange: (updates: Partial<PipelineConfig>) => void;
  documentText: string;
  onDocumentChange: (text: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onClose: () => void;
}

export default function StepDetailPanel({
  currentStep,
  result,
  config,
  onConfigChange,
  documentText,
  onDocumentChange,
  query,
  onQueryChange,
  onClose,
}: StepDetailPanelProps) {
  const stepInfo = PIPELINE_STEPS.find((s) => s.id === currentStep)!;
  const Icon = stepIcons[stepInfo.icon];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 30 }}
        transition={{ duration: 0.3 }}
        className="w-[420px] max-h-[calc(100vh-120px)] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-5 h-5 text-primary-400" />}
            <div>
              <h2 className="text-sm font-bold text-gray-100">{stepInfo.label}</h2>
              <p className="text-xs text-gray-500">{stepInfo.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Educational tip */}
        <div className="px-4 pt-3 shrink-0">
          <div className="p-2.5 bg-primary-500/5 border border-primary-500/20 rounded-lg">
            <p className="text-[11px] text-primary-200/70 leading-relaxed">{stepInfo.educationalText}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentStep === 'input' && (
            <InputContent
              documentText={documentText}
              onDocumentChange={onDocumentChange}
              query={query}
              onQueryChange={onQueryChange}
              result={result}
            />
          )}
          {currentStep === 'chunking' && (
            <ChunkingContent result={result} config={config} onConfigChange={onConfigChange} />
          )}
          {currentStep === 'embedding' && <EmbeddingContent result={result} />}
          {currentStep === 'vectordb' && <VectorDBContent result={result} />}
          {currentStep === 'query' && <QueryContent query={query} result={result} />}
          {currentStep === 'retrieval' && (
            <RetrievalContent result={result} config={config} onConfigChange={onConfigChange} />
          )}
          {currentStep === 'prompt' && <PromptContent result={result} />}
          {currentStep === 'answer' && <AnswerContent result={result} query={query} />}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ---- Step content sub-components ---- */

function InputContent({
  documentText,
  onDocumentChange,
  query,
  onQueryChange,
  result,
}: {
  documentText: string;
  onDocumentChange: (t: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
  result: PipelineResult | null;
}) {
  const handleSample = (sample: SampleDocument) => onDocumentChange(sample.text);
  const stats = result?.documentStats;

  return (
    <>
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400">Sample Documents</label>
        <div className="grid grid-cols-1 gap-1.5">
          {SAMPLE_DOCUMENTS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSample(s)}
              className={`p-2 rounded-lg border text-left text-xs transition-all ${
                documentText === s.text
                  ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                  : 'border-gray-700/50 bg-gray-800/30 text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                <span className="font-medium text-gray-300">{s.title}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-400 mb-1 block">Document Text</label>
        <textarea
          className="input-field min-h-[100px] resize-y font-mono text-[11px]"
          placeholder="Paste your document..."
          value={documentText}
          onChange={(e) => onDocumentChange(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-400 mb-1 block">Your Question</label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            className="input-field pl-8 text-sm"
            placeholder="Ask something..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
      </div>
      {stats && (
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="badge-blue">{stats.sentenceCount} sentences</span>
          <span className="badge-gray">{stats.wordCount} words</span>
          <span className="badge-amber">~{stats.estimatedTokens} tokens</span>
        </div>
      )}
    </>
  );
}

function ChunkingContent({
  result,
  config,
  onConfigChange,
}: {
  result: PipelineResult | null;
  config: PipelineConfig;
  onConfigChange: (u: Partial<PipelineConfig>) => void;
}) {
  const [hoveredChunk, setHoveredChunk] = useState<number | null>(null);

  if (!result) return <EmptyState />;

  return (
    <>
      <div className="space-y-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Chunk Size</span>
          <span className="text-xs text-primary-400 font-medium">{config.chunkSize}</span>
        </div>
        <input type="range" min={50} max={500} step={10} value={config.chunkSize}
          onChange={(e) => onConfigChange({ chunkSize: Number(e.target.value) })}
          className="w-full accent-primary-500" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Overlap</span>
          <span className="text-xs text-primary-400 font-medium">{config.chunkOverlap}</span>
        </div>
        <input type="range" min={0} max={100} step={10} value={config.chunkOverlap}
          onChange={(e) => onConfigChange({ chunkOverlap: Number(e.target.value) })}
          className="w-full accent-primary-500" />
      </div>
      <div className="flex items-center gap-2">
        <Scissors className="w-3.5 h-3.5 text-primary-400" />
        <span className="text-xs text-gray-300">{result.chunks.length} chunks</span>
      </div>
      <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
        {result.chunks.map((chunk, i) => (
          <div
            key={chunk.id}
            className={`p-2 rounded-lg border text-[11px] transition-all cursor-pointer ${
              hoveredChunk === i
                ? 'border-primary-500 bg-primary-500/10 text-gray-200'
                : 'border-gray-700/30 bg-gray-800/20 text-gray-500 hover:border-gray-600'
            }`}
            onMouseEnter={() => setHoveredChunk(i)}
            onMouseLeave={() => setHoveredChunk(null)}
          >
            <div className="flex justify-between mb-0.5">
              <span className="text-[10px] text-primary-400 font-medium">Chunk #{chunk.id + 1}</span>
              <span className="text-[10px] text-gray-600">{chunk.text.length} chars</span>
            </div>
            <p className="line-clamp-2 leading-relaxed">{chunk.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function EmbeddingContent({ result }: { result: PipelineResult | null }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!result) return <EmptyState />;

  return (
    <>
      <div className="text-xs text-gray-400">
        Each chunk → <span className="text-primary-300 font-medium">{result.chunkEmbeddings[0]?.dimensions}D</span> vector
      </div>
      <div className="space-y-2">
        {result.chunkEmbeddings.map((emb, i) => (
          <div key={emb.chunkId} className="p-2.5 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-primary-400 font-medium">Chunk #{emb.chunkId + 1}</span>
              <button onClick={() => setExpanded(expanded === i ? null : i)} className="text-gray-500 hover:text-gray-300">
                {expanded === i ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
            <div className="flex gap-px h-4 rounded overflow-hidden">
              {emb.embedding.slice(0, 50).map((val, j) => (
                <div key={j} className="flex-1" style={{
                  backgroundColor: val > 0
                    ? `rgba(92, 124, 250, ${Math.min(Math.abs(val) * 5, 1)})`
                    : `rgba(251, 146, 60, ${Math.min(Math.abs(val) * 5, 1)})`,
                }} />
              ))}
            </div>
            {expanded === i && (
              <div className="mt-2 p-1.5 bg-gray-900 rounded text-[9px] font-mono text-gray-600 max-h-16 overflow-auto">
                [{emb.embedding.slice(0, 10).map(v => v.toFixed(4)).join(', ')}, ...]
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function VectorDBContent({ result }: { result: PipelineResult | null }) {
  if (!result) return <EmptyState />;

  const totalVectors = result.chunkEmbeddings.length;
  const dims = result.chunkEmbeddings[0]?.dimensions || 0;

  return (
    <>
      <p className="text-xs text-gray-400 leading-relaxed">
        A vector database is a specialized storage system designed for embedding vectors. Unlike traditional databases that match on exact values, a vector DB indexes high-dimensional vectors so that nearest-neighbor queries run in sub-linear time — even across millions of records. This is what makes retrieval fast and scalable in production RAG systems.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 bg-gray-800/30 rounded-lg border border-gray-700/30 text-center">
          <span className="text-lg font-bold text-purple-400">{totalVectors}</span>
          <p className="text-[10px] text-gray-500 mt-0.5">Vectors Stored</p>
        </div>
        <div className="p-2.5 bg-gray-800/30 rounded-lg border border-gray-700/30 text-center">
          <span className="text-lg font-bold text-purple-400">{dims}D</span>
          <p className="text-[10px] text-gray-500 mt-0.5">Dimensions</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Indexed Chunks</span>
        <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
          {result.chunkEmbeddings.map((emb) => (
            <div key={emb.chunkId} className="p-2 bg-gray-800/20 border border-gray-700/30 rounded-lg flex items-center gap-2">
              <Database className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="text-[10px] text-purple-400 font-medium shrink-0">#{emb.chunkId + 1}</span>
              <div className="flex gap-px h-3 rounded overflow-hidden flex-1">
                {emb.embedding.slice(0, 30).map((val, j) => (
                  <div key={j} className="flex-1" style={{
                    backgroundColor: val > 0
                      ? `rgba(167, 139, 250, ${Math.min(Math.abs(val) * 5, 1)})`
                      : `rgba(251, 146, 60, ${Math.min(Math.abs(val) * 5, 1)})`,
                  }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function QueryContent({ query, result }: { query: string; result: PipelineResult | null }) {
  if (!result) return <EmptyState />;

  return (
    <>
      <div className="p-2.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
        <span className="text-[10px] text-gray-500 uppercase">Query</span>
        <p className="text-sm text-gray-200 mt-0.5">{query}</p>
      </div>
      <div className="text-xs text-gray-400">
        Embedded to <span className="text-amber-300 font-medium">{result.chunkEmbeddings[0]?.dimensions ?? result.queryEmbedding.length}D</span> vector
      </div>
      <div className="flex gap-px h-6 rounded overflow-hidden">
        {result.queryEmbedding.slice(0, 60).map((val, i) => (
          <div key={i} className="flex-1" style={{
            backgroundColor: val > 0
              ? `rgba(251, 191, 36, ${Math.min(Math.abs(val) * 5, 1)})`
              : `rgba(139, 92, 246, ${Math.min(Math.abs(val) * 5, 1)})`,
          }} />
        ))}
      </div>
    </>
  );
}

function RetrievalContent({
  result,
  config,
  onConfigChange,
}: {
  result: PipelineResult | null;
  config: PipelineConfig;
  onConfigChange: (u: Partial<PipelineConfig>) => void;
}) {
  if (!result) return <EmptyState />;

  const topIds = new Set(result.topChunks.map(c => c.chunkId));
  const chartData = result.similarityResults.map(r => ({
    name: `#${r.chunkId + 1}`,
    score: Number((r.score * 100).toFixed(1)),
    isTop: topIds.has(r.chunkId),
  }));

  return (
    <>
      <div className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-lg border border-gray-700/30">
        <span className="text-xs text-gray-400">Top-K</span>
        <input type="range" min={1} max={Math.min(10, result.similarityResults.length)} value={config.topK}
          onChange={(e) => onConfigChange({ topK: Number(e.target.value) })}
          className="flex-1 accent-primary-500" />
        <span className="text-xs text-primary-400 font-medium">{config.topK}</span>
      </div>

      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 9 }} tickFormatter={v => `${v}%`} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 9 }} width={32} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6', fontSize: 11 }} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {chartData.map((e, i) => (
                <Cell key={i} fill={e.isTop ? '#5c7cfa' : '#374151'} opacity={e.isTop ? 1 : 0.5} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-1.5">
        {result.topChunks.map(r => (
          <div key={r.chunkId} className="p-2 bg-primary-500/5 border border-primary-500/20 rounded-lg">
            <div className="flex justify-between mb-0.5">
              <span className="text-[10px] text-primary-400 font-medium">#{r.rank} — Chunk #{r.chunkId + 1}</span>
              <span className="badge-green text-[9px]">{(r.score * 100).toFixed(1)}%</span>
            </div>
            <p className="text-[11px] text-gray-400 line-clamp-2">{r.chunk.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function PromptContent({ result }: { result: PipelineResult | null }) {
  const [copied, setCopied] = useState(false);
  if (!result) return <EmptyState />;

  const handleCopy = () => {
    navigator.clipboard.writeText(result.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">{result.prompt.length} chars</span>
        <button onClick={handleCopy} className="btn-secondary text-[10px] py-1 px-2 flex items-center gap-1">
          {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 max-h-[350px] overflow-auto">
        <pre className="text-[10px] text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
          {result.prompt.split(/(CONTEXT:|QUESTION:|INSTRUCTIONS:)/g).map((part, i) =>
            ['CONTEXT:', 'QUESTION:', 'INSTRUCTIONS:'].includes(part)
              ? <span key={i} className="text-primary-400 font-bold">{part}</span>
              : <span key={i}>{part}</span>
          )}
        </pre>
      </div>
    </>
  );
}

function AnswerContent({ result, query }: { result: PipelineResult | null; query: string }) {
  if (!result) return <EmptyState />;

  return (
    <>
      <div className="p-2.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
        <span className="text-[10px] text-gray-500 uppercase">Question</span>
        <p className="text-xs text-gray-300 mt-0.5">{query}</p>
      </div>

      <div className="p-3 bg-gradient-to-br from-primary-500/10 to-primary-600/5 border border-primary-500/20 rounded-xl">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-4 h-4 text-primary-400" />
          <span className="text-xs font-semibold text-primary-300">Answer</span>
        </div>
        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{result.answer}</p>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <BookOpen className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-medium text-gray-300">Sources</span>
        </div>
        <div className="space-y-1.5">
          {result.topChunks.map(r => (
            <div key={r.chunkId} className="p-2 bg-green-500/5 border border-green-500/20 rounded-lg">
              <div className="flex justify-between mb-0.5">
                <span className="text-[10px] text-green-400 font-medium">Chunk #{r.chunkId + 1}</span>
                <span className="badge-green text-[9px]">{(r.score * 100).toFixed(1)}%</span>
              </div>
              <p className="text-[11px] text-gray-400 line-clamp-2">{r.chunk.text}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8">
      <ChevronRight className="w-8 h-8 text-gray-700 mx-auto mb-2" />
      <p className="text-xs text-gray-600">Run the pipeline to see results</p>
    </div>
  );
}
