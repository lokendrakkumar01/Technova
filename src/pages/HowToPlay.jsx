import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// ─── Animation helpers ────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, delay, ease: 'easeOut' },
});

// ─── Data ─────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    n: '01',
    icon: '🎮',
    title: 'Register & Get Your Code',
    desc: 'Choose Individual or Team mode. Fill in your details and receive a unique participant code — keep it handy!',
  },
  {
    n: '02',
    icon: '🔔',
    title: 'Wait for the Host',
    desc: 'Once registered, standby on the Ready Screen. The host kicks off each round — no action needed until they start.',
  },
  {
    n: '03',
    icon: '⏱️',
    title: 'Answer Fast, Score Big',
    desc: 'Choose an option in Round 1, type answers in Round 2, decode emoji clues in Round 3, and type quickly in Round 4.',
  },
  {
    n: '04',
    icon: '💡',
    title: 'Use Your Lifelines Wisely',
    desc: 'Use the 50/50 option in Round 1 or ask for a tech hint. Hints do not change the round\'s fixed points.',
  },
  {
    n: '05',
    icon: '🏆',
    title: 'Finish the Rapid Fire Round',
    desc: 'Round 4 gives you 45 seconds per question. Each correct answer is worth 30 points.',
  },
  {
    n: '06',
    icon: '📊',
    title: 'Check the Leaderboard',
    desc: 'Live leaderboard updates after every question. Stay in the top 5 to win prizes!',
  },
];

const SCORING = [
  { difficulty: 'Choose an answer', emoji: '🟦', points: '10–30', time: '20 sec', rounds: '1' },
  { difficulty: 'Type an answer', emoji: '⌨️', points: 15, time: '30 sec', rounds: '2' },
  { difficulty: 'Decode emojis', emoji: '🧩', points: 20, time: '30 sec', rounds: '3' },
  { difficulty: 'Rapid fire', emoji: '⚡', points: 30, time: '45 sec', rounds: '4' },
];

const LIFELINES = [
  {
    icon: '½',
    name: '50 / 50',
    color: 'text-cyan-300',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/10',
    desc: 'Removes 2 incorrect answers at random, leaving you with the correct option and one decoy. Applies once per game.',
  },
  {
    icon: '💡',
    name: 'TECH HINT',
    color: 'text-yellow-300',
    border: 'border-yellow-500/40',
    bg: 'bg-yellow-500/10',
    desc: 'Reveals a contextual clue for the current question. Round points stay fixed.',
  },
];

