import { faker } from '@faker-js/faker';
import type {
  Department,
  Employee,
  Invoice,
  AIDecision,
  InvoiceStatus,
  ApprovalAction,
} from '../types';

/* ── Seed for reproducibility ── */
faker.seed(42);

/* ── Departments ── */
const departmentNames = [
  'Engineering',
  'Marketing',
  'Sales',
  'Operations',
  'Human Resources',
  'Research & Development',
  'Customer Support',
  'Legal',
];

const departmentColors = [
  '#22C55E', // green
  '#3B82F6', // blue
  '#F59E0B', // amber
  '#EC4899', // pink
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#F97316', // orange
  '#EF4444', // red
];

export const departments: Department[] = departmentNames.map((name, i) => {
  const budget = faker.number.int({ min: 500_000, max: 5_000_000 });
  const spent = faker.number.int({ min: budget * 0.3, max: budget * 0.95 });
  return {
    id: faker.string.alphanumeric(6).toUpperCase(),
    name,
    budget,
    spent,
    headcount: faker.number.int({ min: 15, max: 200 }),
    color: departmentColors[i % departmentColors.length],
  };
});

/* ── Employees ── */
export const employees: Employee[] = Array.from({ length: 60 }, () => {
  const dept = faker.helpers.arrayElement(departments);
  return {
    id: faker.string.alphanumeric(8).toUpperCase(),
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    departmentId: dept.id,
    avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${faker.string.alphanumeric(8)}`,
  };
});

/* ── Invoice categories ── */
const categories = [
  'Travel',
  'Office Supplies',
  'Software & Subscriptions',
  'Equipment',
  'Meals & Entertainment',
  'Training & Education',
  'Transportation',
  'Utilities',
  'Professional Services',
  'Marketing Spend',
];

const vendors = [
  'Amazon Business',
  'Stripe',
  'AWS',
  'Google Cloud',
  'Microsoft',
  'Slack',
  'Figma',
  'Notion',
  'HubSpot',
  'Zoom',
  'Adobe',
  'Atlassian',
  'Salesforce',
  'Twilio',
  'Datadog',
  'GitHub',
  'Vercel',
  'Linear',
  'Loom',
  'Monday.com',
];



const aiFlagList = [
  'Amount exceeds department average by >50%',
  'Vendor not in approved list',
  'Duplicate invoice detected',
  'Unusual spending pattern',
  'Missing receipt attachment',
  'Suspicious vendor domain',
  'Amount exceeds approval threshold',
  'Category mismatch with department policy',
];

/* ── Helper: pick a status with weighted distribution ── */
function pickStatus(): InvoiceStatus {
  const rand = faker.number.float({ min: 0, max: 1 });
  if (rand < 0.4) return 'pending';
  if (rand < 0.8) return 'approved';
  return 'rejected';
}

/* ── Invoices ── */
export const invoices: Invoice[] = Array.from({ length: 150 }, (_, i) => {
  const employee = faker.helpers.arrayElement(employees);
  const dept = departments.find((d) => d.id === employee.departmentId)!;
  const status = pickStatus();
  const daysAgo = faker.number.int({ min: 1, max: 90 });
  const amount = faker.number.int({ min: 50, max: 25_000 });

  return {
    id: `INV-${String(i + 1).padStart(4, '0')}`,
    employeeId: employee.id,
    employeeName: employee.name,
    departmentId: dept.id,
    departmentName: dept.name,
    amount,
    currency: 'USD',
    description: faker.commerce.productDescription().slice(0, 80),
    category: faker.helpers.arrayElement(categories),
    vendor: faker.helpers.arrayElement(vendors),
    date: faker.date.recent({ days: daysAgo }).toISOString(),
    status,
    aiScore: faker.number.int({ min: 20, max: 100 }),
    aiFlags: faker.helpers.arrayElements(aiFlagList, faker.number.int({ min: 0, max: 3 })),
    approvedBy: status === 'approved' ? faker.person.fullName() : undefined,
    approvedAt: status === 'approved' ? faker.date.recent({ days: daysAgo }).toISOString() : undefined,
    receiptUrl: faker.helpers.maybe(() => faker.internet.url(), { probability: 0.7 }),
    notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
  };
});

/* ── AI Decisions (audit trail) ── */
export const aiHistory: AIDecision[] = invoices.flatMap((inv) => {
  const decisions: AIDecision[] = [];
  // Auto-Approver always runs first
  const aaAction: ApprovalAction = faker.number.float() < 0.6 ? 'approve' : 'flag';
  decisions.push({
    id: faker.string.alphanumeric(12).toUpperCase(),
    invoiceId: inv.id,
    agent: 'auto_approver',
    agentLabel: 'Auto-Approver Alpha',
    action: aaAction,
    confidence: faker.number.int({ min: 65, max: 99 }),
    reason: aaAction === 'approve'
      ? 'Within policy parameters, low risk'
      : 'Amount exceeds auto-approval threshold',
    timestamp: new Date(
      new Date(inv.date).getTime() - 60000 * 5
    ).toISOString(),
  });

  // Risk Analyzer runs second
  const raAction: ApprovalAction = faker.number.float() < 0.7 ? 'approve' : 'flag';
  decisions.push({
    id: faker.string.alphanumeric(12).toUpperCase(),
    invoiceId: inv.id,
    agent: 'risk_analyzer',
    agentLabel: 'Risk Analyzer Beta',
    action: raAction,
    confidence: faker.number.int({ min: 55, max: 95 }),
    reason: raAction === 'approve'
      ? `Risk score ${faker.number.int({ min: 10, max: 40 })}/100 — acceptable`
      : `Risk score ${faker.number.int({ min: 60, max: 95 })}/100 — needs review`,
    timestamp: new Date(
      new Date(inv.date).getTime() + 60000 * faker.number.int({ min: 1, max: 15 })
    ).toISOString(),
  });

  // Fraud Detector runs third (only if flagged)
  if (faker.number.float() < 0.3) {
    const fdAction: ApprovalAction = faker.number.float() < 0.5 ? 'approve' : 'reject';
    decisions.push({
      id: faker.string.alphanumeric(12).toUpperCase(),
      invoiceId: inv.id,
      agent: 'fraud_detector',
      agentLabel: 'Fraud Detector Gamma',
      action: fdAction,
      confidence: faker.number.int({ min: 70, max: 98 }),
      reason: fdAction === 'approve'
        ? 'No fraud indicators detected'
        : 'Potential duplicate invoice — vendor mismatch flag',
      timestamp: new Date(
        new Date(inv.date).getTime() + 60000 * faker.number.int({ min: 20, max: 60 })
      ).toISOString(),
    });
  }

  return decisions;
});

/* ── Helper: compute dashboard metrics ── */

export type DashboardMetrics = {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalAmount: number;
  pendingAmount: number;
  avgApprovalTime: number; // in hours
  flagsRaised: number;
};

export function computeDashboardMetrics(): DashboardMetrics {
  const pending = invoices.filter((i) => i.status === 'pending');
  const approved = invoices.filter((i) => i.status === 'approved');
  const rejected = invoices.filter((i) => i.status === 'rejected');

  // Average approval time: difference between created date and approvedAt
  const approvalTimes = approved
    .filter((i) => i.approvedAt)
    .map((i) => {
      const created = new Date(i.date).getTime();
      const approvedTime = new Date(i.approvedAt!).getTime();
      return (approvedTime - created) / (1000 * 60 * 60); // hours
    });

  const avgApprovalTime =
    approvalTimes.length > 0
      ? approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length
      : 0;

  return {
    totalPending: pending.length,
    totalApproved: approved.length,
    totalRejected: rejected.length,
    totalAmount: invoices.reduce((sum, i) => sum + i.amount, 0),
    pendingAmount: pending.reduce((sum, i) => sum + i.amount, 0),
    avgApprovalTime: Math.round(avgApprovalTime * 10) / 10,
    flagsRaised: invoices.filter((i) => i.aiFlags.length > 0).length,
  };
}

/* ── Monthly spending for chart ── */
export type MonthlySpend = {
  month: string;
  approved: number;
  pending: number;
  rejected: number;
};

export function getMonthlySpending(): MonthlySpend[] {
  const months: Record<string, MonthlySpend> = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Initialize last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    months[key] = { month: key, approved: 0, pending: 0, rejected: 0 };
  }

  invoices.forEach((inv) => {
    const d = new Date(inv.date);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (months[key]) {
      months[key][inv.status] += inv.amount;
    }
  });

  return Object.values(months);
}
