import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function RoundTransition({
  roundNumber = 1,
  roundName = 'CODE LANGUAGE',
  roundTagline = 'Know your languages.',
  onComplete,
}) {
  const [countdown, setCountdown] = useState(3);
  const [stage, setStage] = useState('intro'); // 'intro' -> 'countdown' -> 'go'

  useEffect(() => {
    // Stage 1: Intro for 2.2 seconds
    const introTimer = setTimeout(() => {
      setStage('countdown');
    }, 2200);

    return () => clearTimeout(introTimer);
  }, []);

  useEffect(() => {
    if (stage !== 'countdown') return;

    if (countdown > 1) {
      const timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 900);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setStage('go');
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [stage, countdown]);

  useEffect(() => {
    if (stage === 'go') {
      const finishTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 800);
      return () => clearTimeout(finishTimer);
    }
  }, [stage, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020818]/95 backdrop-blur-2xl overflow-hidden"
    >
      {/* Ambient background rays */}
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] bg-cyan-neon/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-purple-neon/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Cyber grid lines */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {stage === 'intro' && (
            <motion.div
              key="intro"
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.1, opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-neon/40 bg-cyan-neon/10 text-cyan-neon text-xs font-display tracking-widest uppercase">
                <Zap className="w-3.5 h-3.5 text-cyan-neon animate-pulse" />
                TECHDECODE Protocol Initiated
              </div>

              <h1 className="font-display font-black text-5xl sm:text-7xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-neon to-purple-soft drop-shadow-[0_0_35px_rgba(0,245,255,0.4)]">
                ROUND {String(roundNumber).padStart(2, '0')}
              </h1>

              <div className="font-display text-2xl sm:text-3xl font-bold tracking-widest text-cyan-soft uppercase">
                {roundName}
              </div>

              <p className="font-body text-lg sm:text-xl text-white/70 italic">
                "{roundTagline}"
              </p>

              <div className="pt-4 flex items-center justify-center gap-4 text-xs font-mono text-white/40">
                <span>[ 10 QUESTIONS ]</span>
                <span>•</span>
                <span>[ 20 SECONDS EACH ]</span>
                <span>•</span>
                <span>[ LIVE SCORING ]</span>
              </div>
            </motion.div>
          )}

          {stage === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'backOut' }}
              className="space-y-6"
            >
              <div className="font-display text-xs tracking-[0.3em] uppercase text-cyan-neon">
                GET READY TO DECODE
              </div>

              <motion.div
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="font-display font-black text-8xl sm:text-9xl text-cyan-neon drop-shadow-[0_0_50px_rgba(0,245,255,0.8)]"
              >
                {countdown}
              </motion.div>

              <div className="text-white/60 font-body text-sm tracking-widest">
                FOCUS YOUR MIND
              </div>
            </motion.div>
          )}

          {stage === 'go' && (
            <motion.div
              key="go"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="font-display font-black text-7xl sm:text-9xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-neon to-purple-soft drop-shadow-[0_0_60px_rgba(0,245,255,0.9)]"
            >
              GO!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
