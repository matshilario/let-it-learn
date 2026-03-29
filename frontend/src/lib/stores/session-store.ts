import { create } from "zustand"
import type { Question } from "@/lib/types"

export interface Participant {
  id: string
  nickname: string
  score: number
  questions_answered: number
}

interface SessionState {
  sessionId: string | null
  status: string
  currentQuestionIndex: number
  totalQuestions: number
  currentQuestion: Question | null
  participants: Participant[]
  isLocked: boolean
  responseStats: { total: number; answered: number }

  setSessionId: (id: string | null) => void
  setStatus: (status: string) => void
  setCurrentQuestionIndex: (index: number) => void
  setTotalQuestions: (count: number) => void
  setCurrentQuestion: (question: Question | null) => void
  setParticipants: (participants: Participant[]) => void
  updateParticipant: (id: string, data: Partial<Participant>) => void
  addParticipant: (participant: Participant) => void
  removeParticipant: (id: string) => void
  setIsLocked: (locked: boolean) => void
  setResponseStats: (stats: { total: number; answered: number }) => void
  reset: () => void
}

const initialState = {
  sessionId: null,
  status: "waiting",
  currentQuestionIndex: -1,
  totalQuestions: 0,
  currentQuestion: null,
  participants: [],
  isLocked: false,
  responseStats: { total: 0, answered: 0 },
}

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  setSessionId: (id) => set({ sessionId: id }),
  setStatus: (status) => set({ status }),
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  setTotalQuestions: (count) => set({ totalQuestions: count }),
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  setParticipants: (participants) => set({ participants }),
  updateParticipant: (id, data) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    })),
  addParticipant: (participant) =>
    set((state) => {
      if (state.participants.find((p) => p.id === participant.id)) {
        return state
      }
      return { participants: [...state.participants, participant] }
    }),
  removeParticipant: (id) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.id !== id),
    })),
  setIsLocked: (locked) => set({ isLocked: locked }),
  setResponseStats: (stats) => set({ responseStats: stats }),
  reset: () => set(initialState),
}))
