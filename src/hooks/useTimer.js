import { useState, useEffect, useRef, useCallback } from 'react';

const useTimer = ({ duration, onTimeout, isActive, extraTime = 0 }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(null);
  const hasTimeoutFired = useRef(false);
  const extraTimeApplied = useRef(false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Apply extra time when it's granted
  useEffect(() => {
    if (extraTime > 0 && !extraTimeApplied.current && isRunning) {
      extraTimeApplied.current = true;
      setTimeLeft((prev) => Math.min(prev + extraTime, duration + extraTime));
    }
  }, [extraTime, isRunning, duration]);

  // Reset timer when duration or isActive changes
  useEffect(() => {
    clearTimer();
    hasTimeoutFired.current = false;
    extraTimeApplied.current = false;
    setTimeLeft(duration);
    setIsRunning(false);

    if (isActive) {
      // Small delay so the question renders first
      const startDelay = setTimeout(() => {
        startTimeRef.current = Date.now();
        setIsRunning(true);
      }, 300);
      return () => clearTimeout(startDelay);
    }
  }, [duration, isActive, clearTimer]);

  // Countdown effect
  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearTimer();
          setIsRunning(false);
          if (!hasTimeoutFired.current) {
            hasTimeoutFired.current = true;
            setTimeout(() => onTimeout?.(), 0);
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, clearTimer, onTimeout]);

  const getTimeUsed = useCallback(() => {
    if (!startTimeRef.current) return 0;
    return Math.round((Date.now() - startTimeRef.current) / 1000);
  }, []);

  const timerState =
    timeLeft > 10 ? 'normal' :
    timeLeft > 5 ? 'warning' :
    'danger';

  const progress = Math.max(0, (timeLeft / (duration + (extraTimeApplied.current ? extraTime : 0))) * 100);

  return { timeLeft, timerState, progress, isRunning, getTimeUsed };
};

export default useTimer;
