import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { getMonthlySpending } from '../data/mockData';
import { formatCompactCurrency } from '../utils/format';

const data = getMonthlySpending();

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass rounded-lg px-4 py-3 text-sm shadow-lg border border-border/30">
      <p className="text-muted text-xs mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted capitalize">{entry.name}: </span>
          <span className="text-foreground font-medium">
            {formatCompactCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function BudgetChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass rounded-xl p-5"
    >
      <h3 className="font-heading text-sm font-semibold text-foreground mb-4">
        Monthly Spending Overview
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barGap={4}
            barCategoryGap="20%"
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255, 255, 255, 0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 11 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.6)' }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="approved"
              name="Approved"
              fill="oklch(0.78 0.18 190)" // Cyan-Teal
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="pending"
              name="Pending"
              fill="oklch(0.65 0.18 290)" // Purple-Indigo
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="rejected"
              name="Rejected"
              fill="oklch(0.6 0.18 20)" // Coral-Red
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
