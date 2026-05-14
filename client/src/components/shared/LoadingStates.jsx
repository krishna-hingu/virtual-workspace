import { motion } from 'framer-motion';
import { CINEMATIC } from '../../constants/cinematicAtmosphere';

export const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} border-2 ${CINEMATIC.BORDER.MICRO} border-t-primary rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
};

export const EmptyState = ({
  icon = '📭',
  title = 'No data',
  description = 'Try adding something new',
  action = null,
}) => {
  return (
    <motion.div
      className={`flex flex-col items-center justify-center py-12 px-4 ${CINEMATIC.PRESETS.EMPTY_STATE}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-6xl mb-4 opacity-40">{icon}</div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary text-center mb-6">{description}</p>
      {action && <div>{action}</div>}
    </motion.div>
  );
};

export const SkeletonLoader = ({ count = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`h-12 ${CINEMATIC.BACKGROUND.EMPTY} ${CINEMATIC.RADIUS.MD}`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      ))}
    </div>
  );
};
