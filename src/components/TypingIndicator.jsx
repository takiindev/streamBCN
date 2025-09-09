import React from 'react';

const TypingIndicator = ({ typingUsers }) => {
  if (!typingUsers) return null;

  return (
    <div className="hidden px-3 lg:px-4 py-3 text-xs text-gray-400 italic bg-gradient-to-r from-gray-800 to-slate-800 border-t border-gray-600/50">
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
        <span className="text-gray-300 animate-pulse">{typingUsers}</span>
      </div>
    </div>
  );
};

export default TypingIndicator;
