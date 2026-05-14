import { motion } from 'framer-motion';
import { Tooltip } from '../shared/Tooltip';

export const StatsCard = ({
  icon = '📊',
  title = 'Stat',
  value = '0',
  subtext = '',
  trend = null,
  color = 'primary',
  onClick,
}) => {
  const bgColor = {
    primary: 'from-primary/20 to-primary/10',
    success: 'from-success/20 to-success/10',
    warning: 'from-warning/20 to-warning/10',
    danger: 'from-danger/20 to-danger/10',
  }[color];

  const borderColor = {
    primary: 'border-primary',
    success: 'border-success',
    warning: 'border-warning',
    danger: 'border-danger',
  }[color];

  const trendColor = trend?.value > 0 ? 'text-success' : 'text-danger';

  return (
    <Tooltip text={subtext}>
      <motion.div
        className={`
          glass bg-gradient-to-br ${bgColor} p-4 rounded-lg
          border border-l-4 ${borderColor}
          cursor-pointer hover:scale-105 transition-transform
        `}
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-text-secondary mb-1">{title}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
          </div>
          <div className="text-2xl">{icon}</div>
        </div>
        {trend && (
          <div className={`text-xs ${trendColor} mt-2`}>
            {trend.value > 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </motion.div>
    </Tooltip>
  );
};
