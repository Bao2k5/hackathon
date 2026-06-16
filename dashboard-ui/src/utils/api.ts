import type { Invoice, AIDecision, InvoiceStatus, AIAgent, ApprovalAction } from '../types';

// Let's check if the API backend is available
let apiAvailable = false;

// Helper to determine if we are running in the Integrated Flask environment
export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/expenses');
    apiAvailable = res.ok;
  } catch (err) {
    apiAvailable = false;
  }
  return apiAvailable;
}

export function isApiAvailable(): boolean {
  return apiAvailable;
}

export async function fetchInvoicesFromApi(): Promise<Invoice[]> {
  const res = await fetch('/api/expenses');
  if (!res.ok) throw new Error('Failed to fetch expenses');
  const data = await res.json();
  
  return data.map((item: any) => {
    let status: InvoiceStatus = 'pending';
    if (item.status === 'APPROVED') status = 'approved';
    else if (item.status === 'REJECTED') status = 'rejected';

    let aiScore = 80;
    if (item.risk_level === 'LOW') aiScore = 98;
    else if (item.risk_level === 'MEDIUM') aiScore = 65;
    else if (item.risk_level === 'HIGH') aiScore = 22;

    const aiFlags: string[] = [];
    if (item.risk_level === 'HIGH') aiFlags.push('High Risk Level Detected');
    if (item.status === 'ESCALATED') aiFlags.push('Escalated to Manager/CFO');

    return {
      id: item.id,
      employeeId: item.requester,
      employeeName: item.requester,
      departmentId: String(item.department_id),
      departmentName: item.department_name,
      amount: item.amount,
      currency: 'USD',
      description: item.description || 'No description provided',
      category: item.category || 'Other',
      vendor: item.vendor || 'Unknown Vendor',
      date: item.created_at,
      status,
      aiScore,
      aiFlags,
      approvedBy: item.approved_by || undefined,
      approvedAt: item.updated_at || undefined,
      receiptUrl: item.receipt_url || undefined,
      notes: item.note || undefined,
    };
  });
}

export async function fetchHistoryFromApi(): Promise<AIDecision[]> {
  const res = await fetch('/api/history');
  if (!res.ok) throw new Error('Failed to fetch history');
  const data = await res.json();

  return data.map((item: any) => {
    let agent: AIAgent = 'auto_approver';
    if (item.agent_name.includes('policy')) agent = 'fraud_detector';
    else if (item.agent_name.includes('risk')) agent = 'risk_analyzer';

    let action: ApprovalAction = 'flag';
    const act = item.action.toLowerCase();
    if (act.includes('approve')) action = 'approve';
    else if (act.includes('reject')) action = 'reject';

    return {
      id: String(item.id),
      invoiceId: item.expense_id,
      agent,
      agentLabel: item.agent_name.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      action,
      confidence: 90,
      reason: item.details || 'Processed successfully',
      timestamp: item.timestamp,
    };
  });
}

export async function submitExpenseToApi(payload: {
  requester: string;
  amount: number;
  department_id: number;
  category: string;
  vendor: string;
  description: string;
  receiptData?: string | null;
}): Promise<{ success: boolean; expense_id?: string; error?: string }> {
  const res = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function overrideExpenseInApi(expenseId: string, action: 'APPROVED' | 'REJECTED'): Promise<boolean> {
  const res = await fetch(`/api/override/${expenseId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.success;
}
