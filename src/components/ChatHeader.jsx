import React from 'react';

const ChatHeader = ({ viewerCount, messageCount, ping }) => {
  return (
    <div className="p-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"></div>
      <div className="relative">
        <h3 className="font-bold text-base lg:text-lg flex items-center gap-2 mb-2 tracking-wide">
          💬 Live Chat
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
        </h3>
        <div className="text-xs flex flex-wrap gap-4 opacity-90">
          <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            {viewerCount} người xem
          </span>
          <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            {messageCount} tin nhắn
          </span>
          <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            {ping}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
