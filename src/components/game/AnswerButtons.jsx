import React from 'react';
import { motion } from 'framer-motion';

/**
 * AnswerButtons — renders 4 option buttons for the current question.
 * Handles eliminated options (50/50), selected state, disabled state.
 */
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const OPTION_COLORS = {
  default: {
    border: 'border-white/20',
    bg: 'bg-white/5',
    label: 'bg-white/10 text-white/70',
    text: 'text-white',
    hover: 'hover:border-cyan-400/60 hover:bg-cyan-400/10 hover:shadow-[0_0_20px_rgba(0,245,255,0.2)]',
  },
  selected: {
    border: 'border-cyan-400',
    bg: 'bg-cyan-400/15',
    label: 'bg-cyan-400 text-black',
    text: 'text-cyan-300',
    hover: '',
  },
  eliminated: {
    border: 'border-white/8',
    bg: 'bg-white/2',
    label: 'bg-white/5 text-white/20',
    text: 'text-white/20 line-through',
    hover: '',
  },
  disabled: {
    border: 'border-white/15',
    bg: 'bg-white/3',
    label: 'bg-white/8 text-white/40',
    text: 'text-white/40',
    hover: '',
  },
};

function getOptionState({ option, selectedAnswer, eliminatedOptions, isAnswerLocked }) {
  if (eliminatedOptions.includes(option)) return 'eliminated';
  if (selectedAnswer === option) return 'selected';
  if (isAnswerLocked && selectedAnswer !== option) return 'disabled';
  return 'default';
}

export default function AnswerButtons({
  options = [],
  selectedAnswer,
  eliminatedOptions = [],
  isAnswerLocked,
  onSelect,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      {options.map((option, idx) => {
        const state = getOptionState({ option, selectedAnswer, eliminatedOptions, isAnswerLocked });
        const colors = OPTION_COLORS[state];
        const isClickable = state === 'default';

        return (
          <motion.button
            key={option}
            onClick={() => isClickable && onSelect(option)}
            disabled={!isClickable}
            className={[
              'relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200',
              'text-left w-full group',
              colors.border,
              colors.bg,
              isClickable ? colors.hover + ' cursor-pointer' : 'cursor-default',
              state === 'eliminated' ? 'opacity-40' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: state === 'eliminated' ? 0.4 : 1, x: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.07, ease: 'easeOut' }}
            whileHover={isClickable ? { scale: 1.015 } : {}}
            whileTap={isClickable ? { scale: 0.985 } : {}}
          >
            {/* Letter label */}
            <div
              className={[
                'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                'font-display font-black text-sm transition-all duration-200',
                colors.label,
              ].join(' ')}
            >
              {OPTION_LABELS[idx]}
            </div>

            {/* Option text */}
            <span
              className={[
                'font-body font-semibold text-base sm:text-lg leading-tight flex-1',
                'transition-all duration-200',
                colors.text,
              ].join(' ')}
            >
              {option}
            </span>

            {/* Selected indicator */}
            {state === 'selected' && (
              <motion.div
                className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                <div className="w-2 h-2 rounded-full bg-black" />
              </motion.div>
            )}

            {/* Hover shine */}
            {isClickable && (
              <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
