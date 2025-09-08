import React, { useRef, useEffect } from 'react';

const ChatMessages = ({ messages, currentUser }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 lg:space-y-3 bg-gradient-to-b from-gray-800 to-slate-800 min-h-[300px] max-h-[400px] lg:max-h-none">
      {messages.map((message, index) => (
        <div
          key={message.id || index}
          className={`p-3 rounded-[5px] text-sm transition-all duration-200 backdrop-blur-sm ${
            message.isSystem
              ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-200 italic border-l-4 border-blue-400 shadow-lg'
              : 'bg-gradient-to-r from-gray-700/80 to-slate-700/80 text-gray-100 shadow-md border border-gray-600/50 hover:shadow-lg hover:border-gray-500/50'
          }`}
        >
          {!message.isSystem && (
            <div className="text-xs text-gray-400 mb-2 font-medium">
              <span className="text-blue-300">{message.username}</span>
              <span className="mx-2">•</span>
              <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
          )}
          <div className="break-words leading-relaxed">{message.message}</div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
