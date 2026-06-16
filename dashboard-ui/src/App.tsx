import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import InvoicesPage from './pages/InvoicesPage';
import AITimelinePage from './pages/AITimelinePage';
import LoginScreen from './components/LoginScreen';
import type { UserRole, Invoice, AIDecision } from './types';

import { invoices as mockInvoices, aiHistory as mockHistory } from './data/mockData';
import {
  checkApiHealth,
  fetchInvoicesFromApi,
  fetchHistoryFromApi,
  submitExpenseToApi,
  overrideExpenseInApi
} from './utils/api';

type PageKey = 'dashboard' | 'invoices' | 'ai-timeline';

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Persona and login states persisted in localStorage for seamless refreshes
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('user_role') as UserRole) || 'cfo';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('is_logged_in') === 'true';
  });

  // Real-time states
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [history, setHistory] = useState<AIDecision[]>(mockHistory);
  const [useLiveApi, setUseLiveApi] = useState(false);

  // Poll backend
  const loadData = async () => {
    try {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        setUseLiveApi(true);
        const liveInvs = await fetchInvoicesFromApi();
        const liveHist = await fetchHistoryFromApi();
        setInvoices(liveInvs);
        setHistory(liveHist);
      } else {
        setUseLiveApi(false);
      }
    } catch (err) {
      setUseLiveApi(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setIsLoggedIn(true);
    localStorage.setItem('user_role', selectedRole);
    localStorage.setItem('is_logged_in', 'true');
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('user_role', newRole);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    localStorage.setItem('is_logged_in', 'false');
  };

  const handleApprove = async (invoiceId: string) => {
    if (useLiveApi) {
      const success = await overrideExpenseInApi(invoiceId, 'APPROVED');
      if (success) await loadData();
    } else {
      // Mock update
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? {
                ...inv,
                status: 'approved',
                approvedBy: role === 'cfo' ? 'CFO (You)' : 'Finance Manager (You)',
                approvedAt: new Date().toISOString(),
              }
            : inv
        )
      );
    }
  };

  const handleReject = async (invoiceId: string) => {
    if (useLiveApi) {
      const success = await overrideExpenseInApi(invoiceId, 'REJECTED');
      if (success) await loadData();
    } else {
      // Mock update
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? {
                ...inv,
                status: 'rejected',
              }
            : inv
        )
      );
    }
  };

  const handleSubmitExpense = async (data: {
    requester: string;
    amount: number;
    department_id: number;
    category: string;
    vendor: string;
    description: string;
    receiptData?: string | null;
  }) => {
    if (useLiveApi) {
      const res = await submitExpenseToApi(data);
      if (res.success) {
        await loadData();
        return true;
      }
      return false;
    } else {
      // Mock submission
      const newInvoiceId = `INV-${String(invoices.length + 1).padStart(4, '0')}`;
      const newInvoice: Invoice = {
        id: newInvoiceId,
        employeeId: 'EMP-MOCK',
        employeeName: data.requester,
        departmentId: String(data.department_id),
        departmentName:
          data.department_id === 1
            ? 'Engineering'
            : data.department_id === 2
            ? 'Marketing'
            : data.department_id === 3
            ? 'Human Resources'
            : data.department_id === 4
            ? 'Finance'
            : 'Operations',
        amount: data.amount,
        currency: 'USD',
        description: data.description,
        category: data.category,
        vendor: data.vendor,
        date: new Date().toISOString(),
        status: 'pending',
        aiScore: 85,
        aiFlags: [],
        receiptUrl: `https://example.com/receipts/${newInvoiceId}.pdf`,
      };

      setInvoices((prev) => [newInvoice, ...prev]);

      // Mock Agent execution timeline logs
      const mockAgentLogs: AIDecision[] = [
        {
          id: `DEC-${Date.now()}-1`,
          invoiceId: newInvoiceId,
          agent: 'auto_approver',
          agentLabel: 'Auto-Approver Alpha',
          action: data.amount < 1000 ? 'approve' : 'flag',
          confidence: 95,
          reason: data.amount < 1000 ? 'Amount is within limits and department budget is healthy.' : 'Escalating due to policy audit requirement.',
          timestamp: new Date().toISOString(),
        }
      ];

      setHistory((prev) => [...mockAgentLogs, ...prev]);
      return true;
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage role={role} invoices={invoices} history={history} />;
      case 'invoices':
        return (
          <InvoicesPage
            role={role}
            invoices={invoices}
            onApprove={handleApprove}
            onReject={handleReject}
            onSubmitExpense={handleSubmitExpense}
          />
        );
      case 'ai-timeline':
        return <AITimelinePage history={history} />;
      default:
        return <DashboardPage role={role} invoices={invoices} history={history} />;
    }
  };

  // If not logged in, render the Persona Quick Select screen
  if (!isLoggedIn) {
    return <LoginScreen onSelectRole={handleSelectRole} />;
  }

  return (
    <div className="h-screen bg-dotgrid-glow flex relative overflow-hidden">
      {/* Ambient Glow Orbs */}
      <div className="absolute top-[-15%] left-[20%] w-[600px] h-[600px] rounded-full bg-accent/8 blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[5%] w-[700px] h-[700px] rounded-full bg-purple-500/5 blur-[180px] pointer-events-none z-0" />
      <div className="absolute top-[35%] right-[25%] w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[130px] pointer-events-none z-0" />

      {/* Live API Status Indicator */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/5 border border-border/10 px-3 py-1.5 rounded-full backdrop-blur-md">
        <span className="w-2 h-2 rounded-full relative flex">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${useLiveApi ? 'bg-accent' : 'bg-orange-500'}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${useLiveApi ? 'bg-accent' : 'bg-orange-500'}`} />
        </span>
        <span className="text-[10px] font-semibold tracking-wider uppercase text-foreground/70">
          {useLiveApi ? 'Live Connected' : 'Mock Mode'}
        </span>
      </div>

      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onPageChange={(page) => setActivePage(page as PageKey)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        role={role}
        onRoleChange={handleRoleChange}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
