import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { taskAPI } from '../../services/api';
import { TaskCard } from './TaskCard';
import { useUIStore } from '../../store/uiStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useAuth } from '../../hooks/useAuth';
import socket from '../../socket/socket';
import * as NotificationEvents from '../../utils/notificationEvents';
import modalManager from '../../utils/modalManager';
import { Z_INDEX } from '../../constants/zIndex';
import { TRANSITION } from '../../constants/transitions';
import { EmptyState } from '../shared/LoadingStates';
import { CINEMATIC } from '../../constants/cinematicAtmosphere';

export const TaskBoard = () => {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  // Phase 5: Use shallow selectors to prevent unnecessary rerenders
  const activePanel = useUIStore((state) => state.activePanel);
  const setActivePanel = useUIStore((state) => state.setActivePanel);
  const addToast = useUIStore((state) => state.addToast);
  const tasks = useWorkspaceStore((state) => state.tasks);
  const removeTask = useWorkspaceStore((state) => state.removeTask);
  const updateTask = useWorkspaceStore((state) => state.updateTask);
  const addTask = useWorkspaceStore((state) => state.addTask);
  const { user } = useAuth();

  const isOpen = activePanel === 'tasks';
  const onClose = () => setActivePanel(null);
  const modalId = 'task-board';

  // Modal registration
  useEffect(() => {
    if (isOpen) {
      modalManager.registerModal(modalId, onClose);
    } else {
      modalManager.unregisterModal(modalId);
    }

    return () => {
      modalManager.unregisterModal(modalId);
    };
  }, [isOpen, modalId]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const res = await taskAPI.getTasks();
        useWorkspaceStore.setState({ tasks: res.data });
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        addToast("Failed to load tasks", "error");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen, addToast]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleTaskCreated = (task) => {
      console.log('TASKBOARD task:created received:', task);
      const tasks = useWorkspaceStore.getState().tasks;
      const exists = tasks.some(t => t._id === task._id);

      if (!exists) {
        addTask(task);
      }
      // Notifications now handled by Workspace.jsx via notification:new event
    };

    const handleTaskUpdated = (task) => {
      console.log('TASKBOARD task:updated received:', task);
      updateTask(task);
      // Notifications now handled by Workspace.jsx via notification:new event
    };

    const handleTaskDeleted = (taskId) => {
      console.log('TASKBOARD task:deleted received:', taskId);
      removeTask(taskId);
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [socket, isOpen, addTask, updateTask, removeTask, addToast, user?.id]);

  const filteredTasks = tasks.filter(task => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const handleDelete = async (taskId) => {
    // Phase 6: Optimistic update - remove task immediately
    const taskCopy = tasks.find(t => t._id === taskId);
    removeTask(taskId);
    addToast('Deleting task...', 'info');
    
    try {
      await taskAPI.deleteTask(taskId);
      addToast('Task deleted successfully', 'success');
    } catch (error) {
      console.error('Delete task error:', error);
      // Rollback: Restore task
      if (taskCopy) {
        addTask(taskCopy);
      }
      addToast('Failed to delete task', 'error');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskAPI.updateTask(taskId, { status: newStatus });
      addToast(`Task marked as ${newStatus.replace('-', ' ')}`, "success");
    } catch (error) {
      console.error("Failed to update task:", error);
      addToast("Failed to update task", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: TRANSITION.NORMAL }}
      className={`fixed inset-0 flex items-start justify-center pt-24 ${CINEMATIC.PRESETS.BACKDROP}`}
      style={{ zIndex: Z_INDEX.MODAL }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ duration: TRANSITION.SPRING, type: "spring", stiffness: 300, damping: 25 }}
        className={`w-full max-w-3xl max-h-[75vh] overflow-hidden flex flex-col ${CINEMATIC.PRESETS.TASK_BOARD}`}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${CINEMATIC.DIVIDER.PRIMARY}`}>
          <h2 className="text-lg font-semibold text-white">Task Board</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{tasks.length} total</span>
            <button 
              onClick={() => setActivePanel(null)} 
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className={`flex items-center justify-between px-6 py-3 border-b ${CINEMATIC.DIVIDER.SECONDARY}`}>
          <div className="flex gap-2">
            {["all","todo","in-progress","done"].map(f => {
              const count = f === "all" ? tasks.length : tasks.filter(t => t.status === f).length;
              return (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)} 
                  className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-all ${ 
                    filter === f 
                      ? "bg-violet-600 text-white" 
                      : `bg-white/5 text-slate-300 ${CINEMATIC.STATES.INTERACTIVE_HOVER}` 
                  }`} 
                >
                  {f === "all" ? "All" : 
                   f === "todo" ? "Todo" : 
                   f === "in-progress" ? "In Progress" : 
                   "Done"}
                  {count > 0 && (
                    <span className="text-xs opacity-70">({count})</span>
                  )}
                </button> 
              );
            })}
          </div>

          <button
            onClick={() => setActivePanel("create-task")}
            className={`px-4 py-1.5 text-sm rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600 transition-all ${CINEMATIC.STATES.ACTIVE}`}
          >
            + Create Task
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-slate-400">Loading tasks...</div>
            </div>
          )}

          {!loading && filteredTasks.length === 0 && (
            <EmptyState
              icon="📋"
              title={filter === "all" ? "No tasks yet" : `No ${filter} tasks`}
              description={filter === "all" ? "Create your first task to get started" : "Try changing the filter"}
            />
          )}

          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {filteredTasks.map(task => {
                const taskId = task._id || task.id;
                return (
                  <TaskCard
                    key={taskId}
                    task={task}
                    onDelete={() => handleDelete(taskId)}
                    onStatusChange={handleStatusChange}
                  />
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
