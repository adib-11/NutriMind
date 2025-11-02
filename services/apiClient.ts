import { type GeneratePlanRequest, type GeneratePlanResponse } from '@/types';

export const getMealPlan = async (
  requestData: GeneratePlanRequest
): Promise<GeneratePlanResponse> => {
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

  return response.json();
};
