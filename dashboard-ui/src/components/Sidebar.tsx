import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Bot,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
} from 'lucide-react';
import type { UserRole } from '../types';

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'invoices', label: 'Invoices', icon: <FileText size={20} /> },
  { id: 'ai-timeline', label: 'AI Timeline', icon: <Bot size={20} /> },
];

type SidebarProps = {
  activePage: string;
  onPageChange: (page: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  onSignOut?: () => void;
};

const roles: { value: UserRole; label: string }[] = [
  { value: 'cfo', label: 'CFO' },
  { value: 'finance_manager', label: 'Finance Manager' },
  { value: 'employee', label: 'Employee' },
];

export default function Sidebar({
  activePage,
  onPageChange,
  collapsed,
  onToggle,
  role,
  onRoleChange,
  onSignOut,
}: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      className="h-screen glass border-r border-border/30 flex flex-col shrink-0 overflow-hidden relative z-50"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-border/20 shrink-0">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <FileText size={16} className="text-accent" />
            </div>
            <span className="font-heading text-sm font-semibold text-foreground">
              Approvaflow
            </span>
          </motion.div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <FileText size={16} className="text-accent" />
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/5 transition-all-200 cursor-pointer shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all-200 cursor-pointer ${
                isActive
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'text-muted hover:text-foreground hover:bg-white/5 border border-transparent'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Role Switcher */}
      <div className="px-2 py-3 border-t border-border/20">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-2"
          >
            <label className="text-xs text-muted font-medium px-3 block mb-1.5">
              Viewing as
            </label>
          </motion.div>
        )}
        <div className="space-y-1">
          {roles.map((r) => (
            <button
              key={r.value}
              onClick={() => onRoleChange(r.value)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all-200 cursor-pointer ${
                role === r.value
                  ? 'bg-white/10 text-foreground border border-border/30'
                  : 'text-muted hover:text-foreground hover:bg-white/5 border border-transparent'
              }`}
              title={collapsed ? r.label : undefined}
            >
              <User size={16} className="shrink-0" />
              {!collapsed && <span className="text-sm truncate">{r.label}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-2 py-3 border-t border-border/20">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-all-200 cursor-pointer"
          title="Sign out"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm">Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
}
