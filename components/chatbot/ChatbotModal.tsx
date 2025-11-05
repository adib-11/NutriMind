'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Minus } from 'lucide-react';
import { type ChatMessage, type Meal, type SwapMealRequest, type SwapMealResponse } from '@/types';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import { MealSuggestionCard } from './MealSuggestionCard';

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm your NutriMind AI assistant. I can help you replace meals or answer nutrition questions. How can I help you today?",
  timestamp: new Date(),
};

export function ChatbotModal({ isOpen, onClose }: ChatbotModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get user store data
  const { mealPlan, allergies, isVegetarian, healthConditions, budget, updateMeal } = useUserStore();

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect meal swap intent from user message
  const detectMealSwapIntent = (message: string): { isMealSwap: boolean; mealType?: string; currentMealId?: string } => {
    const lowerMessage = message.toLowerCase();
    const swapKeywords = ['replace', 'change', 'swap', "don't want", "not want", "don't like", 'different'];
    
    const hasSwapIntent = swapKeywords.some(keyword => lowerMessage.includes(keyword));
    if (!hasSwapIntent) {
      return { isMealSwap: false };
    }

    // Detect meal type
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const detectedMealType = mealTypes.find(type => lowerMessage.includes(type));
    
    if (!detectedMealType || mealPlan.length === 0) {
      return { isMealSwap: false };
    }

    // Find current meal for this type
    const currentMeal = mealPlan.find(meal => 
      meal.meal_type.map(t => t.toLowerCase()).includes(detectedMealType)
    );

    if (!currentMeal) {
      return { isMealSwap: false };
    }

    console.log('[ChatBot] Swap intent detected:', { mealType: detectedMealType, currentMealId: currentMeal.meal_id });
    return { isMealSwap: true, mealType: detectedMealType, currentMealId: currentMeal.meal_id };
  };

  // Handle meal selection from suggestions
  const handleSelectMeal = (newMeal: Meal, mealType: string) => {
    console.log('[ChatBot] Meal selected:', newMeal.name_en);
    
    // Get current meal for comparison
    const currentMeal = mealPlan.find(meal => 
      meal.meal_type.map(t => t.toLowerCase()).includes(mealType.toLowerCase())
    );

    // Update meal plan using Zustand store
    updateMeal(mealType, newMeal);

    // Add confirmation message
    const comparisonText = currentMeal 
      ? `Replaced ${currentMeal.name_en} with ${newMeal.name_en}. Calories: ${currentMeal.total_nutrition.calories} → ${newMeal.total_nutrition.calories}, Cost: ৳${currentMeal.total_cost_bdt} → ৳${newMeal.total_cost_bdt}`
      : `Selected ${newMeal.name_en} for ${mealType}. Calories: ${newMeal.total_nutrition.calories}, Cost: ৳${newMeal.total_cost_bdt}`;

    const confirmationMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `✅ ${comparisonText}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, confirmationMessage]);
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        console.log('[ChatBot] Widget closed via Escape key');
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    console.log('[ChatBot] Message sent:', userMessage.content);
    const messageContent = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // Detect meal swap intent
      const swapIntent = detectMealSwapIntent(messageContent);

      if (swapIntent.isMealSwap && swapIntent.mealType && swapIntent.currentMealId) {
        // Call swap-meal API
        const requestBody: SwapMealRequest = {
          message: messageContent,
          currentMealId: swapIntent.currentMealId,
          mealType: swapIntent.mealType,
          userProfile: {
            allergies,
            isVegetarian,
            healthConditions,
            budget,
          },
        };

        console.log('[ChatBot] Calling swap-meal API:', requestBody);

        const response = await fetch('/api/chatbot/swap-meal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error('Failed to get meal suggestions');
        }

        const data: SwapMealResponse = await response.json();
        console.log('[ChatBot] Swap-meal response:', data);

        // Add assistant message with meal suggestions - store mealType in content for later use
        const botMessage: ChatMessage = {
          id: `msg_${Date.now()}_${swapIntent.mealType}`, // Encode mealType in ID
          role: 'assistant',
          content: data.explanation,
          timestamp: new Date(),
          mealSuggestions: data.suggestions,
        };

        setMessages((prev) => [...prev, botMessage]);
      } else {
        // Regular chatbot response (not a swap request)
        setTimeout(() => {
          const botMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: "I can help you replace meals from your plan. Try saying 'I don't want eggs in breakfast' or 'change my lunch'.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
          setIsLoading(false);
        }, 500);
        return;
      }
    } catch (error) {
      console.error('[ChatBot] Error:', error);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 bg-white rounded-2xl shadow-2xl flex flex-col",
        "w-[380px] transition-all duration-300",
        isMinimized ? "h-[60px]" : "h-[600px]",
        // Mobile: Take more space
        "max-sm:w-[calc(100vw-2rem)] max-sm:h-[calc(100vh-2rem)] max-sm:bottom-2 max-sm:right-2"
      )}
      style={{
        border: '1px solid #e5e7eb',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-blue-600 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <h2 className="text-base font-bold text-white">NutriMind AI</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setIsMinimized(!isMinimized);
              console.log('[ChatBot] Widget minimized/maximized');
            }}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Minimize chatbot"
          >
            <Minus className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => {
              console.log('[ChatBot] Widget closed via X button');
              onClose();
            }}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close chatbot"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Messages Area - Hidden when minimized */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col",
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2 shadow-sm",
                    message.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  )}>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Render meal suggestion cards if present */}
                {message.mealSuggestions && message.mealSuggestions.length > 0 && (
                  <div className="mt-2 space-y-2 w-full">
                    {message.mealSuggestions.map((meal) => {
                      // Extract meal type from message ID (encoded as msg_timestamp_mealType)
                      const mealType = message.id.split('_')[2] || '';
                      return (
                        <MealSuggestionCard
                          key={meal.meal_id}
                          meal={meal}
                          onSelect={(selectedMeal) => handleSelectMeal(selectedMeal, mealType)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 rounded-2xl rounded-bl-sm border border-gray-200 px-4 py-2 shadow-sm">
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className={cn(
                  "px-4 py-2 rounded-full font-semibold transition-colors flex items-center gap-1",
                  inputText.trim()
                    ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
