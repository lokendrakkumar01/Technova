import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import TechParticles from '../components/particles/TechParticles';

// ─── Floating symbol data ────────────────────────────────────────────────────
const FLOAT_SYMBOLS = [
  { label: '{ }',  top: '8%',   left: '4%',   delay: 0 },
  { label: '</>',  top: '14%',  left: '88%',  delay: 0.6 },
  { label: '01',   top: '30%',  left: '92%',  delay: 1.1 },
  { label: 'AI',   top: '62%',  left: '6%',   delay: 0.3 },
  { label: 'SQL',  top: '72%',  left: '85%',  delay: 0.9 },
  { label: 'λ',    top: '48%',  left: '2%',   delay: 1.4 },
  { label: 'π',    top: '20%',  left: '78%',  delay: 0.2 },
  { label: '⚡',   top: '80%',  left: '15%',  delay: 0.7 },
  { label: '∑',    top: '55%',  left: '95%',  delay: 1.8 },
  { label: '#{}',  top: '90%',  left: '50%',  delay: 1.2 },
];

// ─── Feature cards data ──────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '🧩',
    title: '30 PICTOGRAM PUZZLES',
    description:
      'Each round unleashes hand-crafted technical pictograms spanning algorithms, languages, frameworks, and engineering concepts. No two games are alike.',
    accent: '#00f5ff',
  },
  {
    icon: '🏆',
    title: '3 EPIC ROUNDS',
    description:
      'Progress through three escalating rounds — Warm-Up, Challenge, and the heart-pounding Final Showdown. Difficulty spikes. Stakes skyrocket.',
    accent: '#9333ea',
  },
  {
    icon: '⚡',
    title: 'FINAL SHOWDOWN',
    description:
      'The last survivors face a sudden-death lightning round. One wrong answer and you\'re out. Only the sharpest minds claim the TECHDECODE crown.',
    accent: '#f59e0b',
  },
];

// ─── Stats data ──────────────────────────────────────────────────────────────
const STATS = [
  { value: '60-100', label: 'PLAYERS' },
  { value: '3',      label: 'ROUNDS' },
  { value: '35',     label: 'QUESTIONS' },
  { value: '20 SEC', label: 'PER QUESTION' },
];

// ─── Animation variants ───────────────────────────────────────────────────────
const heroContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const statVariants = {
  hidden:  { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'backOut' } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function FloatingSymbol({ label, top, left, delay }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.span
      aria-hidden="true"
      className="absolute font-mono font-bold text-cyan-400 select-none pointer-events-none"
      style={{
        top,
        left,
        fontSize: 'clamp(0.85rem, 1.5vw, 1.25rem)',
        textShadow: '0 0 12px #00f5ff, 0 0 28px #00f5ff88',
        filter: 'drop-shadow(0 0 6px #00f5ff)',
        zIndex: 1,
      }}
      initial={{ opacity: 0 }}
      animate={reduceMotion
        ? { opacity: 0.35 }
        : {
            opacity:   [0, 0.55, 0.35, 0.65, 0.35],
            y:         [0, -18, 0, -12, 0],
            rotate:    [0, 3, -3, 2, 0],
          }
      }
      transition={{
        duration: 6,
        repeat: Infinity,
        repeatType: 'loop',
        delay,
        ease: 'easeInOut',
      }}
    >
      {label}
    </motion.span>
  );
}

function PrimaryButton({ children, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06, boxShadow: '0 0 32px #00f5ff99, 0 0 64px #00f5ff44' }}
      whileTap={{ scale: 0.97 }}
      className="relative px-8 py-4 rounded-lg font-bold tracking-widest text-sm text-[#020818] bg-cyan-400 overflow-hidden"
      style={{ fontFamily: "'Orbitron', monospace" }}
    >
      <span className="relative z-10">{children}</span>
      <motion.span
        className="absolute inset-0 bg-white/20"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
    </motion.button>
  );
}

function SecondaryButton({ children, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06, boxShadow: '0 0 24px #9333ea88' }}
      whileTap={{ scale: 0.97 }}
      className="px-8 py-4 rounded-lg font-bold tracking-widest text-sm text-purple-400 border-2 border-purple-500 bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
      style={{ fontFamily: "'Orbitron', monospace" }}
    >
      {children}
    </motion.button>
  );
}

