import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Scissors, Binary, Search, Filter, MessageSquare, Sparkles,
  X, ChevronRight, ChevronLeft, Copy, Check, Eye, EyeOff, BookOpen, Database, Info, Upload, Play,
} from 'lucide-react';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { PipelineStep, PipelineResult, PipelineConfig, SampleDocument } from '../lib/types';
import { PIPELINE_STEPS, SAMPLE_DOCUMENTS } from '../lib/constants';

const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, Scissors, Binary, Search, Filter, MessageSquare, Sparkles, Database, Upload,
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
  onNext: () => void;
  onPrev: () => void;
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
  onNext,
  onPrev,
}: StepDetailPanelProps) {
  const stepInfo = PIPELINE_STEPS.find((s) => s.id === currentStep)!;
  const Icon = stepIcons[stepInfo.icon];
  const currentIndex = PIPELINE_STEPS.findIndex((s) => s.id === currentStep);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === PIPELINE_STEPS.length - 1;
  const requiresPipelineRun = currentStep === 'input';
  const nextDisabled = isLast || (requiresPipelineRun && !result);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 30 }}
        transition={{ duration: 0.3 }}
        className="w-full sm:w-[420px] max-h-full sm:max-h-[calc(100vh-20px)] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
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
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Educational tip with info icon for deep dive */}
        <div className="px-4 pt-3 shrink-0">
          <EducationalTip
            educationalText={stepInfo.educationalText}
            educationalItems={stepInfo.educationalItems}
            deepDiveText={stepInfo.deepDiveText}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentStep === 'ingestion' && <IngestionContent />}
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

        {/* Step navigation footer */}
        <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between shrink-0">
          <button
            onClick={onPrev}
            disabled={isFirst}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-gray-200 hover:bg-gray-800 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>

          <span className="text-[10px] text-gray-600">
            {currentIndex + 1} / {PIPELINE_STEPS.length}
          </span>

          <button
            onClick={onNext}
            disabled={nextDisabled}
            title={requiresPipelineRun && !result ? 'Run the pipeline first' : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-gray-200 hover:bg-gray-800 disabled:hover:bg-transparent"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ---- Educational tip with deep dive toggle ---- */

function EducationalTip({ educationalText, educationalItems, deepDiveText }: { educationalText: string; educationalItems?: { label: string; description: string }[]; deepDiveText: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-2.5 bg-primary-500/5 border border-primary-500/20 rounded-lg">
      <div className="flex items-start gap-2">
        <BookOpen className="w-3.5 h-3.5 text-primary-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-primary-200/70 leading-relaxed">{educationalText}</p>
          {educationalItems && educationalItems.length > 0 && (
            <ul className="mt-2 space-y-1">
              {educationalItems.map((item) => (
                <li key={item.label} className="flex items-start gap-1.5 text-xs">
                  <span className="mt-0.5 w-1 h-1 rounded-full bg-primary-400/60 shrink-0" />
                  <span>
                    <span className="text-primary-300 font-medium">{item.label}</span>
                    <span className="text-primary-200/60"> — {item.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`p-1 rounded-md transition-colors shrink-0 ${
            expanded
              ? 'bg-primary-500/15 text-primary-400'
              : 'text-primary-400/50 hover:text-primary-400 hover:bg-primary-500/10'
          }`}
          title="Deep dive"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 pt-2 border-t border-primary-500/10">
              <p className="text-xs text-primary-200/60 leading-relaxed">{deepDiveText}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---- Step content sub-components ---- */

const INGESTION_SOURCES = [
  { icon: FileText, label: 'PDF / Word Docs', example: 'Policies, manuals, guides', color: 'text-blue-400' },
  { icon: Database, label: 'Help Desk / CRM', example: 'Zendesk, Salesforce tickets', color: 'text-purple-400' },
  { icon: MessageSquare, label: 'Internal Wiki', example: 'Confluence, Notion, SharePoint', color: 'text-green-400' },
  { icon: Search, label: 'Web / Sitemap', example: 'Public docs, landing pages', color: 'text-amber-400' },
  { icon: Database, label: 'Databases', example: 'Product catalog, FAQs in SQL', color: 'text-red-400' },
  { icon: FileText, label: 'Chat & Email', example: 'Slack archives, support emails', color: 'text-cyan-400' },
];

const INGESTION_PIPELINE_STEPS = [
  { step: 1, label: 'Source Crawling', desc: 'Scan registered sources for new or updated content', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  { step: 2, label: 'Text Extraction', desc: 'Convert PDFs, HTML, DOCX to clean plain text', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  { step: 3, label: 'Data Cleaning', desc: 'Strip boilerplate, fix encoding, normalize whitespace', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  { step: 4, label: 'Deduplication', desc: 'Hash-based detection to skip duplicate content', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  { step: 5, label: 'Metadata Tagging', desc: 'Attach source URL, date, category, and doc type', color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20' },
  { step: 6, label: 'Load to Pipeline', desc: 'Pass cleaned docs to the RAG pipeline for chunking', color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20' },
];

function IngestionContent() {
  return (
    <>
      <p className="text-xs text-gray-400 leading-relaxed">
        A company chatbot's knowledge comes from existing documents across the organization.
        Before retrieval can work, these sources must be crawled, extracted, and loaded.
      </p>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Ingestion Pipeline</label>
        <div className="space-y-1.5">
          {INGESTION_PIPELINE_STEPS.map(({ step, label, desc, color, bg }) => (
            <div key={step} className={`flex items-start gap-3 p-2.5 rounded-lg border ${bg}`}>
              <span className={`text-sm font-bold ${color} w-5 shrink-0 text-center`}>{step}</span>
              <div>
                <p className={`text-xs font-semibold ${color}`}>{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Common Source Types</label>
        <div className="grid grid-cols-2 gap-2">
          {INGESTION_SOURCES.map(({ icon: Icon, label, example, color }) => (
            <div key={label} className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-800/40 border border-gray-700/30">
              <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${color}`} />
              <div>
                <p className="text-xs font-medium text-gray-200">{label}</p>
                <p className="text-[11px] text-gray-500">{example}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-lg bg-primary-500/5 border border-primary-500/20 space-y-2">
        <p className="text-xs font-medium text-primary-300">In this demo</p>
        <p className="text-xs text-primary-200/60 leading-relaxed">
          We simulate a real company knowledge base using 4 pre-loaded documents:
        </p>
        <ul className="space-y-1.5">
          {[
            { icon: '🔑', label: 'Password Reset FAQ',        desc: 'account recovery & auth flows' },
            { icon: '↩️', label: 'Return & Refund Policy',    desc: 'order returns, refunds, timelines' },
            { icon: '🧭', label: 'Employee Onboarding Guide', desc: 'day-1 setup, tools, processes' },
            { icon: '🌴', label: 'Leave Policy',              desc: 'PTO, sick days, vacation rules' },
          ].map(({ icon, label, desc }) => (
            <li key={label} className="flex items-start gap-2 text-xs">
              <span className="leading-none mt-0.5">{icon}</span>
              <span>
                <span className="text-primary-200/80 font-medium">{label}</span>
                <span className="text-primary-200/40"> — {desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

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
  const FIXED_QUESTIONS = [
    "How many sick leaves available per year?",
    "How many times can I reset password?",
    "How long does a refund take?",
  ];

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Sample Documents</label>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_DOCUMENTS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSample(s)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all ${
                documentText === s.text
                  ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                  : 'border-gray-700/50 bg-gray-800/30 text-gray-400 hover:border-gray-600'
              }`}
            >
              <FileText className="w-3 h-3 shrink-0" />
              {s.title}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 italic">
          These documents represent real knowledge-base content — just as they'd arrive after being crawled and cleaned in the Ingestion stage.
        </p>
      </div>

      {documentText && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-400">Document Content</label>
          <textarea
            readOnly
            value={documentText}
            className="w-full min-h-[160px] max-h-[260px] resize-y rounded-lg border border-gray-700/50 bg-gray-800/30 p-2.5 text-xs font-mono text-gray-300 leading-relaxed focus:outline-none"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Suggested Questions</label>
        <div className="flex flex-wrap gap-2">
          {FIXED_QUESTIONS.map((question) => (
            <button
              key={question}
              onClick={() => onQueryChange(question)}
              className={`text-left px-3 py-1.5 rounded-full border text-xs transition-all ${
                query === question
                  ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                  : 'border-gray-700/50 bg-gray-800/30 text-gray-400 hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {!result && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
          <Play className="w-4 h-4 text-primary-400 shrink-0" />
          <p className="text-xs text-primary-300">
            Select a document and question above, then hit <span className="font-semibold">Run</span> to start the pipeline.
          </p>
        </div>
      )}

      {stats && (
        <div className="flex flex-wrap gap-2 text-xs">
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
            className={`p-2 rounded-lg border text-xs transition-all cursor-pointer ${
              hoveredChunk === i
                ? 'border-primary-500 bg-primary-500/10 text-gray-200'
                : 'border-gray-700/30 bg-gray-800/20 text-gray-500 hover:border-gray-600'
            }`}
            onMouseEnter={() => setHoveredChunk(i)}
            onMouseLeave={() => setHoveredChunk(null)}
          >
            <div className="flex justify-between mb-0.5">
              <span className="text-xs text-primary-400 font-medium">Chunk #{chunk.id + 1}</span>
              <span className="text-xs text-gray-600">{chunk.text.length} chars</span>
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
      <div className="text-xs text-gray-400 mb-1">
        Each chunk →{' '}
        <span className="text-primary-300 font-medium">{result.chunkEmbeddings[0]?.dimensions}D</span> vector
        {' '}using <span className="text-primary-300 font-medium">all-MiniLM-L6-v2</span>
      </div>

      {/* Model comparison table */}
      <div className="rounded-lg border border-gray-700/50 overflow-hidden text-xs mb-1">
        <div className="grid grid-cols-2 bg-gray-800/80 px-2.5 py-1.5 text-gray-500 font-medium uppercase tracking-wide">
          <span>Model</span>
          <span className="text-right">Dims</span>
        </div>
        {[
          { name: 'all-MiniLM-L6-v2', dims: '384D', active: true },
          { name: 'bge-base-en-v1.5', dims: '768D', active: false },
          { name: 'bge-large-en-v1.5', dims: '1024D', active: false },
          { name: 'text-embedding-ada-002', dims: '1536D', active: false },
          { name: 'text-embedding-3-small', dims: '1536D', active: false },
          { name: 'text-embedding-3-large', dims: '3072D', active: false },
        ].map((m) => (
          <div
            key={m.name}
            className={`grid grid-cols-2 px-2.5 py-1.5 border-t border-gray-700/40 ${
              m.active ? 'bg-primary-900/30' : ''
            }`}
          >
            <span className={`font-mono ${m.active ? 'text-primary-300' : 'text-gray-400'}`}>{m.name}</span>
            <span className={`text-right font-medium ${m.active ? 'text-primary-300' : 'text-gray-500'}`}>{m.dims}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {result.chunkEmbeddings.map((emb, i) => (
          <div key={emb.chunkId} className="p-2.5 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-primary-400 font-medium">Chunk #{emb.chunkId + 1}</span>
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
              <div className="mt-2 p-1.5 bg-gray-900 rounded text-[11px] font-mono text-gray-600 max-h-16 overflow-auto">
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
          <p className="text-xs text-gray-500 mt-0.5">Vectors Stored</p>
        </div>
        <div className="p-2.5 bg-gray-800/30 rounded-lg border border-gray-700/30 text-center">
          <span className="text-lg font-bold text-purple-400">{dims}D</span>
          <p className="text-xs text-gray-500 mt-0.5">Dimensions</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Indexed Chunks</span>
        <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
          {result.chunkEmbeddings.map((emb) => (
            <div key={emb.chunkId} className="p-2 bg-gray-800/20 border border-gray-700/30 rounded-lg flex items-center gap-2">
              <Database className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="text-xs text-purple-400 font-medium shrink-0">#{emb.chunkId + 1}</span>
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
        <span className="text-xs text-gray-500 uppercase">Query</span>
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
              <span className="text-xs text-primary-400 font-medium">#{r.rank} — Chunk #{r.chunkId + 1}</span>
              <span className="badge-green text-[10px]">{(r.score * 100).toFixed(1)}%</span>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2">{r.chunk.text}</p>
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
        <button onClick={handleCopy} className="btn-secondary text-xs py-1 px-2 flex items-center gap-1">
          {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 max-h-[350px] overflow-auto">
        <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
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
        <span className="text-xs text-gray-500 uppercase">Question</span>
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
                <span className="text-xs text-green-400 font-medium">Chunk #{r.chunkId + 1}</span>
                <span className="badge-green text-[10px]">{(r.score * 100).toFixed(1)}%</span>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2">{r.chunk.text}</p>
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
