import { motion } from 'framer-motion';
import { Tooltip } from '../shared/Tooltip';

export const InterruptionCostWidget = ({ metrics }) => {
  const {
    count,
    totalDuration,
    avgDuration,
    productivityLoss,
    frequencyPerHour,
  } = metrics || {
    count: 0,
    totalDuration: 0,
    avgDuration: 0,
    productivityLoss: 0,
    frequencyPerHour: 0,
  };

  const formatDuration = (seconds) => {
    if (seconds === 0) return '0m';
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  };

  const getImpactLevel = (loss) => {
    if (loss === 0) return { label: 'None', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' };
    if (loss < 20) return { label: 'Low', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' };
    if (loss < 40) return { label: 'Medium', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' };
    return { label: 'High', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' };
  };

  const impactLevel = getImpactLevel(productivityLoss);

  return (
    <Tooltip 
      text={`Interruption Cost: ${count} interruptions, ${productivityLoss}% productivity loss`}
      className="w-full h-full"
    >
      <motion.div
        className="
          relative
          w-full h-full
          rounded-2xl p-6 md:p-7
          bg-gradient-to-br from-orange-500/10 via-transparent to-red-500/5
          border border-orange-400/20
          ring-1 ring-orange-400/10
          backdrop-blur-xl
          shadow-[0_10px_50px_rgba(0,0,0,0.6)]
          transition-all duration-300
          flex flex-col
        "
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <div className="text-xl">⚡</div>
            </div>
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Interruption Cost</p>
              <p className="text-xs text-gray-500">Productivity impact analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold text-white">
              {count}
            </span>
            <span className={`text-xs font-semibold ${impactLevel.color} ${impactLevel.bg} px-4 py-1.5 rounded-full border ${impactLevel.border}`}>
              {impactLevel.label} Impact
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 rounded-lg bg-white/5">
            <div className="text-2xl font-bold text-white mb-1">
              {formatDuration(totalDuration)}
            </div>
            <p className="text-xs text-gray-400">Total Time</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-white/5">
            <div className="text-2xl font-bold text-white mb-1">
              {formatDuration(avgDuration)}
            </div>
            <p className="text-xs text-gray-400">Avg Duration</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-white/5">
            <div className="text-2xl font-bold text-white mb-1">
              {frequencyPerHour}
            </div>
            <p className="text-xs text-gray-400">Per Hour</p>
          </div>
        </div>

        <div className="mt-auto">
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500"
              initial={{ width: 0 }}
              animate={{ width: `${productivityLoss}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Productivity Loss</p>
            <p className={`text-sm font-semibold ${impactLevel.color}`}>
              -{productivityLoss}%
            </p>
          </div>
        </div>
      </motion.div>
    </Tooltip>
  );
};
