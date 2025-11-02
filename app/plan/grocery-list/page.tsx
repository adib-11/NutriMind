'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import GroceryListDisplay from '@/components/plan/GroceryListDisplay';

export default function GroceryListPage() {
  const router = useRouter();
  const { mealPlan } = useUserStore();

  // Redirect if no meal plan
  useEffect(() => {
    if (!mealPlan || mealPlan.length === 0) {
      router.push('/plan');
    }
  }, [mealPlan, router]);

  // Show loading or empty state while redirecting
  if (!mealPlan || mealPlan.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Grocery List</h1>
        <p className="text-gray-600 mb-8">
          All the ingredients you need for your personalized meal plan.
        </p>
        <GroceryListDisplay meals={mealPlan} />
      </div>
    </div>
  );
}
