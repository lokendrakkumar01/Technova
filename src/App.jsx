import React, { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { motion } from 'framer-motion'

// Page imports
const LandingPage = lazy(() => import('./pages/LandingPage'))
const HowToPlay = lazy(() => import('./pages/HowToPlay'))
const ModeSelection = lazy(() => import('./pages/ModeSelection'))
const Registration = lazy(() => import('./pages/Registration'))
const ReadyScreen = lazy(() => import('./pages/ReadyScreen'))
const GameScreen = lazy(() => import('./pages/GameScreen'))
const HostDashboard = lazy(() => import('./pages/HostDashboard'))
const ProjectorMode = lazy(() => import('./pages/ProjectorMode'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Results = lazy(() => import('./pages/Results'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const Memories = lazy(() => import('./pages/Memories'))
import useGameStore from './store/gameStore'

// ─── Inline 404 Component ─────────────────────────────────────────────────────
function NotFound() {
  return (
    <div className="min-h-screen bg-[#020818] flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-neon/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-electric/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        className="relative z-10 text-center px-6 max-w-lg mx-auto"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Glitchy 404 */}
        <motion.div
          className="font-display font-black text-[8rem] leading-none select-none"
          style={{
            color: 'transparent',
            WebkitTextStroke: '2px #00f5ff',
            textShadow: '0 0 30px rgba(0,245,255,0.4), 0 0 60px rgba(0,245,255,0.15)',
          }}
          animate={{
            textShadow: [
              '0 0 30px rgba(0,245,255,0.4), 0 0 60px rgba(0,245,255,0.15)',
              '0 0 40px rgba(147,51,234,0.5), 0 0 70px rgba(147,51,234,0.2)',
              '0 0 30px rgba(0,245,255,0.4), 0 0 60px rgba(0,245,255,0.15)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          404
        </motion.div>

        <p className="font-display text-cyan-neon text-xl font-bold tracking-widest uppercase mt-2 mb-4">
          ⚡ Signal Lost
        </p>
        <p className="font-body text-white/60 text-base mb-10 leading-relaxed">
          The page you're looking for doesn't exist in this dimension.
          <br />
          The grid has no record of this route.
        </p>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Link
            to="/"
            className="btn-primary inline-flex items-center gap-2"
          >
            🏠 Return to Base
          </Link>
        </motion.div>

        {/* Decorative corners */}
        <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-neon/50" />
        <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-neon/50" />
        <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-neon/50" />
        <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-neon/50" />
      </motion.div>
    </div>
  )
}

class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('The requested page could not be rendered.', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-[#020818] text-white flex items-center justify-center p-6">
          <section className="max-w-md text-center">
            <h1 className="font-display text-xl font-bold text-cyan-neon">PAGE FAILED TO LOAD</h1>
            <p className="mt-3 text-white/70">The page could not be started. Reload to try again.</p>
            <button type="button" className="btn-primary mt-6" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

// ─── App Router ───────────────────────────────────────────────────────────────
export default function App() {
  const loadQuestionBank = useGameStore((state) => state.loadQuestionBank);
  useEffect(() => { void loadQuestionBank(); }, [loadQuestionBank]);

  return (
    <BrowserRouter>
      <AppErrorBoundary>
      <Suspense fallback={<div role="status" aria-live="polite" className="min-h-screen bg-[#020818] text-cyan-neon flex items-center justify-center font-mono">LOADING TECHDECODE...</div>}>
      <Routes>
        <Route path="/"               element={<LandingPage />} />
        <Route path="/how-to-play"    element={<HowToPlay />} />
        <Route path="/mode"           element={<ModeSelection />} />
        <Route path="/register"       element={<Registration />} />
        <Route path="/ready"          element={<ReadyScreen />} />
        <Route path="/game"           element={<GameScreen />} />
        <Route path="/host"           element={<HostDashboard />} />
        <Route path="/host/display"   element={<ProjectorMode />} />
        <Route path="/leaderboard"    element={<Leaderboard />} />
        <Route path="/results"        element={<Results />} />
        <Route path="/admin"          element={<AdminPanel />} />
        <Route path="/admin-login"    element={<AdminPanel />} />
        <Route path="/admin%20login" element={<AdminPanel />} />
        <Route path="/Admin login"   element={<AdminPanel />} />
        <Route path="/memories"       element={<Memories />} />
        <Route path="*"               element={<NotFound />} />
      </Routes>
      </Suspense>
      </AppErrorBoundary>
    </BrowserRouter>
  )
}
