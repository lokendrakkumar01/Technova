import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Award, ArrowLeft, RefreshCw, Zap, Users } from 'lucide-react';
import Layout from '../components/layout/Layout';
import useGameStore from '../store/gameStore';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { leaderboard, score, player, team, mode } = useGameStore();
  const [data, setData] = useState(leaderboard);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync from store and optionally backend
  useEffect(() => {
    setData(leaderboard);
  }, [leaderboard]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/api/leaderboard`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.length > 0) {
          setData(json);
        }
      }
    } catch {
      // fallback to store data
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const currentContestantName = mode === 'team' ? team?.name : player?.name;

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] py-10 px-4 max-w-4xl mx-auto space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-mono text-white/50 hover:text-cyan-neon transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            RETURN
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs font-mono text-cyan-neon hover:text-white px-3 py-1.5 rounded-lg border border-cyan-neon/30 bg-cyan-neon/10 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            SYNC STANDINGS
          </button>
        </div>

        {/* Title & Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-neon/10 border border-cyan-neon/30 text-cyan-neon text-xs font-display tracking-widest uppercase">
            <Trophy className="w-3.5 h-3.5" />
            LIVE AUDITORIUM STANDINGS
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wider">
            TECHNOVA HALL OF GLORY
          </h1>
          <p className="text-xs sm:text-sm font-body text-white/60">
            Real-time score calculation and precision ranking across all participating colleges
          </p>
        </div>

        {/* Top 3 Podium Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          {data.slice(0, 3).map((item, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;
            const isThird = idx === 2;

            return (
              <motion.div
                key={item.id || idx}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative rounded-2xl border p-5 text-center flex flex-col justify-between overflow-hidden shadow-xl ${
                  isFirst
                    ? 'border-amber-400/50 bg-gradient-to-b from-amber-500/15 to-navy-950/90 shadow-amber-950/30'
                    : isSecond
                    ? 'border-slate-300/40 bg-gradient-to-b from-slate-300/10 to-navy-950/90'
                    : 'border-amber-700/40 bg-gradient-to-b from-amber-700/10 to-navy-950/90'
                }`}
              >
                <div>
                  <div className="mb-2 flex justify-center">
                    {isFirst ? (
                      <Crown className="w-8 h-8 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-bounce" />
                    ) : isSecond ? (
                      <Medal className="w-7 h-7 text-slate-300" />
                    ) : (
                      <Award className="w-7 h-7 text-amber-600" />
                    )}
                  </div>
                  <div className="text-[10px] font-mono tracking-widest text-white/50 uppercase">
                    RANK #{idx + 1}
                  </div>
                  <div className="font-display font-bold text-lg text-white truncate mt-1">
                    {item.name}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="font-display font-black text-2xl text-cyan-neon">
                    {item.score} <span className="text-xs text-white/50 font-normal">PTS</span>
                  </div>
                  <div className="text-[11px] font-mono text-white/40 mt-0.5">
                    {item.correctAnswers || 0} Correct Decodes
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Complete Standings Table */}
        <div className="rounded-2xl border border-white/10 bg-navy-900/80 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between text-xs font-mono text-white/50 uppercase">
            <span className="w-16">Rank</span>
            <span className="flex-1">Contestant / Squad</span>
            <span className="w-24 text-right">Decodes</span>
            <span className="w-24 text-right">Points</span>
          </div>

          <div className="divide-y divide-white/5">
            {data.map((item, idx) => {
              const isCurrent =
                item.isCurrentPlayer ||
                (currentContestantName && item.name === currentContestantName);

              return (
                <div
                  key={item.id || idx}
                  className={`p-4 flex items-center justify-between transition-colors ${
                    isCurrent
                      ? 'bg-cyan-neon/10 border-l-4 border-cyan-neon'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="w-16 flex items-center gap-1.5 font-mono font-bold text-sm">
                    {idx === 0 ? (
                      <Crown className="w-4 h-4 text-amber-400" />
                    ) : idx === 1 ? (
                      <Medal className="w-4 h-4 text-slate-300" />
                    ) : idx === 2 ? (
                      <Award className="w-4 h-4 text-amber-600" />
                    ) : (
                      <span className="text-white/40">#{idx + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm sm:text-base text-white truncate">
                        {item.name}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-neon/20 text-cyan-neon border border-cyan-neon/40">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-24 text-right font-mono text-xs text-white/60">
                    {item.correctAnswers || 0}
                  </div>

                  <div className="w-24 text-right font-display font-black text-base sm:text-lg text-cyan-neon">
                    {item.score}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
