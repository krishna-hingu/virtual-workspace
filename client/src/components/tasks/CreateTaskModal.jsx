import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../shared/Button';
import { useUIStore } from '../../store/uiStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useAuth } from '../../hooks/useAuth';
import { taskAPI, activityAPI } from '../../services/api';
import socket from '../../socket/socket';
import * as NotificationEvents from '../../utils/notificationEvents';
import modalManager from '../../utils/modalManager';
import { Z_INDEX } from '../../constants/zIndex';
import { TRANSITION } from '../../constants/transitions';
import { CINEMATIC } from '../../constants/cinematicAtmosphere';

export const CreateTaskModal = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { addToast, activePanel, setActivePanel } = useUIStore();
  const { users, addTask, updateTask, removeTask } = useWorkspaceStore();
  const { user } = useAuth();

  console.log("STEP 4: MODAL RECEIVED USERS:", users);

  const isOpen = activePanel === 'create-task';
  const onClose = () => setActivePanel('tasks');
  const modalId = 'create-task-modal';

  // Modal registration - STABLE VERSION
  useEffect(() => {
    if (isOpen) {
      modalManager.registerModal(modalId, onClose);
      console.log('CreateTaskModal registered:', modalId);
    } else {
      modalManager.unregisterModal(modalId);
      console.log('CreateTaskModal unregistered:', modalId);
    }

    return () => {
      modalManager.unregisterModal(modalId);
    };
  }, [isOpen, modalId]); // Remove onClose from dependencies to prevent spam

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      addToast('Title is required', 'warning');
      return;
    }

    setIsLoading(true);
    
    // Phase 6: Optimistic update - add task to store immediately
    const optimisticId = `temp-${Date.now()}`;
    const optimisticTask = {
      _id: optimisticId,
      title: title.trim(),
      description: description.trim(),
      status: 'todo',
      priority: 'medium',
      createdBy: user,
      createdAt: new Date(),
      _optimistic: true, // Flag to identify optimistic tasks
    };
    
    addTask(optimisticTask);
    addToast('Creating task...', 'info');
    
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        ...(assignedTo && { assignedTo }),
      };

      const response = await taskAPI.createTask(taskData);
      const newTask = response.data;

      // Replace optimistic task with real task from server
      removeTask(optimisticId);
      addTask(newTask);
      addToast('Task created successfully', 'success');

      // Reset form
      setTitle('');
      setDescription('');
      setAssignedTo('');
      onClose();
    } catch (error) {
      console.error('Create task error:', error);
      // Rollback: Remove optimistic task
      removeTask(optimisticId);
      addToast(error.response?.data?.message || 'Failed to create task', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setAssignedTo('');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: TRANSITION.NORMAL }}
      className={`fixed inset-0 flex items-center justify-center ${CINEMATIC.PRESETS.BACKDROP}`}
      style={{ zIndex: Z_INDEX.MODAL }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ duration: TRANSITION.SPRING, type: "spring", stiffness: 300, damping: 25 }}
        className={`w-full max-w-2xl p-6 ${CINEMATIC.PRESETS.CREATE_TASK_MODAL}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Create New Task</h2>
          <button 
            onClick={handleCancel}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className={`w-full rounded-xl ${CINEMATIC.BORDER.MICRO} bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 ${CINEMATIC.STATES.FOCUS} transition-all`}
              disabled={isLoading}
              maxLength={100}
            />
            <div className="mt-1 text-xs text-slate-500">
              {title.length}/100 characters
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add some details..."
              className={`w-full rounded-xl ${CINEMATIC.BORDER.MICRO} bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 ${CINEMATIC.STATES.FOCUS} transition-all resize-none h-24`}
              disabled={isLoading}
              maxLength={500}
            />
            <div className="mt-1 text-xs text-slate-500">
              {description.length}/500 characters
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Assign To
            </label>
                        <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className={`w-full rounded-xl ${CINEMATIC.BORDER.MICRO} bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 ${CINEMATIC.STATES.FOCUS} transition-all appearance-none`}
              disabled={isLoading}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 ${CINEMATIC.BORDER.ACCENT}`}>
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-xs text-blue-300">
              Tasks are visible to all workspace members and update in real-time
            </div>
          </div>
        </div>

        <div className={`flex gap-3 justify-end pt-6 border-t ${CINEMATIC.DIVIDER.PRIMARY} mt-6`}>
          <Button 
            variant="secondary" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            loading={isLoading}
            disabled={!title.trim()}
          >
            Create Task
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
