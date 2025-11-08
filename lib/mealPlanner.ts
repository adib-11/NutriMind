import { type Meal, type Ingredient } from '@/types';
import ingredientsData from '@/data/ingredients.json';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

const REQUIRED_MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

// Load ingredients data for cost calculation
const ingredientsDataImport = ingredientsData as { ingredients: Ingredient[] };
const allIngredients: Ingredient[] = ingredientsDataImport.ingredients;
const ingredientMap = new Map(allIngredients.map((ing) => [ing.ingredient_id, ing]));

// Helper function to calculate actual ingredient cost for a meal
function calculateMealIngredientCost(meal: Meal): number {
  if (!meal.ingredients || meal.ingredients.length === 0) {
    return meal.total_cost_bdt; // Fallback to stored cost if no ingredients
  }

  return meal.ingredients.reduce((sum, mealIngredient) => {
    const ingredientDetails = ingredientMap.get(mealIngredient.ingredient_id);
    
    if (!ingredientDetails) return sum;

    let quantity = mealIngredient.quantity;
    
    // Convert to base unit if needed for cost calculation
    if (ingredientDetails.unit === 'kg' && mealIngredient.unit === 'g') {
      quantity = mealIngredient.quantity / 1000;
    } else if (ingredientDetails.unit === 'litre' && mealIngredient.unit === 'ml') {
      quantity = mealIngredient.quantity / 1000;
    }

    return sum + (quantity * ingredientDetails.price_bdt_per_unit);
  }, 0);
}

interface MacroTargets {
  calorieGoal: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
}

interface SelectionTargets extends MacroTargets {
  budget: number;
  maxCalorieDeviation?: number; // percentage as decimal (e.g., 0.1 == 10%)
  candidateLimitPerType?: number;
}

interface MealTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cost: number;
}

export interface MealPlanSelection {
  meals: Meal[];
  totals: MealTotals;
  score: number;
  attempts: number;
  candidateCounts: Record<MealType, number>;
  caloriePenalty: number;
  macroPenalty: number;
}

const DEFAULT_CANDIDATE_LIMIT = 55;
const DEFAULT_MAX_CALORIE_DEVIATION = 0.12; // 12%

