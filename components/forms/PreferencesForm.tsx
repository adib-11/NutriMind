'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { getMealPlan } from '@/services/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

const COMMON_HEALTH_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'High Cholesterol',
  'PCOS',
  'Thyroid Issues',
  'None'
];

export default function PreferencesForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const userStore = useUserStore();
  const { healthConditions, allergies, budget, isVegetarian, setData, setMealPlan, setDebugInfo } = userStore;

  // Progress messages that cycle during loading
  const loadingMessages = [
    'Analyzing your health profile...',
    'Calculating your nutritional needs...',
    'Consulting with AI nutritionist...',
    'Searching through 35+ Bengali meals...',
    'Matching meals to your preferences...',
    'Optimizing for your budget...',
    'Balancing macronutrients...',
    'Almost ready with your perfect plan...',
  ];

  useEffect(() => {
    if (isLoading) {
      let messageIndex = 0;
      setLoadingMessage(loadingMessages[0]);

      const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 8000); // Change message every 8 seconds

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleHealthConditionToggle = (condition: string) => {
    const current = healthConditions || [];
    if (current.includes(condition)) {
      setData({ healthConditions: current.filter(c => c !== condition) });
    } else {
      setData({ healthConditions: [...current, condition] });
    }
  };

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Extract all user data from Zustand store
      const userData = {
        age: userStore.age,
        gender: userStore.gender,
        height: userStore.height, // Already stored in cm
        weight: userStore.weight,
        activityLevel: userStore.activityLevel,
        healthGoal: userStore.healthGoal,
        healthConditions: userStore.healthConditions,
        allergies: userStore.allergies,
        budget: userStore.budget,
        isVegetarian: userStore.isVegetarian,
      };

      console.log('Sending user data to API:', userData);

      // Call API to generate meal plan
      const response = await getMealPlan(userData);

      console.log('Received meal plan:', response);

      // Store meal plan and debug info in Zustand
      setMealPlan(response.meals);
      setDebugInfo(response.debugInfo);

      // Navigate to meal plan page
      router.push('/plan');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate meal plan';
      setError(errorMessage);
      console.error('Error generating meal plan:', err);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Loading Modal Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center space-y-6">
              {/* Animated Spinner */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-green-200 rounded-full"></div>
                  <div className="w-20 h-20 border-4 border-green-600 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
                </div>
              </div>

              {/* Loading Text */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-900">Creating Your Meal Plan</h3>
                <p className="text-green-600 font-semibold animate-pulse">{loadingMessage}</p>
                <p className="text-sm text-gray-500">This may take 1-2 minutes. Please wait...</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-green-600 h-2 rounded-full animate-progress"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="w-full max-w-2xl mx-auto !bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-2xl !text-gray-900">Health Conditions & Preferences</CardTitle>
        <CardDescription className="!text-gray-600">Help us customize your meal plan to your specific needs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health Conditions */}
        <div className="space-y-3">
          <Label className="text-base font-semibold !text-gray-900">Health Conditions</Label>
          <p className="text-sm text-gray-500">Select all that apply</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {COMMON_HEALTH_CONDITIONS.map((condition) => (
              <div key={condition} className="flex items-center space-x-2">
                <Checkbox
                  id={condition}
                  checked={healthConditions.includes(condition)}
                  onCheckedChange={() => handleHealthConditionToggle(condition)}
                  className="!border-gray-300 data-[state=checked]:!bg-green-600 data-[state=checked]:!border-green-600"
                />
                <Label
                  htmlFor={condition}
                  className="text-sm font-normal cursor-pointer !text-gray-700"
                >
                  {condition}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div className="space-y-2">
          <Label htmlFor="allergies" className="!text-gray-700">Allergies</Label>
          <Input
            id="allergies"
            type="text"
            placeholder="e.g., peanuts, shellfish, dairy (comma-separated)"
            value={allergies}
            onChange={(e) => setData({ allergies: e.target.value })}
            className="!bg-white !text-gray-900"
          />
          <p className="text-sm text-gray-500">Enter any food allergies, separated by commas</p>
        </div>

        {/* Budget */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label htmlFor="budget" className="!text-gray-700">Daily Budget (BDT)</Label>
            <span className="text-lg font-semibold text-green-600">৳{budget}</span>
          </div>
          <Slider
            id="budget"
            min={100}
            max={1000}
            step={50}
            value={[budget]}
            onValueChange={(value) => setData({ budget: value[0] })}
            className="w-full [&_[data-slot=slider-track]]:!bg-gray-200 [&_[data-slot=slider-range]]:!bg-green-600 [&_[data-slot=slider-thumb]]:!border-green-600"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>৳100</span>
            <span>৳1000</span>
          </div>
        </div>

        {/* Vegetarian Preference */}
        <div className="flex items-center space-x-2 p-4 border rounded-lg border-gray-200">
          <Checkbox
            id="vegetarian"
            checked={isVegetarian}
            onCheckedChange={(checked) => setData({ isVegetarian: checked as boolean })}
            className="!border-gray-300 data-[state=checked]:!bg-green-600 data-[state=checked]:!border-green-600"
          />
          <div className="flex flex-col">
            <Label
              htmlFor="vegetarian"
              className="text-base font-semibold cursor-pointer !text-gray-900"
            >
              Vegetarian Preference
            </Label>
            <p className="text-sm text-gray-500">Only show vegetarian meal options</p>
          </div>
        </div>

        {/* Generate My Plan Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleGeneratePlan}
            disabled={isLoading}
            className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating your plan...' : 'Generate My Plan'}
          </button>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
