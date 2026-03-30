import { useState, useCallback, useRef } from 'react';
import type { PipelineConfig, PipelineResult, PipelineStep } from '../lib/types';
import { runPipeline } from '../lib/api';
import { DEFAULT_CONFIG } from '../lib/constants';

const STEP_ORDER: PipelineStep[] = [
  'input', 'chunking', 'embedding', 'query', 'retrieval', 'prompt', 'answer',
];

const STEP_DELAY_MS: Record<PipelineStep, number> = {
  input: 0,
  chunking: 600,
  embedding: 800,
  query: 500,
  retrieval: 700,
  prompt: 500,
  answer: 400,
};

export function usePipeline() {
  const [documentText, setDocumentText] = useState('');
  const [query, setQuery] = useState('');
  const [config, setConfig] = useState<PipelineConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [currentStep, setCurrentStep] = useState<PipelineStep>('input');
  const [processingStep, setProcessingStep] = useState<PipelineStep | null>(null);
  const [completedSteps, setCompletedSteps] = useState<PipelineStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const animateSteps = useCallback(async (pipelineResult: PipelineResult) => {
    const steps = STEP_ORDER.slice(1); // skip 'input'
    const completed: PipelineStep[] = ['input'];

    for (const step of steps) {
      if (abortRef.current) break;
      setProcessingStep(step);
      setCurrentStep(step);
      await delay(STEP_DELAY_MS[step]);
      if (abortRef.current) break;
      completed.push(step);
      setCompletedSteps([...completed]);
    }

    setProcessingStep(null);
    setCurrentStep('answer');
    setResult(pipelineResult);
  }, []);

  const run = useCallback(async () => {
    if (!documentText.trim() || !query.trim()) {
      setError('Please provide both a document and a query.');
      return;
    }

    abortRef.current = false;
    setIsRunning(true);
    setError(null);
    setResult(null);
    setCompletedSteps(['input']);
    setCurrentStep('chunking');
    setProcessingStep('chunking');

    try {
      const pipelineResult = await runPipeline(documentText, query, config);
      await animateSteps(pipelineResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setCurrentStep('input');
      setProcessingStep(null);
    } finally {
      setIsRunning(false);
      setProcessingStep(null);
    }
  }, [documentText, query, config, animateSteps]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setResult(null);
    setCurrentStep('input');
    setProcessingStep(null);
    setCompletedSteps([]);
    setError(null);
    setIsRunning(false);
  }, []);

  const updateConfig = useCallback((updates: Partial<PipelineConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    documentText,
    setDocumentText,
    query,
    setQuery,
    config,
    updateConfig,
    result,
    currentStep,
    setCurrentStep,
    processingStep,
    completedSteps,
    isRunning,
    error,
    run,
    reset,
  };
}
