import React, { useState } from 'react';
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
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import useGameStore from '../store/gameStore';

export default function HostDashboard() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Score adjust state
  const [pointsInput, setPointsInput] = useState(10);
  const [showConfirmModal, setShowConfirmModal] = useState(null);

  const {
    gameStatus,
    currentRound,
    currentQuestionIndex,
    score,
    player,
    team,
    mode,
    hostPaused,
    leaderboard,
    startGame,
    hostPause,
    hostResume,
    nextQuestion,
    hostSkipQuestion,
    hostRevealAnswer,
    hostResetQuestion,
    hostEndGame,
    hostAddPoints,
    hostRemovePoints,
    hostResetScore,
  } = useGameStore();

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
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
              ENTER EVENT DIRECTOR PASSCODE
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="Passcode (Default: 1234)"
                  className="w-full px-4 py-3 text-center tracking-[0.5em] font-mono text-lg rounded-xl bg-navy-950/80 border border-white/15 text-white placeholder-white/20 focus:outline-none focus:border-cyan-neon"
                />
                {pinError && (
                  <p className="text-xs text-rose-400 mt-2 font-mono">
                    INVALID CREDENTIALS // ACCESS DENIED
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
              TECHNOVA MARSHAL CONSOLE
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Start Game */}
              <button
                type="button"
                onClick={() => {
                  startGame();
                  navigate('/game');
                }}
                className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-display font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                START GAME
              </button>

              {/* Pause / Resume */}
              <button
                type="button"
                onClick={hostPaused ? hostResume : hostPause}
                className={`p-3 rounded-xl border font-display font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  hostPaused
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                }`}
              >
                {hostPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                {hostPaused ? 'RESUME GAME' : 'PAUSE GAME'}
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

        {/* Live Leaderboard Matrix */}
        <div className="rounded-2xl border border-white/10 bg-navy-900/70 backdrop-blur-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-base text-white tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-soft" />
              LIVE LEADERBOARD OVERVIEW
            </h2>
            <button
              type="button"
              onClick={() => navigate('/leaderboard')}
              className="text-xs font-mono text-cyan-neon hover:underline"
            >
              FULL SCREEN LEADERBOARD →
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {leaderboard.map((item, idx) => (
              <div
                key={item.id || idx}
                className={`py-3 flex items-center justify-between ${
                  item.isCurrentPlayer ? 'bg-cyan-neon/5 px-3 rounded-lg border border-cyan-neon/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-white/50 w-6">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-white text-sm">{item.name}</span>
                    {item.isCurrentPlayer && (
                      <span className="ml-2 text-[10px] font-mono text-cyan-neon bg-cyan-neon/10 px-1.5 py-0.5 rounded">
                        ACTIVE CONTESTANT
                      </span>
                    )}
                  </div>
                </div>

                <div className="font-display font-black text-cyan-neon text-base">
                  {item.score} PTS
                </div>
              </div>
            ))}
          </div>
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
                      hostEndGame();
                      navigate('/results');
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
