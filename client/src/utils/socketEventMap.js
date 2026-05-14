/**
 * CENTRALIZED SOCKET EVENT MAP
 * 
 * This file documents all socket events in the system.
 * 
 * Naming Convention: domain:action:entity
 * - Example: workspace:task:create
 * 
 * Event Status Legend:
 * ✓ - Working (emit + listener connected)
 * ⚠ - Partial (emit exists, listener missing or vice versa)
 * ✗ - Orphaned (emit exists but no listener, or listener with no emit)
 * 🔄 - Deprecated (old event, should migrate)
 */

export const SOCKET_EVENTS = {
  // ==================== NOTIFICATION EVENTS ====================
  'notification:new': {
    direction: 'server→client',
    source: 'server/socket/index.js:27',
    listeners: ['client/src/pages/Workspace.jsx:88'],
    status: '✓',
    payload: {
      id: 'number',
      type: 'string',
      title: 'string',
      message: 'string',
      user: 'string',
      timestamp: 'Date',
      taskId: 'string (optional)',
      read: 'boolean'
    },
    notes: 'Used for user join/leave notifications'
  },
  
  'notification': {
    direction: 'server→client',
    source: 'server/controllers/taskController.js:45,150,199',
    listeners: [],
    status: '✗',
    payload: {
      type: 'string',
      message: 'string',
      task: 'object',
      createdBy: 'object',
      assignedTo: 'object'
    },
    notes: 'ORPHANED - No frontend listener. Should migrate to notification:new'
  },
  
  // ==================== TASK EVENTS ====================
  'task:created': {
    direction: 'server→client',
    source: 'server/controllers/taskController.js:44',
    listeners: [
      'client/src/components/tasks/TaskBoard.jsx:78'
    ],
    status: '✓',
    payload: {
      _id: 'string',
      title: 'string',
      description: 'string',
      status: 'string',
      priority: 'string',
      assignedTo: 'object',
      createdBy: 'object',
      createdAt: 'Date'
    },
    notes: 'Task creation broadcast to all users. Listener removed from Workspace.jsx (was log-only)'
  },
  
  'task:updated': {
    direction: 'server→client',
    source: 'server/controllers/taskController.js:149',
    listeners: [
      'client/src/components/tasks/TaskBoard.jsx:79'
    ],
    status: '✓',
    payload: 'same as task:created',
    notes: 'Task update broadcast to all users. Listener removed from Workspace.jsx (was log-only)'
  },
  
  'task:deleted': {
    direction: 'server→client',
    source: 'server/controllers/taskController.js:198',
    listeners: [
      'client/src/components/tasks/TaskBoard.jsx:80'
    ],
    status: '✓',
    payload: {
      _id: 'string'
    },
    notes: 'Task ID broadcast to all users. Listener removed from Workspace.jsx (was log-only). Toast removed from socket listener (now only from API response)'
  },
  
  'task:assigned': {
    direction: 'server→client',
    source: 'server/controllers/taskController.js:49',
    listeners: [
      'client/src/components/tasks/TaskBoard.jsx:69-71 (via task:updated handler)'
    ],
    status: '✓',
    payload: {
      _id: 'string',
      title: 'string',
      assignedTo: 'object',
      createdBy: 'object'
    },
    notes: 'Phase 3: Now emits to assigned user room. Targeted emit added in taskController. Frontend handles via task:updated listener. Fixed condition bug that blocked new task notifications.'
  },
  
  // ==================== USER EVENTS ====================
  'user:joined': {
    direction: 'server→client',
    source: 'server/socket/index.js:161',
    listeners: ['client/src/pages/Workspace.jsx:89'],
    status: '✓',
    payload: {
      socketId: 'string',
      userId: 'string',
      user: 'object',
      position: { x: 'number', y: 'number' }
    },
    notes: 'Emitted to workspace room on user join. Duplicate broadcastNotification removed in Phase 1.'
  },
  
  'user:left': {
    direction: 'server→client',
    source: 'server/socket/index.js:274',
    listeners: ['client/src/pages/Workspace.jsx:90'],
    status: '✓',
    payload: {
      socketId: 'string',
      userId: 'string'
    },
    notes: 'Emitted to workspace room on user leave. Duplicate broadcastNotification removed in Phase 1.'
  },
  
  'users:update': {
    direction: 'server→client',
    source: 'server/socket/index.js:158,271',
    listeners: ['client/src/App.jsx:124'],
    status: '✓',
    payload: 'Array of user objects',
    notes: 'Broadcast user list updates'
  },
  
  // ==================== ACTIVITY EVENTS ====================
  'activity': {
    direction: 'server→client',
    source: 'server/controllers/taskController.js:53,158,205',
    listeners: [],
    status: '✗',
    payload: {
      type: 'string',
      message: 'string',
      user: 'string',
      taskId: 'string',
      timestamp: 'Date'
    },
    notes: 'ORPHANED - No frontend listener. Activity tracking only in DB.'
  },
  
  // ==================== MOVEMENT EVENTS ====================
  'player:moved': {
    direction: 'server→client',
    source: 'server/socket/handlers/movement.js:83',
    listeners: ['client/src/components/workspace/WorkspaceScene.jsx:879'],
    status: '✓',
    payload: {
      userId: 'string',
      position: { x: 'number', y: 'number' }
    },
    notes: 'Player position broadcast'
  },
  
  'player:state': {
    direction: 'server→client',
    source: 'server/socket/index.js:224',
    listeners: [],
    status: '✗',
    payload: {
      state: 'string (sitting/standing)'
    },
    notes: 'ORPHANED - No frontend listener'
  },
  
  // ==================== PROXIMITY EVENTS ====================
  'proximity:enter': {
    direction: 'server→client',
    source: 'server/socket/handlers/movement.js:57,62',
    listeners: [],
    status: '✗',
    payload: {
      user: 'object',
      distance: 'number'
    },
    notes: 'ORPHANED - No frontend listener. Proximity system not integrated.'
  },
  
  'proximity:exit': {
    direction: 'server→client',
    source: 'server/socket/handlers/movement.js:73,74',
    listeners: [],
    status: '✗',
    payload: {
      user: 'object'
    },
    notes: 'ORPHANED - No frontend listener'
  },
  
  // ==================== CHAT EVENTS ====================
  'chat:receive': {
    direction: 'server→client',
    source: 'server/socket/handlers/chat.js:39,46,52',
    listeners: [],
    status: '✗',
    payload: {
      message: 'string',
      type: 'string (dm/nearby)',
      senderId: 'string',
      senderName: 'string',
      receiverId: 'string',
      timestamp: 'Date'
    },
    notes: 'ORPHANED - ChatPanel uses different pattern (reads from store, not socket)'
  },
  
  // ==================== FOCUS EVENTS ====================
  'focus:updated': {
    direction: 'server→client',
    source: 'server/socket/handlers/proximity.js:36',
    listeners: [],
    status: '✗',
    payload: {
      userId: 'string',
      focusMode: 'boolean'
    },
    notes: 'ORPHANED - No frontend listener'
  },
  
  'focus:confirmed': {
    direction: 'server→client',
    source: 'server/socket/handlers/proximity.js:42',
    listeners: [],
    status: '✗',
    payload: {
      focusMode: 'boolean'
    },
    notes: 'ORPHANED - No frontend listener'
  },
  
  // ==================== AI SUGGESTION EVENTS ====================
  'ai:suggestion': {
    direction: 'server→client',
    source: 'server/socket/handlers/proximity.js:60, notifications.js:23',
    listeners: [],
    status: '✗',
    payload: {
      type: 'string',
      message: 'string'
    },
    notes: 'ORPHANED - No frontend listener'
  },
  
  // ==================== SESSION EVENTS ====================
  'notification:alert': {
    direction: 'server→client',
    source: 'server/socket/handlers/notifications.js:17',
    listeners: [],
    status: '✗',
    payload: {
      type: 'string',
      message: 'string',
      intensity: 'number'
    },
    notes: 'ORPHANED - No frontend listener'
  },
  
  'session:started': {
    direction: 'server→client',
    source: 'server/socket/handlers/notifications.js:54',
    listeners: [],
    status: '✗',
    payload: {
      session: 'object'
    },
    notes: 'ORPHANED - No frontend listener'
  },
  
  'session:ended': {
    direction: 'server→client',
    source: 'server/socket/handlers/notifications.js:82',
    listeners: [],
    status: '✗',
    payload: {
      session: 'object',
      duration: 'number'
    },
    notes: 'ORPHANED - No frontend listener'
  },
  
  'session:error': {
    direction: 'server→client',
    source: 'server/socket/handlers/notifications.js:42,57,72,88',
    listeners: [],
    status: '✗',
    payload: {
      message: 'string'
    },
    notes: 'ORPHANED - No frontend listener'
  },
  
  // ==================== INITIALIZATION EVENTS ====================
  'players:init': {
    direction: 'server→client',
    source: 'server/socket/index.js:151',
    listeners: [],
    status: '✗',
    payload: 'Array of player positions',
    notes: 'ORPHANED - No frontend listener. May be handled implicitly.'
  },
  
  'objects:init': {
    direction: 'server→client',
    source: 'server/socket/index.js:156',
    listeners: [],
    status: '✗',
    payload: 'Array of object states',
    notes: 'ORPHANED - No frontend listener. May be handled implicitly.'
  },
  
  'object:state': {
    direction: 'server→client',
    source: 'server/socket/index.js:260',
    listeners: [],
    status: '✗',
    payload: {
      objectId: 'string',
      state: 'object'
    },
    notes: 'ORPHANED - No frontend listener'
  },
  
  // ==================== TOAST EVENTS (MISSING) ====================
  'toast:new': {
    direction: 'server→client',
    source: 'NOT IMPLEMENTED (backend can emit)',
    listeners: ['client/src/pages/Workspace.jsx:107'],
    status: '⚠ PARTIAL',
    payload: {
      message: 'string',
      type: 'string (success/error/warning/info)',
      duration: 'number',
      userId: 'string (optional)'
    },
    notes: 'Phase 3: Frontend listener added. Backend can now emit toasts to specific users using io.to(`user:${userId}`).emit("toast:new", data). Enables remote toast notifications for DMs, assignments, etc.'
  }
};

