import { type GeneratePlanRequest, type GeneratePlanResponse } from '@/types';

interface MealPlanWithDebug {
  meals: GeneratePlanResponse;
  debugInfo: {
    totalMeals: number;
    safeForUser: number;
    allergies: string;
    removedCount: number;
    selectedMealIds: string[];
    selectedMealNames: string[];
    timestamp: number;
  } | null;
}

export const getMealPlan = async (
  requestData: GeneratePlanRequest
): Promise<MealPlanWithDebug> => {
  const response = await fetch('/api/generatePlan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate meal plan');
  }

  const meals = await response.json();
  
  // Extract debug info from response headers
  const debugHeader = response.headers.get('X-Debug-Info');
  const debugInfo = debugHeader ? JSON.parse(debugHeader) : null;

  return { meals, debugInfo };
};
