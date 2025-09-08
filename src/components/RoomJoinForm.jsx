import React from 'react';

const RoomJoinForm = ({ 
  currentRoom, 
  setCurrentRoom, 
  authenticatedUser, 
  onJoinRoom, 
  onLogout 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onJoinRoom();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onJoinRoom();
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 bg-gradient-to-br from-slate-800 via-gray-800 to-slate-700 relative overflow-hidden rounded-[5px]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
      <div className="relative text-center mb-6">
        <h3 className="text-lg lg:text-xl font-bold text-white mb-3 tracking-wide">💬 Tham gia phòng chat</h3>
        <div className="w-16 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto rounded-full shadow-lg"></div>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-200 tracking-wide">🏠 Room ID:</label>
          <input
            type="text"
            value={currentRoom}
            onChange={(e) => setCurrentRoom(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full p-3 border-2 border-gray-600 rounded-[5px] bg-gray-700/80 backdrop-blur-sm text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 placeholder-gray-400 shadow-inner"
            placeholder="Nhập room ID"
            required
          />
        </div>

        <div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 px-4 py-3 rounded-[5px] text-white font-semibold text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
          >
            🚀 Tham gia phòng chat
          </button>
        </div>

        <div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-4 py-3 rounded-[5px] text-white font-semibold text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-xl mt-2"
          >
            🚪 Đăng xuất
          </button>
        </div>

        <div className="mt-3 text-sm text-gray-300">
          Đăng nhập dưới tên: <span className="text-white font-semibold">{authenticatedUser?.fullName || authenticatedUser?.username}</span>
        </div>
      </form>
    </div>
  );
};

export default RoomJoinForm;
