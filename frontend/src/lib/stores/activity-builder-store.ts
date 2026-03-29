import { create } from "zustand"
import type { Question } from "@/lib/types"

interface ActivityBuilderState {
  selectedQuestionId: string | null
  questions: Question[]
  setSelectedQuestion: (id: string | null) => void
  setQuestions: (questions: Question[]) => void
  addQuestion: (question: Question) => void
  updateQuestion: (id: string, updates: Partial<Question>) => void
  deleteQuestion: (id: string) => void
  reorderQuestions: (fromIndex: number, toIndex: number) => void
}

export const useActivityBuilderStore = create<ActivityBuilderState>(
  (set) => ({
    selectedQuestionId: null,
    questions: [],
    setSelectedQuestion: (id) => set({ selectedQuestionId: id }),
    setQuestions: (questions) => set({ questions }),
    addQuestion: (question) =>
      set((state) => ({
        questions: [...state.questions, question],
        selectedQuestionId: question.id,
      })),
    updateQuestion: (id, updates) =>
      set((state) => ({
        questions: state.questions.map((q) =>
          q.id === id ? { ...q, ...updates } : q
        ),
      })),
    deleteQuestion: (id) =>
      set((state) => {
        const filtered = state.questions.filter((q) => q.id !== id)
        return {
          questions: filtered,
          selectedQuestionId:
            state.selectedQuestionId === id
              ? filtered.length > 0
                ? filtered[0].id
                : null
              : state.selectedQuestionId,
        }
      }),
    reorderQuestions: (fromIndex, toIndex) =>
      set((state) => {
        const newQuestions = [...state.questions]
        const [moved] = newQuestions.splice(fromIndex, 1)
        newQuestions.splice(toIndex, 0, moved)
        return {
          questions: newQuestions.map((q, i) => ({
            ...q,
            sort_order: i,
          })),
        }
      }),
  })
)
