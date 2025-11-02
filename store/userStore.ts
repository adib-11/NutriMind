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

// Defines the store's actions
interface UserStore extends UserData {
  mealPlan: Meal[];
  setData: (data: Partial<UserData>) => void;
  setMealPlan: (plan: Meal[]) => void;
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
  setData: (data) => set((state) => ({ ...state, ...data })),
  setMealPlan: (plan) => set({ mealPlan: plan }),
  reset: () => set({ ...initialState, mealPlan: [] }),
}));
