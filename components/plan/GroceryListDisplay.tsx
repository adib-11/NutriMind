'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { type Meal, type Ingredient } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ingredientsData from '@/data/ingredients.json';

interface GroceryListDisplayProps {
  meals: Meal[];
}

interface AggregatedIngredient {
  ingredient: Ingredient;
  totalQuantity: number;
  unit: string;
  cost: number;
}

export default function GroceryListDisplay({ meals }: GroceryListDisplayProps) {
  const router = useRouter();
  const allIngredients: Ingredient[] = ingredientsData;

  // Aggregate ingredients from all meals
  const aggregatedIngredients = useMemo(() => {
    const ingredientMap = new Map<string, AggregatedIngredient>();

    // Loop through all meals and their ingredients
    meals.forEach((meal) => {
      meal.ingredients.forEach((mealIngredient) => {
        const ingredientDetails = allIngredients.find(
          (ing) => ing.id === mealIngredient.ingredient_id
        );

        if (!ingredientDetails) {
          console.warn(`Ingredient ${mealIngredient.ingredient_id} not found`);
          return;
        }

        const key = mealIngredient.ingredient_id;

        if (ingredientMap.has(key)) {
          // Add to existing quantity
          const existing = ingredientMap.get(key)!;
          
          // Handle unit conversion if needed
          let additionalQuantity = mealIngredient.quantity;
          
          // Simple unit conversion for common cases
          if (ingredientDetails.unit === 'kg' && mealIngredient.unit === 'g') {
            additionalQuantity = mealIngredient.quantity / 1000;
          } else if (ingredientDetails.unit === 'litre' && mealIngredient.unit === 'ml') {
            additionalQuantity = mealIngredient.quantity / 1000;
          }

          existing.totalQuantity += additionalQuantity;
          // Recalculate cost
          existing.cost = existing.totalQuantity * ingredientDetails.price_bdt;
        } else {
          // Create new entry
          let quantity = mealIngredient.quantity;
          let unit = mealIngredient.unit;

          // Convert to base unit if needed
          if (ingredientDetails.unit === 'kg' && mealIngredient.unit === 'g') {
            quantity = mealIngredient.quantity / 1000;
            unit = 'kg';
          } else if (ingredientDetails.unit === 'litre' && mealIngredient.unit === 'ml') {
            quantity = mealIngredient.quantity / 1000;
            unit = 'litre';
          }

          ingredientMap.set(key, {
            ingredient: ingredientDetails,
            totalQuantity: quantity,
            unit: unit,
            cost: quantity * ingredientDetails.price_bdt,
          });
        }
      });
    });

    return Array.from(ingredientMap.values());
  }, [meals, allIngredients]);

  // Calculate total grocery cost
  const totalGroceryCost = aggregatedIngredients.reduce(
    (sum, item) => sum + item.cost,
    0
  );

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <button
          onClick={() => router.push('/plan')}
          className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors shadow-md"
        >
          ← Back to Meal Plan
        </button>
      </div>

      {/* Ingredients List */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900">Ingredients</CardTitle>
          <p className="text-sm text-gray-600">All ingredients needed for your meal plan</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aggregatedIngredients.map((item) => (
              <div
                key={item.ingredient.id}
                className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.ingredient.name}</h3>
                  <p className="text-sm text-gray-600">{item.ingredient.name_bn}</p>
                </div>
                <div className="text-right mr-6">
                  <p className="font-semibold text-gray-900">
                    {item.totalQuantity.toFixed(2)} {item.unit}
                  </p>
                </div>
                <div className="text-right min-w-[100px]">
                  <p className="font-semibold text-green-600">৳{item.cost.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Total Cost Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Total Grocery Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <p className="text-lg text-gray-700">Estimated total for all ingredients</p>
            <p className="text-4xl font-bold text-green-600">৳{totalGroceryCost.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
