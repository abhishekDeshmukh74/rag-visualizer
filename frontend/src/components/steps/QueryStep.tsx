import StepCard from '../StepCard';
import { PIPELINE_STEPS } from '../../lib/constants';
import { Search } from 'lucide-react';

interface QueryStepProps {
  query: string;
  onQueryChange: (query: string) => void;
  queryEmbedding: number[] | null;
  embeddingDimensions?: number;
}

export default function QueryStep({ query, onQueryChange, queryEmbedding, embeddingDimensions }: QueryStepProps) {
  const step = PIPELINE_STEPS[3];

  return (
    <StepCard
      title={step.label}
      description={step.description}
      educationalText={step.educationalText}
      isActive={true}
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            className="input-field pl-10 text-lg"
            placeholder="Ask a question about the document..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>

        {queryEmbedding && (
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="text-sm text-gray-400 mb-2">
              Query converted to a{' '}
              <span className="text-primary-300 font-medium">{embeddingDimensions ?? queryEmbedding.length}-dimensional</span>{' '}
              embedding vector
            </div>
            <div className="flex gap-px h-8 rounded overflow-hidden">
              {queryEmbedding.slice(0, 80).map((val, i) => (
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
            <div className="text-[10px] text-gray-600 mt-1">
              First 80 of {embeddingDimensions ?? queryEmbedding.length} dimensions
            </div>
          </div>
        )}
      </div>
    </StepCard>
  );
}
