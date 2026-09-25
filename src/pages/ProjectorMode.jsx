import React from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import useTimer from '../hooks/useTimer';
import { ROUND_CONFIGS, QUESTIONS, SHOWDOWN_QUESTIONS } from '../data/questions';

export default function ProjectorMode() {
  const {
    currentRound,
    currentQuestionIndex,
    score,
    gameStatus,
    phase,
    selectedAnswer,
    inShowdown,
    showdownIndex,
    getCurrentQuestion,
  } = useGameStore();

  const question = getCurrentQuestion();
  const totalQuestions = inShowdown ? SHOWDOWN_QUESTIONS.length : QUESTIONS.length;
  const currentNum = inShowdown ? showdownIndex + 1 : currentQuestionIndex + 1;
  const roundConfig = inShowdown ? ROUND_CONFIGS.showdown : (ROUND_CONFIGS[currentRound] || ROUND_CONFIGS[1]);

  const { timeLeft, timerState } = useTimer({
    duration: inShowdown ? 10 : 20,
    isActive: phase === 'question' && gameStatus === 'playing',
  });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden select-none">
      {/* Dynamic ambient spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-cyan-neon/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Top Projector Header */}
      <header className="flex items-center justify-between border-b border-white/20 pb-6 relative z-10">
        <div className="flex items-center gap-6">
          <div className="font-display font-black text-4xl sm:text-6xl text-cyan-neon tracking-widest drop-shadow-[0_0_30px_rgba(0,245,255,0.7)]">
            TECHDECODE
          </div>
          <div className="h-10 w-0.5 bg-white/20" />
          <div className="font-display text-2xl sm:text-3xl font-bold tracking-widest text-purple-soft uppercase">
            {inShowdown ? '⚡ TECH SHOWDOWN' : roundConfig.name}
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-xs sm:text-sm font-mono text-white/50 tracking-widest uppercase">
              QUESTION INDEX
            </div>
            <div className="font-display font-black text-2xl sm:text-4xl text-white">
              {currentNum} <span className="text-white/40">/ {totalQuestions}</span>
            </div>
          </div>

          <div className="px-6 py-2 rounded-2xl bg-white/5 border border-white/20 text-right">
            <div className="text-xs font-mono text-cyan-neon tracking-widest uppercase">
              SCORE
            </div>
            <div className="font-display font-black text-3xl sm:text-5xl text-cyan-neon">
              {score}
            </div>
          </div>
        </div>
      </header>

      {/* Main Focus: Giant Pictogram (Readable from back of auditorium) */}
      <main className="flex-1 flex flex-col items-center justify-center my-8 text-center relative z-10">
        {question ? (
          <div className="space-y-8 max-w-5xl">
            {/* Massive Pictogram */}
            <motion.div
              key={question.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-[7rem] sm:text-[11rem] md:text-[13rem] leading-none select-none filter drop-shadow-[0_0_60px_rgba(0,245,255,0.5)]"
            >
              {question.pictogram}
            </motion.div>

            <div className="font-display font-bold text-2xl sm:text-4xl tracking-widest text-white/90 uppercase">
              WHAT DOES THIS TECHNICAL PICTOGRAM REPRESENT?
            </div>

            {/* Answer Options Banner for audience view */}
            <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto pt-4">
              {question.options.map((opt, i) => {
                const label = ['A', 'B', 'C', 'D'][i];
                const isCorrect = phase === 'reveal' && opt === question.correctAnswer;
                const isSelected = selectedAnswer === opt;

                return (
                  <div
                    key={opt}
                    className={`p-4 rounded-2xl border text-left font-display font-bold text-xl sm:text-2xl flex items-center gap-4 transition-all ${
                      isCorrect
                        ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-[0_0_30px_rgba(52,211,153,0.5)]'
                        : isSelected && !isCorrect && phase === 'reveal'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-white/5 border-white/10 text-white/80'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-mono">
                      {label}
                    </span>
                    <span className="truncate">{opt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="font-display text-4xl text-white/40">
            AWAITING SYSTEM SIGNAL...
          </div>
        )}
      </main>

      {/* Massive Bottom Timer Bar */}
      <footer className="flex items-center justify-between border-t border-white/20 pt-6 relative z-10">
        <div className="text-sm font-mono text-white/40 tracking-widest">
          PROJECTOR OUTPUT RUNTIME // RESOLUTION OPTIMIZED
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-white/50 tracking-widest">COUNTDOWN:</div>
          <div
            className={`font-display font-black text-6xl sm:text-8xl tracking-widest ${
              timerState === 'danger'
                ? 'text-rose-400 animate-pulse drop-shadow-[0_0_40px_rgba(244,63,94,0.8)]'
                : timerState === 'warning'
                ? 'text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.6)]'
                : 'text-cyan-neon drop-shadow-[0_0_30px_rgba(0,245,255,0.6)]'
            }`}
          >
            {String(timeLeft).padStart(2, '0')}s
          </div>
        </div>
      </footer>
    </div>
  );
}
