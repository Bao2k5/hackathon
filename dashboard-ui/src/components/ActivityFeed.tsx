import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { formatRelativeTime } from '../utils/format';
import type { Invoice, AIDecision } from '../types';

const actionConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  approve: { icon: <CheckCircle2 size={14} />, color: 'text-accent' },
  reject: { icon: <XCircle size={14} />, color: 'text-destructive' },
  flag: { icon: <AlertTriangle size={14} />, color: 'text-orange-glow' },
};

const agentColors: Record<string, string> = {
  auto_approver: 'oklch(0.72 0.172 225.36)',
  risk_analyzer: 'oklch(0.627 0.265 303.9)',
  fraud_detector: 'oklch(0.715 0.215 45.0)',
};

type ActivityFeedProps = {
  role?: string;
  employeeName?: string;
  invoices: Invoice[];
  history: AIDecision[];
};

export default function ActivityFeed({
  role,
  employeeName = 'Geovanny Cartwright',
  invoices,
  history,
}: ActivityFeedProps) {
  // Get last 8 decisions sorted by timestamp desc
  const recent = useMemo(() => {
    let list = [...history];
    if (role === 'employee') {
      const personalInvoiceIds = new Set(
        invoices
          .filter((inv) => inv.employeeName === employeeName)
          .map((inv) => inv.id)
      );
      list = list.filter((item) => personalInvoiceIds.has(item.invoiceId));
    }
    return list
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }, [role, employeeName, invoices, history]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass rounded-xl p-5"
    >
      <h3 className="font-heading text-sm font-semibold text-foreground mb-4">
        Recent AI Activity
      </h3>
      <div className="space-y-2">
        {recent.map((item, i) => {
          const config = actionConfig[item.action] || actionConfig.flag;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-all-200"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  backgroundColor: `${agentColors[item.agent]}20`,
                }}
              >
                <span
                  className="text-[10px] font-bold"
                  style={{ color: agentColors[item.agent] }}
                >
                  {item.agent === 'auto_approver'
                    ? 'AA'
                    : item.agent === 'risk_analyzer'
                    ? 'RA'
                    : 'FD'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-foreground">
                    {item.agentLabel}
                  </span>
                  <span className={`flex items-center gap-0.5 text-xs ${config.color}`}>
                    {config.icon}
                    <span className="capitalize">{item.action}</span>
                  </span>
                </div>
                <p className="text-xs text-muted line-clamp-1">{item.reason}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted">Inv: {item.invoiceId}</span>
                  <span className="text-[10px] text-muted">•</span>
                  <span className="text-[10px] text-muted flex items-center gap-1">
                    <Clock size={10} />
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
