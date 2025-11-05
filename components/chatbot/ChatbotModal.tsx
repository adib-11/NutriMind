'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        console.log('[ChatBot] Modal closed via Escape key');
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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => {
          console.log('[ChatBot] Modal closed via backdrop click');
          onClose();
        }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "bg-white rounded-lg shadow-2xl w-full max-w-[600px] max-h-[80vh] flex flex-col",
            "md:w-[600px]", // Desktop: fixed 600px width
            "w-full h-full max-h-none md:h-auto md:max-h-[80vh]" // Mobile: full screen
          )}
          onClick={(e) => e.stopPropagation()} // Prevent backdrop click
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">🤖 NutriMind AI Assistant</h2>
            <button
              onClick={() => {
                console.log('[ChatBot] Modal closed via X button');
                onClose();
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close chatbot"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.role === 'user'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
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
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className={cn(
                  "px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2",
                  inputText.trim()
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
