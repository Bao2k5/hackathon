import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import AITimeline from '../components/AITimeline';
import type { AIDecision } from '../types';

export default function AITimelinePage({ history }: { history: AIDecision[] }) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-glow/15 flex items-center justify-center">
            <Bot size={22} className="text-purple-glow" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-semibold text-foreground">
              AI Timeline
            </h1>
            <p className="text-sm text-muted mt-0.5">
              Audit trail of AI agent decisions across all invoices
            </p>
          </div>
        </div>
      </motion.div>

      {/* Agent Legend */}
      <div className="glass rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-xs text-muted font-medium uppercase tracking-wider">
            AI Agents
          </span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-glow" />
            <span className="text-xs text-foreground">Auto-Approver Alpha</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-glow" />
            <span className="text-xs text-foreground">Risk Analyzer Beta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-glow" />
            <span className="text-xs text-foreground">Fraud Detector Gamma</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <AITimeline history={history} />
    </div>
  );
}
