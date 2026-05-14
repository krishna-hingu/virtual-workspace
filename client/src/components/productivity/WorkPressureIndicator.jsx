import { motion } from 'framer-motion';
import { Tooltip } from '../shared/Tooltip';

export const WorkPressureIndicator = ({ level = 'moderate', score = null }) => {
  const levels = {
    low: { color: 'bg-success', label: 'Low', percentage: 30, gradient: 'from-green-500/10 via-transparent to-green-500/5', border: 'border-green-400/20', ring: 'ring-green-400/10', text: 'text-green-400' },
    moderate: { color: 'bg-warning', label: 'Moderate', percentage: 60, gradient: 'from-yellow-500/10 via-transparent to-yellow-500/5', border: 'border-yellow-400/20', ring: 'ring-yellow-400/10', text: 'text-yellow-400' },
    high: { color: 'bg-danger', label: 'High', percentage: 90, gradient: 'from-red-500/10 via-transparent to-red-500/5', border: 'border-red-400/20', ring: 'ring-red-400/10', text: 'text-red-400' },
  };

  const current = levels[level] || levels.moderate;

  return (
    <Tooltip 
      text={`Work Pressure: ${current.label}${score !== null ? ` (${score}/100)` : ''}`}
      className="w-full h-full"
    >
      <motion.div
        className={`
          relative
          w-full h-full
          rounded-2xl p-6 md:p-7
          bg-gradient-to-br ${current.gradient}
          border ${current.border}
          ring-1 ${current.ring}
          backdrop-blur-xl
          shadow-[0_10px_50px_rgba(0,0,0,0.6)]
          transition-all duration-300
          flex flex-col
        `}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <div className="text-xl">📊</div>
            </div>
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Work Pressure</p>
              <p className="text-xs text-gray-500">Current stress level</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {score !== null && (
              <span className="text-4xl font-bold text-white">
                {score}
              </span>
            )}
            <span className={`text-xs font-semibold ${current.text} bg-white/10 px-4 py-1.5 rounded-full border ${current.border}`}>
              {current.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 rounded-lg bg-white/5">
            <div className="text-2xl mb-1">💪</div>
            <p className="text-xs text-gray-400">Energy</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-white/5">
            <div className="text-2xl mb-1">📊</div>
            <p className="text-xs text-gray-400">Load</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-white/5">
            <div className="text-2xl mb-1">⏱️</div>
            <p className="text-xs text-gray-400">Time</p>
          </div>
        </div>

        <div className="mt-auto">
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-3">
            <motion.div
              className={`h-full ${current.color}`}
              initial={{ width: 0 }}
              animate={{ width: score !== null ? `${score}%` : `${current.percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Pressure Level</p>
            <p className={`text-sm font-semibold ${current.text}`}>
              {score !== null ? `${score}%` : `${current.percentage}%`}
            </p>
          </div>
        </div>
      </motion.div>
    </Tooltip>
  );
};
