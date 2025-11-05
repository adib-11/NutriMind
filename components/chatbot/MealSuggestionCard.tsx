'use client';

import React from 'react';
import { Meal } from '@/types';
import { Card } from '@/components/ui/card';

interface MealSuggestionCardProps {
  meal: Meal;
  onSelect: (meal: Meal) => void;
}

export function MealSuggestionCard({ meal, onSelect }: MealSuggestionCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow bg-white">
      <h4 className="font-semibold text-lg text-gray-900">{meal.name_en}</h4>
      <div className="flex justify-between mt-2 text-sm text-gray-700">
        <span>{meal.total_nutrition.calories} cal</span>
        <span>৳{meal.total_cost_bdt}</span>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {meal.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
            {tag}
          </span>
        ))}
      </div>
      <button
        onClick={() => onSelect(meal)}
        className="w-full mt-3 bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-md hover:from-green-700 hover:to-blue-700 transition-colors font-medium"
      >
        Select This Meal
      </button>
    </Card>
  );
}
