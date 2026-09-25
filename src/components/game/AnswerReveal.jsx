import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, ArrowRight, Zap } from 'lucide-react';

export default function AnswerReveal({
  question,
  selectedAnswer,
  result = 'correct', // 'correct' | 'wrong' | 'timeout'
  scoreDelta,
  onContinue,
}) {
  if (!question) return null;

  const isCorrect = result === 'correct';
  const isTimeout = result === 'timeout';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-xl rounded-2xl border border-white/15 bg-gradient-to-b from-navy-900/90 to-navy-950/95 p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow effect based on outcome */}
        <div
          className={`absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl pointer-events-none ${
            isCorrect
              ? 'bg-emerald-500/20'
              : isTimeout
              ? 'bg-amber-500/20'
              : 'bg-rose-500/20'
          }`}
        />

        {/* Top Status Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            {isCorrect ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : isTimeout ? (
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                <XCircle className="w-6 h-6" />
              </div>
            )}

            <div>
              <div
                className={`font-display text-xl sm:text-2xl font-black tracking-wider uppercase ${
                  isCorrect
                    ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                    : isTimeout
                    ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                    : 'text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                }`}
              >
                {isCorrect
                  ? 'DECODED! CORRECT'
                  : isTimeout
                  ? 'TIME EXPIRED!'
                  : 'INCORRECT DECODE'}
              </div>
              <div className="text-xs font-mono text-white/50">
                {isCorrect
                  ? 'Precision bonus awarded'
                  : isTimeout
                  ? 'Locked out by system timer'
                  : `Your pick: ${selectedAnswer || 'None'}`}
              </div>
            </div>
          </div>

          {scoreDelta && (
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className={`px-3 py-1.5 rounded-xl font-display font-black text-sm sm:text-base border shadow-lg ${
                isCorrect
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-emerald-950/50'
                  : 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-rose-950/50'
              }`}
            >
              {scoreDelta} PTS
            </motion.div>
          )}
        </div>

        {/* Pictogram & Correct Answer Display */}
        <div className="my-6 text-center space-y-3 relative z-10">
          <div className="text-4xl sm:text-5xl py-2 filter drop-shadow-[0_0_20px_rgba(0,245,255,0.4)]">
            {question.pictogram}
          </div>

          <div className="text-xs font-mono tracking-widest text-cyan-neon uppercase">
            Official Solution
          </div>

          <div className="font-display font-black text-2xl sm:text-4xl text-white tracking-wide border-y border-cyan-neon/30 py-3 bg-cyan-neon/5">
            {question.correctAnswer}
          </div>
        </div>

        {/* Technical Explanation */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 relative z-10 mb-6">
          <div className="flex items-center gap-2 text-xs font-display tracking-widest text-purple-soft uppercase mb-1.5">
            <Zap className="w-3.5 h-3.5" />
            Technical Breakdown
          </div>
          <p className="text-sm font-body text-white/80 leading-relaxed">
            {question.explanation}
          </p>
        </div>

        {/* Continue Button */}
        <div className="relative z-10 flex justify-end">
          <motion.button
            type="button"
            onClick={onContinue}
            whileHover={{ scale: 1.03, x: 2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 px-8 py-3.5 text-sm"
          >
            <span>CONTINUE PROTOCOL</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
