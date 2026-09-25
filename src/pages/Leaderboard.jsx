import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Award, ArrowLeft, RefreshCw, Users } from 'lucide-react';
import Layout from '../components/layout/Layout';
import useGameStore from '../store/gameStore';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { player, team, mode } = useGameStore();
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadStandings = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/leaderboard`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Standings could not be loaded from the server.');
      const entries = await response.json();
      if (!Array.isArray(entries)) throw new Error('The server returned invalid standings.');
      const realEntries = entries
        .filter((entry) => entry && typeof entry.name === 'string' && Number.isFinite(Number(entry.score)))
        .map((entry) => ({
          ...entry,
          score: Math.max(0, Number(entry.score)),
          correctAnswers: Math.max(0, Number(entry.correctAnswers) || 0),
          mode: entry.mode === 'team' ? 'team' : 'individual',
        }))
        .sort((a, b) => b.score - a.score || b.correctAnswers - a.correctAnswers);
      setData(realEntries);
      setError('');
    } catch (err) {
      setData([]);
      setError(err.message || 'Could not connect to the standings service.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadStandings();
    const timer = window.setInterval(() => void loadStandings(), 15000);
    const refreshOnReturn = () => { if (document.visibilityState === 'visible') void loadStandings(); };
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshOnReturn);
    };
  }, [loadStandings]);

  const visibleEntries = useMemo(
    () => data.filter((entry) => filter === 'all' || entry.mode === filter),
    [data, filter],
  );
  const currentContestantName = mode === 'team' ? team?.name : player?.name;

  const refresh = () => {
    setIsRefreshing(true);
    void loadStandings();
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] py-8 sm:py-10 px-4 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-mono text-white/50 hover:text-cyan-neon transition-colors">
            <ArrowLeft className="w-4 h-4" /> RETURN
          </button>
          <button type="button" onClick={refresh} disabled={isRefreshing} className="flex items-center gap-1.5 text-xs font-mono text-cyan-neon hover:text-white px-3 py-2 rounded-lg border border-cyan-neon/30 bg-cyan-neon/10 disabled:opacity-60">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> REFRESH
          </button>
        </div>

        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-neon/10 border border-cyan-neon/30 text-cyan-neon text-xs font-display tracking-widest uppercase">
            <Trophy className="w-3.5 h-3.5" /> LIVE SERVER STANDINGS
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wider">TECHDECODE HALL OF GLORY</h1>
          <p className="text-xs sm:text-sm font-body text-white/60">Completed game results, refreshed automatically every 15 seconds.</p>
        </header>

        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Filter standings by game mode">
          {[['all', 'All players'], ['individual', 'Individual'], ['team', 'Team']].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`px-4 py-2 rounded-full border text-xs font-mono transition-colors ${filter === value ? 'border-cyan-neon bg-cyan-neon/15 text-cyan-neon' : 'border-white/10 bg-white/5 text-white/60 hover:text-white'}`}>
              {label}{value === 'all' ? ` (${data.length})` : ` (${data.filter((entry) => entry.mode === value).length})`}
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-center text-sm text-rose-200">
            <p>{error}</p>
            <button type="button" onClick={refresh} className="mt-2 underline underline-offset-4">Try again</button>
          </div>
        )}

        {!error && !isLoading && visibleEntries.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-navy-900/70 p-8 sm:p-12 text-center">
            <Users className="w-8 h-8 text-white/40 mx-auto mb-3" />
            <h2 className="font-display text-lg text-white">No completed results yet</h2>
            <p className="mt-1 text-sm text-white/50">Finished games will appear here after their scores are saved.</p>
          </div>
        )}

        {isLoading && <div className="rounded-2xl border border-white/10 bg-navy-900/70 p-10 text-center text-sm text-white/50" role="status">Loading saved results…</div>}

        {!error && visibleEntries.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {visibleEntries.slice(0, 3).map((item, idx) => (
                <motion.div key={item.id || item.name} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.08 }} className={`rounded-2xl border p-5 text-center ${idx === 0 ? 'border-amber-400/50 bg-gradient-to-b from-amber-500/15 to-navy-950/90' : idx === 1 ? 'border-slate-300/40 bg-gradient-to-b from-slate-300/10 to-navy-950/90' : 'border-amber-700/40 bg-gradient-to-b from-amber-700/10 to-navy-950/90'}`}>
                  <div className="flex justify-center mb-2">{idx === 0 ? <Crown className="w-8 h-8 text-amber-300" /> : idx === 1 ? <Medal className="w-7 h-7 text-slate-300" /> : <Award className="w-7 h-7 text-amber-600" />}</div>
                  <div className="text-[10px] font-mono tracking-widest text-white/50">RANK #{idx + 1}</div>
                  <div className="font-display font-bold text-lg text-white truncate mt-1">{item.name}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-white/45">{item.mode}</div>
                  <div className="mt-4 pt-3 border-t border-white/10 font-display font-black text-2xl text-cyan-neon">{item.score} <span className="text-xs text-white/50 font-normal">PTS</span></div>
                </motion.div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-navy-900/80 overflow-hidden shadow-2xl">
              <div className="hidden sm:flex p-4 border-b border-white/10 text-xs font-mono text-white/50 uppercase">
                <span className="w-16">Rank</span><span className="flex-1">Contestant / Squad</span><span className="w-24 text-center">Mode</span><span className="w-24 text-right">Correct</span><span className="w-24 text-right">Points</span>
              </div>
              <div className="divide-y divide-white/5">
                {visibleEntries.map((item, idx) => {
                  const isCurrent = currentContestantName && item.name === currentContestantName;
                  return (
                    <div key={item.id || `${item.name}-${idx}`} className={`p-4 flex items-center gap-2 sm:gap-0 ${isCurrent ? 'bg-cyan-neon/10 border-l-4 border-cyan-neon' : 'hover:bg-white/[0.02]'}`}>
                      <div className="w-12 sm:w-16 flex items-center gap-1.5 font-mono font-bold text-sm">{idx === 0 ? <Crown className="w-4 h-4 text-amber-400" /> : idx === 1 ? <Medal className="w-4 h-4 text-slate-300" /> : idx === 2 ? <Award className="w-4 h-4 text-amber-600" /> : <span className="text-white/40">#{idx + 1}</span>}</div>
                      <div className="flex-1 min-w-0 pr-2"><div className="font-display font-bold text-sm sm:text-base text-white truncate">{item.name}{isCurrent && <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-neon/20 text-cyan-neon border border-cyan-neon/40">YOU</span>}</div><div className="sm:hidden text-[10px] uppercase text-white/40">{item.mode} · {item.correctAnswers} correct</div></div>
                      <div className="hidden sm:block w-24 text-center text-[10px] uppercase font-mono text-white/50">{item.mode}</div>
                      <div className="hidden sm:block w-24 text-right font-mono text-xs text-white/60">{item.correctAnswers}</div>
                      <div className="w-20 sm:w-24 text-right font-display font-black text-base sm:text-lg text-cyan-neon">{item.score}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