/**
 * EVENT NAMING STANDARD
 * 
 * Pattern: domain:action:entity
 * 
 * Examples:
 * - workspace:notification:create
 * - workspace:task:assign
 * - workspace:user:join
 * - workspace:toast:show
 * 
 * Current non-standard events (to migrate):
 * - notification → workspace:notification:create
 * - activity → workspace:activity:create
 * - notification:new → workspace:notification:new (already close)
 * - task:created → workspace:task:create
 * - user:joined → workspace:user:join
 * 
 * PHASE 1 CHANGES:
 * - Removed duplicate broadcastNotification for user:joined
 * - Removed duplicate broadcastNotification for user:left
 * - Removed duplicate toast from task:deleted socket listener
 * - Removed log-only task listeners from Workspace.jsx
 * - Created this centralized event map
 * 
 * PHASE 2 CHANGES:
 * - Removed workspaceStore.notifications (dead code)
 * - Consolidated all notification logic to uiStore
 * - Documented window.uiStore pattern for future refactoring
 * 
 * PHASE 3 CHANGES:
 * - Added user-specific room joins (user:{userId})
 * - Fixed task assignment notification condition bug
 * - Added targeted emit for task:assigned
 * - Added toast:new frontend listener
 * - Enabled remote toast notifications
 * 
 * PHASE 4 CHANGES:
 * - Created Notification Mongoose model
 * - Created notification controller with CRUD operations
 * - Created notification routes
 * - Registered notification API endpoints
 * - Added DB persistence to addNotification, markAllAsRead, clearNotifications
 * - Added load-on-login notification fetch in Workspace
 * 
 * PHASE 5 CHANGES:
 * - Added shallow selectors to NotificationPanel, ToastContainer, TopBar, TaskBoard
 * - Reduced unnecessary rerenders
 * - Documented setTimeout memory leak
 * 
 * PHASE 6 CHANGES:
 * - Added optimistic updates to CreateTaskModal with rollback
 * - Added optimistic updates to TaskBoard delete with rollback
 * - Partial fix for setTimeout memory leak
 * - Documented optimistic UI pattern for future use
 */
