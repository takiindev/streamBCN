const MessageInput = ({ 
  messageInput, 
  onInputChange, 
  onSendMessage, 
  isConnected 
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSendMessage();
  };

  return (
    <div className="p-3 lg:p-4 border-t border-gray-600 bg-gradient-to-r from-slate-800 to-gray-800 shadow-inner">
      <form onSubmit={handleSubmit} className="flex gap-2 lg:gap-3">
          <input
            type="text"
            value={messageInput}
            onChange={onInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            maxLength={500}
            className="w-full p-3 rounded-[5px] text-white text-sm transition-all duration-300 disabled:opacity-50 placeholder-gray-400"
            disabled={!isConnected}
          />
        <button
          type="submit"
          disabled={!isConnected || !messageInput.trim()}
          className="px-4 py-3 bg-gradient-to-r from-red-600 via-blue-600 to-purple-600 text-white rounded-[5px] disabled:from-gray-600 disabled:to-gray-700 text-sm hover:from-red-700 hover:via-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl relative overflow-hidden group"
        >
          <span className="relative z-10">📤</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
