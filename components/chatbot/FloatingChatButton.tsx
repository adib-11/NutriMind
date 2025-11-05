'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface FloatingChatButtonProps {
  onClick: () => void;
}

export function FloatingChatButton({ onClick }: FloatingChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 w-[60px] h-[60px] bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 flex items-center justify-center"
      aria-label="Open AI chatbot"
    >
      <MessageCircle className="w-7 h-7" />
    </button>
  );
}
