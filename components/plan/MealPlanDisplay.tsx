'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { type Meal, type Ingredient } from '@/types';
import { getMealPlan } from '@/services/apiClient';
import { useUserStore } from '@/store/userStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import formatQuantity from '@/lib/formatQuantity';
import { getMealImage } from '@/lib/imageClient';
import ingredientsData from '@/data/ingredients.json';

interface MealPlanDisplayProps {
  meals: Meal[];
}

export default function MealPlanDisplay({ meals }: MealPlanDisplayProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [mealImages, setMealImages] = useState<Record<string, string>>({});
  const userStore = useUserStore();
  const { setMealPlan, setDebugInfo } = userStore;

  // Import ingredients data
  const ingredientsDataImport = ingredientsData as { ingredients: Ingredient[] };
  const allIngredients = ingredientsDataImport.ingredients;

  // Helper function to calculate actual ingredient cost for a meal
  const calculateMealIngredientCost = (meal: Meal): number => {
    if (!meal.ingredients || meal.ingredients.length === 0) {
      return meal.total_cost_bdt; // Fallback to stored cost if no ingredients
    }

    return meal.ingredients.reduce((sum, mealIngredient) => {
      const ingredientDetails = allIngredients.find(
        (ing) => ing.ingredient_id === mealIngredient.ingredient_id
      );
      
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
  };

  // Calculate totals using actual ingredient costs
  const totalCalories = meals.reduce((sum, meal) => sum + meal.total_nutrition.calories, 0);
  const totalCost = meals.reduce((sum, meal) => sum + calculateMealIngredientCost(meal), 0);

  // Determine intended meal type based on position (AI returns in order: Breakfast, Lunch, Dinner, Snack)
  const getIntendedMealType = (meal: Meal, index: number): string => {
    const expectedOrder = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    const expectedType = expectedOrder[index];
    // Return the expected type if it exists in the meal's meal_type array, otherwise use first available
    return meal.meal_type.includes(expectedType) ? expectedType : meal.meal_type[0];
  };

  // Progress messages that cycle during loading
  const loadingMessages = [
    'Generating a fresh meal plan...',
    'Finding new meal combinations...',
    'Optimizing for variety...',
    'Balancing nutrition and budget...',
    'Almost done...',
  ];

  // Load meal images
  useEffect(() => {
    const loadImages = async () => {
      const images: Record<string, string> = {};
      for (const meal of meals) {
        const imageData = getMealImage(meal.meal_id, meal.name_en);
        images[meal.meal_id] = imageData.image_url;
      }
      setMealImages(images);
    };
    loadImages();
  }, [meals]);

  useEffect(() => {
    if (isLoading) {
      let messageIndex = 0;
      setLoadingMessage(loadingMessages[0]);

      const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 10000); // Change message every 10 seconds

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleGenerateNewPlan = async () => {
    setIsLoading(true);

    try {
      // Extract user data from Zustand store
      const userData = {
        age: userStore.age,
        gender: userStore.gender,
        height: userStore.height,
        weight: userStore.weight,
        activityLevel: userStore.activityLevel,
        healthGoal: userStore.healthGoal,
        healthConditions: userStore.healthConditions,
        allergies: userStore.allergies,
        budget: userStore.budget,
        isVegetarian: userStore.isVegetarian,
      };

      // Call API to generate new meal plan
      const response = await getMealPlan(userData);

      // Update meal plan and debug info in store
      setMealPlan(response.meals);
      setDebugInfo(response.debugInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate new meal plan';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getMealTypeBadgeColor = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return 'bg-yellow-100 text-yellow-800';
      case 'lunch':
        return 'bg-blue-100 text-blue-800';
      case 'dinner':
        return 'bg-purple-100 text-purple-800';
      case 'snack':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
                <h3 className="text-xl font-bold text-gray-900">Generating New Plan</h3>
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

      <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <button
          onClick={() => router.push('/plan/grocery-list')}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          View Grocery List
        </button>
        <button
          onClick={handleGenerateNewPlan}
          disabled={isLoading}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : 'Generate New Plan'}
        </button>
      </div>

      {/* Meal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {meals.map((meal, index) => {
          const intendedMealType = getIntendedMealType(meal, index);
          const mealIngredientCost = calculateMealIngredientCost(meal);
          return (
          <Card key={meal.meal_id} className="border-gray-200 overflow-hidden">
            {/* Meal Image */}
            <div className="relative w-full h-[150px] bg-gray-200">
              {!mealImages[meal.meal_id] ? (
                <div className="w-full h-full bg-gray-200 animate-pulse" />
              ) : (
                <Image 
                  src={mealImages[meal.meal_id]} 
                  alt={meal.name_en}
                  fill
                  className="object-cover"
                  loading="lazy"
                />
              )}
            </div>
            <CardHeader>
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <CardTitle className="text-xl text-gray-900">{meal.name_en}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{meal.name_bn}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getMealTypeBadgeColor(intendedMealType)}`}>
                  {intendedMealType}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ingredients List */}
              {meal.ingredients && meal.ingredients.length > 0 && (
                <div className="border-b pb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Ingredients</p>
                  <ul className="space-y-1">
                    {meal.ingredients.map((mealIngredient) => {
                      const ingredientDetails = allIngredients.find(
                        (ing) => ing.ingredient_id === mealIngredient.ingredient_id
                      );
                      if (!ingredientDetails) return null;
                      
                      const formattedQuantity = formatQuantity(
                        mealIngredient.quantity,
                        mealIngredient.unit,
                        ingredientDetails.name_en
                      );
                      
                      return (
                        <li key={mealIngredient.ingredient_id} className="text-sm text-gray-600">
                          {ingredientDetails.name_en} - {formattedQuantity}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Nutrition Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Calories</p>
                  <p className="text-lg font-semibold text-gray-900">{meal.total_nutrition.calories} cal</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cost</p>
                  <p className="text-lg font-semibold text-green-600">৳{mealIngredientCost.toFixed(2)}</p>
                </div>
              </div>

              {/* Macros */}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Macronutrients</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-600">Protein</p>
                    <p className="text-sm font-semibold text-gray-900">{meal.total_nutrition.protein_g}g</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Carbs</p>
                    <p className="text-sm font-semibold text-gray-900">{meal.total_nutrition.carbs_g}g</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Fat</p>
                    <p className="text-sm font-semibold text-gray-900">{meal.total_nutrition.fat_g}g</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Summary Section */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Daily Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Calories</p>
              <p className="text-3xl font-bold text-gray-900">{totalCalories} cal</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-3xl font-bold text-green-600">৳{totalCost.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
