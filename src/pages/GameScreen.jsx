import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  Pause,
} from 'lucide-react';
import useGameStore from '../store/gameStore';
import useTimer from '../hooks/useTimer';
import useSound from '../hooks/useSound';
import { ROUND_CONFIGS } from '../data/questions';

import PictogramDisplay from '../components/game/PictogramDisplay';
import AnswerButtons from '../components/game/AnswerButtons';
import Lifelines from '../components/game/Lifelines';
import RoundTransition from '../components/game/RoundTransition';
import AnswerReveal from '../components/game/AnswerReveal';

function TypedAnswerForm({ answerMode, isAnswerLocked, hostPaused, onSubmit }) {
  const [typedAnswer, setTypedAnswer] = useState('');
  const answerEmojiOptions = ['☁️', '🤖', '🔐', '🌐', '📡', '🧠', '🔗', '🛡️', '👁️', '✨', '💻', '⚡'];
  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      onSubmit={(event) => { event.preventDefault(); if (typedAnswer.trim()) onSubmit(typedAnswer.trim()); }}
      className="flex flex-col sm:flex-row sm:flex-wrap gap-3 rounded-2xl border border-cyan-neon/20 bg-navy-900/70 p-3 shadow-[0_12px_50px_rgba(0,0,0,0.25)]"
    >
      <input
        autoComplete="off" autoCapitalize="words" maxLength={120}
        value={typedAnswer} onChange={(event) => setTypedAnswer(event.target.value)}
        disabled={isAnswerLocked || hostPaused}
        aria-label="Type your answer"
        placeholder={answerMode === 'emoji' ? 'Choose an emoji that answers the clue…' : 'Type your answer…'}
        className="min-h-12 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 text-base text-white outline-none placeholder:text-white/35 focus:border-cyan-neon/60 focus:ring-2 focus:ring-cyan-neon/20 disabled:opacity-50"
      />
      <button type="submit" disabled={isAnswerLocked || hostPaused || !typedAnswer.trim()} className="min-h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 font-display text-sm font-black tracking-widest text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
        LOCK ANSWER
      </button>
      {answerMode === 'emoji' && <div className="flex flex-wrap justify-center gap-2 sm:basis-full">{answerEmojiOptions.map((emoji) => <button key={emoji} type="button" disabled={isAnswerLocked || hostPaused} onClick={() => setTypedAnswer((answer) => answer + emoji)} className="min-h-10 min-w-10 rounded-lg border border-white/10 bg-white/5 text-xl transition hover:border-cyan-neon/40 hover:bg-cyan-neon/10 disabled:opacity-40" aria-label={`Add ${emoji} to your answer`}>{emoji}</button>)}</div>}
    </motion.form>
  );
}

