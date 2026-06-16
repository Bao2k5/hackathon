import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  FileText,
  X,
} from 'lucide-react';
import type {
  Invoice,
  InvoiceStatus,
  FilterState,
  SortField,
  SortDirection,
  UserRole,
} from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import InvoiceDetailModal from './InvoiceDetailModal';

type InvoiceTableProps = {
  invoices: Invoice[];
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  departments: { id: string; name: string }[];
  role?: UserRole;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
};

export default function InvoiceTable({
  invoices,
  filter,
  onFilterChange,
  sortField,
  sortDirection,
  onSort,
  currentPage,
  pageSize,
  onPageChange,
  totalItems,
  departments,
  role = 'cfo',
  onApprove,
  onReject,
}: InvoiceTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const statusColors: Record<InvoiceStatus, string> = {
    pending: 'bg-cyan-glow/15 text-cyan-glow border border-cyan-glow/25',
    approved: 'bg-accent/15 text-accent border border-accent/25',
    rejected: 'bg-destructive/15 text-destructive border border-destructive/25',
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-muted" />;
    return sortDirection === 'asc' ? (
      <ChevronUp size={12} className="text-accent" />
    ) : (
      <ChevronDown size={12} className="text-accent" />
    );
  };

  return (
    <>
      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Search invoices..."
              value={filter.search}
              onChange={(e) =>
                onFilterChange({ ...filter, search: e.target.value })
              }
              className="w-full bg-muted/50 border border-border/30 rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent/50 transition-all-200"
            />
          </div>

          {/* Status filter */}
          <select
            value={filter.status}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                status: e.target.value as InvoiceStatus | 'all',
              })
            }
            className="bg-muted/50 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-all-200 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Department filter */}
          <select
            value={filter.department}
            onChange={(e) =>
              onFilterChange({ ...filter, department: e.target.value })
            }
            className="bg-muted/50 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-all-200 cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Date range */}
          <input
            type="date"
            value={filter.dateFrom}
            onChange={(e) =>
              onFilterChange({ ...filter, dateFrom: e.target.value })
            }
            className="bg-muted/50 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-all-200"
            placeholder="From"
          />
          <input
            type="date"
            value={filter.dateTo}
            onChange={(e) =>
              onFilterChange({ ...filter, dateTo: e.target.value })
            }
            className="bg-muted/50 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-all-200"
            placeholder="To"
          />

          {/* Clear filters */}
          {(filter.status !== 'all' ||
            filter.department !== 'all' ||
            filter.search ||
            filter.dateFrom ||
            filter.dateTo) && (
            <button
              onClick={() =>
                onFilterChange({
                  status: 'all',
                  department: 'all',
                  dateFrom: '',
                  dateTo: '',
                  search: '',
                })
              }
              className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground px-2 py-2 rounded-lg hover:bg-white/5 transition-all-200 cursor-pointer"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/20">
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-muted cursor-pointer hover:text-foreground transition-all-200 select-none"
                  onClick={() => onSort('id')}
                >
                  <div className="flex items-center gap-1">
                    Invoice <SortIcon field="id" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted">
                  Employee
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted">
                  Department
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-medium text-muted cursor-pointer hover:text-foreground transition-all-200 select-none"
                  onClick={() => onSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount <SortIcon field="amount" />
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-muted cursor-pointer hover:text-foreground transition-all-200 select-none"
                  onClick={() => onSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date <SortIcon field="date" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted">
                  AI Score
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <FileText size={36} className="mx-auto text-muted mb-2" />
                    <p className="text-sm text-muted">No invoices found</p>
                    <p className="text-xs text-muted/60 mt-1">
                      Try adjusting your filters
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setSelectedInvoice(inv)}
                    className="border-b border-border/10 hover:bg-white/5 transition-all-200 cursor-pointer last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <code className="text-xs font-heading text-cyan-glow bg-cyan-glow/10 px-1.5 py-0.5 rounded">
                        {inv.id}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {inv.employeeName}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {inv.departmentName}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right font-medium">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">
                      {formatDate(inv.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                          statusColors[inv.status]
                        }`}
                      >
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              inv.aiScore >= 70
                                ? 'bg-destructive'
                                : inv.aiScore >= 40
                                ? 'bg-orange-glow'
                                : 'bg-accent'
                            }`}
                            style={{ width: `${inv.aiScore}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted w-6 text-right font-medium">
                          {inv.aiScore}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/20">
            <span className="text-xs text-muted">
              Showing {startItem}–{endItem} of {totalItems} invoices
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs rounded-lg text-muted hover:text-foreground hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all-200 cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(
                  1,
                  Math.min(currentPage - 2, totalPages - 4)
                );
                const page = start + i;
                if (page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`w-8 h-8 text-xs rounded-lg transition-all-200 cursor-pointer ${
                      page === currentPage
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'text-muted hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg text-muted hover:text-foreground hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all-200 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          role={role}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}
    </>
  );
}
