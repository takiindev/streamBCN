import React, { useRef, useEffect, useMemo } from 'react';

const ChatMessages = React.memo(({ messages, currentUser }) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  };

  // Debounced scroll to prevent layout thrashing on mobile
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Memoize messages to prevent unnecessary re-renders
  const renderedMessages = useMemo(() => {
    return messages.map((message, index) => (
      <div
        key={message.id || `msg-${index}`}
        className={`
          p-3 rounded-lg text-sm transition-all duration-200 backdrop-blur-sm
          break-words overflow-hidden
          ${message.isSystem
            ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-blue-200 italic border-l-4 border-blue-400 shadow-lg'
            : 'bg-gradient-to-r from-gray-700/90 to-slate-700/90 text-gray-100 shadow-md border border-gray-600/50'
          }
        `}
        style={{
          // Force hardware acceleration for smoother animations
          transform: 'translateZ(0)',
          willChange: 'auto'
        }}
      >
        {!message.isSystem && (
          <div className="text-xs text-gray-400 mb-2 font-medium flex items-center gap-2 flex-wrap">
            <span className="text-blue-300 truncate max-w-[120px]">{message.username}</span>
            <span className="opacity-60">•</span>
            <span className="whitespace-nowrap">
              {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}
        <div className="break-words leading-relaxed whitespace-pre-wrap">
          {message.message}
        </div>
      </div>
    ));
  }, [messages]);

  return (
    <div 
      ref={containerRef}
      className="
        flex-1 overflow-y-auto
        p-2 md:p-3 lg:p-4 
        space-y-2 lg:space-y-3 
        bg-gradient-to-b from-gray-800 to-slate-800
        min-h-[250px] max-h-[60vh] 
        md:min-h-[300px] md:max-h-[70vh]
        lg:min-h-[400px] lg:max-h-none
      "
      style={{
        // Ensure consistent background on mobile
        backgroundColor: '#1e293b',
        backgroundImage: 'linear-gradient(to bottom, #1e293b, #334155)',
        // Optimize scrolling performance
        WebkitOverflowScrolling: 'touch',
        transform: 'translateZ(0)',
        // Prevent zoom on double-tap
        touchAction: 'pan-y'
      }}
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          <div className="text-center">
            <div className="text-2xl mb-2">💬</div>
            <p>Chưa có tin nhắn nào</p>
            <p className="text-xs mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        </div>
      ) : (
        <>
          {renderedMessages}
          <div 
            ref={messagesEndRef} 
            className="h-1"
            style={{ minHeight: '1px' }}
          />
        </>
      )}
    </div>
  );
});

export default ChatMessages;