function sumTotals(meals: Meal[]): MealTotals {
  return meals.reduce<MealTotals>((acc, meal) => {
    const nutrition = meal.total_nutrition;
    const mealCost = calculateMealIngredientCost(meal); // Use calculated ingredient cost
    return {
      calories: acc.calories + (nutrition?.calories || 0),
      protein: acc.protein + (nutrition?.protein_g || 0),
      carbs: acc.carbs + (nutrition?.carbs_g || 0),
      fat: acc.fat + (nutrition?.fat_g || 0),
      cost: acc.cost + mealCost,
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 });
}

function macroPenalty(actual: number, target: number): number {
  if (target === 0) return 0;
  return Math.abs(actual - target) / target;
}

function createCandidateBuckets(
  eligibleMeals: Meal[],
  candidateLimitPerType: number
): { buckets: Record<MealType, Meal[]>; counts: Record<MealType, number> } {
  const buckets = {
    Breakfast: [] as Meal[],
    Lunch: [] as Meal[],
    Dinner: [] as Meal[],
    Snack: [] as Meal[],
  } satisfies Record<MealType, Meal[]>;

  for (const meal of eligibleMeals) {
    for (const mealType of REQUIRED_MEAL_TYPES) {
      if (meal.meal_type.includes(mealType)) {
        buckets[mealType].push(meal);
      }
    }
  }

  const counts: Record<MealType, number> = {
    Breakfast: buckets.Breakfast.length,
    Lunch: buckets.Lunch.length,
    Dinner: buckets.Dinner.length,
    Snack: buckets.Snack.length,
  };

  for (const mealType of REQUIRED_MEAL_TYPES) {
    if (buckets[mealType].length === 0) {
      throw new Error(`No meals available for required type: ${mealType}`);
    }

    buckets[mealType] = buckets[mealType]
      .filter((meal) => {
        const mealCost = calculateMealIngredientCost(meal);
        return mealCost > 0 && meal.total_nutrition?.calories > 0;
      })
      .sort((a, b) => {
        const caloriesDiff = (b.total_nutrition?.calories || 0) - (a.total_nutrition?.calories || 0);
        if (caloriesDiff !== 0) {
          return caloriesDiff;
        }
        const costA = calculateMealIngredientCost(a);
        const costB = calculateMealIngredientCost(b);
        return costA - costB;
      })
      .slice(0, candidateLimitPerType);

    if (buckets[mealType].length === 0) {
      throw new Error(`Insufficient candidates for ${mealType} after filtering`);
    }
  }

  return { buckets, counts };
}

export function selectMealPlan(
  eligibleMeals: Meal[],
  targets: SelectionTargets
): MealPlanSelection | null {
  const candidateLimit = targets.candidateLimitPerType ?? DEFAULT_CANDIDATE_LIMIT;
  const maxDeviation = targets.maxCalorieDeviation ?? DEFAULT_MAX_CALORIE_DEVIATION;

  const { buckets, counts } = createCandidateBuckets(eligibleMeals, candidateLimit);

  let best: MealPlanSelection | null = null;
  let attempts = 0;

  const {
    calorieGoal,
    proteinTarget,
    carbsTarget,
    fatTarget,
    budget,
  } = targets;

  const acceptableCalorieRange: [number, number] = [
    calorieGoal * (1 - maxDeviation),
    calorieGoal * (1 + maxDeviation),
  ];

  const breakfastMeals = buckets.Breakfast;
  const lunchMeals = buckets.Lunch;
  const dinnerMeals = buckets.Dinner;
  const snackMeals = buckets.Snack;

  for (const breakfast of breakfastMeals) {
    const breakfastCost = calculateMealIngredientCost(breakfast);
    if (breakfastCost > budget) continue;

    for (const lunch of lunchMeals) {
      if (lunch.meal_id === breakfast.meal_id) continue;
      const costBL = breakfastCost + calculateMealIngredientCost(lunch);
      if (costBL > budget) continue;

      for (const dinner of dinnerMeals) {
        if (dinner.meal_id === breakfast.meal_id || dinner.meal_id === lunch.meal_id) continue;
        const costBLD = costBL + calculateMealIngredientCost(dinner);
        if (costBLD > budget) continue;

        for (const snack of snackMeals) {
          if (
            snack.meal_id === breakfast.meal_id ||
            snack.meal_id === lunch.meal_id ||
            snack.meal_id === dinner.meal_id
          ) {
            continue;
          }
          attempts += 1;

          const meals = [breakfast, lunch, dinner, snack];
          const totals = sumTotals(meals);

          if (totals.cost > budget) {
            continue;
          }

          const rawCaloriePenalty = Math.abs(totals.calories - calorieGoal) / Math.max(calorieGoal, 1);
          const proteinPenalty = macroPenalty(totals.protein, proteinTarget);
          const carbsPenalty = macroPenalty(totals.carbs, carbsTarget);
          const fatPenalty = macroPenalty(totals.fat, fatTarget);
          const macroPenaltyAverage = (proteinPenalty + carbsPenalty + fatPenalty) / 3;

          const underTargetMultiplier = totals.calories < calorieGoal ? 1.35 : 1;
          const caloriePenalty = rawCaloriePenalty * underTargetMultiplier;

          const score = caloriePenalty * 0.7 + macroPenaltyAverage * 0.3;

          const withinCalorieBand =
            totals.calories >= acceptableCalorieRange[0] && totals.calories <= acceptableCalorieRange[1];

          if (!best || score < best.score || (score === best.score && totals.cost < best.totals.cost)) {
            best = {
              meals,
              totals,
              score,
              attempts,
              candidateCounts: counts,
              caloriePenalty: rawCaloriePenalty,
              macroPenalty: macroPenaltyAverage,
            };

            // Early exit if we're within calorie band and macro penalty small
            if (withinCalorieBand && macroPenaltyAverage <= 0.12 && rawCaloriePenalty <= 0.08) {
              return best;
            }
          }
        }
      }
    }
  }

  if (!best) {
    return null;
  }

  const finalCaloriePenalty = Math.abs(best.totals.calories - calorieGoal) / Math.max(calorieGoal, 1);
  if (finalCaloriePenalty > maxDeviation * 1.5) {
    // Consider result unacceptable if we're dramatically off target
    return null;
  }

  best.attempts = attempts;
  return best;
}
