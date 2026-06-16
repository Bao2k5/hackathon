import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Send, Landmark, Tag, Briefcase, User, Info } from 'lucide-react';
import type { Department } from '../types';

type SubmitExpenseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    requester: string;
    amount: number;
    department_id: number;
    category: string;
    vendor: string;
    description: string;
  }) => Promise<boolean>;
  departments: Department[];
  defaultRequester?: string;
};

const CATEGORIES = [
  { value: 'software', label: 'Software & Subscriptions' },
  { value: 'hardware', label: 'Equipment & Hardware' },
  { value: 'travel', label: 'Travel & Lodging' },
  { value: 'marketing', label: 'Marketing Spend' },
  { value: 'office', label: 'Office Supplies' },
  { value: 'training', label: 'Training & Education' },
  { value: 'other', label: 'Other Expenses' },
];

export default function SubmitExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  departments,
  defaultRequester = 'Geovanny Cartwright',
}: SubmitExpenseModalProps) {
  const [requester, setRequester] = useState(defaultRequester);
  const [amount, setAmount] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '1');
  const [category, setCategory] = useState('software');
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!vendor.trim()) {
      setError('Please specify a vendor');
      return;
    }
    if (!description.trim()) {
      setError('Please describe the purpose of the expense');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Find numeric ID of the department (standard: 1 to 5)
      // If departmentId is alpha (e.g. from mock data), we map to a number 1-5
      let deptNum = 1;
      const index = departments.findIndex((d) => d.id === departmentId);
      if (index !== -1) {
        deptNum = (index % 5) + 1;
      }

      const ok = await onSubmit({
        requester,
        amount: parseFloat(amount),
        department_id: deptNum,
        category,
        vendor,
        description,
      });

      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setAmount('');
          setVendor('');
          setDescription('');
          onClose();
        }, 1500);
      } else {
        setError('Submission failed. Check backend connection.');
      }
    } catch (err) {
      setError('An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-lg glass rounded-2xl border border-border/20 shadow-2xl relative z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/10">
              <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
                <Send className="text-accent" size={16} />
                Submit New Expense Request
              </h2>
              <button
                onClick={onClose}
                className="text-foreground/50 hover:text-foreground hover:bg-white/5 p-1 rounded-lg transition-all-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg flex items-center gap-2">
                  <Info size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-accent/10 border border-accent/20 text-accent text-xs p-3 rounded-lg flex items-center gap-2">
                  <Info size={14} className="shrink-0" />
                  <span>Expense submitted successfully! AI Agents are analyzing...</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Requester */}
                <div>
                  <label className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider mb-1 block">
                    Requester Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-foreground/45" size={14} />
                    <input
                      type="text"
                      value={requester}
                      onChange={(e) => setRequester(e.target.value)}
                      placeholder="e.g. Geovanny Cartwright"
                      className="w-full bg-white/5 border border-border/10 rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/30 focus:bg-white/10 transition-all-200"
                      required
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider mb-1 block">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 text-foreground/45" size={14} />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 500.00"
                      step="0.01"
                      min="0.01"
                      className="w-full bg-white/5 border border-border/10 rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/30 focus:bg-white/10 transition-all-200"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Department */}
                <div>
                  <label className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider mb-1 block">
                    Department
                  </label>
                  <div className="relative">
                    <Landmark className="absolute left-3 top-2.5 text-foreground/45" size={14} />
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full bg-white/5 border border-border/10 rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/30 focus:bg-white/10 transition-all-200 appearance-none"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id} className="bg-background text-foreground">
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider mb-1 block">
                    Category
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 text-foreground/45" size={14} />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white/5 border border-border/10 rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/30 focus:bg-white/10 transition-all-200 appearance-none"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value} className="bg-background text-foreground">
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Vendor */}
              <div>
                <label className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider mb-1 block">
                  Vendor / Provider
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 text-foreground/45" size={14} />
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="e.g. AWS, Microsoft, Slack"
                    className="w-full bg-white/5 border border-border/10 rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/30 focus:bg-white/10 transition-all-200"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider mb-1 block">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this expense request..."
                  rows={3}
                  className="w-full bg-white/5 border border-border/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/30 focus:bg-white/10 transition-all-200"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white/5 border border-border/10 text-foreground font-semibold text-xs py-2 px-4 rounded-lg hover:bg-white/10 transition-all-200 cursor-pointer"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-accent text-background font-semibold text-xs py-2 px-4 rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-all-200 cursor-pointer flex items-center gap-1.5 shadow-lg shadow-accent/10"
                  disabled={loading || success}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
