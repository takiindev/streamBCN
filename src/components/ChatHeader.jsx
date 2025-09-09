import React from 'react';

const ChatHeader = ({ viewerCount, messageCount, ping }) => {
  return (
    <div className="relative">
      {/* Main Header */}
      <div className="p-4 bg-gradient-to-r from-red-600 via-blue-600 to-purple-700 text-white shadow-xl relative overflow-hidden border-b-2 border-white/20">
        {/* Animated shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-[shimmer_3s_ease-in-out_infinite]"></div>
        
        {/* Glass morphism overlay */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <h3 className="font-bold text-base lg:text-lg flex items-center gap-2 mb-3 tracking-wide">
            💬 Live Chat
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
            <div className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
              🔴 LIVE
            </div>
          </h3>
          
          <div className="text-xs flex flex-wrap gap-3 opacity-95">
            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-sm"></div>
              <span className="font-medium">{viewerCount}</span>
              <span className="opacity-80">người xem</span>
            </span>
            
            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-sm"></div>
              <span className="font-medium">{messageCount}</span>
              <span className="opacity-80">tin nhắn</span>
            </span>
            
            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full shadow-sm"></div>
              <span className="font-medium">{ping}</span>
            </span>
          </div>
        </div>
        
        {/* Bottom gradient border */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-blue-500 to-purple-500"></div>
      </div>
      
      {/* Fade overlay for messages */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-transparent to-red-600/20 pointer-events-none z-20"></div>
    </div>
  );
};

export default ChatHeader;
