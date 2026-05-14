import { motion } from "framer-motion";
import { useUIStore } from "../../store/uiStore";
import { Z_INDEX } from "../../constants/zIndex";
import { EmptyState } from "../shared/LoadingStates";
import { CINEMATIC } from "../../constants/cinematicAtmosphere";

export const ActivityPanel = () => {
  const { notifications } = useUIStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className={`fixed right-4 top-20 w-[320px] p-4 ${CINEMATIC.PRESETS.NOTIFICATION_PANEL} ${CINEMATIC.STATES.PANEL_HOVER}`}
      style={{ zIndex: Z_INDEX.PANEL }}
    >
      <h2 className="text-lg font-semibold text-white mb-4">Activity</h2>

      {notifications.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No activity yet"
          description="Activity will appear here"
        />
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-2 rounded-lg bg-white/5 ${CINEMATIC.BORDER.MICRO} ${CINEMATIC.STATES.INTERACTIVE_HOVER}`}
            >
              <div
                className={`mt-1 h-2 w-2 rounded-full ${
                  n.type === "task_created"
                    ? "bg-green-400"
                    : n.type === "task_updated"
                    ? "bg-blue-400"
                    : n.type === "task_deleted"
                    ? "bg-red-400"
                    : "bg-slate-400"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm text-white leading-tight">
                  {n.message}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(n.createdAt || n.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};