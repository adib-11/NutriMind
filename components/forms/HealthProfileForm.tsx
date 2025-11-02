'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function HealthProfileForm() {
  const router = useRouter();
  const { age, gender, height, weight, activityLevel, healthGoal, setData } = useUserStore();
  
  // Local state for feet and inches
  const [feet, setFeet] = useState<number | undefined>();
  const [inches, setInches] = useState<number | undefined>();

  // Convert stored height (in cm) to feet/inches on mount
  useEffect(() => {
    if (height) {
      const totalInches = height / 2.54;
      const ft = Math.floor(totalInches / 12);
      const inch = Math.round(totalInches % 12);
      setFeet(ft);
      setInches(inch);
    }
  }, []);

  // Update height in cm when feet or inches change
  const updateHeight = (newFeet?: number, newInches?: number) => {
    if (newFeet || newInches) {
      const totalInches = (newFeet || 0) * 12 + (newInches || 0);
      const cm = Math.round(totalInches * 2.54);
      setData({ height: cm });
    } else {
      setData({ height: undefined });
    }
  };

  const handleNext = () => {
    router.push('/profile/step2');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto !bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-2xl !text-gray-900">Health Profile</CardTitle>
        <CardDescription className="!text-gray-600">Tell us about yourself to create your personalized meal plan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Age */}
          <div className="space-y-2">
            <Label htmlFor="age" className="!text-gray-700">Age</Label>
            <Input
              id="age"
              type="number"
              placeholder="Enter your age"
              value={age || ''}
              onChange={(e) => setData({ age: parseInt(e.target.value) || undefined })}
              className="!bg-white !text-gray-900"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender" className="!text-gray-700">Gender</Label>
            <Select value={gender || ''} onValueChange={(value) => setData({ gender: value })}>
              <SelectTrigger id="gender" className="!bg-white !text-gray-900">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent className="!bg-white !text-gray-900">
                <SelectItem value="male" className="!text-gray-900">Male</SelectItem>
                <SelectItem value="female" className="!text-gray-900">Female</SelectItem>
                <SelectItem value="other" className="!text-gray-900">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Height - Feet and Inches */}
          <div className="space-y-2">
            <Label className="!text-gray-700">Height</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="feet"
                  type="number"
                  placeholder="Feet"
                  value={feet || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || undefined;
                    setFeet(val);
                    updateHeight(val, inches);
                  }}
                  className="!bg-white !text-gray-900"
                />
              </div>
              <div className="flex-1">
                <Input
                  id="inches"
                  type="number"
                  placeholder="Inches"
                  min="0"
                  max="11"
                  value={inches || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || undefined;
                    setInches(val);
                    updateHeight(feet, val);
                  }}
                  className="!bg-white !text-gray-900"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">Enter height in feet and inches</p>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label htmlFor="weight" className="!text-gray-700">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="Enter weight in kg"
              value={weight || ''}
              onChange={(e) => setData({ weight: parseInt(e.target.value) || undefined })}
              className="!bg-white !text-gray-900"
            />
          </div>

          {/* Activity Level */}
          <div className="space-y-2">
            <Label htmlFor="activityLevel" className="!text-gray-700">Activity Level</Label>
            <Select value={activityLevel || ''} onValueChange={(value) => setData({ activityLevel: value })}>
              <SelectTrigger id="activityLevel" className="!bg-white !text-gray-900">
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent className="!bg-white !text-gray-900">
                <SelectItem value="sedentary" className="!text-gray-900">Sedentary (little to no exercise)</SelectItem>
                <SelectItem value="light" className="!text-gray-900">Light (1-3 days/week)</SelectItem>
                <SelectItem value="moderate" className="!text-gray-900">Moderate (3-5 days/week)</SelectItem>
                <SelectItem value="active" className="!text-gray-900">Active (6-7 days/week)</SelectItem>
                <SelectItem value="very_active" className="!text-gray-900">Very Active (intense daily)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Health Goal */}
          <div className="space-y-2">
            <Label htmlFor="healthGoal" className="!text-gray-700">Health Goal</Label>
            <Select value={healthGoal || ''} onValueChange={(value) => setData({ healthGoal: value })}>
              <SelectTrigger id="healthGoal" className="!bg-white !text-gray-900">
                <SelectValue placeholder="Select health goal" />
              </SelectTrigger>
              <SelectContent className="!bg-white !text-gray-900">
                <SelectItem value="weight_loss" className="!text-gray-900">Weight Loss</SelectItem>
                <SelectItem value="weight_gain" className="!text-gray-900">Weight Gain</SelectItem>
                <SelectItem value="maintenance" className="!text-gray-900">Maintenance</SelectItem>
                <SelectItem value="muscle_gain" className="!text-gray-900">Muscle Gain</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Next Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Next
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
