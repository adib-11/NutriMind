import { NextRequest, NextResponse } from 'next/server';
import { GeneratePlanRequest, GeneratePlanResponse, Meal, ApiError, Ingredient } from '@/types/index';
import mealsData from '@/data/meals.json';
import ingredientsData from '@/data/ingredients.json';
import { selectMealPlan } from '@/lib/mealPlanner';

function checkIngredientAllergies(
  meal: Meal,
  allergyString: string,
  allIngredients: Ingredient[]
): boolean {
  if (!allergyString || allergyString.trim() === '') {
    return false;
  }
  
  // If meal doesn't have ingredients list, we can't check
  if (!meal.ingredients || meal.ingredients.length === 0) {
    return false; // Can't verify, so don't exclude
  }

  const allergens = allergyString
    .toLowerCase()
    .split(',')
    .map((a) => a.trim())
    .filter((a) => a.length > 0);

  if (allergens.length === 0) {
    return false;
  }

  const ingredientMap = new Map(allIngredients.map((ing) => [ing.ingredient_id, ing]));

  for (const mealIng of meal.ingredients) {
    const ingredient = ingredientMap.get(mealIng.ingredient_id);
    if (ingredient) {
      const ingredientName = ingredient.name_en.toLowerCase();
      const hasAllergen = allergens.some((allergen) => ingredientName.includes(allergen));

      if (hasAllergen) {
        return true;
      }
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🔵 API Route: POST /api/generatePlan called');
  
  try {
    // Task 4: Load and Parse meals.json
    const allMeals: Meal[] = mealsData.meals;
    const ingredientsDataImport = ingredientsData as { ingredients: Ingredient[] };
    const allIngredients: Ingredient[] = ingredientsDataImport.ingredients;
    
    if (!allMeals || allMeals.length === 0) {
      throw new Error('Failed to load meals data');
    }
    
    if (!allIngredients || allIngredients.length === 0) {
      throw new Error('Failed to load ingredients data');
    }
    
    console.log(`🔵 Loaded ${allMeals.length} meals and ${allIngredients.length} ingredients`);

    // Task 5: Parse Request Body
    const userData: GeneratePlanRequest = await request.json();
    console.log('🔵 Received user data:', userData);
    
    // Validate required fields
    if (userData.budget === undefined || userData.budget === null) {
      return NextResponse.json(
        { error: 'Budget is required' } as ApiError,
        { status: 400 }
      );
    }
    if (userData.healthConditions === undefined) {
      return NextResponse.json(
        { error: 'Health conditions are required' } as ApiError,
        { status: 400 }
      );
    }
    if (userData.allergies === undefined) {
      return NextResponse.json(
        { error: 'Allergies field is required' } as ApiError,
        { status: 400 }
      );
    }
    if (userData.isVegetarian === undefined) {
      return NextResponse.json(
        { error: 'Vegetarian preference is required' } as ApiError,
        { status: 400 }
      );
    }

    // Task 6: Calculate User's Calorie Goal
    let calorieGoal = 2500; // Default
    let bmr = 0;
    let tdee = 0;
    
  if (userData.age && userData.gender && userData.weight && userData.height && userData.activityLevel) {
      // Simple BMR calculation (Mifflin-St Jeor)
      if (userData.gender.toLowerCase() === 'male') {
        bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age + 5;
      } else {
        bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age - 161;
      }
      
      // Activity multiplier
      const activityMultipliers: { [key: string]: number } = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725
      };
      // Normalize activity level to lowercase for case-insensitive matching
      const normalizedActivity = userData.activityLevel?.toLowerCase();
      const multiplier = activityMultipliers[normalizedActivity] || 1.55;
      tdee = bmr * multiplier;
      
      // Adjust for health goal
      // Normalize health goal string to handle both 'Weight Loss' and 'weight_loss' formats
      const normalizedGoal = userData.healthGoal?.toLowerCase().replace(/[_\s]/g, '');
      console.log('🔵 Debug Goal Normalization:', { 
        original: userData.healthGoal, 
        normalized: normalizedGoal,
        matches_weightloss: normalizedGoal === 'weightloss'
      });
      
      if (normalizedGoal === 'weightloss') {
        tdee -= 500; // 500 calorie deficit
        console.log('🔵 Applied Weight Loss deficit. New TDEE:', tdee);
      } else if (normalizedGoal === 'weightgain') {
        tdee += 500; // 500 calorie surplus
        console.log('🔵 Applied Weight Gain surplus. New TDEE:', tdee);
      } else {
        console.log('🔵 No calorie adjustment (Weight Maintenance). TDEE remains:', tdee);
      }
      
      calorieGoal = Math.round(tdee);
    }

    // Task 3: Calculate macro targets based on health goal
    // Normalize health goal string to handle both 'Weight Loss' and 'weight_loss' formats
    const normalizedGoal = userData.healthGoal?.toLowerCase().replace(/[_\s]/g, '');
    let proteinPercent, carbsPercent, fatPercent;
    if (normalizedGoal === 'weightloss') {
      proteinPercent = 0.30; carbsPercent = 0.40; fatPercent = 0.30;
    } else if (normalizedGoal === 'weightgain') {
      proteinPercent = 0.25; carbsPercent = 0.50; fatPercent = 0.25;
    } else { // Weight Maintenance
      proteinPercent = 0.25; carbsPercent = 0.45; fatPercent = 0.30;
    }
    
    const proteinTarget = Math.round((calorieGoal * proteinPercent) / 4); // 4 cal/g
    const carbsTarget = Math.round((calorieGoal * carbsPercent) / 4);
    const fatTarget = Math.round((calorieGoal * fatPercent) / 9); // 9 cal/g

    // Task 9: Add console logging for debugging
    console.log('🔵 Calorie Calculations:', {
      bmr,
      tdee,
      calorieGoal,
      healthGoal: userData.healthGoal
    });
    console.log('🔵 Macro Targets:', {
      protein: `${proteinTarget}g (${proteinPercent * 100}%)`,
      carbs: `${carbsTarget}g (${carbsPercent * 100}%)`,
      fat: `${fatTarget}g (${fatPercent * 100}%)`
    });

    // Pre-filter meals to exclude allergen ingredients
    let safeForUserMeals = allMeals;

    if (userData.allergies && userData.allergies.trim() !== '') {
      safeForUserMeals = allMeals.filter(
        (meal) => !checkIngredientAllergies(meal, userData.allergies, allIngredients)
      );

      console.log(`🔵 Allergy filtering: ${allMeals.length} total meals, ${safeForUserMeals.length} safe for user`);
      console.log(`🔵 User allergies: ${userData.allergies}`);

      if (safeForUserMeals.length === 0) {
        return NextResponse.json(
          {
            error: 'No meals available that meet your allergy requirements. Please adjust your preferences.'
          } as ApiError,
          { status: 400 }
        );
      }
    }

    if (userData.allergies) {
      console.log('🔵 Allergy filtering results:', {
        totalMeals: allMeals.length,
        safeForUser: safeForUserMeals.length,
        allergies: userData.allergies,
        removedCount: allMeals.length - safeForUserMeals.length
      });
    }

    // Pre-filter meals based on health constraints BEFORE selecting plan
    let eligibleMeals = [...safeForUserMeals];

    const normalizedHealthConditions = (userData.healthConditions || [])
      .map((condition) => condition.trim())
      .filter((condition) => condition.length > 0 && condition.toLowerCase() !== 'none');
    
    // Helper function to check if a meal has a tag in either tags or suitability_tags
    const mealHasTag = (meal: Meal, tag: string): boolean => {
      return meal.tags.includes(tag) || (meal.suitability_tags?.includes(tag) ?? false);
    };
    
    // Filter for vegetarian if required
    if (userData.isVegetarian) {
      eligibleMeals = eligibleMeals.filter(meal => mealHasTag(meal, 'vegetarian'));
      console.log('🔵 Filtered for vegetarian:', eligibleMeals.length, 'meals remaining');
    }
    
    // Filter for diabetes if required (frontend sends 'Diabetes')
  if (normalizedHealthConditions.includes('Diabetes')) {
      eligibleMeals = eligibleMeals.filter(meal => mealHasTag(meal, 'diabetic_friendly'));
      console.log('🔵 Filtered for diabetic_friendly:', eligibleMeals.length, 'meals remaining');
    }
    
    // Filter for hypertension if required
  if (normalizedHealthConditions.includes('Hypertension')) {
      eligibleMeals = eligibleMeals.filter(meal => 
        mealHasTag(meal, 'low_sodium') || mealHasTag(meal, 'hypertension_friendly')
      );
      console.log('🔵 Filtered for low_sodium/hypertension_friendly:', eligibleMeals.length, 'meals remaining');
    }
    
    // Check if we have enough meals after filtering
    if (eligibleMeals.length < 4) {
      return NextResponse.json(
        { error: `Insufficient meals available that match your health constraints. Only ${eligibleMeals.length} eligible meals found.` } as ApiError,
        { status: 400 }
      );
    }
    
    console.log('🔵 Final eligible meals count:', eligibleMeals.length);

    const selectionResult = selectMealPlan(eligibleMeals, {
      calorieGoal,
      proteinTarget,
      carbsTarget,
      fatTarget,
      budget: userData.budget,
    });

    if (!selectionResult) {
      console.warn('⚠️ Unable to construct meal plan meeting targets.');
      return NextResponse.json(
        {
          error: 'No meal combination found that satisfies calorie and budget targets. Please adjust your preferences.'
        } as ApiError,
        { status: 400 }
      );
    }

    const normalizedMeals = selectionResult.meals;

    const totalSelectedCost = selectionResult.totals.cost;

    console.log('🔵 Deterministic selection complete:', {
      selectedMealIds: normalizedMeals.map((meal) => meal.meal_id),
      totals: selectionResult.totals,
      attempts: selectionResult.attempts,
      score: selectionResult.score,
      totalCost: totalSelectedCost,
    });

    // Task 11: Return Success Response
    const totalTime = Date.now() - startTime;
    console.log(`⏱️ Total API execution time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    
    // Prepare debug info for UI display
    const debugInfo = {
      totalMeals: allMeals.length,
      safeForUser: safeForUserMeals.length,
      allergies: userData.allergies || 'None',
      removedCount: allMeals.length - safeForUserMeals.length,
      selectedMealIds: normalizedMeals.map((meal) => meal.meal_id),
      selectedMealNames: normalizedMeals.map(m => m.name_en),
      totals: selectionResult.totals,
      attempts: selectionResult.attempts,
      score: selectionResult.score,
      caloriePenalty: selectionResult.caloriePenalty,
      macroPenalty: selectionResult.macroPenalty,
      targets: {
        calorieGoal,
        proteinTarget,
        carbsTarget,
        fatTarget,
        budget: userData.budget
      },
      timestamp: Date.now()
    };
    
    const response = NextResponse.json(normalizedMeals as GeneratePlanResponse, { status: 200 });
    response.headers.set('X-Debug-Info', JSON.stringify(debugInfo));
    return response;

  } catch (error) {
    // Task 12: Implement Error Handling
    const totalTime = Date.now() - startTime;
    console.log(`⏱️ API failed after: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.error('Error generating meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal plan' } as ApiError,
      { status: 500 }
    );
  }
}
