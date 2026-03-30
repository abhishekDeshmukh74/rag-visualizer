import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

interface StepCardProps {
  title: string;
  description: string;
  educationalText: string;
  isActive: boolean;
  children: React.ReactNode;
}

export default function StepCard({ title, description, educationalText, isActive, children }: StepCardProps) {
  return (
    <motion.div
      className={`step-card ${isActive ? 'active' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-100">{title}</h2>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      </div>

      <div className="mb-4 flex items-start gap-2 p-3 bg-primary-500/5 border border-primary-500/20 rounded-lg">
        <Info className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-primary-200/80 leading-relaxed">{educationalText}</p>
      </div>

      <div>{children}</div>
    </motion.div>
  );
}
