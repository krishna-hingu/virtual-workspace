import { useUIStore } from '../store/uiStore';

/**
 * NOTIFICATION EVENTS UTILITY
 * 
 * PHASE 2 NOTE: This file uses window.uiStore pattern for non-React contexts.
 * 
 * CURRENT PATTERN:
 * - Uses window.uiStore global access (set in uiStore.js)
 * - Allows calling notification functions outside React components
 * - Works but bypasses React render cycle
 * 
 * FUTURE IMPROVEMENT (Phase 5+):
 * - Consider creating a notificationService that uses the store properly
 * - Or refactor to use useUIStore hook in all call sites
 * - Current pattern is functional but not ideal for React best practices
 */

export const handleUserJoined = (user) => {
  if (window.uiStore) {
    window.uiStore.getState().addNotification({
      message: `${user?.name || 'Someone'} joined workspace`,
      type: "user_joined",
      user,
      timestamp: new Date(),
      read: false
    });
  }
};

export const handleUserLeft = (user) => {
  if (window.uiStore) {
    window.uiStore.getState().addNotification({
      message: `${user.name || 'Someone'} left workspace`,
      type: "user_left"
    });
  }
};

export const handleChatMessage = (msg) => {
  if (window.uiStore) {
    window.uiStore.getState().addNotification({
      message: `New message from ${msg.name || msg.sender || 'Someone'}`,
      type: "chat_message"
    });
  }
};

export const handleTaskCreated = (task) => {
  if (window.uiStore) {
    window.uiStore.getState().addNotification({
      message: `${task.createdBy?.name || 'Someone'} created task: ${task.title}`,
      type: "task_created"
    });
  }
};

export const handleTaskAssigned = (task) => {
  if (window.uiStore) {
    const userName = task.assignedTo?.name || 'Someone';
    window.uiStore.getState().addNotification({
      message: `Task assigned to ${userName}: ${task.title}`,
      type: "task_assigned"
    });
  }
};

export const handleTaskUpdated = (task) => {
  if (window.uiStore) {
    const statusText = task.status?.replace('-', ' ') || 'updated';
    window.uiStore.getState().addNotification({
      message: `Task ${statusText}: ${task.title}`,
      type: "task_updated"
    });
  }
};

export const handleTaskCompleted = (task) => {
  if (window.uiStore) {
    window.uiStore.getState().addNotification({
      message: `Task completed: ${task.title}`,
      type: "task_completed"
    });
  }
};

export const handleFocusSessionComplete = (message) => {
  if (window.uiStore) {
    window.uiStore.getState().addNotification({
      message,
      type: "session_complete"
    });
  }
};

export const handleWorkspaceUpdate = (update) => {
  if (window.uiStore) {
    window.uiStore.getState().addNotification({
      message: update.message || 'Workspace updated',
      type: "workspace_update"
    });
  }
};

export const handleSystemNotification = (message, type = 'info') => {
  if (window.uiStore) {
    window.uiStore.getState().addNotification({
      message,
      type: "system"
    });
  }
};
