import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import BudgetChart from '../components/BudgetChart';
import DepartmentProgress from '../components/DepartmentProgress';
import ActivityFeed from '../components/ActivityFeed';
import { getMonthlySpending } from '../data/mockData';
import type { Invoice, AIDecision } from '../types';

type DashboardPageProps = {
  role?: string;
  invoices: Invoice[];
  history: AIDecision[];
};

export default function DashboardPage({ role, invoices, history }: DashboardPageProps) {
  const isEmployee = role === 'employee';
  
  // Calculate employee personal metrics
  const employeeInvoices = invoices.filter(inv => inv.employeeName === 'Geovanny Cartwright');
  const personalPending = employeeInvoices.filter(i => i.status === 'pending');
  const personalApproved = employeeInvoices.filter(i => i.status === 'approved');
  const personalRejected = employeeInvoices.filter(i => i.status === 'rejected');
  
  const personalApprovedAmount = personalApproved.reduce((sum, i) => sum + i.amount, 0);

  // Dynamic metrics calculation from live invoices
  const totalPending = invoices.filter(i => i.status === 'pending').length;
  const totalApproved = invoices.filter(i => i.status === 'approved').length;
  const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
  const flagsRaised = invoices.reduce((sum, i) => sum + i.aiFlags.length, 0);

  const monthlyData = getMonthlySpending();

  // Calculate change percentages (mock — from last month)
  const lastMonthApproved = monthlyData.length > 1
    ? monthlyData[monthlyData.length - 2].approved
    : 0;
  const currentMonthApproved = monthlyData.length > 0
    ? monthlyData[monthlyData.length - 1].approved
    : 0;
  const approvalChange = lastMonthApproved > 0
    ? Math.round(((currentMonthApproved - lastMonthApproved) / lastMonthApproved) * 100)
    : 0;

  const cardData = isEmployee
    ? [
        {
          label: 'My Pending Invoices',
          value: personalPending.length,
          change: 0,
          changeLabel: 'active requests',
          icon: <Clock size={20} />,
          color: 'oklch(0.72 0.172 225.36)',
        },
        {
          label: 'My Approved Invoices',
          value: personalApproved.length,
          change: 5,
          changeLabel: 'this month',
          icon: <CheckCircle2 size={20} />,
          color: 'oklch(0.7227 0.192 149.58)',
        },
        {
          label: 'Total Reimbursed',
          value: personalApprovedAmount,
          prefix: '$',
          change: 15,
          changeLabel: 'increase',
          icon: <DollarSign size={20} />,
          color: 'oklch(0.627 0.265 303.9)',
        },
        {
          label: 'Rejected Invoices',
          value: personalRejected.length,
          change: 0,
          changeLabel: 'requires revision',
          icon: <AlertTriangle size={20} />,
          color: 'oklch(0.715 0.215 45.0)',
        },
      ]
    : [
        {
          label: 'Pending Approvals',
          value: totalPending,
          change: 12,
          changeLabel: 'vs last month',
          icon: <Clock size={20} />,
          color: 'oklch(0.72 0.172 225.36)',
        },
        {
          label: 'Approved',
          value: totalApproved,
          change: approvalChange,
          changeLabel: 'vs last month',
          icon: <CheckCircle2 size={20} />,
          color: 'oklch(0.7227 0.192 149.58)',
        },
        {
          label: 'Pending Amount',
          value: pendingAmount,
          prefix: '$',
          change: 8,
          changeLabel: 'increase',
          icon: <DollarSign size={20} />,
          color: 'oklch(0.627 0.265 303.9)',
        },
        {
          label: 'AI Flags Raised',
          value: flagsRaised,
          change: -5,
          changeLabel: 'vs last month',
          icon: <AlertTriangle size={20} />,
          color: 'oklch(0.715 0.215 45.0)',
        },
      ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-heading font-semibold text-foreground">
          {isEmployee ? 'My Expense Portal' : 'Dashboard'}
        </h1>
        <p className="text-sm text-muted mt-1">
          {isEmployee
            ? 'Welcome back, Geovanny Cartwright! Manage your personal expense invoices and review statuses.'
            : 'Real-time overview of expense approvals and AI analysis'}
        </p>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardData.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      {/* Charts Row */}
      {!isEmployee && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BudgetChart />
          <DepartmentProgress />
        </div>
      )}

      {/* Activity Feed */}
      <div className="grid grid-cols-1">
        <ActivityFeed role={role} invoices={invoices} history={history} />
      </div>
    </div>
  );
}
