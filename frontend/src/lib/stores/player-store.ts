import { create } from "zustand"
import type { Question } from "@/lib/types"

interface PlayerState {
  sessionId: string | null
  studentSessionId: string | null
  questions: Question[]
  currentQuestionIndex: number
  answers: Record<string, unknown>
  submittedQuestions: Set<string>
  timeRemaining: number | null
  isTimerRunning: boolean

  setSession: (sessionId: string, studentSessionId: string) => void
  setQuestions: (questions: Question[]) => void
  goToQuestion: (index: number) => void
  nextQuestion: () => void
  prevQuestion: () => void
  setAnswer: (questionId: string, answer: unknown) => void
  markSubmitted: (questionId: string) => void
  setTimeRemaining: (seconds: number) => void
  startTimer: () => void
  stopTimer: () => void
  tick: () => void
  reset: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  sessionId: null,
  studentSessionId: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  submittedQuestions: new Set(),
  timeRemaining: null,
  isTimerRunning: false,

  setSession: (sessionId, studentSessionId) =>
    set({ sessionId, studentSessionId }),

  setQuestions: (questions) => set({ questions, currentQuestionIndex: 0 }),

  goToQuestion: (index) => {
    const { questions } = get()
    if (index >= 0 && index < questions.length) {
      set({ currentQuestionIndex: index })
    }
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get()
    if (currentQuestionIndex < questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 })
    }
  },

  prevQuestion: () => {
    const { currentQuestionIndex } = get()
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 })
    }
  },

  setAnswer: (questionId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    })),

  markSubmitted: (questionId) =>
    set((state) => {
      const newSet = new Set(state.submittedQuestions)
      newSet.add(questionId)
      return { submittedQuestions: newSet }
    }),

  setTimeRemaining: (seconds) => set({ timeRemaining: seconds }),

  startTimer: () => set({ isTimerRunning: true }),

  stopTimer: () => set({ isTimerRunning: false }),

  tick: () =>
    set((state) => {
      if (state.timeRemaining === null || state.timeRemaining <= 0) {
        return { isTimerRunning: false }
      }
      return { timeRemaining: state.timeRemaining - 1 }
    }),

  reset: () =>
    set({
      sessionId: null,
      studentSessionId: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      submittedQuestions: new Set(),
      timeRemaining: null,
      isTimerRunning: false,
    }),
}))
