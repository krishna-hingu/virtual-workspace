import { activityAPI } from './api';

class ActivityTracker {
  constructor() {
    this.isTracking = false;
    this.lastActivity = Date.now();
    this.idleTimeout = null;
    this.focusSession = null;
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.eventListeners = [];
    
    // Throttling variables
    this.lastMovementTrack = 0;
    this.lastWorkspaceTrack = 0;
    this.throttleDelay = 5000; // 5 seconds minimum
  }

  // Start tracking user activity
  start() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.lastActivity = Date.now();
    
    // Track session start
    this.trackActivity('session_start', 'User session started');
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Start idle detection
    this.startIdleDetection();
    
    console.log('Activity tracking started');
  }

  // Stop tracking user activity
  stop() {
    if (!this.isTracking) return;
    
    this.isTracking = false;
    
    // Track session end
    this.trackActivity('session_end', 'User session ended');
    
    // Clean up event listeners
    this.cleanup();
    
    console.log('Activity tracking stopped');
  }

  // Setup event listeners for mouse and keyboard activity
  setupEventListeners() {
    // Mouse movement tracking (throttled)
    const handleMouseMove = (event) => {
      this.updateLastActivity();
      
      // Throttle movement tracking
      const now = Date.now();
      if (now - this.lastMovementTrack >= this.throttleDelay) {
        this.lastMovementTrack = now;
        this.trackActivity('movement', `Mouse moved to (${event.clientX}, ${event.clientY})`, {
          x: event.clientX,
          y: event.clientY,
          z: 0
        });
      }
    };

    // Keyboard activity tracking (throttled)
    const handleKeyPress = () => {
      this.updateLastActivity();
      
      // Throttle keyboard tracking
      const now = Date.now();
      if (now - this.lastActivity >= 200) { // 200ms minimum
        this.trackActivity('workspace_interaction', 'Keyboard activity detected', {
          action: 'typed',
          element: 'keyboard'
        });
      }
    };

    // Click tracking (throttled)
    const handleClick = (event) => {
      this.updateLastActivity();
      
      // Throttle click tracking
      const now = Date.now();
      if (now - this.lastWorkspaceTrack >= this.throttleDelay) {
        this.lastWorkspaceTrack = now;
        const element = event.target.tagName.toLowerCase();
        this.trackActivity('workspace_interaction', `Clicked on ${element}`, {
          action: 'clicked',
          element: element,
          details: {
            id: event.target.id,
            class: event.target.className
          }
        });
      }
    };

    // Scroll tracking (throttled)
    const handleScroll = () => {
      this.updateLastActivity();
      
      // Throttle scroll tracking
      const now = Date.now();
      if (now - this.lastActivity >= 200) { // 200ms minimum
        this.trackActivity('workspace_interaction', 'Page scrolled', {
          action: 'scrolled',
          element: 'page'
        });
      }
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keypress', handleKeyPress);
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll);
    
    // Store references for cleanup
    this.eventListeners = [
      { type: 'mousemove', handler: handleMouseMove },
      { type: 'keypress', handler: handleKeyPress },
      { type: 'click', handler: handleClick },
      { type: 'scroll', handler: handleScroll }
    ];
  }

  // Update last activity timestamp
  updateLastActivity() {
    this.lastActivity = Date.now();
    
    // If user was idle, mark as active again
    if (this.idleTimeout) {
      this.trackActivity('idle_end', 'User became active again');
      this.idleTimeout = null;
    }
  }

  // Start idle detection (5 minutes of inactivity)
  startIdleDetection() {
    this.idleTimeout = setTimeout(() => {
      if (this.isTracking && Date.now() - this.lastActivity >= 5 * 60 * 1000) {
        this.trackActivity('idle_start', 'User became idle');
        this.idleTimeout = null;
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Track activity and send to server
  async trackActivity(type, message, metadata = {}) {
    if (!this.isTracking) return;

    try {
      const activityData = {
        type,
        message,
        metadata: {
          ...metadata,
          timestamp: Date.now(),
          sessionId: this.sessionId
        }
      };

      // Send to appropriate tracking endpoint
      switch (type) {
        case 'movement':
          const movementResponse = await activityAPI.trackMovement(
            metadata.x || 0,
            metadata.y || 0,
            metadata.z || 0,
            metadata.room || 'main'
          );
          break;
        case 'workspace_interaction':
          const workspaceResponse = await activityAPI.trackWorkspaceInteraction(
            metadata.action || 'interacted',
            metadata.element || 'unknown',
            metadata.details || {}
          );
          break;
        case 'focus_start':
          const focusStartResponse = await activityAPI.trackFocusStart();
          break;
        case 'focus_end':
          const focusEndResponse = await activityAPI.trackFocusEnd();
          break;
        case 'idle_start':
          const idleStartResponse = await activityAPI.trackIdleStart();
          break;
        case 'idle_end':
          const idleEndResponse = await activityAPI.trackIdleEnd();
          break;
        case 'interruption':
          const interruptionResponse = await activityAPI.trackInterruption(
            metadata.reason || 'Unknown',
            metadata.duration || 0
          );
          break;
        default:
          // For general Activity types, just log them
          console.log('Activity tracked:', activityData);
      }
    } catch (error) {
      console.error('Failed to track Activity:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  }

  // Track task-related activities
  trackTaskCreate(title, description) {
    this.trackActivity('task_create', `Created task: ${title}`, { title, description });
  }

  trackTaskUpdate(taskId, status, title) {
    this.trackActivity('task_update', `Updated task: ${title}`, { taskId, status, title });
  }

  trackTaskComplete(taskId, title) {
    this.trackActivity('task_complete', `Completed task: ${title}`, { taskId, title });
  }

  // Start focus session
  startFocusSession() {
    if (this.focusSession) return;
    
    this.focusSession = {
      startTime: Date.now(),
      interruptions: 0
    };
    
    this.trackActivity('focus_start', 'Focus session started');
  }

  // End focus session
  endFocusSession() {
    if (!this.focusSession) return;
    
    const duration = Date.now() - this.focusSession.startTime;
    this.focusSession = null;
    
    this.trackActivity('focus_end', 'Focus session ended', {
      duration,
      interruptions: this.focusSession?.interruptions || 0
    });
  }

  // Track interruption
  trackInterruption(reason) {
    if (this.focusSession) {
      this.focusSession.interruptions++;
    }
    
    this.trackActivity('interruption', `Interruption: ${reason}`, {
      reason,
      duration: 0
    });
  }

  // Get current activity status
  getActivityStatus() {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;
    const isIdle = timeSinceLastActivity >= 5 * 60 * 1000;
    
    return {
      isActive: this.isTracking,
      isIdle,
      lastActivity: this.lastActivity,
      timeSinceLastActivity,
      sessionId: this.sessionId,
      focusSession: this.focusSession
    };
  }

  // Cleanup event listeners
  cleanup() {
    this.eventListeners.forEach(({ type, handler }) => {
      document.removeEventListener(type, handler);
    });
    
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
    
    this.eventListeners = [];
  }
}

// Create singleton instance
const activityTracker = new ActivityTracker();

export default activityTracker;