export default function GameScreen() {
  const navigate = useNavigate();

  // Zustand Store
  const {
    player,
    team,
    mode,
    gameStatus,
$1$2    pendingRound,$2$3
    phase,
    score,
    selectedAnswer,
    isAnswerLocked,
    answerResult,
    lifelines,
    hintsRemaining,
    hintShown,
    hintText,
    eliminatedOptions,
    extraTimeAmount,
    inShowdown,
    scoreDelta,
    soundEnabled,
    hostPaused,
    // Actions
    beginRound,
    selectAnswer,
    timeout,
    nextQuestion,
    activateFiftyFifty,
    activateTechHint,
    activateExtraTime,
    questionBank,
    toggleSound,
    getCurrentQuestion,
  } = useGameStore();

  const { play } = useSound(soundEnabled);

  // Current Question
  const question = getCurrentQuestion();

  // Redirection guard
  useEffect(() => {
    if (!player && !team) {
      navigate('/mode');
      return;
    }
    if (gameStatus === 'finished') {
      navigate('/results');
      return;
    }
    if (gameStatus === 'idle') {
      navigate('/ready');
      return;
    }
  }, [player, team, gameStatus, navigate]);

  const baseDuration = ROUND_CONFIGS[currentRound]?.timePerQuestion || 20;

  // Handle Timeout
  const handleTimeout = useCallback(() => {
    if (!isAnswerLocked && phase === 'question') {
      play('wrong');
      timeout();
    }
  }, [isAnswerLocked, phase, timeout, play]);

  // Hook for Timer
  const { timeLeft, timerState, progress, getTimeUsed } = useTimer({
    duration: baseDuration,
    onTimeout: handleTimeout,
    isActive: phase === 'question' && !isAnswerLocked && gameStatus === 'playing',
    isPaused: hostPaused,
    questionKey: `${inShowdown ? 'showdown' : currentQuestionIndex}:${question?.id}`,
    extraTime: extraTimeAmount,
  });

  // Sound effects on answer & timer ticks
  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0 && phase === 'question' && !isAnswerLocked) {
      play('tickWarning');
    }
  }, [timeLeft, phase, isAnswerLocked, play]);

  const handleSelectAnswer = (ans) => {
    if (isAnswerLocked || hostPaused) return;
    const timeUsed = getTimeUsed();
    play('click');
    selectAnswer(ans, timeUsed);

    const normalizeAnswer = (value) => String(value ?? '').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
    const isCorrect = [question?.correctAnswer, ...(Array.isArray(question?.acceptedAnswers) ? question.acceptedAnswers : [])].some((value) => normalizeAnswer(value) === normalizeAnswer(ans));
    if (isCorrect) {
      setTimeout(() => play('correct'), 150);
    } else {
      setTimeout(() => play('wrong'), 150);
    }
  };

  const handleLifelineExtraTime = () => {
    activateExtraTime();
    play('click');
  };

  const handleLifelineHint = () => {
    activateTechHint();
    play('click');
  };

  const handleLifelineFiftyFifty = () => {
    activateFiftyFifty();
    play('click');
  };

  // Question numbering
  const totalQuestionsCount = questionBank.length;
  const currentNumber = currentQuestionIndex + 1;
  const roundConfig = ROUND_CONFIGS[currentRound] || ROUND_CONFIGS[1];
  const answerMode = roundConfig.answerMode || (currentRound === 1 ? 'choice' : currentRound === 3 ? 'emoji' : 'text');

  return (
    <div className="min-h-screen bg-[#020818] text-white flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-grid opacity-25 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-hero-gradient pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-neon/5 rounded-full blur-[140px] pointer-events-none" />

      {/* ─── TOP STATUS BAR ────────────────────────────────────── */}
      <header className="relative z-20 border-b border-white/10 bg-navy-900/60 backdrop-blur-xl px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Participant */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="font-display font-black text-xl tracking-wider text-cyan-neon hover:text-white transition-colors"
            >
              TECHDECODE
            </button>
            <div className="hidden sm:block h-4 w-px bg-white/20" />
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-white/70">
              <span className="text-white/40">USER:</span>
              <span className="text-cyan-soft font-bold truncate max-w-[130px]">
                {mode === 'team' ? team?.name : player?.name}
              </span>
            </div>
          </div>

          {/* Round & Question Indicator */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-display font-bold uppercase tracking-wider ${
                  inShowdown
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/30'
                }`}
              >
                {roundConfig.name}
              </span>
              <span className="text-xs sm:text-sm font-mono text-white/80 font-bold">
                Q {currentNumber} / {totalQuestionsCount}
              </span>
            </div>

            {/* Tiny Progress bar */}
            <div className="w-36 sm:w-48 h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-neon to-purple-soft transition-all duration-300"
                style={{ width: `${(currentNumber / totalQuestionsCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Score & Audio Controls */}
          <div className="flex items-center gap-3">
            {/* Score Badge */}
            <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-neon/10 border border-cyan-neon/30 text-cyan-neon font-display font-black text-sm sm:text-base shadow-sm">
              <Trophy className="w-4 h-4 text-cyan-neon" />
              <span>{score} PTS</span>

              {/* Score Pop Delta */}
              <AnimatePresence>
                {scoreDelta && (
                  <motion.span
                    initial={{ y: 0, opacity: 1, scale: 0.8 }}
                    animate={{ y: -24, opacity: 0, scale: 1.2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className={`absolute -top-3 right-0 font-bold text-xs ${
                      scoreDelta.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {scoreDelta}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
              title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-neon" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ─── PAUSED BANNER (IF HOST PAUSED) ───────────────────── */}
      {hostPaused && (
        <div className="relative z-30 bg-amber-500/20 border-y border-amber-500/40 text-amber-300 px-4 py-2 text-center text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2">
          <Pause className="w-4 h-4" />
          GAME TEMPORARILY PAUSED BY EVENT MARSHAL // HOLD FOR SIGNAL
        </div>
      )}

      {/* ─── MAIN ARENA ────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-4 sm:py-6 flex flex-col justify-center">
        {question && (
          <div className="space-y-4 sm:space-y-6">
            {/* Timer Banner */}
            <div className="flex flex-col items-center">
              <div
                className={`font-display font-black text-4xl sm:text-5xl tracking-widest ${
                  timerState === 'danger'
                    ? 'text-rose-400 animate-pulse drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]'
                    : timerState === 'warning'
                    ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                    : 'text-cyan-neon drop-shadow-[0_0_15px_rgba(0,245,255,0.4)]'
                }`}
              >
                {String(timeLeft).padStart(2, '0')}s
              </div>

              {/* Dynamic countdown ring/bar */}
              <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timerState === 'danger'
                      ? 'bg-rose-500'
                      : timerState === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-cyan-neon'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Pictogram Box */}
            <div className="relative rounded-2xl border border-white/10 bg-navy-900/70 backdrop-blur-md p-6 sm:p-8 text-center shadow-xl overflow-hidden">
              <div className="text-[11px] font-mono tracking-[0.25em] text-cyan-neon/80 uppercase mb-2">
                Pictogram Clue Matrix
              </div>

              <PictogramDisplay pictogram={question.pictogram} />

              <div className="font-display font-bold text-lg sm:text-xl text-white tracking-wider mt-4">
                {question.question}
              </div>
              {answerMode === 'emoji' && <div className="mt-2 text-[10px] font-mono tracking-widest text-blue-bright">ANSWER WITH AN EMOJI</div>}

              {/* Hint Box (if activated) */}
              <AnimatePresence>
                {hintShown && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-3 rounded-xl bg-purple-electric/20 border border-purple-soft/40 text-purple-200 text-xs sm:text-sm font-body flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-purple-soft shrink-0" />
                    <span>HINT: {hintText}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Answer Options Grid */}
            {answerMode === 'choice' ? (
              <AnswerButtons
                options={question.options}
                selectedAnswer={selectedAnswer}
                correctAnswer={question.correctAnswer}
                isLocked={isAnswerLocked}
                eliminatedOptions={eliminatedOptions}
                onSelect={handleSelectAnswer}
              />
            ) : (
              <TypedAnswerForm key={question.id} answerMode={answerMode} isAnswerLocked={isAnswerLocked} hostPaused={hostPaused} onSubmit={handleSelectAnswer} />
            )}

            {/* Lifelines Panel (Disabled in Showdown) */}
            {!inShowdown && (
              <div className="pt-2">
                <Lifelines
                  lifelines={lifelines}
                  hintsRemaining={hintsRemaining}
                  onFiftyFifty={handleLifelineFiftyFifty}
                  onTechHint={handleLifelineHint}
                  onExtraTime={handleLifelineExtraTime}
                  disabled={isAnswerLocked || hostPaused}
                  showFiftyFifty={answerMode === 'choice'}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── FOOTER BAR ────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 bg-navy-950/80 px-4 py-2 text-center text-[11px] font-mono text-white/40">
        <span>TECHDECODE GAME ENGINE // LIVE COMPETITION RUNTIME</span>
      </footer>

      {/* ─── OVERLAYS ──────────────────────────────────────────── */}
      {gameStatus === 'roundApproval' && pendingRound && (
        <div role="status" aria-live="polite" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-5 text-center backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-amber-300/25 bg-navy-900/90 p-8 shadow-2xl shadow-amber-950/30 sm:p-12">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-2xl">✦</div>
            <p className="text-xs font-mono tracking-[0.25em] text-amber-200/80">ROUND {currentRound} COMPLETE</p>
            <h2 className="mt-3 font-display text-2xl font-black text-white sm:text-4xl">Waiting for host approval</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">Round {pendingRound} will begin after the host approves it.</p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-mono text-white/55"><span className="h-2 w-2 animate-pulse rounded-full bg-amber-300" /> GAME PAUSED</div>
          </div>
        </div>
      )}

      {/* Round Transition Screen */}
      <AnimatePresence>
        {gameStatus === 'roundTransition' && (
          <RoundTransition
            roundNumber={currentRound}
          roundName={roundConfig.name}
          roundTagline={roundConfig.tagline}
          questionCount={questionBank.filter((item) => Number(item.round) === Number(currentRound)).length}
          timePerQuestion={roundConfig.timePerQuestion}
          points={roundConfig.points}
          onComplete={beginRound}
          />
        )}
      </AnimatePresence>

      {/* Answer Reveal Screen */}
      <AnimatePresence>
        {phase === 'reveal' && (
          <AnswerReveal
            question={question}
            selectedAnswer={selectedAnswer}
            result={answerResult}
            scoreDelta={scoreDelta}
            onContinue={nextQuestion}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

