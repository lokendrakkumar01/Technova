import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_QUESTION_BANK, SHOWDOWN_QUESTIONS, normalizeQuestionBank } from '../data/questions';

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const initialState = {
  // Player/Team info
  mode: null, // 'individual' | 'team'
  player: null,
  team: null,
  playerCode: null,

  // Game status
  gameStatus: 'idle', // idle | registration | ready | playing | roundApproval | roundTransition | showdown | finished | paused
  currentRound: 1,
  pendingRound: null,
  currentQuestionIndex: 0, // 0-based index within the full QUESTIONS array
  phase: 'question', // 'question' | 'reveal' | 'roundEnd'

  // Scoring
  score: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  skippedAnswers: 0,
  totalAnswered: 0,
  roundScores: { 1: 0, 2: 0, 3: 0, 4: 0 },
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
  hintsRemaining: 1,
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
  lastHostActionId: 0,
  hostSkipped: false,
  hostPointsOverride: null,
  participantCount: 0,
  activeTeams: 0,

  // Leaderboard
  leaderboard: [],
  questionBank: normalizeQuestionBank(DEFAULT_QUESTION_BANK),

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
      loadQuestionBank: async () => {
        try {
          const response = await fetch('/api/questions');
          if (!response.ok) return false;
          const questions = await response.json();
          if (!Array.isArray(questions)) return false;
          set({ questionBank: normalizeQuestionBank(questions) });
          return true;
        } catch { return false; /* The bundled question bank remains available when offline. */ }
      },
      saveQuestionBank: async (questionBank, token) => {
        const normalizedBank = normalizeQuestionBank(questionBank);
        const response = await fetch('/api/questions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
          body: JSON.stringify({ questions: normalizedBank }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Could not save the question bank.');
        set({ questionBank: normalizedBank });
      },

      registerPlayer: ({ name, college, department, id }) => {
        const playerCode = generateCode();
        const playerId = id ? String(id) : `player_${Date.now()}`;
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
          leaderboard: [entry, ...s.leaderboard.filter(l => l.id !== playerId).map(l => ({ ...l, isCurrentPlayer: false }))],
          team: null,
          mode: 'individual',
          lastHostActionId: 0,
        }));
      },

      registerTeam: ({ teamName, captainName, members, id }) => {
        const teamCode = generateCode();
        const teamId = id ? String(id) : `team_${Date.now()}`;
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
          leaderboard: [entry, ...s.leaderboard.filter(l => l.id !== teamId).map(l => ({ ...l, isCurrentPlayer: false }))],
          player: null,
          mode: 'team',
          lastHostActionId: 0,
        }));
      },

      // ─── GAME FLOW ───────────────────────────────────────────────────────
      startGame: () => set({
        gameStatus: 'roundTransition',
        currentRound: 1,
        pendingRound: null,
        currentQuestionIndex: 0,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        skippedAnswers: 0,
        totalAnswered: 0,
        roundScores: { 1: 0, 2: 0, 3: 0, 4: 0 },
        fastestAnswerTime: null,
        phase: 'question',
        selectedAnswer: null,
        isAnswerLocked: false,
        answerResult: null,
        lifelines: initialState.lifelines,
        hintsRemaining: 1,
        hintShown: false,
        hintText: null,
        eliminatedOptions: [],
        inShowdown: false,
        showdownComplete: false,
        showdownIndex: 0,
        scoreDelta: null,
        hostPaused: false,
        lastHostActionId: 0,
        hostSkipped: false,
        hostPointsOverride: null,
        timeUsed: 0,
      }),

      beginRound: () => set({ gameStatus: 'playing', phase: 'question' }),

      getCurrentQuestion: () => {
        const { inShowdown, showdownIndex, currentQuestionIndex, questionBank } = get();
        if (inShowdown) return SHOWDOWN_QUESTIONS[showdownIndex] || null;
        return questionBank[currentQuestionIndex] || null;
      },

      // ─── ANSWERING ───────────────────────────────────────────────────────
      selectAnswer: (answer, timeUsed) => {
        const { isAnswerLocked, inShowdown } = get();
        if (isAnswerLocked) return;

        const question = get().getCurrentQuestion();
        if (!question) return;

        const normalize = (value) => String(value ?? '').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
        const acceptedAnswers = [question.correctAnswer, ...(Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [])].map(normalize);
        const isCorrect = acceptedAnswers.includes(normalize(answer));
        const basePoints = question.points;
        const penalty = inShowdown ? question.penalty || 10 : 0;

        let pointsDelta = 0;
        if (isCorrect) {
          pointsDelta = basePoints;
          // Correct answers keep their configured round value.
        } else if (inShowdown) {
          pointsDelta = -penalty;
        }

        const fastest = get().fastestAnswerTime;
        const newFastest = fastest === null ? timeUsed : Math.min(fastest, timeUsed);

        set((s) => {
          const newScore = Math.max(0, s.score + pointsDelta);
          const newCorrect = s.correctAnswers + (isCorrect ? 1 : 0);
          const newWrong = s.wrongAnswers + (!isCorrect ? 1 : 0);
          const roundKey = s.currentRound;
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
        const { currentQuestionIndex, inShowdown, showdownIndex, questionBank } = get();

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
        const currentQ = questionBank[currentQuestionIndex];
        const nextQ = questionBank[nextIdx];

        const roundChanged = nextQ && nextQ.round !== currentQ.round;
        const allDone = nextIdx >= questionBank.length;

        if (allDone) {
          const roundScores = get().roundScores;
          const strongest = Object.entries(roundScores).reduce((a, b) => b[1] > a[1] ? b : a, ['1', 0]);
          set({ gameStatus: 'finished', strongestRound: strongest[0] });        } else if (roundChanged) {
          set({
            pendingRound: Number(nextQ.round),
            gameStatus: 'roundApproval',
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
      activateFiftyFifty: () => {
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

      activateTechHint: () => {
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

      activateExtraTime: () => {
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
      applyHostActions: (actions) => {
        for (const action of [...(Array.isArray(actions) ? actions : [])].sort((a, b) => Number(a.id) - Number(b.id))) {
          const actionId = Number(action.id);
          if (!Number.isInteger(actionId) || actionId <= (Number(get().lastHostActionId) || 0)) continue;
          if (action.action === 'next-question') get().nextQuestion();
          else if (action.action === 'forward-round') get().hostForwardRound();
          else if (action.action === 'reveal-answer') get().hostRevealAnswer();
          else if (action.action === 'skip-question') get().hostSkipQuestion();
          else if (action.action === 'reset-question') get().hostResetQuestion();
          set({ lastHostActionId: actionId });
        }
      },
      hostNextQuestion: () => { get().nextQuestion(); },
      hostApproveRound: () => {
        const { gameStatus, pendingRound, currentQuestionIndex, questionBank } = get();
        if (gameStatus !== 'roundApproval' || !pendingRound) return;
        const nextQuestionIndex = questionBank.findIndex((question, index) => index > currentQuestionIndex && Number(question.round) === Number(pendingRound));
        if (nextQuestionIndex < 0) return;
        set({
          currentQuestionIndex: nextQuestionIndex,
          currentRound: Number(pendingRound),
          pendingRound: null,
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
      },
      hostForwardRound: () => {
        const { gameStatus, currentQuestionIndex, questionBank } = get();
        if (gameStatus !== 'playing') return;
        const currentRound = Number(questionBank[currentQuestionIndex]?.round) || 1;
        const nextQuestion = questionBank.find((question, index) => index > currentQuestionIndex && Number(question.round) > currentRound);
        if (!nextQuestion) return;
        set({ pendingRound: Number(nextQuestion.round), gameStatus: 'roundApproval' });
      },
      hostSkipQuestion: () => {
        if (get().isAnswerLocked) return;
        set((s) => ({
          isAnswerLocked: true,
          answerResult: 'timeout',
          phase: 'reveal',
          skippedAnswers: s.skippedAnswers + 1,
          totalAnswered: s.totalAnswered + 1,
        }));
      },
      hostRevealAnswer: () => {
        if (get().isAnswerLocked) return;
        set({ isAnswerLocked: true, phase: 'reveal' });
      },
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
      resetGame: () => set({ ...initialState, questionBank: get().questionBank }),

      clearScoreDelta: () => set({ scoreDelta: null }),
    }),
    {
      name: 'techdecode-game-state',
      partialize: (state) => ({
        mode: state.mode,
        player: state.player,
        team: state.team,
        playerCode: state.playerCode,
        gameStatus: state.gameStatus,
        lastHostActionId: state.lastHostActionId,
        currentRound: state.currentRound,
        pendingRound: state.pendingRound,
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
        questionBank: state.questionBank,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        leaderboard: (persistedState?.leaderboard || []).filter((entry) => !String(entry.id || '').startsWith('demo')),
      }),
    }
  )
);

export default useGameStore;

