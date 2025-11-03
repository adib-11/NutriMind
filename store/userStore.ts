import { create } from 'zustand';
import { type Meal } from '@/types';

// Defines the shape of all user inputs
interface UserData {
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  activityLevel?: string;
  healthGoal?: string;
  healthConditions: string[];
  allergies: string;
  budget: number;
  isVegetarian: boolean;
}

// Debug info for testing Story 1.6
interface DebugInfo {
  totalMeals?: number;
  safeForUser?: number;
  allergies?: string;
  removedCount?: number;
  selectedMealIds?: string[];
  selectedMealNames?: string[];
  timestamp?: number;
}

// Defines the store's actions
interface UserStore extends UserData {
  mealPlan: Meal[];
  debugInfo: DebugInfo | null;
  setData: (data: Partial<UserData>) => void;
  setMealPlan: (plan: Meal[]) => void;
  setDebugInfo: (info: DebugInfo | null) => void;
  reset: () => void;
}

const initialState: UserData = {
  healthConditions: [],
  allergies: '',
  budget: 250, // Default budget in BDT
  isVegetarian: false,
};

export const useUserStore = create<UserStore>((set) => ({
  ...initialState,
  mealPlan: [],
  debugInfo: null,
  setData: (data) => set((state) => ({ ...state, ...data })),
  setMealPlan: (plan) => set({ mealPlan: plan }),
  setDebugInfo: (info) => set({ debugInfo: info }),
  reset: () => set({ ...initialState, mealPlan: [], debugInfo: null }),
}));
