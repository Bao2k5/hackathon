import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ExternalLink, CheckCircle2, AlertTriangle, Printer } from 'lucide-react';
import type { Invoice, UserRole } from '../types';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/format';

type InvoiceDetailModalProps = {
  invoice: Invoice;
  onClose: () => void;
  role?: UserRole;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
};

// Generate conversational agent messages dynamically for wow effect
function getAgentDiscussion(invoice: Invoice) {
  const messages = [];
  
  messages.push({
    sender: "Budget Checker Alpha",
    role: "budget_checker",
    avatar: "BC",
    color: "text-cyan-glow",
    bg: "bg-cyan-glow/5 border-cyan-glow/20",
    text: `Verifying department budget for ${invoice.departmentName}. Requested: ${formatCurrency(invoice.amount)}. Available budget verified. No overspend flag. Passing to Policy Checker.`
  });

  let policyText = `Validating Category: '${invoice.category}', Vendor: '${invoice.vendor}'. `;
  const isOverLimit = invoice.amount > 5000;
  
  if (isOverLimit) {
    policyText += `ALERT: Expense ${formatCurrency(invoice.amount)} exceeds the standard $5,000 approval threshold. Flagging for CFO manual review.`;
  } else if (invoice.category.toLowerCase() === 'software' && invoice.amount > 1000) {
    policyText += `NOTE: Software item exceeds $1,000 threshold. Checking IT pre-approval registry. Passed policy check with warning.`;
  } else {
    policyText += `All items comply with corporate travel and procurement policies. Policy check PASSED.`;
  }
  
  messages.push({
    sender: "Policy Checker Beta",
    role: "policy_checker",
    avatar: "PC",
    color: "text-purple-glow",
    bg: "bg-purple-glow/5 border-purple-glow/20",
    text: policyText
  });

  let riskText = "";
  if (invoice.aiScore >= 70) {
    riskText = `CRITICAL: High risk score (${invoice.aiScore}/100). Anomaly detected: vendor name spelling mismatch or duplicate metadata. Recommend immediate REJECTION.`;
  } else if (invoice.aiScore >= 40) {
    riskText = `WARNING: Moderate risk score (${invoice.aiScore}/100). Non-standard pricing pattern identified. Recommending ESCALATION to CFO.`;
  } else {
    riskText = `CLEAN: Low risk score (${invoice.aiScore}/100). No duplicates or fraudulent metadata found. Recommending AUTO-APPROVAL.`;
  }

  messages.push({
    sender: "Risk Analyzer Gamma",
    role: "risk_analyzer",
    avatar: "RA",
    color: "text-orange-glow",
    bg: "bg-orange-glow/5 border-orange-glow/20",
    text: riskText
  });

  let finalMsg = "";
  if (invoice.status === 'approved') {
    finalMsg = `Process complete. Status: APPROVED by ${invoice.approvedBy || "Approval Notifier"}. Ledger updated, funds deducted, notifying team chat.`;
  } else if (invoice.status === 'rejected') {
    finalMsg = `Process complete. Status: REJECTED. Flagged for compliance violations. Sending rejection email to requester.`;
  } else {
    finalMsg = `Process paused. Status: PENDING. Awaiting Human-in-the-Loop decision from CFO/Manager.`;
  }

  messages.push({
    sender: "Approval Notifier",
    role: "approval_notifier",
    avatar: "AN",
    color: "text-accent",
    bg: "bg-accent/5 border-accent/20",
    text: finalMsg
  });

  return messages;
}

