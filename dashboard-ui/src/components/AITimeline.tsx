import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Bot } from 'lucide-react';
import { formatRelativeTime } from '../utils/format';

const actionConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  approve: {
    icon: <CheckCircle2 size={16} />,
    color: 'text-accent',
    label: 'Approved',
  },
  reject: {
    icon: <XCircle size={16} />,
    color: 'text-destructive',
    label: 'Rejected',
  },
  flag: {
    icon: <AlertTriangle size={16} />,
    color: 'text-orange-glow',
    label: 'Flagged',
  },
};

const agentColors: Record<string, string> = {
  auto_approver: 'oklch(0.72 0.172 225.36)',
  risk_analyzer: 'oklch(0.627 0.265 303.9)',
  fraud_detector: 'oklch(0.715 0.215 45.0)',
};

const agentGradients: Record<string, string> = {
  auto_approver:
    'linear-gradient(135deg, oklch(0.72 0.172 225.36 / 0.2), oklch(0.72 0.172 225.36 / 0.05))',
  risk_analyzer:
    'linear-gradient(135deg, oklch(0.627 0.265 303.9 / 0.2), oklch(0.627 0.265 303.9 / 0.05))',
  fraud_detector:
    'linear-gradient(135deg, oklch(0.715 0.215 45.0 / 0.2), oklch(0.715 0.215 45.0 / 0.05))',
};

import { AIDecision } from '../types';

// Get unique invoices with their AI decision chains
function getTimelineEvents(history: AIDecision[]) {
  const grouped = new Map<string, AIDecision[]>();
  history.forEach((d) => {
    if (!grouped.has(d.invoiceId)) grouped.set(d.invoiceId, []);
    grouped.get(d.invoiceId)!.push(d);
  });

  return Array.from(grouped.entries())
    .sort((a, b) => {
      const aTime = Math.max(...a[1].map((d) => new Date(d.timestamp).getTime()));
      const bTime = Math.max(...b[1].map((d) => new Date(d.timestamp).getTime()));
      return bTime - aTime;
    })
    .slice(0, 30);
}

type AITimelineProps = {
  history: AIDecision[];
};

export default function AITimeline({ history }: AITimelineProps) {
  const events = getTimelineEvents(history);

  return (
    <div className="space-y-6">
      {events.length === 0 && (
        <div className="text-center py-16">
          <Bot size={48} className="mx-auto text-muted mb-3" />
          <p className="text-muted text-sm">No AI decisions recorded yet.</p>
        </div>
      )}

      {events.map(([invoiceId, decisions], idx) => {
        const sortedDecisions = [...decisions].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const finalAction =
          sortedDecisions[sortedDecisions.length - 1]?.action || 'flag';
        const finalConfig = actionConfig[finalAction] || actionConfig.flag;

        return (
          <motion.div
            key={invoiceId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative"
          >
            {/* Timeline line */}
            <div className="absolute left-5 top-10 bottom-0 w-px bg-border/20" />

            <div className="flex gap-4">
              {/* Timeline node */}
              <div className="relative shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${finalConfig.color}`}
                  style={{
                    backgroundColor: 'oklch(0.176 0.038 262.5)',
                    borderColor: `${agentColors[sortedDecisions[0]?.agent] || 'oklch(0.3717 0.0392 257.29)'}`,
                  }}
                >
                  <Bot size={18} className={finalConfig.color} />
                </div>
              </div>

              {/* Content card */}
              <div className="flex-1 glass rounded-xl p-4 border-border/30 min-w-0">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted">
                      Invoice
                    </span>
                    <code className="text-xs font-heading text-cyan-glow bg-cyan-glow/10 px-1.5 py-0.5 rounded">
                      {invoiceId}
                    </code>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${finalConfig.color} bg-current/10`}
                  >
                    {finalConfig.icon}
                    <span>Final: {finalConfig.label}</span>
                  </div>
                </div>

                {/* Decision chain */}
                <div className="space-y-2">
                  {sortedDecisions.map((decision, dIdx) => {
                    const cfg = actionConfig[decision.action] || actionConfig.flag;
                    const agentColor = agentColors[decision.agent];

                    return (
                      <div
                        key={decision.id}
                        className="flex items-start gap-3 p-2.5 rounded-lg"
                        style={{ background: agentGradients[decision.agent] }}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${agentColor}25`,
                          }}
                        >
                          <span
                            className="text-[10px] font-bold"
                            style={{ color: agentColor }}
                          >
                            {decision.agent === 'auto_approver'
                              ? 'AA'
                              : decision.agent === 'risk_analyzer'
                              ? 'RA'
                              : 'FD'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className="text-xs font-semibold"
                              style={{ color: agentColor }}
                            >
                              {decision.agentLabel}
                            </span>
                            <span
                              className={`flex items-center gap-0.5 text-xs font-medium ${cfg.color}`}
                            >
                              {cfg.icon}
                              <span>{cfg.label}</span>
                            </span>
                            <span className="text-[10px] text-foreground/60 font-medium">
                              ({decision.confidence}% confidence)
                            </span>
                          </div>
                          <p className="text-xs text-foreground/90 leading-relaxed font-medium mt-0.5">{decision.reason}</p>
                          <span className="text-[10px] text-foreground/50 font-medium block mt-1">
                            {formatRelativeTime(decision.timestamp)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
