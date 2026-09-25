import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Trophy, Users, User, ArrowLeft } from 'lucide-react';
import Layout from '../components/layout/Layout';
import useGameStore from '../store/gameStore';

export default function ReadyScreen() {
  const navigate = useNavigate();
  const { player, team, playerCode, mode, startGame, leaderboard, loadQuestionBank } = useGameStore();

  const name = mode === 'team' ? team?.name : player?.name;

  useEffect(() => {
    // If neither player nor team is set, redirect to mode selection
    if (!player && !team) {
      navigate('/mode');
    }
  }, [player, team, navigate]);

  const handleLaunch = async () => {
    await loadQuestionBank();
    startGame();
    navigate('/game');
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-10 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-3xl space-y-6"
        >
          {/* Top Status */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/mode')}
              className="flex items-center gap-2 text-xs font-mono text-white/50 hover:text-cyan-neon transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              SWITCH PROFILE
            </button>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              SYSTEMS OPTIMAL // READY FOR DISPATCH
            </div>
          </div>

          {/* Main Card */}
          <div className="rounded-2xl border border-white/10 bg-navy-900/80 backdrop-blur-xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-neon/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="text-center space-y-4 mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-neon/30 bg-cyan-neon/10 text-cyan-neon text-xs font-display tracking-widest uppercase">
                {mode === 'team' ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                {mode === 'team' ? 'TEAM COMPETITOR ENGAGED' : 'SOLO OPERATIVE ENGAGED'}
              </div>

              <h1 className="font-display font-black text-4xl sm:text-6xl text-white tracking-wider">
                READY TO DECODE?
              </h1>

              <div className="text-xl sm:text-2xl font-display font-bold text-cyan-soft">
                {name || 'ANONYMOUS CODER'}
              </div>

              {playerCode && (
                <div className="inline-block px-4 py-2 rounded-xl bg-white/5 border border-white/10 font-mono text-xs sm:text-sm text-white/70">
                  SECURITY CODE: <span className="text-cyan-neon font-bold tracking-widest">{playerCode}</span>
                </div>
              )}
            </div>

            {/* Quick Rules Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-navy-950/60 border border-white/10 text-center">
                <div className="font-display font-bold text-2xl text-cyan-neon mb-1">30 PUZZLES</div>
                <div className="text-xs text-white/60">3 Progressive CS Rounds</div>
                <div className="text-[10px] font-mono text-cyan-neon/60 mt-2">10-30 PTS EACH</div>
              </div>

              <div className="p-4 rounded-xl bg-navy-950/60 border border-white/10 text-center">
                <div className="font-display font-bold text-2xl text-purple-soft mb-1">20 SECONDS</div>
                <div className="text-xs text-white/60">Per Question Countdown</div>
                <div className="text-[10px] font-mono text-purple-soft/60 mt-2">AUTO-LOCK AT 0S</div>
              </div>

              <div className="p-4 rounded-xl bg-navy-950/60 border border-white/10 text-center">
                <div className="font-display font-bold text-2xl text-blue-bright mb-1">SHOWDOWN</div>
                <div className="text-xs text-white/60">5 Rapid-fire Bonus Qs</div>
                <div className="text-[10px] font-mono text-blue-bright/60 mt-2">+20 / -10 PTS PENALTY</div>
              </div>
            </div>

            {/* CTA Button */}
            <motion.button
              type="button"
              onClick={handleLaunch}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full btn-primary py-4 text-base tracking-[0.2em] uppercase flex items-center justify-center gap-3 cursor-pointer shadow-neon-cyan"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>START GAME PROTOCOL</span>
            </motion.button>
          </div>

          {/* Quick Leaderboard Glimpse */}
          <div className="rounded-xl border border-white/10 bg-navy-900/50 p-4">
            <div className="flex items-center justify-between mb-3 text-xs font-display tracking-widest text-white/60">
              <span className="flex items-center gap-1.5 text-cyan-neon">
                <Trophy className="w-3.5 h-3.5" />
                CONTEST STANDINGS BENCHMARK
              </span>
              <button
                type="button"
                onClick={() => navigate('/leaderboard')}
                className="text-white/40 hover:text-white transition-colors"
              >
                VIEW FULL TABLE →
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {leaderboard.slice(0, 4).map((entry, idx) => (
                <div key={idx} className="p-2 rounded bg-navy-950/50 border border-white/5 text-xs">
                  <div className="text-white/50 font-mono text-[10px]">#{idx + 1}</div>
                  <div className="font-bold text-white truncate">{entry.name}</div>
                  <div className="text-cyan-neon font-mono text-[11px]">{entry.score} pts</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
