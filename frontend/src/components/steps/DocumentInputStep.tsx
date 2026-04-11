import { Upload, Database } from 'lucide-react';
import StepCard from '../StepCard';
import { PIPELINE_STEPS } from '../../lib/constants';
import type { DocumentStats } from '../../lib/types';

interface DocumentInputStepProps {
  documentText: string;
  onDocumentChange: (text: string) => void;
  documentStats: DocumentStats | null;
}

function estimateStats(text: string): DocumentStats {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return {
    sentenceCount: sentences.length,
    wordCount: words.length,
    charCount: text.length,
    estimatedTokens: Math.ceil(words.length * 1.3),
  };
}

export default function DocumentInputStep({
  documentText,
  onDocumentChange,
  documentStats,
}: DocumentInputStepProps) {
  const step = PIPELINE_STEPS[0];
  const stats = documentText ? (documentStats || estimateStats(documentText)) : null;

  return (
    <StepCard
      title={step.label}
      description={step.description}
      educationalText={step.educationalText}
      isActive={true}
    >
      <div className="space-y-4">
        {/* Knowledge base overview */}
        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary-400" />
            <span className="text-base font-medium text-gray-300">Pre-loaded Knowledge Base</span>
          </div>
          <p className="text-sm text-gray-500">
            We simulate a real company chatbot knowledge base using 4 pre-loaded documents.
            Each represents a common enterprise content type:
          </p>
          <ul className="space-y-2">
            {[
              { icon: '🔑', label: 'Password Reset FAQ',        desc: 'Account recovery steps, auth flows, common errors' },
              { icon: '↩️', label: 'Return & Refund Policy',    desc: 'Order returns, refund timelines, eligibility rules' },
              { icon: '🧭', label: 'Employee Onboarding Guide', desc: 'Day-1 setup, tooling, team processes & policies' },
              { icon: '🌴', label: 'Leave Policy',              desc: 'PTO, sick days, vacation accrual & approval flow' },
            ].map(({ icon, label, desc }) => (
              <li key={label} className="flex items-start gap-3 text-sm">
                <span className="text-lg leading-none mt-0.5">{icon}</span>
                <span>
                  <span className="text-gray-300 font-medium">{label}</span>
                  <span className="text-gray-500"> — {desc}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-500">
            Select one below to run it through the full RAG pipeline — from chunking and
            embedding to semantic retrieval and LLM-generated answers.
          </p>
        </div>

        {/* Text input */}
        <div>
          <label className="block text-base font-medium text-gray-400 mb-2">
            Document text
          </label>
          <textarea
            className="input-field min-h-[200px] resize-y font-mono text-base"
            placeholder="Paste your document text here..."
            value={documentText}
            onChange={(e) => onDocumentChange(e.target.value)}
          />
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex flex-wrap gap-3">
            <div className="badge-blue">
              <Upload className="w-3 h-3 mr-1" />
              {stats.sentenceCount} sentences
            </div>
            <div className="badge-gray">{stats.wordCount} words</div>
            <div className="badge-gray">{stats.charCount} chars</div>
            <div className="badge-amber">~{stats.estimatedTokens} tokens</div>
          </div>
        )}
      </div>
    </StepCard>
  );
}
