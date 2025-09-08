import React from 'react';

const ConnectionToast = ({ connectionStatus, showConnectionToast }) => {
  if (!showConnectionToast || connectionStatus === 'idle') return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-500 transform ${
      showConnectionToast && connectionStatus !== 'idle' ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
    }`}>
      {(connectionStatus === 'connecting' || connectionStatus === 'connected' || connectionStatus === 'reconnecting' || connectionStatus === 'disconnected') && connectionStatus !== 'idle' && (
        <div className={`p-4 rounded-lg shadow-xl ${
          connectionStatus === 'connected' 
            ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
            : connectionStatus === 'reconnecting'
            ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
            : 'bg-gradient-to-r from-red-500 to-rose-600'
        }`}>
          <div className="flex items-center gap-3 text-white text-sm font-medium">
            {connectionStatus === 'connected' ? (
              <>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>Kết nối WebSocket thành công</span>
              </>
            ) : connectionStatus === 'reconnecting' ? (
              <>
                <div className="w-2 h-2 bg-white rounded-full animate-spin"></div>
                <span>Đang kết nối lại...</span>
              </>
            ) : connectionStatus === 'connecting' ? (
              <>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse opacity-60"></div>
                <span>Đang kết nối WebSocket...</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
                <span>Mất kết nối - Đang thử lại...</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionToast;
