import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import InvoiceTable from '../components/InvoiceTable';
import SubmitExpenseModal from '../components/SubmitExpenseModal';
import { departments } from '../data/mockData';
import type { FilterState, SortField, SortDirection, UserRole, Invoice } from '../types';

const DEFAULT_FILTER: FilterState = {
  status: 'all',
  department: 'all',
  dateFrom: '',
  dateTo: '',
  search: '',
};

const DEFAULT_PAGE_SIZE = 10;

type InvoicesPageProps = {
  role?: UserRole;
  invoices: Invoice[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSubmitExpense: (data: {
    requester: string;
    amount: number;
    department_id: number;
    category: string;
    vendor: string;
    description: string;
  }) => Promise<boolean>;
};

export default function InvoicesPage({
  role = 'cfo',
  invoices,
  onApprove,
  onReject,
  onSubmitExpense,
}: InvoicesPageProps) {
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Default to newest/desc
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  // Apply filters, sort, and paginate
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    if (role === 'employee') {
      result = result.filter(
        (inv) => inv.employeeName === 'Geovanny Cartwright'
      );
    }

    // Filter by status
    if (filter.status !== 'all') {
      result = result.filter((inv) => inv.status === filter.status);
    }

    // Filter by department
    if (filter.department !== 'all') {
      result = result.filter(
        (inv) => inv.departmentName === filter.department
      );
    }

    // Filter by date range
    if (filter.dateFrom) {
      const fromDate = new Date(filter.dateFrom);
      result = result.filter((inv) => new Date(inv.date) >= fromDate);
    }
    if (filter.dateTo) {
      const toDate = new Date(filter.dateTo);
      toDate.setHours(23, 59, 59, 999); // end of day
      result = result.filter((inv) => new Date(inv.date) <= toDate);
    }

    // Search
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.id.toLowerCase().includes(q) ||
          inv.employeeName.toLowerCase().includes(q) ||
          inv.vendor.toLowerCase().includes(q) ||
          inv.description.toLowerCase().includes(q) ||
          inv.departmentName.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'id':
          cmp = a.id.localeCompare(b.id);
          break;
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'date':
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'employeeName':
          cmp = a.employeeName.localeCompare(b.employeeName);
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [invoices, role, filter, sortField, sortDirection]);

  // Paginate
  const totalItems = filteredInvoices.length;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * DEFAULT_PAGE_SIZE;
    return filteredInvoices.slice(start, start + DEFAULT_PAGE_SIZE);
  }, [filteredInvoices, currentPage]);

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filter handler
  const handleFilterChange = (newFilter: FilterState) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const deptOptions = departments.map((d) => ({
    id: d.id,
    name: d.name,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl font-heading font-semibold text-foreground">
            Invoices
          </h1>
          <p className="text-sm text-muted mt-1">
            Browse, filter, and review all expense invoices
          </p>
        </motion.div>

        {role === 'employee' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setIsSubmitOpen(true)}
            className="bg-accent text-background font-semibold text-xs py-2.5 px-4 rounded-lg hover:bg-accent-hover transition-all-200 cursor-pointer flex items-center gap-1.5 shadow-lg shadow-accent/15"
          >
            <Plus size={16} />
            Submit Expense
          </motion.button>
        )}
      </div>

      <InvoiceTable
        invoices={paginatedInvoices}
        filter={filter}
        onFilterChange={handleFilterChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        currentPage={currentPage}
        pageSize={DEFAULT_PAGE_SIZE}
        onPageChange={setCurrentPage}
        totalItems={totalItems}
        departments={deptOptions}
        role={role}
        onApprove={onApprove}
        onReject={onReject}
      />

      <SubmitExpenseModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSubmit={onSubmitExpense}
        departments={departments}
      />
    </div>
  );
}
