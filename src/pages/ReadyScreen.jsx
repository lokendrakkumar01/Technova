import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Trophy, Users, User, ArrowLeft } from 'lucide-react';
import Layout from '../components/layout/Layout';
import useGameStore from '../store/gameStore';
import { ROUNDS, ROUND_CONFIGS } from '../data/questions';

export default function ReadyScreen() {
  const navigate = useNavigate();
  const { player, team, playerCode, mode, startGame, questionBank, loadQuestionBank } = useGameStore();
  const [isLaunching, setIsLaunching] = useState(false);
  const [questionLoadError, setQuestionLoadError] = useState('');
  const [standings, setStandings] = useState([]);

  const name = mode === 'team' ? team?.name : player?.name;

  useEffect(() => {
    // If neither player nor team is set, redirect to mode selection
    if (!player && !team) {
      navigate('/mode');
    }
  }, [player, team, navigate]);

  useEffect(() => {
    let active = true;
    fetch('/api/leaderboard', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : [])
      .then((entries) => { if (active && Array.isArray(entries)) setStandings(entries); })
      .catch(() => { if (active) setStandings([]); });
    return () => { active = false; };
  }, []);

  const handleLaunch = async () => {
    setIsLaunching(true);
    setQuestionLoadError('');
    const loaded = await loadQuestionBank();
    if (!loaded) {
      setQuestionLoadError('Could not load the latest admin question bank. Check the connection and try again.');
      setIsLaunching(false);
      return;
    }
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {ROUNDS.map((round) => {
                const config = ROUND_CONFIGS[round.id];
                const count = questionBank.filter((question) => Number(question.round) === round.id).length;
                return (
                  <motion.div key={round.id} whileHover={{ y: -3 }} className="group rounded-xl border border-white/10 bg-navy-950/60 p-4 text-left transition-colors hover:border-cyan-neon/30">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-display font-bold text-sm text-white">ROUND {round.id} <span className="text-cyan-neon">· {round.name}</span></div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-mono text-white/65">{count} Q</span>
                    </div>
                    <div className="mt-2 text-xs text-white/55">{round.answerMode === 'choice' ? 'Choose one answer' : round.answerMode === 'emoji' ? 'Answer with an emoji' : 'Type your answer'}</div>
                    <div className="mt-3 flex gap-3 text-[10px] font-mono text-cyan-neon/75"><span>{config.timePerQuestion}s EACH</span><span>•</span><span>{config.points} PTS</span></div>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA Button */}
            <motion.button
              type="button"
              onClick={handleLaunch}
              disabled={isLaunching}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full btn-primary py-4 text-base tracking-[0.2em] uppercase flex items-center justify-center gap-3 cursor-pointer shadow-neon-cyan disabled:opacity-60"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{isLaunching ? 'LOADING CURRENT QUESTIONS…' : 'START GAME PROTOCOL'}</span>
            </motion.button>
            {questionLoadError && <p role="alert" className="mt-3 text-center text-xs text-rose-300">{questionLoadError}</p>}
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
              {standings.slice(0, 4).map((entry, idx) => (
                <div key={idx} className="p-2 rounded bg-navy-950/50 border border-white/5 text-xs">
                  <div className="text-white/50 font-mono text-[10px]">#{idx + 1}</div>
                  <div className="font-bold text-white truncate">{entry.name}</div>
                  <div className="text-cyan-neon font-mono text-[11px]">{entry.score} pts</div>
                </div>
              ))}
              {standings.length === 0 && <p className="col-span-full py-2 text-center text-xs text-white/40">No completed results have been saved yet.</p>}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

