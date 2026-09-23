import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';

// ─── Animation variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 18 },
  },
};

const headingVariants = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

// ─── Mode card data ───────────────────────────────────────────────────────────
const MODES = [
  {
    key: 'individual',
    icon: '🧑‍💻',
    title: 'INDIVIDUAL MODE',
    tagline: 'Compete on your own.',
    description: 'Enter your name and college to get started.',
    borderColor: 'border-cyan-400',
    glowColor: 'shadow-cyan-500/40',
    hoverGlow: 'hover:shadow-cyan-400/70',
    btnGradient: 'from-cyan-500 to-cyan-400',
    btnHover: 'hover:from-cyan-400 hover:to-cyan-300',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
  },
  {
    key: 'team',
    icon: '👥',
    title: 'TEAM MODE',
    tagline: 'Create a team and compete together.',
    description: '2–5 members per team.',
    borderColor: 'border-purple-500',
    glowColor: 'shadow-purple-500/40',
    hoverGlow: 'hover:shadow-purple-400/70',
    btnGradient: 'from-purple-600 to-purple-500',
    btnHover: 'hover:from-purple-500 hover:to-purple-400',
    badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ModeSelection() {
  const navigate = useNavigate();
  const setMode = useGameStore((s) => s.setMode);

  const handleSelect = (modeKey) => {
    setMode(modeKey);
    navigate('/register');
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #020818 0%, #0a0f2e 60%, #0d0620 100%)' }}
    >
      {/* ── Ambient grid ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,245,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.15) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Radial glows ── */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />

      {/* ── Back button ── */}
      <motion.div
        className="absolute top-6 left-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-200 transition-colors group"
        >
          <span className="text-lg group-hover:-translate-x-1 transition-transform inline-block">←</span>
          BACK TO HOME
        </Link>
      </motion.div>

      {/* ── TECHNOVA badge ── */}
      <motion.p
        className="mb-3 text-xs tracking-[0.35em] font-bold text-cyan-400/70 uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        ⚡ TECHNOVA 2026
      </motion.p>

      {/* ── Heading ── */}
      <motion.h1
        variants={headingVariants}
        initial="hidden"
        animate="visible"
        className="mb-2 text-4xl md:text-5xl lg:text-6xl font-black text-center tracking-wider"
        style={{
          background: 'linear-gradient(90deg, #00f5ff, #9333ea)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        CHOOSE YOUR MODE
      </motion.h1>
      <motion.p
        className="mb-12 text-slate-400 text-center text-sm md:text-base"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        Select how you want to compete in today's challenge
      </motion.p>

      {/* ── Mode cards ── */}
      <motion.div
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {MODES.map((mode) => (
          <motion.div
            key={mode.key}
            variants={cardVariants}
            whileHover={{ scale: 1.03, y: -4 }}
            className={`
              relative group flex flex-col items-center text-center rounded-2xl border
              ${mode.borderColor} ${mode.glowColor} ${mode.hoverGlow}
              shadow-2xl cursor-pointer transition-shadow duration-300
              backdrop-blur-md
            `}
            style={{
              background: 'linear-gradient(145deg, rgba(2,8,24,0.85) 0%, rgba(15,20,50,0.75) 100%)',
            }}
          >
            {/* Subtle inner shimmer */}
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background:
                  mode.key === 'individual'
                    ? 'radial-gradient(ellipse at 50% 0%, rgba(0,245,255,0.08) 0%, transparent 70%)'
                    : 'radial-gradient(ellipse at 50% 0%, rgba(147,51,234,0.10) 0%, transparent 70%)',
              }}
            />

            <div className="flex flex-col items-center p-8 md:p-10 gap-4 w-full">
              {/* Icon */}
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center text-5xl shadow-lg ${mode.badgeColor}`}
              >
                {mode.icon}
              </div>

              {/* Title */}
              <h2 className="text-xl md:text-2xl font-black tracking-widest text-white mt-1">
                {mode.title}
              </h2>

              {/* Tagline */}
              <p
                className="text-base font-semibold"
                style={{ color: mode.key === 'individual' ? '#00f5ff' : '#c084fc' }}
              >
                {mode.tagline}
              </p>

              {/* Description */}
              <p className="text-slate-400 text-sm leading-relaxed">{mode.description}</p>

              {/* Divider */}
              <div
                className={`w-16 h-px my-2 ${mode.key === 'individual' ? 'bg-cyan-500/50' : 'bg-purple-500/50'}`}
              />

              {/* SELECT button */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleSelect(mode.key)}
                className={`
                  w-full py-3 rounded-xl font-black tracking-widest text-sm md:text-base
                  bg-gradient-to-r ${mode.btnGradient} ${mode.btnHover}
                  text-white shadow-lg transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${mode.key === 'individual' ? 'focus:ring-cyan-400' : 'focus:ring-purple-500'}
                  focus:ring-offset-slate-900
                `}
              >
                SELECT →
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Footer note ── */}
      <motion.p
        className="mt-10 text-xs text-slate-600 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        🏆 Compete across 3 rounds + Final Showdown &nbsp;·&nbsp; 30 questions &nbsp;·&nbsp; 20 sec each
      </motion.p>
    </div>
  );
}
