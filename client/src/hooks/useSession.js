import { useEffect, useState, useRef } from "react";
import { sessionAPI } from "../services/api";
import { useWorkspaceStore } from "../store/workspaceStore";

// Global session restoration guard - prevents multiple components from restoring simultaneously
let isGlobalRestoring = false;

export const useSession = (autoRestore = true) => {
  const {
    sessionActive,
    sessionTime,
    startSession,
    endSession,
    incrementSessionTime,
    setSessionStartTime,
  } = useWorkspaceStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const restorationAttempted = useRef(false);
  const lastRestoreTime = useRef(0);
  const restoreTimeout = useRef(null);

  // Session timer - runs locally for visual display only
  useEffect(() => {
    let interval;
    if (sessionActive) {
      interval = setInterval(() => {
        incrementSessionTime();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionActive, incrementSessionTime]);

  // Session restoration on mount - only if autoRestore is true and with debouncing
  useEffect(() => {
    if (autoRestore && !restorationAttempted.current) {
      // Clear any existing timeout
      if (restoreTimeout.current) {
        clearTimeout(restoreTimeout.current);
      }
      
      // Debounce restoration to prevent multiple rapid calls
      restoreTimeout.current = setTimeout(() => {
        restorationAttempted.current = true;
        restoreActiveSession();
      }, 1000); // 1 second delay
    }
  }, [autoRestore]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (restoreTimeout.current) {
        clearTimeout(restoreTimeout.current);
      }
    };
  }, []);

  // Restore active session from backend
  const restoreActiveSession = async () => {
    // Prevent rapid successive calls
    const now = Date.now();
    if (now - lastRestoreTime.current < 5000) {
      console.log('🔄 Session restoration throttled - skipping');
      return;
    }
    lastRestoreTime.current = now;

    // Global guard to prevent multiple components from restoring simultaneously
    if (isGlobalRestoring) {
      console.log('🔄 Global restoration in progress, skipping');
      return;
    }
    isGlobalRestoring = true;

    setIsRestoring(true);
    try {
      const response = await sessionAPI.getActiveSession();
      const activeSession = response.data;

      if (activeSession && activeSession.clockInTime) {
        // Calculate elapsed time since clock-in
        const clockInTime = new Date(activeSession.clockInTime);
        const currentTime = new Date();
        const elapsedSeconds = Math.floor((currentTime - clockInTime) / 1000);

        // Only restore if not already active
        if (!sessionActive) {
          // Restore session state locally
          setSessionStartTime(clockInTime);
          startSession(elapsedSeconds);
          
          console.log('✅ Session restored:', {
            clockInTime,
            elapsedSeconds,
            sessionId: activeSession._id
          });
        } else {
          console.log('🔄 Session already active, skipping restoration');
        }
      }
    } catch (err) {
      console.warn('⚠️ Session restoration failed:', err.response?.data?.message || err.message);
      // Don't show error to user for restoration failures
      // Session might not exist, which is normal
    } finally {
      setIsRestoring(false);
      isGlobalRestoring = false;
    }
  };

  const clockIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await sessionAPI.clockIn();
      const session = response.data.session;
      
      // Set session start time from backend response
      setSessionStartTime(new Date(session.clockInTime));
      startSession(0); // Start with 0 elapsed seconds
      
      console.log('✅ Session started:', {
        sessionId: session._id,
        clockInTime: session.clockInTime
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to activate workspace";
      setError(errorMessage);
      console.error('❌ Clock in failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clockOut = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await sessionAPI.clockOut();
      const session = response.data.session;
      
      endSession();
      
      console.log('✅ Session ended:', {
        sessionId: session._id,
        duration: session.totalMinutes,
        clockOutTime: session.clockOutTime
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to end session";
      setError(errorMessage);
      console.error('❌ Clock out failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Manual session restoration (for explicit user actions)
  const restoreSession = async () => {
    // Apply same rate limiting for manual calls
    const now = Date.now();
    if (now - lastRestoreTime.current < 2000) {
      console.log('🔄 Manual session restoration throttled - skipping');
      return;
    }
    
    // Global guard to prevent multiple components from restoring simultaneously
    if (isGlobalRestoring) {
      console.log('🔄 Global restoration in progress, skipping manual restore');
      return;
    }
    
    await restoreActiveSession();
  };

  // Clear any session errors
  const clearError = () => {
    setError(null);
  };

  return {
    sessionActive,
    sessionTime,
    isLoading: isLoading || isRestoring,
    error,
    isRestoring,
    clockIn,
    clockOut,
    restoreSession,
    clearError,
  };
};
