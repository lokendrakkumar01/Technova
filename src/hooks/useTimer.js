import { useState, useEffect, useRef, useCallback } from 'react';

const useTimer = ({ duration, onTimeout, isActive, isPaused = false, extraTime = 0, questionKey }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [extraTimeIsApplied, setExtraTimeIsApplied] = useState(false);
  const intervalRef = useRef(null);
  const startDelayRef = useRef(null);
  const deadlineRef = useRef(null);
  const remainingRef = useRef(duration);
  const hasTimeoutFired = useRef(false);
  const extraTimeApplied = useRef(false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimer();
    hasTimeoutFired.current = false;
    extraTimeApplied.current = false;
    deadlineRef.current = null;
    remainingRef.current = duration;
    setTimeLeft(duration);
    setExtraTimeIsApplied(false);
  }, [duration, questionKey, clearTimer]);

  useEffect(() => {
    if (extraTime <= 0 || extraTimeApplied.current) return;
    extraTimeApplied.current = true;
    setExtraTimeIsApplied(true);
    remainingRef.current += extraTime;
    if (deadlineRef.current && isRunning) {
      deadlineRef.current += extraTime * 1000;
      setTimeLeft(Math.ceil(Math.max(0, deadlineRef.current - Date.now()) / 1000));
    } else {
      setTimeLeft(remainingRef.current);
    }
  }, [extraTime, isRunning]);

  useEffect(() => {
    clearTimer();
    if (startDelayRef.current) clearTimeout(startDelayRef.current);

    if (!isActive) {
      setIsRunning(false);
      return;
    }

    if (isPaused) {
      if (deadlineRef.current) {
        remainingRef.current = Math.ceil(Math.max(0, deadlineRef.current - Date.now()) / 1000);
        setTimeLeft(remainingRef.current);
        deadlineRef.current = null;
      }
      setIsRunning(false);
      return;
    }

    startDelayRef.current = setTimeout(() => {
      deadlineRef.current = Date.now() + remainingRef.current * 1000;
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        const next = Math.ceil(Math.max(0, deadlineRef.current - Date.now()) / 1000);
        remainingRef.current = next;
        setTimeLeft(next);

        if (next === 0) {
          clearTimer();
          deadlineRef.current = null;
          setIsRunning(false);
          if (!hasTimeoutFired.current) {
            hasTimeoutFired.current = true;
            setTimeout(() => onTimeout?.(), 0);
          }
        }
      }, 100);
    }, 300);

    return () => {
      if (startDelayRef.current) clearTimeout(startDelayRef.current);
      clearTimer();
    };
  }, [duration, questionKey, isActive, isPaused, onTimeout, clearTimer]);

  const getTimeUsed = useCallback(() => {
    return Math.max(0, duration + (extraTimeApplied.current ? extraTime : 0) - remainingRef.current);
  }, [duration, extraTime]);

  const timerState =
    timeLeft > 10 ? 'normal' :
    timeLeft > 5 ? 'warning' :
    'danger';

  const progress = Math.max(0, (timeLeft / (duration + (extraTimeIsApplied ? extraTime : 0))) * 100);

  return { timeLeft, timerState, progress, isRunning, getTimeUsed };
};

export default useTimer;
