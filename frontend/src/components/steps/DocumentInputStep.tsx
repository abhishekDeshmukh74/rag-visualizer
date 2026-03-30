import { FileText, Upload } from 'lucide-react';
import StepCard from '../StepCard';
import { SAMPLE_DOCUMENTS, PIPELINE_STEPS } from '../../lib/constants';
import type { DocumentStats, SampleDocument } from '../../lib/types';

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

  const handleSampleClick = (sample: SampleDocument) => {
    onDocumentChange(sample.text);
  };

  return (
    <StepCard
      title={step.label}
      description={step.description}
      educationalText={step.educationalText}
      isActive={true}
    >
      <div className="space-y-4">
        {/* Sample documents */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Quick start with a sample document
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SAMPLE_DOCUMENTS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSampleClick(sample)}
                className={`
                  p-3 rounded-lg border text-left transition-all duration-200 text-sm
                  ${documentText === sample.text
                    ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:bg-gray-800'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="font-medium text-gray-300">{sample.title}</span>
                </div>
                <p className="text-xs text-gray-500">{sample.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Text input */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Or paste your own text
          </label>
          <textarea
            className="input-field min-h-[200px] resize-y font-mono text-sm"
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
