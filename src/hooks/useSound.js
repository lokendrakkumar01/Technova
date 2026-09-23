import { useRef, useCallback } from 'react';

// Synthetic sound using Web Audio API — no external files needed
const createAudioContext = () => {
  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return null;
  }
};

const playTone = (ctx, frequency, duration, type = 'sine', volume = 0.3, delay = 0) => {
  if (!ctx) return;
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + duration);
  } catch { /* silent fail */ }
};

const SOUNDS = {
  correct: (ctx) => {
    playTone(ctx, 523, 0.15, 'sine', 0.4);
    playTone(ctx, 659, 0.15, 'sine', 0.4, 0.15);
    playTone(ctx, 784, 0.3, 'sine', 0.4, 0.3);
  },
  wrong: (ctx) => {
    playTone(ctx, 300, 0.1, 'sawtooth', 0.3);
    playTone(ctx, 200, 0.3, 'sawtooth', 0.3, 0.1);
  },
  tick: (ctx) => {
    playTone(ctx, 800, 0.05, 'square', 0.1);
  },
  tickWarning: (ctx) => {
    playTone(ctx, 600, 0.08, 'square', 0.2);
  },
  click: (ctx) => {
    playTone(ctx, 1000, 0.05, 'sine', 0.15);
  },
  roundTransition: (ctx) => {
    [261, 329, 392, 523].forEach((freq, i) => {
      playTone(ctx, freq, 0.3, 'sine', 0.35, i * 0.15);
    });
  },
  victory: (ctx) => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      playTone(ctx, freq, 0.4, 'sine', 0.4, i * 0.2);
    });
  },
  countdown: (ctx) => {
    playTone(ctx, 440, 0.2, 'sine', 0.3);
  },
};

const useSound = (enabled) => {
  const ctxRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!enabled) return null;
    if (!ctxRef.current) {
      ctxRef.current = createAudioContext();
    }
    // Resume if suspended (browser policy)
    if (ctxRef.current?.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, [enabled]);

  const play = useCallback((soundName) => {
    if (!enabled) return;
    const ctx = getCtx();
    if (ctx && SOUNDS[soundName]) {
      SOUNDS[soundName](ctx);
    }
  }, [enabled, getCtx]);

  return { play };
};

export default useSound;