function GhostButton({ children, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06, borderColor: '#00f5ff', color: '#00f5ff' }}
      whileTap={{ scale: 0.97 }}
      className="px-8 py-4 rounded-lg font-bold tracking-widest text-sm text-slate-400 border border-slate-600 bg-transparent hover:bg-white/5 transition-colors"
      style={{ fontFamily: "'Orbitron', monospace" }}
    >
      {children}
    </motion.button>
  );
}

function FeatureCard({ icon, title, description, accent, index }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      custom={index}
      whileHover={{ y: -8, transition: { duration: 0.25 } }}
      className="relative flex flex-col gap-4 p-7 rounded-2xl border"
      style={{
        background: 'rgba(2, 8, 24, 0.65)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderColor: `${accent}55`,
        boxShadow: `0 0 0 1px ${accent}22, 0 8px 40px ${accent}18, inset 0 1px 0 ${accent}22`,
      }}
    >
      {/* Glow corner accent */}
      <span
        className="absolute top-0 left-0 w-20 h-20 rounded-tl-2xl rounded-br-full opacity-20"
        style={{ background: `radial-gradient(circle at top left, ${accent}, transparent 70%)` }}
        aria-hidden="true"
      />

      <span className="text-4xl">{icon}</span>
      <h3
        className="text-sm font-bold tracking-widest"
        style={{ fontFamily: "'Orbitron', monospace", color: accent }}
      >
        {title}
      </h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

function StatItem({ value, label, index }) {
  return (
    <motion.div
      variants={statVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.12 }}
      className="flex flex-col items-center gap-1 px-6 py-5"
    >
      <span
        className="text-4xl md:text-5xl font-black tracking-tight"
        style={{
          fontFamily: "'Orbitron', monospace",
          color: '#00f5ff',
          textShadow: '0 0 20px #00f5ffaa, 0 0 40px #00f5ff55',
        }}
      >
        {value}
      </span>
      <span className="text-xs text-slate-500 tracking-widest font-semibold">{label}</span>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      {/* Particle background */}
      <TechParticles />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #020818 0%, #0a0520 50%, #020818 100%)' }}
      >
        {/* Radial glow behind heading */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(0,245,255,0.07) 0%, transparent 70%), ' +
              'radial-gradient(ellipse 50% 40% at 50% 60%, rgba(147,51,234,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Floating tech symbols */}
        {FLOAT_SYMBOLS.map((sym) => (
          <FloatingSymbol key={sym.label + sym.top} {...sym} />
        ))}

        {/* Hero content */}
        <motion.div
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex flex-col items-center gap-6 px-6 text-center max-w-4xl mx-auto"
        >
          {/* Pre-title badge */}
          <motion.div variants={fadeIn}>
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest border border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
              style={{ fontFamily: "'Orbitron', monospace" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              SEASON 1 • LIVE NOW
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={fadeUp}
            className="font-black tracking-tight leading-none m-0"
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 'clamp(2.4rem, 10vw, 7.5rem)',
              color: '#00f5ff',
              textShadow:
                '0 0 20px #00f5ff, 0 0 60px #00f5ffbb, 0 0 120px #00f5ff55, 0 2px 0 #00a8b5',
              letterSpacing: '-0.02em',
              wordBreak: 'break-word',
            }}
          >
            TECHDECODE
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="text-xs md:text-sm font-bold tracking-[0.3em] text-purple-400"
            style={{ fontFamily: "'Orbitron', monospace" }}
          >
            THE ULTIMATE TECHNICAL PICTOGRAM CHALLENGE
          </motion.p>

          {/* Divider */}
          <motion.div variants={fadeIn} className="flex items-center gap-3 w-full max-w-xs">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-cyan-500/50" />
            <span className="text-cyan-500/60 text-xs">◆</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-cyan-500/50" />
          </motion.div>

          {/* Tagline */}
          <motion.p
            variants={fadeUp}
            className="text-base md:text-lg font-bold tracking-[0.15em] text-slate-300"
            style={{ fontFamily: "'Orbitron', monospace" }}
          >
            DECODE.&nbsp;&nbsp;THINK.&nbsp;&nbsp;COMPETE.&nbsp;&nbsp;CONQUER.
          </motion.p>

          {/* Description */}
          <motion.p
            variants={fadeUp}
            className="text-slate-400 text-sm md:text-base leading-relaxed max-w-lg"
          >
            Decode technical clues, beat the clock, outsmart your opponents, and become the{' '}
            <span
              className="font-bold text-cyan-400"
              style={{ textShadow: '0 0 10px #00f5ff88' }}
            >
              TECHDECODE
            </span>{' '}
            champion.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-4 mt-2"
          >
            <PrimaryButton onClick={() => navigate('/mode')}>
              🚀 START GAME
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate('/how-to-play')}>
              📖 HOW TO PLAY
            </SecondaryButton>
            <GhostButton onClick={() => navigate('/leaderboard')}>
              📊 LIVE LEADERBOARD
            </GhostButton>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            variants={fadeIn}
            className="mt-8 flex flex-col items-center gap-2 text-slate-600"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-xs tracking-widest">SCROLL</span>
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="14" height="22" rx="7" stroke="#334155" strokeWidth="1.5" />
              <motion.rect
                x="6.5" y="5" width="3" height="5" rx="1.5" fill="#00f5ff"
                animate={{ y: [0, 10, 0], opacity: [1, 0.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Bottom gradient fade into features */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #020818)' }}
        />
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section
        className="relative py-24 px-6"
        style={{ background: '#020818' }}
      >
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p
            className="text-xs font-bold tracking-[0.35em] text-purple-500 mb-3"
            style={{ fontFamily: "'Orbitron', monospace" }}
          >
            WHY TECHDECODE
          </p>
          <h2
            className="text-2xl md:text-4xl font-black text-white m-0"
            style={{
              fontFamily: "'Orbitron', monospace",
              textShadow: '0 0 30px #9333ea55',
            }}
          >
            BUILT FOR CHAMPIONS
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section
        className="relative py-16 px-6 overflow-hidden"
        style={{
          background:
            'linear-gradient(90deg, rgba(0,245,255,0.04) 0%, rgba(147,51,234,0.07) 50%, rgba(0,245,255,0.04) 100%)',
          borderTop: '1px solid rgba(0,245,255,0.12)',
          borderBottom: '1px solid rgba(0,245,255,0.12)',
        }}
      >
        {/* Grid scanline overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #00f5ff 0px, #00f5ff 1px, transparent 1px, transparent 40px)',
          }}
        />

        <div className="relative max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center text-xs font-bold tracking-[0.35em] text-slate-600 mb-8"
            style={{ fontFamily: "'Orbitron', monospace" }}
          >
            BY THE NUMBERS
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-800/80">
            {STATS.map((s, i) => (
              <StatItem key={s.label} {...s} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────────────────── */}
      <section
        className="relative py-28 px-6 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #020818 0%, #0a0520 60%, #020818 100%)' }}
      >
        {/* Glowing orb */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(147,51,234,0.18) 0%, rgba(0,245,255,0.08) 40%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={heroContainerVariants}
          className="relative z-10 flex flex-col items-center gap-8 text-center max-w-2xl mx-auto"
        >
          <motion.p
            variants={fadeUp}
            className="text-xs font-bold tracking-[0.35em] text-purple-400"
            style={{ fontFamily: "'Orbitron', monospace" }}
          >
            ARE YOU READY?
          </motion.p>

          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-5xl font-black text-white leading-tight m-0"
            style={{
              fontFamily: "'Orbitron', monospace",
              textShadow: '0 0 40px #9333eaaa, 0 0 80px #9333ea44',
            }}
          >
            CLAIM YOUR{' '}
            <span
              style={{
                color: '#00f5ff',
                textShadow: '0 0 20px #00f5ff, 0 0 50px #00f5ffaa',
              }}
            >
              THRONE
            </span>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="text-slate-400 text-sm md:text-base leading-relaxed"
          >
            The arena is set. The puzzles are loaded. 100 players will enter — only one will leave
            as the TECHDECODE champion. Do you have what it takes?
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
            <PrimaryButton onClick={() => navigate('/mode')}>
              ⚡ START GAME NOW
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate('/how-to-play')}>
              📖 LEARN THE RULES
            </SecondaryButton>
          </motion.div>

          <motion.p
            variants={fadeIn}
            className="text-xs text-slate-600 tracking-widest"
          >
            NO REGISTRATION REQUIRED &nbsp;•&nbsp; FREE TO PLAY &nbsp;•&nbsp; INSTANT START
          </motion.p>
        </motion.div>
      </section>
    </Layout>
  );
}
