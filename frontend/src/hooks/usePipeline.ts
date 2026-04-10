import { useState, useCallback, useRef } from 'react';
import type { PipelineConfig, PipelineResult, PipelineStep } from '../lib/types';
import { runPipeline } from '../lib/api';
import { DEFAULT_CONFIG, SAMPLE_DOCUMENTS } from '../lib/constants';

const STEP_ORDER: PipelineStep[] = [
  'ingestion', 'input', 'chunking', 'embedding', 'vectordb', 'query', 'retrieval', 'prompt', 'answer',
];

const STEP_DELAY_MS: Record<PipelineStep, number> = {
  ingestion: 0,
  input: 0,
  chunking: 600,
  embedding: 800,
  vectordb: 600,
  query: 500,
  retrieval: 700,
  prompt: 500,
  answer: 400,
};

export function usePipeline() {
  const [documentText, setDocumentText] = useState(SAMPLE_DOCUMENTS[0].text);
  const [query, setQuery] = useState('');
  const [config, setConfig] = useState<PipelineConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [currentStep, setCurrentStep] = useState<PipelineStep>('ingestion');
  const [processingStep, setProcessingStep] = useState<PipelineStep | null>(null);
  const [completedSteps, setCompletedSteps] = useState<PipelineStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const animateSteps = useCallback(async (pipelineResult: PipelineResult) => {
    const steps = STEP_ORDER.slice(2); // skip 'ingestion' and 'input'
    const completed: PipelineStep[] = ['ingestion', 'input'];

    for (const step of steps) {
      if (abortRef.current) break;
      setProcessingStep(step);
      await delay(STEP_DELAY_MS[step]);
      if (abortRef.current) break;
      completed.push(step);
      setCompletedSteps([...completed]);
    }

    setProcessingStep(null);
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
    setCompletedSteps(['ingestion', 'input']);
    setProcessingStep('chunking');

    try {
      const pipelineResult = await runPipeline(documentText, query, config);
      await animateSteps(pipelineResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setProcessingStep(null);
    } finally {
      setIsRunning(false);
      setProcessingStep(null);
    }
  }, [documentText, query, config, animateSteps]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setResult(null);
    setCurrentStep('ingestion');
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
