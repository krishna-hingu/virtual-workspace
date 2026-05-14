import { motion, AnimatePresence } from 'framer-motion';
import { useProximity } from '../../hooks/useProximity';
import { Button } from '../shared/Button';

export const ProximityToast = ({ onStartChat }) => {
  const { nearbyUsers } = useProximity();

  return (
    <AnimatePresence>
      {nearbyUsers.length > 0 && (
        <motion.div
          className="fixed bottom-6 left-6 z-30 max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="glass bg-bg-secondary p-4 rounded-lg">
            <p className="text-sm font-semibold text-text-primary mb-3">
              👥 Nearby Users
            </p>
            <div className="space-y-2">
              {nearbyUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-text-secondary">
                    {user.name}
                  </span>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onStartChat?.(user.id)}
                  >
                    Chat
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
