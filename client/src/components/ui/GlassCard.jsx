import { classNames } from '../../utils/helpers';
import { HiOutlineBuildingOffice, HiOutlineUsers, HiOutlineBeaker, HiOutlineReceiptRefund, HiOutlineExclamationCircle } from 'react-icons/hi2';

export default function GlassCard({ children, className = '', hover = false, padding = 'p-5', onClick }) {
  return (
    <div
      onClick={onClick}
      className={classNames(
        'glass rounded-2xl',
        padding,
        hover && 'card-hover cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

const iconColorMap = {
  brand: '#2a8bff',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
};

export function StatCard({ icon: Icon, label, value, subValue, trend, color = 'brand' }) {
  const colorMap = {
    brand: 'from-brand-500 to-brand-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  };

  const bgMap = {
    brand: 'bg-brand-50 dark:bg-brand-900/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20',
    amber: 'bg-amber-50 dark:bg-amber-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
  };

  return (
    <GlassCard hover className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">{label}</p>
          <p className="mt-2 text-2xl font-display font-extrabold text-surface-900 dark:text-white">{value}</p>
          {subValue && <p className="mt-1 text-xs text-surface-500">{subValue}</p>}
          {trend && (
            <p className={`mt-1 text-xs font-semibold ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${bgMap[color]} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          {Icon && <Icon className={`w-6 h-6`} style={{ color: iconColorMap[color] }} />}
        </div>
      </div>
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${colorMap[color]} opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500`} />
    </GlassCard>
  );
}