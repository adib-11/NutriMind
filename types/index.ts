// All shared data structures for NutriMind MVP
// This file must be imported by both frontend and API routes

export interface Ingredient {
  ingredient_id: string; // e.g., "ING_001"
  name_en: string; // e.g., "Rice (Miniket)"
  name_bn: string; // e.g., "চাল (মিনিকেট)"
  unit: 'kg' | 'g' | 'piece' | 'bundle' | 'litre' | 'ml' | '100g';
  price_bdt_per_unit: number; // Price in BDT for one unit
}

export interface MealIngredient {
  ingredient_id: string; // Foreign key to Ingredient.id
  quantity: number;
  unit: string; // Unit for this specific quantity
}

export interface Meal {
  meal_id: string; // e.g., "MEAL_001"
  name_en: string; // English name
  name_bn: string; // Bengali name
  meal_type: string[]; // e.g., ["Lunch", "Dinner"]
  description?: string; // Optional description
  prep_time_min?: number; // Optional prep time
  ingredients?: MealIngredient[]; // Optional ingredients list
  total_nutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sodium_mg: number;
    fiber_g?: number; // Optional fiber
    sugar_g: number;
  };
  total_cost_bdt: number;
  tags: string[]; // e.g., ["vegetarian", "low_cost", "traditional"]
  meal_difficulty?: string; // e.g., "Easy", "Medium", "Hard"
  suitability_tags?: string[]; // e.g., ["diabetic_friendly", "hypertension_friendly"]
}

// API Request/Response Types for generatePlan endpoint
export interface GeneratePlanRequest {
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  activityLevel?: string; // "Sedentary" | "Light" | "Moderate" | "Active"
  healthGoal?: string;
  healthConditions: string[]; // e.g., ["Type 2 Diabetes", "Hypertension"]
  allergies: string; // Free text, comma-separated
  budget: number; // e.g., 250 (BDT)
  isVegetarian: boolean;
}

export type GeneratePlanResponse = Meal[]; // Array of Meal objects

export interface ApiError {
  error: string; // e.g., "Failed to generate meal plan"
}

