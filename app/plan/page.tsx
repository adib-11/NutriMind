'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import MealPlanDisplay from '@/components/plan/MealPlanDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MealPlanPage() {
  const router = useRouter();
  const { mealPlan, age, gender, weight, height, activityLevel, healthGoal } = useUserStore();

  // Calculate BMR, TDEE, and macros
  const calculations = useMemo(() => {
    if (!age || !gender || !weight || !height || !activityLevel || !healthGoal) {
      return null;
    }

    // BMR calculation (Mifflin-St Jeor)
    let bmr: number;
    if (gender.toLowerCase() === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // TDEE calculation
    const activityMultipliers: { [key: string]: number } = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725
    };
    const normalizedActivity = activityLevel.toLowerCase();
    const multiplier = activityMultipliers[normalizedActivity] || 1.55;
    let tdee = bmr * multiplier;

    // Adjust for health goal
    const normalizedGoal = healthGoal.toLowerCase().replace(/[_\s]/g, '');
    if (normalizedGoal === 'weightloss') {
      tdee -= 500;
    } else if (normalizedGoal === 'weightgain') {
      tdee += 500;
    }

    const calorieGoal = Math.round(tdee);

    // Macro calculations
    let proteinPercent, carbsPercent, fatPercent;
    if (normalizedGoal === 'weightloss') {
      proteinPercent = 0.30; carbsPercent = 0.40; fatPercent = 0.30;
    } else if (normalizedGoal === 'weightgain') {
      proteinPercent = 0.25; carbsPercent = 0.50; fatPercent = 0.25;
    } else {
      proteinPercent = 0.25; carbsPercent = 0.45; fatPercent = 0.30;
    }

    const proteinTarget = Math.round((calorieGoal * proteinPercent) / 4);
    const carbsTarget = Math.round((calorieGoal * carbsPercent) / 4);
    const fatTarget = Math.round((calorieGoal * fatPercent) / 9);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(bmr * multiplier),
      calorieGoal,
      proteinTarget,
      carbsTarget,
      fatTarget,
      proteinPercent: proteinPercent * 100,
      carbsPercent: carbsPercent * 100,
      fatPercent: fatPercent * 100
    };
  }, [age, gender, weight, height, activityLevel, healthGoal]);

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

        {/* Nutritional Calculations Display */}
        {calculations && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">📊 Your Nutritional Targets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600">BMR (Base Metabolism)</p>
                  <p className="text-2xl font-bold text-blue-600">{calculations.bmr} kcal/day</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600">TDEE (With Activity)</p>
                  <p className="text-2xl font-bold text-blue-600">{calculations.tdee} kcal/day</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600">Daily Target (For Goal)</p>
                  <p className="text-2xl font-bold text-green-600">{calculations.calorieGoal} kcal/day</p>
                </div>
              </div>
              <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Macronutrient Targets:</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-red-600">{calculations.proteinTarget}g</p>
                    <p className="text-xs text-gray-600">Protein ({calculations.proteinPercent}%)</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-yellow-600">{calculations.carbsTarget}g</p>
                    <p className="text-xs text-gray-600">Carbs ({calculations.carbsPercent}%)</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-purple-600">{calculations.fatTarget}g</p>
                    <p className="text-xs text-gray-600">Fat ({calculations.fatPercent}%)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <MealPlanDisplay meals={mealPlan} />
      </div>
    </div>
  );
}

