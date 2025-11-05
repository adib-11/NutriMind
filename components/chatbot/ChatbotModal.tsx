'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Minus } from 'lucide-react';
import { type ChatMessage } from '@/types';
import { cn } from '@/lib/utils';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    console.log('[ChatBot] Message sent:', userMessage.content);
    setInputText('');

    // TODO: Story 2.2 will implement AI response logic
    // For now, just acknowledge the message
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: "I'm currently in development mode. Full AI responses will be available in the next update!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);
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
                  "flex",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
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
              </div>
            ))}
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
