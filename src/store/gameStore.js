import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QUESTIONS, SHOWDOWN_QUESTIONS, ROUND_CONFIGS } from '../data/questions';

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const DEFAULT_LEADERBOARD = [
  { id: 'demo1', name: 'Code Warriors', score: 420, correctAnswers: 18, totalAnswered: 22, isCurrentPlayer: false },
  { id: 'demo2', name: 'Binary Beasts', score: 390, correctAnswers: 16, totalAnswered: 21, isCurrentPlayer: false },
  { id: 'demo3', name: 'Debug Squad', score: 350, correctAnswers: 15, totalAnswered: 20, isCurrentPlayer: false },
  { id: 'demo4', name: 'Syntax Titans', score: 320, correctAnswers: 14, totalAnswered: 20, isCurrentPlayer: false },
  { id: 'demo5', name: 'Algorithm Aces', score: 280, correctAnswers: 12, totalAnswered: 19, isCurrentPlayer: false },
];

const initialState = {
  // Player/Team info
  mode: null, // 'individual' | 'team'
  player: null,
  team: null,
  playerCode: null,

  // Game status
  gameStatus: 'idle', // idle | registration | ready | playing | roundTransition | showdown | finished | paused
  currentRound: 1,
  currentQuestionIndex: 0, // 0-based index within the full QUESTIONS array
  phase: 'question', // 'question' | 'reveal' | 'roundEnd'

  // Scoring
  score: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  skippedAnswers: 0,
  totalAnswered: 0,
  roundScores: { 1: 0, 2: 0, 3: 0, showdown: 0 },
  fastestAnswerTime: null,
  strongestRound: null,

  // Current question state
  selectedAnswer: null,
  isAnswerLocked: false,
  answerResult: null, // 'correct' | 'wrong' | 'timeout'
  timeUsed: 0,

  // Lifelines
  lifelines: {
    fiftyFifty: { used: false, label: '50/50', icon: '½' },
    techHint: { used: false, label: 'TECH HINT', icon: '💡' },
    extraTime: { used: false, label: '+10 SEC', icon: '⏱' },
  },
  hintsRemaining: 2,
  hintShown: false,
  hintText: null,
  eliminatedOptions: [],
  extraTimeUsed: false,
  extraTimeAmount: 0, // how much extra time to add

  // Showdown
  showdownIndex: 0,
  inShowdown: false,
  showdownComplete: false,

  // Host controls
  hostPaused: false,
  hostSkipped: false,
  hostPointsOverride: null,
  participantCount: 0,
  activeTeams: 0,

  // Leaderboard
  leaderboard: DEFAULT_LEADERBOARD,

  // Score pop animation
  scoreDelta: null,
  scorePopKey: 0,

  // Sound
  soundEnabled: false,
};

const useGameStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // ─── REGISTRATION ───────────────────────────────────────────────────
      setMode: (mode) => set({ mode }),

      registerPlayer: ({ name, college, department }) => {
        const playerCode = generateCode();
        const playerId = `player_${Date.now()}`;
        const newPlayer = { id: playerId, name, college, department };
        const entry = {
          id: playerId,
          name,
          score: 0,
          correctAnswers: 0,
          totalAnswered: 0,
          isCurrentPlayer: true,
        };
        set((s) => ({
          player: newPlayer,
          playerCode,
          gameStatus: 'ready',
          leaderboard: [entry, ...s.leaderboard.map(l => ({ ...l, isCurrentPlayer: false }))],
        }));
      },

      registerTeam: ({ teamName, captainName, members }) => {
        const teamCode = generateCode();
        const teamId = `team_${Date.now()}`;
        const newTeam = { id: teamId, name: teamName, captain: captainName, members };
        const entry = {
          id: teamId,
          name: teamName,
          score: 0,
          correctAnswers: 0,
          totalAnswered: 0,
          isCurrentPlayer: true,
        };
        set((s) => ({
          team: newTeam,
          playerCode: teamCode,
          gameStatus: 'ready',
          leaderboard: [entry, ...s.leaderboard.map(l => ({ ...l, isCurrentPlayer: false }))],
        }));
      },

      // ─── GAME FLOW ───────────────────────────────────────────────────────
      startGame: () => set({
        gameStatus: 'roundTransition',
        currentRound: 1,
        currentQuestionIndex: 0,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        skippedAnswers: 0,
        totalAnswered: 0,
        roundScores: { 1: 0, 2: 0, 3: 0, showdown: 0 },
        fastestAnswerTime: null,
        phase: 'question',
        selectedAnswer: null,
        isAnswerLocked: false,
        answerResult: null,
        lifelines: initialState.lifelines,
        hintsRemaining: 2,
        hintShown: false,
        hintText: null,
        eliminatedOptions: [],
        inShowdown: false,
        showdownComplete: false,
        showdownIndex: 0,
        scoreDelta: null,
      }),

      beginRound: () => set({ gameStatus: 'playing', phase: 'question' }),

      getCurrentQuestion: () => {
        const { inShowdown, showdownIndex, currentQuestionIndex } = get();
        if (inShowdown) return SHOWDOWN_QUESTIONS[showdownIndex] || null;
        return QUESTIONS[currentQuestionIndex] || null;
      },

      // ─── ANSWERING ───────────────────────────────────────────────────────
      selectAnswer: (answer, timeUsed) => {
        const { isAnswerLocked, inShowdown } = get();
        if (isAnswerLocked) return;

        const question = get().getCurrentQuestion();
        if (!question) return;

        const isCorrect = answer === question.correctAnswer;
        const basePoints = question.points;
        const penalty = inShowdown ? question.penalty || 10 : 0;

        let pointsDelta = 0;
        if (isCorrect) {
          pointsDelta = basePoints;
          if (get().hintShown) pointsDelta = Math.max(0, pointsDelta - 5);
        } else if (inShowdown) {
          pointsDelta = -penalty;
        }

        const fastest = get().fastestAnswerTime;
        const newFastest = fastest === null ? timeUsed : Math.min(fastest, timeUsed);

        set((s) => {
          const newScore = Math.max(0, s.score + pointsDelta);
          const newCorrect = s.correctAnswers + (isCorrect ? 1 : 0);
          const newWrong = s.wrongAnswers + (!isCorrect ? 1 : 0);
          const roundKey = s.inShowdown ? 'showdown' : s.currentRound;
          const newRoundScores = {
            ...s.roundScores,
            [roundKey]: (s.roundScores[roundKey] || 0) + (isCorrect ? pointsDelta : 0),
          };

          // Update leaderboard
          const updatedLeaderboard = s.leaderboard.map(entry => {
            if (entry.isCurrentPlayer) {
              return { ...entry, score: newScore, correctAnswers: newCorrect, totalAnswered: s.totalAnswered + 1 };
            }
            return entry;
          }).sort((a, b) => b.score - a.score);

          return {
            selectedAnswer: answer,
            isAnswerLocked: true,
            answerResult: isCorrect ? 'correct' : 'wrong',
            score: newScore,
            correctAnswers: newCorrect,
            wrongAnswers: newWrong,
            totalAnswered: s.totalAnswered + 1,
            roundScores: newRoundScores,
            scoreDelta: pointsDelta !== 0 ? (pointsDelta > 0 ? `+${pointsDelta}` : `${pointsDelta}`) : null,
            scorePopKey: s.scorePopKey + 1,
            fastestAnswerTime: isCorrect ? newFastest : fastest,
            phase: 'reveal',
            timeUsed,
            leaderboard: updatedLeaderboard,
          };
        });
      },

      timeout: () => {
        const { isAnswerLocked } = get();
        if (isAnswerLocked) return;
        set((s) => ({
          isAnswerLocked: true,
          answerResult: 'timeout',
          phase: 'reveal',
          skippedAnswers: s.skippedAnswers + 1,
          totalAnswered: s.totalAnswered + 1,
        }));
      },

      // ─── NEXT QUESTION ───────────────────────────────────────────────────
      nextQuestion: () => {
        const { currentQuestionIndex, inShowdown, showdownIndex } = get();

        if (inShowdown) {
          const nextShowdownIdx = showdownIndex + 1;
          if (nextShowdownIdx >= SHOWDOWN_QUESTIONS.length) {
            set({ showdownComplete: true, gameStatus: 'finished', phase: 'question' });
          } else {
            set({
              showdownIndex: nextShowdownIdx,
              selectedAnswer: null,
              isAnswerLocked: false,
              answerResult: null,
              hintShown: false,
              hintText: null,
              eliminatedOptions: [],
              extraTimeAmount: 0,
              phase: 'question',
            });
          }
          return;
        }

        const nextIdx = currentQuestionIndex + 1;

        // Determine if this is the end of a round
        const currentQ = QUESTIONS[currentQuestionIndex];
        const nextQ = QUESTIONS[nextIdx];

        const roundChanged = nextQ && nextQ.round !== currentQ.round;
        const allDone = nextIdx >= QUESTIONS.length;

        if (allDone) {
          // Start final showdown
          const roundScores = get().roundScores;
          const strongest = Object.entries(roundScores).reduce((a, b) => b[1] > a[1] ? b : a, ['1', 0]);
          set({
            inShowdown: true,
            showdownIndex: 0,
            gameStatus: 'playing',
            currentRound: 'showdown',
            phase: 'question',
            selectedAnswer: null,
            isAnswerLocked: false,
            answerResult: null,
            hintShown: false,
            hintText: null,
            eliminatedOptions: [],
            extraTimeAmount: 0,
            strongestRound: strongest[0],
          });
        } else if (roundChanged) {
          set({
            currentQuestionIndex: nextIdx,
            currentRound: nextQ.round,
            gameStatus: 'roundTransition',
            selectedAnswer: null,
            isAnswerLocked: false,
            answerResult: null,
            hintShown: false,
            hintText: null,
            eliminatedOptions: [],
            extraTimeAmount: 0,
            phase: 'question',
          });
        } else {
          set({
            currentQuestionIndex: nextIdx,
            selectedAnswer: null,
            isAnswerLocked: false,
            answerResult: null,
            hintShown: false,
            hintText: null,
            eliminatedOptions: [],
            extraTimeAmount: 0,
            phase: 'question',
          });
        }
      },

      // ─── LIFELINES ───────────────────────────────────────────────────────
      useFiftyFifty: () => {
        const { lifelines, isAnswerLocked } = get();
        if (lifelines.fiftyFifty.used || isAnswerLocked) return;
        const question = get().getCurrentQuestion();
        if (!question) return;

        const wrongOptions = question.options.filter(o => o !== question.correctAnswer);
        const toEliminate = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 2);
        set((s) => ({
          lifelines: { ...s.lifelines, fiftyFifty: { ...s.lifelines.fiftyFifty, used: true } },
          eliminatedOptions: toEliminate,
        }));
      },

      useTechHint: () => {
        const { lifelines, isAnswerLocked, hintsRemaining } = get();
        if (lifelines.techHint.used || isAnswerLocked || hintsRemaining <= 0) return;
        const question = get().getCurrentQuestion();
        if (!question) return;
        set((s) => ({
          lifelines: { ...s.lifelines, techHint: { ...s.lifelines.techHint, used: true } },
          hintShown: true,
          hintText: question.hint,
          hintsRemaining: Math.max(0, s.hintsRemaining - 1),
        }));
      },

      useExtraTime: () => {
        const { lifelines, isAnswerLocked } = get();
        if (lifelines.extraTime.used || isAnswerLocked) return;
        set((s) => ({
          lifelines: { ...s.lifelines, extraTime: { ...s.lifelines.extraTime, used: true } },
          extraTimeAmount: 10,
        }));
      },

      clearExtraTime: () => set({ extraTimeAmount: 0 }),

      // ─── HOST CONTROLS ───────────────────────────────────────────────────
      hostPause: () => set({ hostPaused: true }),
      hostResume: () => set({ hostPaused: false }),
      hostNextQuestion: () => { get().nextQuestion(); },
      hostSkipQuestion: () => {
        set((s) => ({
          isAnswerLocked: true,
          answerResult: 'timeout',
          phase: 'reveal',
          skippedAnswers: s.skippedAnswers + 1,
          totalAnswered: s.totalAnswered + 1,
        }));
      },
      hostRevealAnswer: () => set({ isAnswerLocked: true, phase: 'reveal' }),
      hostResetQuestion: () => set({
        selectedAnswer: null,
        isAnswerLocked: false,
        answerResult: null,
        hintShown: false,
        hintText: null,
        eliminatedOptions: [],
        extraTimeAmount: 0,
        phase: 'question',
      }),
      hostEndGame: () => set({ gameStatus: 'finished' }),
      hostAddPoints: (amount) => set((s) => {
        const newScore = Math.max(0, s.score + amount);
        const updatedLB = s.leaderboard.map(e => e.isCurrentPlayer ? { ...e, score: newScore } : e).sort((a, b) => b.score - a.score);
        return { score: newScore, leaderboard: updatedLB, scoreDelta: `+${amount}`, scorePopKey: s.scorePopKey + 1 };
      }),
      hostRemovePoints: (amount) => set((s) => {
        const newScore = Math.max(0, s.score - amount);
        const updatedLB = s.leaderboard.map(e => e.isCurrentPlayer ? { ...e, score: newScore } : e).sort((a, b) => b.score - a.score);
        return { score: newScore, leaderboard: updatedLB, scoreDelta: `-${amount}`, scorePopKey: s.scorePopKey + 1 };
      }),
      hostResetScore: () => set((s) => {
        const updatedLB = s.leaderboard.map(e => e.isCurrentPlayer ? { ...e, score: 0 } : e).sort((a, b) => b.score - a.score);
        return { score: 0, leaderboard: updatedLB };
      }),

      setParticipantCount: (count) => set({ participantCount: count }),

      // ─── SOUND ───────────────────────────────────────────────────────────
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

      // ─── RESET ───────────────────────────────────────────────────────────
      resetGame: () => set({ ...initialState, leaderboard: DEFAULT_LEADERBOARD }),

      clearScoreDelta: () => set({ scoreDelta: null }),
    }),
    {
      name: 'technova-game-state',
      partialize: (state) => ({
        mode: state.mode,
        player: state.player,
        team: state.team,
        playerCode: state.playerCode,
        gameStatus: state.gameStatus,
        currentRound: state.currentRound,
        currentQuestionIndex: state.currentQuestionIndex,
        score: state.score,
        correctAnswers: state.correctAnswers,
        wrongAnswers: state.wrongAnswers,
        skippedAnswers: state.skippedAnswers,
        totalAnswered: state.totalAnswered,
        roundScores: state.roundScores,
        fastestAnswerTime: state.fastestAnswerTime,
        strongestRound: state.strongestRound,
        lifelines: state.lifelines,
        hintsRemaining: state.hintsRemaining,
        inShowdown: state.inShowdown,
        showdownIndex: state.showdownIndex,
        showdownComplete: state.showdownComplete,
        soundEnabled: state.soundEnabled,
        leaderboard: state.leaderboard,
      }),
    }
  )
);

export default useGameStore;
