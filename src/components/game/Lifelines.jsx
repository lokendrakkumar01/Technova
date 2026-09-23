import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, HelpCircle, Clock, Check } from 'lucide-react';

export default function Lifelines({
  lifelines = {},
  hintsRemaining = 2,
  onFiftyFifty,
  onTechHint,
  onExtraTime,
  disabled = false,
}) {
  const { fiftyFifty, techHint, extraTime } = lifelines;

  const items = [
    {
      id: 'fiftyFifty',
      name: '50 / 50',
      desc: 'Eliminates 2 wrong choices',
      icon: <span className="font-display font-black text-sm">½</span>,
      used: fiftyFifty?.used,
      action: onFiftyFifty,
      accent: 'border-cyan-neon/30 text-cyan-neon hover:border-cyan-neon',
    },
    {
      id: 'techHint',
      name: `TECH HINT (${hintsRemaining})`,
      desc: '-5 pts clue penalty',
      icon: <Sparkles className="w-4 h-4 text-purple-soft" />,
      used: techHint?.used || hintsRemaining <= 0,
      action: onTechHint,
      accent: 'border-purple-soft/30 text-purple-soft hover:border-purple-soft',
    },
    {
      id: 'extraTime',
      name: '+10 SECONDS',
      desc: 'Adds 10s to countdown',
      icon: <Clock className="w-4 h-4 text-blue-bright" />,
      used: extraTime?.used,
      action: onExtraTime,
      accent: 'border-blue-bright/30 text-blue-bright hover:border-blue-bright',
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-display tracking-widest text-white/50 uppercase">
          Tactical Lifelines
        </span>
        <span className="text-xs font-mono text-cyan-neon/70">
          1 use each per session
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {items.map((item) => {
          const isButtonDisabled = disabled || item.used;

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={item.action}
              disabled={isButtonDisabled}
              whileHover={!isButtonDisabled ? { scale: 1.02, y: -2 } : {}}
              whileTap={!isButtonDisabled ? { scale: 0.98 } : {}}
              className={`relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border backdrop-blur-md transition-all text-center select-none ${
                item.used
                  ? 'bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed text-white/30'
                  : disabled
                  ? 'bg-white/[0.03] border-white/10 opacity-60 cursor-not-allowed'
                  : `bg-navy-900/80 ${item.accent} shadow-lg shadow-black/40 cursor-pointer`
              }`}
            >
              {item.used && (
                <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[9px] font-mono uppercase tracking-wider text-white/40 bg-white/10 px-1 rounded">
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                  Used
                </div>
              )}

              <div className="mb-1 flex items-center justify-center w-7 h-7 rounded-lg bg-white/5">
                {item.icon}
              </div>

              <div className="font-display font-bold text-xs sm:text-sm tracking-wide">
                {item.name}
              </div>
              <div className="text-[10px] font-mono text-white/50 hidden sm:block mt-0.5">
                {item.desc}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
