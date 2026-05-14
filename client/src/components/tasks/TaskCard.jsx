import { motion } from 'framer-motion';
import { Tooltip } from '../shared/Tooltip';

const statusColors = {
  todo: 'bg-bg-tertiary text-text-primary',
  'in-progress': 'bg-warning text-white',
  done: 'bg-success text-white',
};

const statusLabels = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

export const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const handleStatusSelect = (e) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    onStatusChange?.(task._id || task.id, newStatus);
  };

  return (
    <Tooltip text={`Created: ${new Date(task.createdAt).toLocaleDateString()}`}>
      <motion.div
        className={`
          bg-gradient-to-br from-[#1b2230]/90 to-[#121826]/90
          backdrop-blur-xl
          border border-white/15
          shadow-[0_8px_24px_rgba(0,0,0,0.18)]
          hover:border-violet-500/40
          hover:shadow-[0_8px_32px_rgba(139,92,246,0.25)]
          transition-all duration-300
          p-4 rounded-lg w-full
        `}
        whileHover={{ scale: 1.015 }}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onEdit}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1">
            <div className={`w-2.5 h-2.5 rounded-full ${ 
              task.status === "todo" ? "bg-yellow-400" : 
              task.status === "in-progress" ? "bg-blue-400" : 
              "bg-green-400" 
            }`} />
            <h4 className="text-white font-semibold tracking-wide flex-1 break-words">
              {task.title}
            </h4>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(task._id || task.id);
            }}
            className="ml-2 text-text-secondary hover:text-danger transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {task.description && (
          <p className="text-slate-400 text-sm leading-relaxed mt-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 mt-4">
          <select
            value={task.status}
            onChange={handleStatusSelect}
            className="bg-slate-800/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-4 text-xs">
          {/* Created By */}
          <div className="flex flex-col">
            <span className="text-slate-500 font-medium">Created by</span>
            <span className="text-white font-semibold truncate max-w-[120px]">
              {task.createdBy?.name || "Unknown"}
            </span>
          </div>

          {/* Assigned To */}
          <div className="flex flex-col items-end">
            <span className="text-slate-500 font-medium">Assigned to</span>
            <span className="text-white font-semibold truncate max-w-[120px]">
              {task.assignedTo?.name || "Unassigned"}
            </span>
          </div>
        </div>
      </motion.div>
    </Tooltip>
  );
};
