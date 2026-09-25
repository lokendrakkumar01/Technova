import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Eye,
  StopCircle,
  PlusCircle,
  MinusCircle,
  Tv,
  Lock,
  ShieldCheck,
  Users,
  Trophy,
  Sliders,
  AlertTriangle,
  BadgeCheck,
  Trash2,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import useGameStore from '../store/gameStore';

export default function HostDashboard() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [hostToken, setHostToken] = useState('');
  const [savedLeaderboard, setSavedLeaderboard] = useState([]);
  const [savedLeaderboardStatus, setSavedLeaderboardStatus] = useState('');
  const [savedLeaderboardLoading, setSavedLeaderboardLoading] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [questionLoadError, setQuestionLoadError] = useState('');
  const [sharedGameState, setSharedGameState] = useState({ status: 'registration', approvedRound: 1, pendingRound: null, hostPaused: false, participants: [] });
  const [sharedGameError, setSharedGameError] = useState('');

  // Score adjust state
  const [pointsInput, setPointsInput] = useState(10);
  const [showConfirmModal, setShowConfirmModal] = useState(null);

  const {
    gameStatus,
    currentRound,
    pendingRound,
    currentQuestionIndex,
    score,
    player,
    team,
    mode,
    nextQuestion,
    hostSkipQuestion,
    hostRevealAnswer,
    hostResetQuestion,
    hostAddPoints,
    hostRemovePoints,
    hostResetScore,
    loadQuestionBank,
  } = useGameStore();

  const refreshSavedLeaderboard = async (token = hostToken) => {
    if (!token) return;
    setSavedLeaderboardLoading(true);
    setSavedLeaderboardStatus('');
    try {
      const response = await fetch('/api/host/leaderboard', { cache: 'no-store', headers: { 'x-host-token': token } });
      const entries = await response.json();
      if (!response.ok || !Array.isArray(entries)) throw new Error(entries.error || 'Could not load saved leaderboard results.');
      setSavedLeaderboard(entries);
    } catch (error) {
      setSavedLeaderboardStatus(error.message || 'Could not load the leaderboard.');
    } finally {
      setSavedLeaderboardLoading(false);
    }
  };

  const refreshSharedGameState = async (token = hostToken) => {
    if (!token) return;
    try {
      const response = await fetch('/api/host/game/state', { cache: 'no-store', headers: { 'x-host-token': token } });
      const state = await response.json();
      if (!response.ok) throw new Error(state.error || 'Could not load live game state.');
      setSharedGameState(state);
      setSharedGameError('');
    } catch (error) {
      setSharedGameError(error.message || 'Could not load live participants.');
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !hostToken) return undefined;
    void refreshSharedGameState(hostToken);
    const timer = window.setInterval(() => void refreshSharedGameState(hostToken), 1800);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, hostToken]);

  const handleApproveRound = async () => {
    const round = Number(sharedGameState.pendingRound);
    if (!round || !hostToken) return;
    try {
      const response = await fetch('/api/host/round-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-host-token': hostToken },
        body: JSON.stringify({ round }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not approve the round.');
      setSharedGameState(result.state);
      setSharedGameError('');
    } catch (error) { setSharedGameError(error.message || 'Could not approve the round.'); }
  };

  const handleTogglePause = async () => {
    try {
      const response = await fetch('/api/host/game/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-host-token': hostToken },
        body: JSON.stringify({ paused: !sharedGameState.hostPaused }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update the game pause state.');
      setSharedGameState(result.state);
      setSharedGameError('');
    } catch (error) { setSharedGameError(error.message || 'Could not update pause state.'); }
  };

  const handleFinishGame = async () => {
    try {
      const response = await fetch('/api/host/game/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-host-token': hostToken },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not end the shared game session.');
      setSharedGameState(result.state);
      setSharedGameError('');
    } catch (error) { setSharedGameError(error.message || 'Could not end the shared game session.'); }
  };

  const deleteLeaderboardEntry = async (entry) => {
    const id = String(entry?.id || '').trim();
    if (!id || !window.confirm(`Remove ${entry.name} from the live session and saved leaderboard?`)) return;
    setSavedLeaderboardStatus('');
    try {
      const response = await fetch(`/api/host/leaderboard/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'x-host-token': hostToken },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not delete this result.');
      await refreshSavedLeaderboard();
    } catch (error) {
      setSavedLeaderboardStatus(error.message || 'Could not delete this result.');
    }
  };

  const handleStartGame = async () => {
    setIsStartingGame(true);
    setQuestionLoadError('');
    const loaded = await loadQuestionBank();
    if (!loaded) {
      setQuestionLoadError('Could not load the latest admin question bank. Check the connection and retry.');
      setIsStartingGame(false);
      return;
    }
    try {
      const response = await fetch('/api/host/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-host-token': hostToken },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not start the shared game session.');
      setSharedGameState(result.state);
      setSharedGameError('');
    } catch (error) {
      setQuestionLoadError(error.message || 'Could not start the shared game session.');
    } finally {
      setIsStartingGame(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinError('');
    try {
      const response = await fetch('/api/host/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Host sign-in failed.');
      setHostToken(result.token);
      setIsAuthenticated(true);
      void refreshSavedLeaderboard(result.token);
    } catch (error) { setPinError(error.message || 'Could not connect to the server.'); }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-navy-900/80 backdrop-blur-xl p-6 sm:p-8 text-center shadow-2xl"
          >
            <div className="w-12 h-12 rounded-full bg-cyan-neon/10 border border-cyan-neon/30 text-cyan-neon flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-display text-xl font-bold text-white mb-1">
              HOST AUTHORIZATION
            </h1>
            <p className="text-xs font-mono text-white/50 mb-6">
              Configure your private HOST_PIN in Render → Environment.
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={128}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="Host passphrase"
                  className="w-full px-4 py-3 text-center tracking-widest font-mono text-lg rounded-xl bg-navy-950/80 border border-white/15 text-white placeholder-white/20 focus:outline-none focus:border-cyan-neon"
                />
                {pinError && (
                  <p className="text-xs text-rose-400 mt-2 font-mono">
                    {pinError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-3 text-xs tracking-widest uppercase cursor-pointer"
              >
                UNLOCK CONTROLLER
              </button>
            </form>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] py-8 px-4 max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-neon/10 border border-cyan-neon/30 text-cyan-neon text-xs font-mono mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              EVENT COMMAND CENTER
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wider">
              TECHDECODE MARSHAL CONSOLE
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/host/display')}
              target="_blank"
              className="px-4 py-2.5 rounded-xl border border-cyan-neon/40 bg-cyan-neon/10 hover:bg-cyan-neon/20 text-cyan-neon text-xs font-display font-bold flex items-center gap-2 cursor-pointer transition-all"
            >
              <Tv className="w-4 h-4" />
              OPEN AUDITORIUM PROJECTOR MODE
            </button>
          </div>
        </div>

        {/* Status Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-white/10 bg-navy-900/60 backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/50 uppercase">Active Contestant</div>
            <div className="font-display font-bold text-lg text-white truncate mt-1">
              {(mode === 'team' ? team?.name : player?.name) || 'Not Connected'}
            </div>
            <div className="text-[10px] font-mono text-cyan-neon mt-0.5">
              MODE: {mode ? mode.toUpperCase() : 'NONE'}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-navy-900/60 backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/50 uppercase">Game Phase</div>
            <div className="font-display font-bold text-lg text-purple-soft mt-1 uppercase">
              {gameStatus}
            </div>
            <div className="text-[10px] font-mono text-white/40 mt-0.5">
              ROUND {currentRound} // Q{currentQuestionIndex + 1}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-navy-900/60 backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/50 uppercase">System Score</div>
            <div className="font-display font-black text-2xl text-cyan-neon mt-1">
              {score} PTS
            </div>
            <div className="text-[10px] font-mono text-emerald-400 mt-0.5">VERIFIED IN STORE</div>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-navy-900/60 backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/50 uppercase">Marshal State</div>
            <div className={`font-display font-bold text-lg mt-1 ${hostPaused ? 'text-amber-400' : 'text-emerald-400'}`}>
              {hostPaused ? 'PAUSED' : 'LIVE'}
            </div>
            <div className="text-[10px] font-mono text-white/40 mt-0.5">TIMERS RUNNING</div>
          </div>
        </div>

        {/* Control Panels: Left (Game Control) & Right (Score Control) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Flow Controls (2 Columns) */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-navy-900/70 backdrop-blur-md p-6 space-y-4">
            <h2 className="font-display font-bold text-base text-white tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-neon" />
              GAME FLOW MARSHAL ACTIONS
            </h2>

            {sharedGameState.pendingRound && (
              <div className="flex flex-col gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-sm font-bold text-amber-200">ROUND {sharedGameState.pendingRound} IS READY FOR APPROVAL</p>
                  <p className="mt-1 text-xs text-white/55">Participants remain paused until the host approves the next round.</p>
                </div>
                <button type="button" onClick={() => void handleApproveRound()} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 font-display text-xs font-black tracking-wider text-slate-950 transition hover:bg-emerald-300">
                  <BadgeCheck className="h-4 w-4" /> APPROVE ROUND {sharedGameState.pendingRound}
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Start Game */}
              <button
                type="button"
                onClick={() => void handleStartGame()}
                disabled={isStartingGame || !sharedGameState.participants?.length}
                className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-display font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className="w-5 h-5 fill-current" />
                {isStartingGame ? 'LOADING QUESTIONS…' : sharedGameState.participants?.length ? 'START GAME' : 'WAITING FOR PLAYERS'}
              </button>

              {/* Pause / Resume */}
              <button
                type="button"
                onClick={() => void handleTogglePause()}
                className={`p-3 rounded-xl border font-display font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  sharedGameState.hostPaused
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                }`}
              >
                {sharedGameState.hostPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                {sharedGameState.hostPaused ? 'RESUME GAME' : 'PAUSE GAME'}
              </button>

              {/* Next Question */}
              <button
                type="button"
                onClick={nextQuestion}
                className="p-3 rounded-xl border border-cyan-neon/30 bg-cyan-neon/10 hover:bg-cyan-neon/20 text-cyan-neon font-display font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <SkipForward className="w-5 h-5" />
                NEXT QUESTION
              </button>

              {/* Reveal Answer */}
              <button
                type="button"
                onClick={hostRevealAnswer}
                className="p-3 rounded-xl border border-purple-soft/30 bg-purple-soft/10 hover:bg-purple-soft/20 text-purple-soft font-display font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-5 h-5" />
                REVEAL ANSWER
              </button>

              {/* Skip Question */}
              <button
                type="button"
                onClick={hostSkipQuestion}
                className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-display font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <SkipForward className="w-5 h-5 text-white/50" />
                SKIP QUESTION
              </button>

              {/* Reset Question */}
              <button
                type="button"
                onClick={hostResetQuestion}
                className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-display font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-5 h-5 text-white/50" />
                RESET QUESTION
              </button>

              {/* End Round */}
              <button
                type="button"
                onClick={nextQuestion}
                className="p-3 rounded-xl border border-purple-electric/30 bg-purple-electric/10 hover:bg-purple-electric/20 text-purple-soft font-display font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <StopCircle className="w-5 h-5" />
                FORWARD ROUND
              </button>

              {/* End Game */}
              <button
                type="button"
                onClick={() => setShowConfirmModal('endGame')}
                className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-display font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <AlertTriangle className="w-5 h-5" />
                END CONTEST
              </button>
            </div>
            {questionLoadError && <p role="alert" className="text-xs text-rose-300">{questionLoadError}</p>}
          </div>

          {/* Points & Score Override (1 Column) */}
          <div className="rounded-2xl border border-white/10 bg-navy-900/70 backdrop-blur-md p-6 space-y-4">
            <h2 className="font-display font-bold text-base text-white tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-cyan-neon" />
              SCORE ARBITRATION
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-white/60 mb-1 block">Points Increment Value</label>
                <div className="flex gap-2">
                  {[5, 10, 20, 30].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPointsInput(val)}
                      className={`flex-1 py-1.5 rounded-lg font-mono text-xs border ${
                        pointsInput === val
                          ? 'border-cyan-neon bg-cyan-neon/20 text-white'
                          : 'border-white/10 text-white/60 hover:border-white/30'
                      }`}
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => hostAddPoints(pointsInput)}
                  className="py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-display font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  AWARD +{pointsInput}
                </button>

                <button
                  type="button"
                  onClick={() => hostRemovePoints(pointsInput)}
                  className="py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-display font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MinusCircle className="w-4 h-4" />
                  DEDUCT -{pointsInput}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal('resetScore')}
                className="w-full py-2.5 rounded-xl border border-rose-500/20 text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
              >
                RESET SCORE TO 0
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-neon/20 bg-navy-900/70 p-6 backdrop-blur-md">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-base font-bold tracking-wider text-white"><Users className="h-4 w-4 text-cyan-neon" /> LIVE PARTICIPANTS</h2>
              <p className="mt-1 text-xs text-white/50">Shared across every device · {sharedGameState.participants?.length || 0} registered · Round {sharedGameState.approvedRound || 1}{sharedGameState.pendingRound ? " · Round " + sharedGameState.pendingRound + " awaiting approval" : ""}</p>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-200">{sharedGameState.status || "registration"}</span>
          </div>
          {sharedGameError && <p role="alert" className="mb-3 rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{sharedGameError}</p>}
          {!sharedGameState.participants?.length ? <p className="py-7 text-center text-sm text-white/45">No participants have registered yet.</p> : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {[...sharedGameState.participants].sort((a, b) => Number(b.score) - Number(a.score)).map((item, index) => (
                <div key={item.id || index} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="min-w-0"><p className="truncate text-sm font-bold text-white">#{index + 1} {item.name}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/45">{item.mode} · {item.correctAnswers || 0} correct · {item.totalAnswered || 0} answered</p></div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-display text-sm font-black text-cyan-neon">{item.score || 0} PTS</span>
                    <button type="button" onClick={() => void deleteLeaderboardEntry(item)} aria-label={`Remove ${item.name} from the live game`} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-rose-400/25 bg-rose-400/10 text-rose-300"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Leaderboard Management */}
        <div className="rounded-2xl border border-white/10 bg-navy-900/70 p-6 backdrop-blur-md">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-base font-bold tracking-wider text-white"><Users className="h-4 w-4 text-purple-soft" /> SAVED LEADERBOARD</h2>
              <p className="mt-1 text-xs text-white/50">Remove a saved result from the public standings.</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => void refreshSavedLeaderboard()} disabled={savedLeaderboardLoading} className="min-h-10 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/70 hover:text-white disabled:opacity-50">{savedLeaderboardLoading ? 'REFRESHING…' : 'REFRESH'}</button>
              <button type="button" onClick={() => navigate('/leaderboard')} className="min-h-10 rounded-lg border border-cyan-neon/30 bg-cyan-neon/10 px-3 py-2 text-xs font-mono text-cyan-neon hover:bg-cyan-neon/15">FULL STANDINGS</button>
            </div>
          </div>
          {savedLeaderboardStatus && <p role="alert" className="mb-3 rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{savedLeaderboardStatus}</p>}
          {savedLeaderboardLoading && savedLeaderboard.length === 0 ? <p role="status" className="py-8 text-center text-sm text-white/45">Loading saved results…</p> : savedLeaderboard.length === 0 ? <p className="py-8 text-center text-sm text-white/45">No saved results to manage.</p> : (
            <div className="divide-y divide-white/5">
              {savedLeaderboard.map((item, idx) => (
                <div key={item.id || idx} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-7 shrink-0 font-mono text-sm font-bold text-white/45">#{idx + 1}</span>
                    <div className="min-w-0"><span className="block truncate font-bold text-sm text-white">{item.name}</span><span className="text-[10px] uppercase tracking-wider text-white/40">{item.mode || 'individual'}</span></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-base font-black text-cyan-neon">{item.score} PTS</span>
                    <button type="button" onClick={() => void deleteLeaderboardEntry(item)} aria-label={`Delete ${item.name}'s saved result`} title="Delete saved result" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-rose-400/25 bg-rose-400/10 text-rose-300 transition hover:bg-rose-400/20"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="max-w-md w-full rounded-2xl border border-rose-500/40 bg-navy-950 p-6 space-y-4 text-center">
              <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
              <h3 className="font-display text-xl font-bold text-white">
                CONFIRM DESTRUCTIVE ACTION
              </h3>
              <p className="text-xs text-white/70 font-mono">
                {showConfirmModal === 'endGame'
                  ? 'Are you certain you want to conclude the game session? Contestants will be transitioned to the final celebration screen.'
                  : 'Are you sure you want to reset the current score to 0 points?'}
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-xs font-mono"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (showConfirmModal === 'endGame') {
                      void handleFinishGame();
                    } else if (showConfirmModal === 'resetScore') {
                      hostResetScore();
                    }
                    setShowConfirmModal(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-display text-xs font-bold"
                >
                  PROCEED
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

