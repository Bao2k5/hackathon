/* ── Invoice & Approval Types ── */

export type InvoiceStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'cfo' | 'finance_manager' | 'employee';
export type ApprovalAction = 'approve' | 'reject' | 'flag';
export type AIAgent = 'auto_approver' | 'risk_analyzer' | 'fraud_detector';

export type Department = {
  id: string;
  name: string;
  budget: number;
  spent: number;
  headcount: number;
  color: string;
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  avatar: string;
};

export type Invoice = {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  vendor: string;
  date: string;
  status: InvoiceStatus;
  aiScore: number;
  aiFlags: string[];
  approvedBy?: string;
  approvedAt?: string;
  receiptUrl?: string;
  notes?: string;
};

export type AIDecision = {
  id: string;
  invoiceId: string;
  agent: AIAgent;
  agentLabel: string;
  action: ApprovalAction;
  confidence: number;
  reason: string;
  timestamp: string;
};

export type MetricCardData = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: number;
  changeLabel: string;
  icon: string;
  color: string;
};

export type SortField = 'id' | 'amount' | 'date' | 'employeeName';
export type SortDirection = 'asc' | 'desc';

export type FilterState = {
  status: InvoiceStatus | 'all';
  department: string;
  dateFrom: string;
  dateTo: string;
  search: string;
};

export type PaginationState = {
  currentPage: number;
  pageSize: number;
};
