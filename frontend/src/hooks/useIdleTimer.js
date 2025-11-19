import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to detect user inactivity and trigger a callback after a specified timeout
 * @param {Function} onIdle - Callback to execute when user becomes idle
 * @param {number} timeout - Idle timeout in milliseconds (default: 30 minutes)
 * @param {Object} options - Additional options
 * @param {boolean} options.enabled - Whether the idle timer is enabled (default: true)
 * @param {string[]} options.events - Events to track for activity (default: mousemove, mousedown, keydown, touchstart, scroll)
 * @param {boolean} options.crossTab - Enable cross-tab synchronization (default: true)
 */
export const useIdleTimer = (
  onIdle,
  timeout = 30 * 60 * 1000, // 30 minutes default
  options = {}
) => {
  const {
    enabled = true,
    events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'],
    crossTab = true
  } = options;

  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const isIdleRef = useRef(false);

  // Reset the idle timer
  const resetTimer = useCallback(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last activity timestamp
    lastActivityRef.current = Date.now();
    isIdleRef.current = false;

    // Broadcast activity to other tabs
    if (crossTab) {
      try {
        localStorage.setItem('lastActivity', Date.now().toString());
      } catch (e) {
        // Ignore localStorage errors
      }
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      isIdleRef.current = true;
      onIdle();
    }, timeout);
  }, [enabled, timeout, onIdle, crossTab]);

  // Handle activity events
  const handleActivity = useCallback(() => {
    // Throttle activity tracking (only reset if last activity was > 1 second ago)
    const now = Date.now();
    if (now - lastActivityRef.current > 1000) {
      resetTimer();
    }
  }, [resetTimer]);

  // Handle storage events from other tabs
  const handleStorageEvent = useCallback((e) => {
    if (e.key === 'lastActivity' && e.newValue) {
      const otherTabActivity = parseInt(e.newValue, 10);
      const timeSinceActivity = Date.now() - otherTabActivity;
      
      // If another tab was active recently, reset our timer
      if (timeSinceActivity < timeout) {
        resetTimer();
      }
    }
  }, [timeout, resetTimer]);

  // Handle visibility change (pause timer when tab is hidden)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Tab is hidden, don't clear the timer, let it continue
      // but stop tracking new activity
      return;
    } else {
      // Tab is visible again, check if we should be idle
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      if (timeSinceActivity >= timeout) {
        // Should be idle
        if (!isIdleRef.current) {
          isIdleRef.current = true;
          onIdle();
        }
      } else {
        // Reset timer for remaining time
        const remainingTime = timeout - timeSinceActivity;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          isIdleRef.current = true;
          onIdle();
        }, remainingTime);
      }
    }
  }, [timeout, onIdle]);

  useEffect(() => {
    if (!enabled) {
      // Clean up if disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Initialize timer
    resetTimer();

    // Add event listeners for activity
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Add storage listener for cross-tab sync
    if (crossTab) {
      window.addEventListener('storage', handleStorageEvent);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (crossTab) {
        window.removeEventListener('storage', handleStorageEvent);
      }
    };
  }, [enabled, events, crossTab, handleActivity, handleVisibilityChange, handleStorageEvent, resetTimer]);

  // Return timer control methods
  return {
    reset: resetTimer,
    getLastActivity: () => lastActivityRef.current,
    isIdle: () => isIdleRef.current
  };
};
