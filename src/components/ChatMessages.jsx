import React, { useRef, useEffect, useMemo, useCallback } from 'react';

const ChatMessages = ({ messages, currentUser }) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  // Throttled scroll to prevent excessive calls
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && containerRef.current) {
      // Use requestAnimationFrame to optimize scroll timing
      requestAnimationFrame(() => {
        try {
          // Try scrollIntoView first
          messagesEndRef.current?.scrollIntoView({ 
            behavior: "smooth",
            block: "end"
          });
          
          // Backup method - direct scroll
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        } catch (error) {
          // Fallback if scrollIntoView fails
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        }
      });
    }
  }, []);

  // Only scroll when new messages are added, not on every render
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      lastMessageCountRef.current = messages.length;
      
      // Debounce scroll to prevent multiple calls
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, scrollToBottom]);

  // Ensure scroll to bottom on initial mount
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 300); // Give time for layout to settle
    }
  }, []);

  // Heavy optimization: Only re-render when messages actually change
  const renderedMessages = useMemo(() => {
    return messages.map((message, index) => {
      // Use stable keys to prevent unnecessary re-renders
      const messageKey = message.id || `${message.timestamp}-${index}`;
      
      return (
        <div
          key={messageKey}
          className={`
            p-3 rounded-lg text-sm transition-none
            break-words overflow-hidden w-full max-w-full
            ${message.isSystem
              ? 'bg-blue-600/30 text-blue-200 italic border-l-4 border-blue-400'
              : 'bg-gray-700/90 text-gray-100 border border-gray-600/50'
            }
          `}
          style={{
            // Force consistent rendering
            backgroundColor: message.isSystem ? 'rgba(37, 99, 235, 0.3)' : 'rgba(55, 65, 81, 0.9)',
            // Prevent layout shift and overflow
            contain: 'layout style',
            willChange: 'auto',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          {!message.isSystem && (
            <div className="text-xs text-gray-400 mb-2 font-medium flex items-center gap-2 overflow-hidden">
              <span className="text-blue-300 truncate max-w-[120px] flex-shrink-0">{message.username}</span>
              <span className="opacity-60 flex-shrink-0">•</span>
              <span className="whitespace-nowrap flex-shrink-0">
                {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
          <div className="break-words leading-relaxed whitespace-pre-wrap overflow-hidden max-w-full" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {message.message}
          </div>
        </div>
      );
    });
  }, [messages]); // Only depend on messages, not other props

  return (
    <div 
      ref={containerRef}
      className="
        h-full overflow-y-auto overflow-x-hidden
        p-2 md:p-3 lg:p-4 
        space-y-2 lg:space-y-3 
        bg-gradient-to-b from-gray-800 to-slate-800
        min-h-0
        relative
        scroll-smooth
      "
      style={{
        // Ensure consistent background on mobile - FORCE IT!
        backgroundColor: '#1e293b !important',
        backgroundImage: 'linear-gradient(to bottom, #1e293b, #334155) !important',
        // Critical performance optimizations for mobile
        WebkitOverflowScrolling: 'touch',
        transform: 'translateZ(0)',
        // Prevent layout thrashing
        contain: 'layout style paint',
        // Prevent repaints during scroll
        willChange: 'scroll-position',
        // Force consistent rendering
        isolation: 'isolate',
        // Fix overflow issues - CRITICAL: Don't let it expand beyond parent
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        // PREVENT 100vh expansion - stay within flex container
        maxHeight: '100%',
        minHeight: '0px'
      }}
    >
      {/* Fade gradient when scrolled to top */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-800 via-gray-800/70 to-transparent pointer-events-none z-10 opacity-80"></div>
      
      {messages.length === 0 ? (
        <div 
          className="flex items-center justify-center h-full text-gray-400 text-sm"
          style={{ 
            contain: 'layout style',
            backgroundColor: 'transparent'
          }}
        >
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
            style={{ 
              minHeight: '1px',
              contain: 'layout size'
            }}
          />
        </>
      )}
    </div>
  );
};

export default ChatMessages;
