import { motion } from 'framer-motion';
import { User, ShieldAlert, BadgeDollarSign, Bot } from 'lucide-react';
import type { UserRole } from '../types';

type LoginScreenProps = {
  onSelectRole: (role: UserRole) => void;
};

export default function LoginScreen({ onSelectRole }: LoginScreenProps) {
  const personas = [
    {
      role: 'employee' as UserRole,
      title: 'Geovanny Cartwright',
      subtitle: 'Marketing Employee',
      description: 'Submit expense requests, upload receipts, and check approval states of your personal expenses.',
      icon: <User size={28} className="text-cyan-glow" />,
      colorClass: 'border-cyan-glow/20 hover:border-cyan-glow/50 hover:shadow-cyan-glow/10',
      badgeColor: 'bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/20',
    },
    {
      role: 'finance_manager' as UserRole,
      title: 'Finance Manager',
      subtitle: 'Department Approver',
      description: 'Review and approve/reject department-wide expenses under $15,000. Larger expenses trigger escalation.',
      icon: <ShieldAlert size={28} className="text-orange-glow" />,
      colorClass: 'border-orange-glow/20 hover:border-orange-glow/50 hover:shadow-orange-glow/10',
      badgeColor: 'bg-orange-glow/10 text-orange-glow border border-orange-glow/20',
    },
    {
      role: 'cfo' as UserRole,
      title: 'Chief Financial Officer',
      subtitle: 'CFO Executive Portal',
      description: 'Full executive control. Monitor company budget compliance, view agent audit logs, and trigger CFO overrides.',
      icon: <BadgeDollarSign size={28} className="text-purple-glow" />,
      colorClass: 'border-purple-glow/20 hover:border-purple-glow/50 hover:shadow-purple-glow/10',
      badgeColor: 'bg-purple-glow/10 text-purple-glow border border-purple-glow/20',
    },
  ];

  return (
    <div className="min-h-screen bg-dotgrid-glow flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient Glow Orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[180px] pointer-events-none z-0" />

      <div className="w-full max-w-4xl relative z-10 flex flex-col items-center">
        {/* Logo and Intro */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/5">
            <Bot size={30} className="text-accent" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
            ApprovaFlow AI
          </h1>
          <p className="text-muted text-sm mt-2 max-w-md mx-auto">
            Multi-Agent Enterprise Expense Approval Orchestrated via Band of Agents
          </p>
        </motion.div>

        {/* Persona grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {personas.map((p, idx) => (
            <motion.button
              key={p.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              onClick={() => onSelectRole(p.role)}
              className={`glass rounded-2xl p-6 text-left border flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 hover:bg-white/5 cursor-pointer shadow-xl ${p.colorClass}`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-border/10">
                    {p.icon}
                  </div>
                  <span className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full ${p.badgeColor}`}>
                    {p.role.replace('_', ' ')}
                  </span>
                </div>
                
                <h3 className="text-base font-heading font-semibold text-foreground">
                  {p.title}
                </h3>
                <p className="text-xs text-muted font-medium mt-0.5">
                  {p.subtitle}
                </p>
                
                <p className="text-xs text-foreground/70 leading-relaxed font-medium mt-3">
                  {p.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-border/10 flex items-center text-xs font-semibold text-accent hover:text-accent-hover transition-colors">
                Enter Portal &rarr;
              </div>
            </motion.button>
          ))}
        </div>

        {/* Info footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-[10px] text-foreground/40 font-medium mt-12 tracking-wide uppercase"
        >
          Secured with Band of Agents Orchestration &bull; SQLite immediate locking active
        </motion.p>
      </div>
    </div>
  );
}
