'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import MealPlanDisplay from '@/components/plan/MealPlanDisplay';

export default function MealPlanPage() {
  const router = useRouter();
  const { mealPlan } = useUserStore();

  // Handle empty state
  if (!mealPlan || mealPlan.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Meal Plan Generated Yet</h1>
          <p className="text-gray-600 mb-6">
            You need to generate a meal plan first. Please go back and complete the form.
          </p>
          <button
            onClick={() => router.push('/profile/step2')}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            Go to Preferences
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Personalized Meal Plan</h1>
        <p className="text-gray-600 mb-8">
          Here&apos;s your customized meal plan based on your health profile and preferences.
        </p>
        <MealPlanDisplay meals={mealPlan} />
      </div>
    </div>
  );
}
