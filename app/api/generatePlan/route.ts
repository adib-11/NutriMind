import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeneratePlanRequest, GeneratePlanResponse, Meal, ApiError } from '@/types/index';
import mealsData from '@/data/meals.json';

export async function POST(request: NextRequest) {
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
    
    if (userData.age && userData.gender && userData.weight && userData.height && userData.activityLevel) {
      // Simple BMR calculation (Mifflin-St Jeor)
      let bmr: number;
      if (userData.gender.toLowerCase() === 'male') {
        bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age + 5;
      } else {
        bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age - 161;
      }
      
      // Activity multiplier
      const activityMultipliers: { [key: string]: number } = {
        'Sedentary': 1.2,
        'Light': 1.375,
        'Moderate': 1.55,
        'Active': 1.725
      };
      const multiplier = activityMultipliers[userData.activityLevel] || 1.55;
      let tdee = bmr * multiplier;
      
      // Adjust for health goal
      if (userData.healthGoal === 'Weight Loss') {
        tdee -= 500; // 500 calorie deficit
      } else if (userData.healthGoal === 'Weight Gain') {
        tdee += 500; // 500 calorie surplus
      }
      
      calorieGoal = Math.round(tdee);
    }

    // Task 7: Construct Gemini AI Prompt
    const prompt = `You are a meal planning assistant. Based on the user's requirements and the available meals, select exactly 4 meals: one breakfast, one lunch, one dinner, and one snack.

REQUIREMENTS:
- Total calories should be close to ${calorieGoal} kcal
- Total cost must be under ${userData.budget} BDT
${userData.isVegetarian ? '- ALL meals must have the "vegetarian" tag' : ''}
${userData.healthConditions.includes('Type 2 Diabetes') ? '- ALL meals must have the "diabetic_friendly" tag' : ''}
${userData.healthConditions.includes('Hypertension') ? '- ALL meals must have the "low_sodium" tag' : ''}
${userData.allergies ? `- NO meals should contain these allergens in their ingredients: ${userData.allergies}` : ''}

AVAILABLE MEALS:
${JSON.stringify(allMeals, null, 2)}

OUTPUT FORMAT:
Return ONLY a JSON array of meal_id strings. Example: ["MEAL_001", "MEAL_005", "MEAL_022", "MEAL_040"]

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
    return NextResponse.json(selectedMeals as GeneratePlanResponse, { status: 200 });

  } catch (error) {
    // Task 12: Implement Error Handling
    console.error('Error generating meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal plan' } as ApiError,
      { status: 500 }
    );
  }
}