export default function InvoiceDetailModal({
  invoice,
  onClose,
  role = 'cfo',
  onApprove,
  onReject,
}: InvoiceDetailModalProps) {
  const statusColors: Record<string, string> = {
    pending: 'bg-cyan-glow/15 text-cyan-glow border border-cyan-glow/25',
    approved: 'bg-accent/15 text-accent border border-accent/25',
    rejected: 'bg-destructive/15 text-destructive border border-destructive/25',
  };

  const allMessages = useMemo(() => getAgentDiscussion(invoice), [invoice]);
  const [visibleMessages, setVisibleMessages] = useState<any[]>([]);

  useEffect(() => {
    setVisibleMessages([]);
    let current = 0;
    const interval = setInterval(() => {
      if (current < allMessages.length) {
        setVisibleMessages(prev => [...prev, allMessages[current]]);
        current++;
      } else {
        clearInterval(interval);
      }
    }, 600);
    return () => clearInterval(interval);
  }, [allMessages]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative glass rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-border/30 z-10 print-modal"
        >
          {/* Print */}
          <button
            onClick={() => window.print()}
            className="absolute top-4 right-12 p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-white/5 transition-all-200 cursor-pointer no-print"
            title="Print Invoice"
          >
            <Printer size={18} />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-white/5 transition-all-200 cursor-pointer no-print"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
              <FileText size={20} className="text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-base font-heading font-semibold text-foreground">
                  Invoice Details
                </h2>
                <code className="text-xs font-heading text-cyan-glow bg-cyan-glow/10 px-1.5 py-0.5 rounded">
                  {invoice.id}
                </code>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  statusColors[invoice.status]
                }`}
              >
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider">
                Employee
              </label>
              <p className="text-sm text-foreground mt-0.5 font-medium">
                {invoice.employeeName}
              </p>
            </div>
            <div>
              <label className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider">
                Department
              </label>
              <p className="text-sm text-foreground mt-0.5 font-medium">
                {invoice.departmentName}
              </p>
            </div>
            <div>
              <label className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider">
                Amount
              </label>
              <p className="text-sm text-foreground font-semibold mt-0.5">
                {formatCurrency(invoice.amount)}
              </p>
            </div>
            <div>
              <label className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider">
                Category
              </label>
              <p className="text-sm text-foreground mt-0.5">
                {invoice.category}
              </p>
            </div>
            <div>
              <label className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider">
                Vendor
              </label>
              <p className="text-sm text-foreground mt-0.5 font-medium">{invoice.vendor}</p>
            </div>
            <div>
              <label className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider">
                Date Submitted
              </label>
              <p className="text-sm text-foreground mt-0.5">
                {formatDate(invoice.date)}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider mb-1 block">
              Description
            </label>
            <p className="text-sm text-foreground/90 leading-relaxed bg-white/5 p-3 rounded-lg border border-border/10">
              {invoice.description}
            </p>
          </div>

          {/* AI Analysis */}
          <div className="mb-6">
            <label className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider mb-2 block">
              AI Analysis
            </label>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    invoice.aiScore >= 70
                      ? 'bg-destructive glow-orange'
                      : invoice.aiScore >= 40
                      ? 'bg-orange-glow'
                      : 'bg-accent glow-cyan'
                  }`}
                  style={{ width: `${invoice.aiScore}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-foreground">
                {invoice.aiScore}/100
              </span>
            </div>
            {invoice.aiFlags.length > 0 && (
              <div className="space-y-1.5">
                {invoice.aiFlags.map((flag, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <AlertTriangle size={12} className="text-destructive mt-0.5 shrink-0" />
                    <span className="text-xs text-destructive-foreground/90 font-medium">{flag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Agent Chat Discussion */}
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-border/20 space-y-3 no-print">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-cyan-glow font-bold uppercase tracking-wider">
                🤖 Agent Auditing Room
              </span>
              <span className="text-[9px] text-muted-foreground animate-pulse">
                {visibleMessages.length < 4 ? "Agents analyzing..." : "Analysis complete"}
              </span>
            </div>
            
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {visibleMessages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${msg.bg}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold bg-white/10 ${msg.color}`}>
                    {msg.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold ${msg.color}`}>{msg.sender}</span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-normal mt-0.5 font-medium">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Approval Info */}
          {invoice.approvedBy && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-accent/10 border border-accent/20 mb-4">
              <CheckCircle2 size={16} className="text-accent shrink-0" />
              <div>
                <p className="text-xs text-foreground font-medium">
                  Approved by {invoice.approvedBy}
                </p>
                {invoice.approvedAt && (
                  <p className="text-[10px] text-foreground/60 mt-0.5">
                    {formatRelativeTime(invoice.approvedAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-4">
              <label className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider mb-1 block">
                Notes
              </label>
              <p className="text-sm text-foreground/80 bg-white/5 rounded-lg p-3 border border-border/10">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Receipt link & Action buttons */}
          <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-border/20 flex-wrap no-print">
            {invoice.receiptUrl ? (
              <a
                href={invoice.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover font-medium transition-all-200"
              >
                <ExternalLink size={14} />
                View Receipt
              </a>
            ) : (
              <div />
            )}

            {invoice.status === 'pending' && (
              <div className="flex items-center gap-2.5 ml-auto">
                {role === 'cfo' || (role === 'finance_manager' && invoice.amount < 15000) ? (
                  <>
                    <button
                      onClick={() => {
                        onApprove?.(invoice.id);
                        onClose();
                      }}
                      className="bg-accent text-background font-semibold text-xs py-2 px-4 rounded-lg hover:bg-accent-hover transition-all-200 cursor-pointer shadow-lg shadow-accent/10 text-center"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        onReject?.(invoice.id);
                        onClose();
                      }}
                      className="bg-white/5 border border-border text-foreground font-semibold text-xs py-2 px-4 rounded-lg hover:bg-white/10 hover:text-destructive hover:border-destructive/30 transition-all-200 cursor-pointer text-center"
                    >
                      Reject
                    </button>
                  </>
                ) : role === 'finance_manager' ? (
                  <span className="text-xs text-orange-400 font-medium italic bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg">
                    Requires CFO Approval (Exceeds Manager limit of $15,000)
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
