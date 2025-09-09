import React from 'react';

const ChatHeader = ({ viewerCount, messageCount, ping }) => {
  return (
    <div className="relative">
      {/* Main Header */}
      <div className="p-4 bg-gradient-to-r from-red-600 via-blue-600 to-purple-700 text-white shadow-xl relative">
        {/* Content */}
        <div className="relative z-10">
          <h3 className="font-bold text-base lg:text-lg flex items-center gap-2 mb-3 tracking-wide">
            💬 Live Chat
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <div className="ml-auto text-xs bg-black/30 px-2 py-1 rounded-full">
              🔴 LIVE
            </div>
          </h3>
          
          <div className="text-xs flex flex-wrap gap-3">
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              <span className="font-medium">{viewerCount}</span>
              <span>người xem</span>
            </span>
            
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              <span className="font-medium">{messageCount}</span>
              <span>tin nhắn</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
