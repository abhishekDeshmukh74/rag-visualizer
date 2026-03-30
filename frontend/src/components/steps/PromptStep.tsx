import StepCard from '../StepCard';
import { PIPELINE_STEPS } from '../../lib/constants';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface PromptStepProps {
  prompt: string;
}

export default function PromptStep({ prompt }: PromptStepProps) {
  const step = PIPELINE_STEPS[5];
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Syntax-highlight the prompt structure
  const highlightPrompt = (text: string) => {
    const parts = text.split(/(CONTEXT:|QUESTION:|INSTRUCTIONS:)/g);
    return parts.map((part, i) => {
      if (['CONTEXT:', 'QUESTION:', 'INSTRUCTIONS:'].includes(part)) {
        return (
          <span key={i} className="text-primary-400 font-bold">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <StepCard
      title={step.label}
      description={step.description}
      educationalText={step.educationalText}
      isActive={true}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Full prompt sent to the LLM ({prompt.length} chars)
          </span>
          <button
            onClick={handleCopy}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 max-h-[500px] overflow-auto">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
            {highlightPrompt(prompt)}
          </pre>
        </div>
      </div>
    </StepCard>
  );
}