const TIMER_RULES = [
  { rule: 'Round 1 · Choose', value: '20 seconds · 10–30 points' },
  { rule: 'Round 2 · Type', value: '30 seconds · 15 points' },
  { rule: 'Round 3 · Emoji decode', value: '30 seconds · 20 points' },
  { rule: 'Round 4 · Rapid fire', value: '45 seconds · 30 points' },
  { rule: 'Timer auto-submits on expiry', value: 'Timeout = 0 pts' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 backdrop-blur-md shadow-xl ${className}`}
      style={{ background: 'linear-gradient(145deg, rgba(2,8,24,0.82) 0%, rgba(15,20,50,0.72) 100%)' }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }) {
  return (
    <h2 className="flex items-center gap-3 text-xl md:text-2xl font-black tracking-wider text-white mb-6">
      <span className="text-2xl">{icon}</span>
      {children}
    </h2>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HowToPlay() {
  const navigate = useNavigate();

  return (
    <div
      className="relative min-h-screen flex flex-col items-center px-4 py-12 overflow-x-hidden"
      style={{ background: 'linear-gradient(135deg, #020818 0%, #0a0f2e 60%, #0d0620 100%)' }}
    >
      {/* ── Ambient grid ── */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,245,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.2) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Radial glows ── */}
      <div className="pointer-events-none fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/8 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-3xl" />

      <div className="relative z-10 w-full max-w-4xl">
        {/* ── Back button ── */}
        <motion.div {...fadeUp(0)} className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-200 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
            BACK TO HOME
          </Link>
        </motion.div>

        {/* ── Hero heading ── */}
        <motion.div {...fadeUp(0.05)} className="text-center mb-14">
          <p className="text-xs tracking-[0.35em] font-bold text-cyan-400/70 uppercase mb-3">
            ⚡ TECHDECODE 2026
          </p>
          <h1
            className="text-4xl md:text-6xl font-black tracking-wider mb-3"
            style={{
              background: 'linear-gradient(90deg, #00f5ff, #9333ea)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            HOW TO PLAY
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            Everything you need to know before diving into the TECHDECODE challenge
          </p>
        </motion.div>

        {/* ════════════════════════════════════════════
            SECTION 1 — Steps
        ════════════════════════════════════════════ */}
        <motion.div {...fadeUp(0.1)} className="mb-10">
          <GlassCard className="p-6 md:p-8">
            <SectionTitle icon="🗺️">HOW THE GAME WORKS</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.n}
                  {...fadeUp(0.05 * i)}
                  className="flex gap-4 p-4 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors"
                  style={{ background: 'rgba(0,245,255,0.03)' }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-xl">
                    {step.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black tracking-widest text-cyan-400/60">{step.n}</span>
                      <span className="text-sm font-bold text-white">{step.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* ════════════════════════════════════════════
            SECTION 2 — Scoring Table
        ════════════════════════════════════════════ */}
        <motion.div {...fadeUp(0.15)} className="mb-10">
          <GlassCard className="p-6 md:p-8">
            <SectionTitle icon="💰">SCORING SYSTEM</SectionTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 pr-4 text-xs font-black tracking-widest text-slate-400 uppercase">Difficulty</th>
                    <th className="text-center py-3 px-4 text-xs font-black tracking-widest text-slate-400 uppercase">Points</th>
                    <th className="text-center py-3 px-4 text-xs font-black tracking-widest text-slate-400 uppercase">Round</th>
                    <th className="text-center py-3 pl-4 text-xs font-black tracking-widest text-slate-400 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {SCORING.map((row) => (
                    <tr
                      key={row.difficulty}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-2 font-semibold text-white">
                          <span>{row.emoji}</span> {row.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="font-black text-lg"
                          style={{ color: '#00f5ff' }}
                        >
                          +{row.points}
                        </span>
                        <span className="text-slate-500 text-xs"> pts</span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">{row.rounds}</td>
                      <td className="py-3 pl-4 text-center text-slate-300">{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Penalty notes */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-red-500/30 bg-red-500/8">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-xs font-black text-red-400 tracking-wider">FIXED ROUND POINTS</p>
                  <p className="text-xs text-slate-400">Tech hints reveal a clue and do not change points earned for a correct answer.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-orange-500/30 bg-orange-500/8">
                <span className="text-xl">⚡</span>
                <div>
                  <p className="text-xs font-black text-orange-400 tracking-wider">FOUR ROUND FORMATS</p>
                  <p className="text-xs text-slate-400">Choose, type, decode emoji clues, then finish with Rapid Fire.</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ════════════════════════════════════════════
            SECTION 3 — Lifelines
        ════════════════════════════════════════════ */}
        <motion.div {...fadeUp(0.2)} className="mb-10">
          <GlassCard className="p-6 md:p-8">
            <SectionTitle icon="🛡️">LIFELINES</SectionTitle>
            <p className="text-slate-400 text-sm mb-6">
              You have <span className="text-white font-bold">two lifelines</span>. Each is available once during a game.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LIFELINES.map((ll) => (
                <div
                  key={ll.name}
                  className={`flex flex-col items-center text-center p-5 rounded-2xl border ${ll.border} ${ll.bg}`}
                >
                  <div className="w-14 h-14 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center text-2xl font-black mb-3"
                    style={{ color: ll.color.replace('text-', '') === ll.color ? 'inherit' : undefined }}
                  >
                    <span className={ll.color}>{ll.icon}</span>
                  </div>
                  <h3 className={`font-black tracking-widest text-sm mb-2 ${ll.color}`}>{ll.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{ll.desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* ════════════════════════════════════════════
            SECTION 4 — Timer Rules
        ════════════════════════════════════════════ */}
        <motion.div {...fadeUp(0.25)} className="mb-10">
          <GlassCard className="p-6 md:p-8">
            <SectionTitle icon="⏱️">TIMER RULES</SectionTitle>
            <div className="space-y-3">
              {TIMER_RULES.map((item) => (
                <div
                  key={item.rule}
                  className="flex items-center justify-between py-3 px-4 rounded-xl border border-white/5 bg-white/3"
                >
                  <span className="text-sm text-slate-300">{item.rule}</span>
                  <span className="text-sm font-bold text-cyan-300">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 p-4 rounded-xl border border-purple-500/30 bg-purple-500/8">
              <p className="text-xs text-purple-300 leading-relaxed">
                🔔 <span className="font-bold">Important:</span> The timer begins immediately when the question is displayed. 
                The host controls question flow — answers are locked once the host reveals the answer or the timer expires.
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* ════════════════════════════════════════════
            SECTION 5 — Quick Tips
        ════════════════════════════════════════════ */}
        <motion.div {...fadeUp(0.3)} className="mb-12">
          <GlassCard className="p-6 md:p-8">
            <SectionTitle icon="🎯">PRO TIPS</SectionTitle>
            <ul className="space-y-3">
              {[
                { tip: 'Save your 50/50 lifeline for Hard questions in Round 3 — maximum value.', icon: '🧠' },
                { tip: 'Negative marking applies ONLY in the Final Showdown. Don\'t guess randomly there.', icon: '⚠️' },
                { tip: 'You can only answer once per question — choose carefully before tapping!', icon: '☝️' },
                { tip: 'Your unique code identifies you on the leaderboard. Note it down at registration.', icon: '🔑' },
                { tip: 'Team mode: discuss quickly — only one answer can be submitted per question.', icon: '🤝' },
              ].map(({ tip, icon }) => (
                <li key={tip} className="flex gap-3 text-sm text-slate-300">
                  <span className="text-base flex-shrink-0">{icon}</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </motion.div>

        {/* ── CTA Buttons ── */}
        <motion.div {...fadeUp(0.35)} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-8 py-3 rounded-xl border border-white/20 text-slate-300 font-bold text-sm tracking-widest text-center hover:border-cyan-500/50 hover:text-white transition-all"
          >
            ← BACK TO HOME
          </Link>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/mode')}
            className="px-10 py-3 rounded-xl font-black text-sm tracking-widest text-white shadow-lg shadow-cyan-500/30 transition-all hover:shadow-cyan-400/50"
            style={{ background: 'linear-gradient(90deg, #00f5ff, #9333ea)' }}
          >
            🚀 START GAME
          </motion.button>
        </motion.div>

        <p className="text-center text-xs text-slate-700 mt-8 mb-4">
          TECHDECODE 2026 &nbsp;·&nbsp; College Tech Fest &nbsp;·&nbsp; All rights reserved
        </p>
      </div>
    </div>
  );
}

