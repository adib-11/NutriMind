import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SwapMealRequest, SwapMealResponse, Meal, Ingredient } from '@/types/index';
import mealsData from '@/data/meals.json';
import ingredientsData from '@/data/ingredients.json';

// TODO: Extract to shared utility in future (code duplication from generatePlan route)
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
  console.log('🟣 API Route: POST /api/chatbot/swap-meal called');
  
  try {
    // Load meals and ingredients data
    const allMeals: Meal[] = mealsData.meals;
    const ingredientsDataImport = ingredientsData as { ingredients: Ingredient[] };
    const allIngredients: Ingredient[] = ingredientsDataImport.ingredients;
    
    if (!allMeals || allMeals.length === 0) {
      throw new Error('Failed to load meals data');
    }
    
    if (!allIngredients || allIngredients.length === 0) {
      throw new Error('Failed to load ingredients data');
    }
    
    console.log(`🟣 Loaded ${allMeals.length} meals and ${allIngredients.length} ingredients`);

    // Parse request body
    const requestBody: SwapMealRequest = await request.json();
    console.log('🟣 Received swap request:', {
      mealType: requestBody.mealType,
      currentMealId: requestBody.currentMealId,
      message: requestBody.message
    });
    
    // Validate required fields
    if (!requestBody.message || !requestBody.currentMealId || !requestBody.mealType || !requestBody.userProfile) {
      return NextResponse.json(
        { error: 'Missing required fields: message, currentMealId, mealType, userProfile' },
        { status: 400 }
      );
    }

    const { message, currentMealId, mealType, userProfile } = requestBody;

    // Normalize meal type for case-insensitive matching
    const normalizedMealType = mealType.charAt(0).toUpperCase() + mealType.slice(1).toLowerCase();
    console.log('🟣 Normalized meal type:', normalizedMealType);

    // Step 1: Filter by exact meal type
    let eligibleMeals = allMeals.filter(meal => 
      meal.meal_type.map(t => t.toLowerCase()).includes(mealType.toLowerCase())
    );
    console.log(`🟣 Step 1 - Meal type filter (${mealType}):`, eligibleMeals.length);

    // Step 2: Exclude current meal
    eligibleMeals = eligibleMeals.filter(meal => meal.meal_id !== currentMealId);
    console.log('🟣 Step 2 - Exclude current meal:', eligibleMeals.length);

    // Step 3: Apply allergy filtering
    if (userProfile.allergies && userProfile.allergies.trim() !== '') {
      eligibleMeals = eligibleMeals.filter(
        meal => !checkIngredientAllergies(meal, userProfile.allergies, allIngredients)
      );
      console.log(`🟣 Step 3 - Allergy filter (${userProfile.allergies}):`, eligibleMeals.length);
    }

    // Step 4: Vegetarian filtering
    if (userProfile.isVegetarian) {
      eligibleMeals = eligibleMeals.filter(meal => 
        meal.tags.includes('vegetarian') || (meal.suitability_tags?.includes('vegetarian') ?? false)
      );
      console.log('🟣 Step 4 - Vegetarian filter:', eligibleMeals.length);
    }

    // Step 5: Health condition filtering
    if (userProfile.healthConditions.includes('Diabetes')) {
      eligibleMeals = eligibleMeals.filter(meal =>
        meal.tags.includes('diabetic_friendly') || (meal.suitability_tags?.includes('diabetic_friendly') ?? false)
      );
      console.log('🟣 Step 5a - Diabetic-friendly filter:', eligibleMeals.length);
    }

    if (userProfile.healthConditions.includes('Hypertension')) {
      eligibleMeals = eligibleMeals.filter(meal =>
        meal.tags.includes('low_sodium') || 
        meal.tags.includes('hypertension_friendly') ||
        (meal.suitability_tags?.includes('low_sodium') ?? false) ||
        (meal.suitability_tags?.includes('hypertension_friendly') ?? false)
      );
      console.log('🟣 Step 5b - Hypertension-friendly filter:', eligibleMeals.length);
    }

    // Step 6: Budget constraint (one meal out of 7-day plan)
    const maxMealCost = userProfile.budget / 7;
    eligibleMeals = eligibleMeals.filter(meal => meal.total_cost_bdt <= maxMealCost);
    console.log(`🟣 Step 6 - Budget filter (≤৳${maxMealCost.toFixed(2)}):`, eligibleMeals.length);

    // Check if we have enough eligible meals
    if (eligibleMeals.length === 0) {
      return NextResponse.json(
        { 
          suggestions: [],
          explanation: 'No alternative meals found that match your profile and constraints. Please adjust your preferences.'
        } as SwapMealResponse,
        { status: 200 }
      );
    }

    // Get current meal details for prompt
    const currentMeal = allMeals.find(m => m.meal_id === currentMealId);
    const currentMealName = currentMeal?.name_en || 'Unknown';

    // Create simplified meal list for AI
    const simplifiedMeals = eligibleMeals.map(meal => ({
      meal_id: meal.meal_id,
      name_en: meal.name_en,
      calories: meal.total_nutrition.calories,
      protein_g: meal.total_nutrition.protein_g,
      carbs_g: meal.total_nutrition.carbs_g,
      fat_g: meal.total_nutrition.fat_g,
      cost_bdt: meal.total_cost_bdt,
      tags: meal.tags
    }));

    // Construct Gemini prompt (AC6 format)
    const swapPrompt = `You are a NutriMind meal replacement assistant for Bangladesh.

USER REQUEST: "${message}"
MEAL TO REPLACE: ${normalizedMealType} (current: ${currentMealName})

USER PROFILE:
- Daily calorie goal: ${userProfile.calorieGoal || 2500} kcal
- Budget: ৳${userProfile.budget} BDT per week
- Allergies: ${userProfile.allergies || 'None'}
- Vegetarian: ${userProfile.isVegetarian ? 'Yes' : 'No'}
- Health conditions: ${userProfile.healthConditions.join(', ') || 'None'}

AVAILABLE MEALS (${eligibleMeals.length} options pre-filtered):
${JSON.stringify(simplifiedMeals, null, 2)}

TASK: Select 3 alternative ${normalizedMealType} meals that:
1. Match the meal type exactly
2. Are safe for user's allergies (already filtered)
3. Respect vegetarian preference (already filtered)
4. Have appropriate tags for health conditions (already filtered)
5. Fit within budget (already filtered)
6. Address the user's specific concern in their request

OUTPUT: Return ONLY a JSON array of exactly 3 meal IDs. Example: ["MEAL_005", "MEAL_012", "MEAL_023"]

Do not include any explanation, markdown, or additional text. Only the JSON array.`;

    console.log(`🟣 Prompt length: ${swapPrompt.length} characters`);

    // Call Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      throw new Error('Gemini API key is not configured');
    }

    console.log('🟣 Calling Gemini API...');
    const aiStartTime = Date.now();
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 200,
      }
    });
    
    const result = await model.generateContent(swapPrompt);
    const responseText = result.response.text();
    
    const aiTime = Date.now() - aiStartTime;
    console.log(`🟣 Gemini API responded in: ${aiTime}ms`);

    // Parse Gemini response
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }
    
    const selectedMealIds: string[] = JSON.parse(cleanedResponse);
    console.log('🟣 AI selected meal IDs:', selectedMealIds);
    
    if (!Array.isArray(selectedMealIds)) {
      throw new Error('Invalid response format from Gemini API');
    }

    // Filter eligible meals by AI-selected IDs and limit to 3
    const suggestions = eligibleMeals
      .filter(meal => selectedMealIds.includes(meal.meal_id))
      .slice(0, 3);
    
    console.log('🟣 Final suggestions:', suggestions.map(m => m.name_en));

    // Fallback: if AI didn't return enough meals, pick top 3 by cost
    if (suggestions.length < 2) {
      console.warn('🟣 AI returned insufficient meals, using fallback selection');
      const fallbackSuggestions = eligibleMeals
        .sort((a, b) => a.total_cost_bdt - b.total_cost_bdt)
        .slice(0, 3);
      
      const totalTime = Date.now() - startTime;
      console.log(`⏱️ Total API execution time: ${totalTime}ms`);
      
      return NextResponse.json({
        suggestions: fallbackSuggestions,
        explanation: "Here are alternatives that match your profile and address your concern"
      } as SwapMealResponse, { status: 200 });
    }

    const totalTime = Date.now() - startTime;
    console.log(`⏱️ Total API execution time: ${totalTime}ms`);

    return NextResponse.json({
      suggestions,
      explanation: "Here are alternatives that match your profile and address your concern"
    } as SwapMealResponse, { status: 200 });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`🟣 Swap meal API failed after ${totalTime}ms:`, error);
    return NextResponse.json(
      { error: 'Failed to generate meal alternatives' },
      { status: 500 }
    );
  }
}
