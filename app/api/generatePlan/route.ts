import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeneratePlanRequest, GeneratePlanResponse, Meal, ApiError } from '@/types/index';
import mealsData from '@/data/meals.json';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🔵 API Route: POST /api/generatePlan called');
  
  try {
    // Task 4: Load and Parse meals.json
    const allMeals: Meal[] = mealsData.meals;
    
    if (!allMeals || allMeals.length === 0) {
      throw new Error('Failed to load meals data');
    }

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

    // Pre-filter meals based on health constraints BEFORE sending to AI
    let eligibleMeals = [...allMeals];
    
    // Filter for vegetarian if required
    if (userData.isVegetarian) {
      eligibleMeals = eligibleMeals.filter(meal => 
        meal.tags.includes('vegetarian')
      );
      console.log('🔵 Filtered for vegetarian:', eligibleMeals.length, 'meals remaining');
    }
    
    // Filter for diabetes if required (frontend sends 'Diabetes')
    if (userData.healthConditions.includes('Diabetes')) {
      eligibleMeals = eligibleMeals.filter(meal => 
        meal.tags.includes('diabetic_friendly')
      );
      console.log('🔵 Filtered for diabetic_friendly:', eligibleMeals.length, 'meals remaining');
    }
    
    // Filter for hypertension if required
    if (userData.healthConditions.includes('Hypertension')) {
      eligibleMeals = eligibleMeals.filter(meal => 
        meal.tags.includes('low_sodium')
      );
      console.log('🔵 Filtered for low_sodium:', eligibleMeals.length, 'meals remaining');
    }
    
    // Check if we have enough meals after filtering
    if (eligibleMeals.length < 4) {
      return NextResponse.json(
        { error: `Insufficient meals available that match your health constraints. Only ${eligibleMeals.length} eligible meals found.` } as ApiError,
        { status: 400 }
      );
    }
    
    console.log('🔵 Final eligible meals count:', eligibleMeals.length);

    // Task 7: Construct Gemini AI Prompt (Enhanced with comprehensive user profile)
    const prompt = `You are a meal planning assistant. Based on the user's comprehensive health profile and nutritional requirements, select exactly 4 meals: one breakfast, one lunch, one dinner, and one snack.

USER PROFILE ANALYSIS:
- Age: ${userData.age || 'Not provided'} years
- Gender: ${userData.gender || 'Not provided'}
- Weight: ${userData.weight || 'Not provided'} kg
- Height: ${userData.height || 'Not provided'} cm
- Activity Level: ${userData.activityLevel || 'Not provided'}
- Health Goal: ${userData.healthGoal || 'Not provided'}
- BMR (Basal Metabolic Rate): ${bmr} kcal/day
- TDEE (Total Daily Energy Expenditure): ${tdee} kcal/day
- Target Daily Calories: ${calorieGoal} kcal (adjusted for ${userData.healthGoal})

NUTRITIONAL REQUIREMENTS:
Target Daily Calories: ${calorieGoal} kcal

CALORIE DISTRIBUTION BY MEAL TYPE:
- Breakfast: ~${Math.round(calorieGoal * 0.25)} kcal (25%)
- Lunch: ~${Math.round(calorieGoal * 0.35)} kcal (35%)
- Dinner: ~${Math.round(calorieGoal * 0.30)} kcal (30%)
- Snack: ~${Math.round(calorieGoal * 0.10)} kcal (10%)

MACRONUTRIENT TARGETS (Total for all 4 meals):
- Protein: ~${proteinTarget}g (${proteinPercent * 100}% of calories)
- Carbohydrates: ~${carbsTarget}g (${carbsPercent * 100}% of calories)
- Fat: ~${fatTarget}g (${fatPercent * 100}% of calories)

IMPORTANT: Select meals that collectively meet these calorie and macro targets.

HEALTH CONDITIONS & CONSTRAINTS:
${userData.healthConditions.includes('Diabetes') ? `- Diabetes:
  * All meals have been pre-filtered to include ONLY "diabetic_friendly" tagged meals
  * Each meal sugar content SHOULD be < 10g (prefer lower sugar options)
  * Prefer low glycemic index foods
` : ''}${userData.healthConditions.includes('Hypertension') ? `- Hypertension:
  * All meals have been pre-filtered to include ONLY "low_sodium" tagged meals
  * Each meal sodium content SHOULD be < 800mg (prefer lower sodium options)
  * Avoid processed foods with hidden sodium
` : ''}${userData.isVegetarian ? `- Vegetarian Diet:
  * All meals have been pre-filtered to include ONLY "vegetarian" tagged meals
  * All available meals exclude meat, poultry, fish, and seafood
` : ''}
Budget Constraint: Total cost must be under ${userData.budget} BDT
${userData.allergies ? `Allergies: NO meals should contain these allergens in their ingredients: ${userData.allergies}` : ''}

NOTE: The meals provided below have already been pre-filtered based on health constraints (vegetarian, diabetic_friendly, low_sodium tags as applicable).

AVAILABLE MEALS:
${JSON.stringify(eligibleMeals, null, 2)}

OUTPUT FORMAT:
Return ONLY a JSON array of meal_id strings. 
Example: ["MEAL_001", "MEAL_005", "MEAL_022", "MEAL_040"]

Select exactly 4 meals:
- 1 meal tagged with "Breakfast" 
- 1 meal tagged with "Lunch"
- 1 meal tagged with "Dinner"
- 1 meal tagged with "Snack"

Do not include any explanation or additional text. Just the JSON array.`;

    // Task 8: Call Gemini API (with optional mock support for local testing)
    const mockResponse = process.env.GEMINI_MOCK_RESPONSE;
    let responseText: string;

    if (mockResponse && mockResponse.trim().length > 0) {
      responseText = mockResponse;
    } else {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        throw new Error('Gemini API key is not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      responseText = result.response.text();
    }

    // Task 9: Parse Gemini Response
    // Clean up response text (remove markdown code blocks if present)
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }
    
    const selectedMealIds: string[] = JSON.parse(cleanedResponse);
    
    if (!Array.isArray(selectedMealIds)) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    if (selectedMealIds.length === 0) {
      throw new Error('No meals were selected by the AI');
    }

    // Task 10: Filter Meals by ID
    const selectedMeals = allMeals.filter(meal => selectedMealIds.includes(meal.meal_id));
    
    if (selectedMeals.length === 0) {
      throw new Error('No valid meal plan could be generated');
    }

    // Task 11: Return Success Response
    const totalTime = Date.now() - startTime;
    console.log(`⏱️ Total API execution time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    
    return NextResponse.json(selectedMeals as GeneratePlanResponse, { status: 200 });

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
