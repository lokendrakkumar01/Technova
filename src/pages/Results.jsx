import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Award,
  Zap,
  RotateCcw,
  BarChart2,
  CheckCircle,
  Clock,
  Flame,
  ArrowRight,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import useGameStore from '../store/gameStore';

export default function Results() {
  const navigate = useNavigate();
  const {
    player,
    team,
    mode,
    score,
    correctAnswers,
    wrongAnswers,
    totalAnswered,
    roundScores,
    fastestAnswerTime,
    strongestRound,
    resetGame,
  } = useGameStore();

  const name = mode === 'team' ? team?.name : player?.name;
  const resultId = (mode === 'team' ? team?.id : player?.id) || name;

  useEffect(() => {
    if (!name) return;
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/leaderboard/update`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resultId, name, score, correctAnswers, mode }),
    }).catch(() => {});
  }, [name, resultId, score, correctAnswers, mode]);

  // Trigger confetti burst on load
  useEffect(() => {
    const end = Date.now() + 3.5 * 1000;
    const colors = ['#00f5ff', '#9333ea', '#3b82f6', '#ffffff', '#fbbf24'];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const totalQuestionsDone = totalAnswered || (correctAnswers + wrongAnswers) || 30;
  const accuracy = totalQuestionsDone > 0 ? ((correctAnswers / totalQuestionsDone) * 100).toFixed(1) : '0.0';

  const roundNames = {
    1: 'Code Language',
    2: 'Think Like A Computer',
    3: 'Tech Arena',
    showdown: 'Tech Showdown',
  };

  const bestRound = strongestRound ? roundNames[strongestRound] || 'Tech Arena' : 'Tech Arena';

  const handlePlayAgain = () => {
    resetGame();
    navigate('/');
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] py-10 px-4 max-w-4xl mx-auto space-y-8">
        {/* Champion Trophy Hero */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-300 font-display text-xs tracking-widest uppercase">
            <Trophy className="w-4 h-4 text-amber-300" />
            TECHDECODE CONTEST CEREMONY
          </div>

          <div className="text-6xl sm:text-7xl">🏆</div>

          <h1 className="font-display font-black text-4xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-cyan-neon to-purple-soft tracking-wider drop-shadow-[0_0_35px_rgba(251,191,36,0.5)]">
            WE HAVE A CHAMPION!
          </h1>

          <div className="font-display text-2xl sm:text-3xl font-bold text-white tracking-wide">
            {name || 'TECH MASTER'}
          </div>

          <p className="text-xs sm:text-sm font-mono text-cyan-neon">
            PROTOCOL COMPLETED // OFFICIAL SCORE DEPOSITED
          </p>
        </motion.div>

        {/* Big Score Card */}
        <div className="rounded-2xl border border-white/10 bg-navy-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-neon/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="text-xs font-mono tracking-widest text-white/50 uppercase mb-1">
            FINAL SCORE ARCHIVE
          </div>
          <div className="font-display font-black text-6xl sm:text-8xl text-cyan-neon tracking-wider drop-shadow-[0_0_30px_rgba(0,245,255,0.6)]">
            {score}
          </div>
          <div className="text-xs font-mono text-white/40 mt-1">TOTAL POINTS ACCUMULATED</div>
        </div>

        {/* 6 Key Performance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-navy-900/60 border border-white/10 text-center">
            <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-[10px] font-mono text-white/50 uppercase">Correct Decodes</div>
            <div className="font-display font-bold text-2xl text-white mt-0.5">
              {correctAnswers} <span className="text-xs text-white/40 font-normal">/ {totalQuestionsDone}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-navy-900/60 border border-white/10 text-center">
            <Zap className="w-5 h-5 text-cyan-neon mx-auto mb-1" />
            <div className="text-[10px] font-mono text-white/50 uppercase">Precision Accuracy</div>
            <div className="font-display font-bold text-2xl text-cyan-neon mt-0.5">
              {accuracy}%
            </div>
          </div>

          <div className="p-4 rounded-xl bg-navy-900/60 border border-white/10 text-center">
            <Clock className="w-5 h-5 text-purple-soft mx-auto mb-1" />
            <div className="text-[10px] font-mono text-white/50 uppercase">Fastest Decode</div>
            <div className="font-display font-bold text-2xl text-purple-soft mt-0.5">
              {fastestAnswerTime ? `${fastestAnswerTime}s` : '3.2s'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-navy-900/60 border border-white/10 text-center">
            <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-[10px] font-mono text-white/50 uppercase">Strongest Domain</div>
            <div className="font-display font-bold text-lg text-amber-300 mt-1 truncate">
              {bestRound}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-navy-900/60 border border-white/10 text-center">
            <BarChart2 className="w-5 h-5 text-blue-bright mx-auto mb-1" />
            <div className="text-[10px] font-mono text-white/50 uppercase">Total Answered</div>
            <div className="font-display font-bold text-2xl text-white mt-0.5">
              {totalQuestionsDone}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-navy-900/60 border border-white/10 text-center">
            <Award className="w-5 h-5 text-slate-300 mx-auto mb-1" />
            <div className="text-[10px] font-mono text-white/50 uppercase">Wrong Submissions</div>
            <div className="font-display font-bold text-2xl text-rose-400 mt-0.5">
              {wrongAnswers}
            </div>
          </div>
        </div>

        {/* Round Scores Breakdown */}
        <div className="rounded-xl border border-white/10 bg-navy-900/50 p-6 space-y-3">
          <div className="text-xs font-display tracking-widest text-white/70 uppercase">
            Score Distribution By Round
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(roundScores).map(([rKey, rScore]) => (
              <div key={rKey} className="p-3 rounded-lg bg-navy-950/70 border border-white/5">
                <div className="text-[10px] font-mono text-white/40 uppercase">
                  {rKey === 'showdown' ? 'Showdown' : `Round ${rKey}`}
                </div>
                <div className="font-display font-bold text-xl text-cyan-neon mt-1">
                  {rScore} PTS
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={handlePlayAgain}
            className="w-full sm:w-auto btn-primary py-3.5 px-8 flex items-center justify-center gap-2 text-xs tracking-widest uppercase cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            PLAY ANOTHER ROUND
          </button>

          <button
            type="button"
            onClick={() => navigate('/leaderboard')}
            className="w-full sm:w-auto btn-secondary py-3.5 px-8 flex items-center justify-center gap-2 text-xs tracking-widest uppercase cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            VIEW AUDITORIUM STANDINGS
          </button>

          <button
            type="button"
            onClick={() => navigate('/memories')}
            className="w-full sm:w-auto py-3.5 px-8 rounded-xl border border-purple-soft/40 bg-purple-electric/15 hover:bg-purple-electric/25 text-purple-soft text-xs font-display font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>FEST MEMORIES & MEDIA</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Layout>
  );
}
