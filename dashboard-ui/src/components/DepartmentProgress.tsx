import { motion } from 'framer-motion';
import { departments } from '../data/mockData';
import { formatCompactCurrency, formatPercent } from '../utils/format';

export default function DepartmentProgress() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass rounded-xl p-5"
    >
      <h3 className="font-heading text-sm font-semibold text-foreground mb-4">
        Department Budget Utilization
      </h3>
      <div className="space-y-3">
        {departments.map((dept, i) => {
          const percent = (dept.spent / dept.budget) * 100;
          const isOver = percent > 90;
          const isWarning = percent > 75 && percent <= 90;

          return (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: dept.color }}
                  />
                  <span className="text-sm text-foreground font-medium">
                    {dept.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">
                    {formatCompactCurrency(dept.spent)} /{' '}
                    {formatCompactCurrency(dept.budget)}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      isOver
                        ? 'text-destructive'
                        : isWarning
                        ? 'text-orange-glow'
                        : 'text-accent'
                    }`}
                  >
                    {formatPercent(percent)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percent, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: i * 0.05 }}
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: isOver
                      ? 'oklch(0.6368 0.2078 25.33)'
                      : isWarning
                      ? 'oklch(0.715 0.215 45.0)'
                      : dept.color,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
