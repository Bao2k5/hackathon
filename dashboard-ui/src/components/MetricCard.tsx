import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type MetricCardProps = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
};

function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const from = 0;

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  const formatted = new Intl.NumberFormat('en-US').format(display);

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export default function MetricCard({
  label,
  value,
  prefix = '',
  suffix = '',
  change,
  changeLabel,
  icon,
  color,
}: MetricCardProps) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glass-hover rounded-xl p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted uppercase tracking-wider">
          {label}
        </span>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-heading font-semibold text-foreground mb-2">
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
      </div>
      <div className="flex items-center gap-1.5">
        <div
          className={`flex items-center gap-0.5 text-xs font-medium ${
            isPositive ? 'text-accent' : 'text-destructive'
          }`}
        >
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{Math.abs(change)}%</span>
        </div>
        <span className="text-xs text-muted">{changeLabel}</span>
      </div>
    </motion.div>
  );
}
