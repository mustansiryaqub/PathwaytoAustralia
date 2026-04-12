import { create } from 'zustand';
import type { QuizResponses, RecommendationResult } from '@/types';

interface QuizState {
  responses: QuizResponses;
  currentStep: number;
  isCompleted: boolean;
  recommendations: RecommendationResult[];
  recommendationId: string | null;
  isGenerating: boolean;

  setResponse: (questionId: string, value: string | string[] | number) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setCompleted: (completed: boolean) => void;
  setRecommendations: (results: RecommendationResult[], id: string) => void;
  setGenerating: (loading: boolean) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  responses: {} as QuizResponses,
  currentStep: 1,
  isCompleted: false,
  recommendations: [] as RecommendationResult[],
  recommendationId: null as string | null,
  isGenerating: false,
};

export const useQuizStore = create<QuizState>((set, get) => ({
  ...INITIAL_STATE,

  setResponse: (questionId, value) =>
    set((state) => ({
      responses: { ...state.responses, [questionId]: value },
    })),

  goToStep: (step) => set({ currentStep: step }),

  nextStep: () =>
    set((state) => ({ currentStep: state.currentStep + 1 })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(1, state.currentStep - 1),
    })),

  setCompleted: (isCompleted) => set({ isCompleted }),

  setRecommendations: (recommendations, recommendationId) =>
    set({ recommendations, recommendationId, isCompleted: true }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  reset: () => set(INITIAL_STATE),
}));
