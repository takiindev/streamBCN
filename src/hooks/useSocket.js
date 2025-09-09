import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const WS_URL = 'wss://stream.bancongnghe.tech';

export const useSocket = (isAuthenticated, authenticatedUser) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [showConnectionToast, setShowConnectionToast] = useState(false);
  
  const pingInterval = useRef(null);
  const reconnectTimer = useRef(null);
  const connectionToastTimer = useRef(null);

  const connectSocket = () => {
    try {
      
      setConnectionStatus('connecting');
      setShowConnectionToast(true);
      
      // Get token from authenticated user for socket connection
      const token = authenticatedUser?.access_token;
      
      const socketOptions = {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        withCredentials: true
      };
      
      // Add token to query if available
      if (token) {
        socketOptions.query = { token };
        
      }
      
      const newSocket = io(WS_URL, socketOptions);

      newSocket.on('connect', () => {
        
        setIsConnected(true);
        setConnectionStatus('connected');
        startPingTest(newSocket);
        
        // Clear any existing reconnect timer
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
        
        // Hide toast after 2 seconds with fade animation
        if (connectionToastTimer.current) {
          clearTimeout(connectionToastTimer.current);
        }
        connectionToastTimer.current = setTimeout(() => {
          setShowConnectionToast(false);
        }, 2000);
      });

      newSocket.on('disconnect', () => {
        
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setShowConnectionToast(true);
        
        if (pingInterval.current) {
          clearInterval(pingInterval.current);
          pingInterval.current = null;
        }
        
        // Start auto-reconnection
        startReconnection();
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        if (error.message && error.message.includes('Authentication')) {
          setConnectionStatus('disconnected');
          setShowConnectionToast(true);
          // Show authentication error
          alert('🔐 Lỗi xác thực - Vui lòng đăng nhập lại');
        } else {
          setIsConnected(false);
          setConnectionStatus('disconnected');
          setShowConnectionToast(true);
          // Start auto-reconnection
          startReconnection();
        }
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        alert('Lỗi Socket: ' + (error.message || 'Unknown error'));
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      startReconnection();
    }
  };

  const startReconnection = () => {
    if (reconnectTimer.current) return; // Already reconnecting
    if (!isAuthenticated || !authenticatedUser) return; // Don't reconnect if not authenticated
    
    setConnectionStatus('reconnecting');
    setShowConnectionToast(true);
    
    reconnectTimer.current = setTimeout(() => {
      
      if (socket) {
        socket.disconnect();
      }
      connectSocket();
      reconnectTimer.current = null;
    }, 3000); // Retry every 3 seconds
  };

  const startPingTest = (socketInstance) => {
    if (pingInterval.current) return;

    pingInterval.current = setInterval(() => {
      const start = Date.now();
      socketInstance.emit('ping', start, () => {
        // Ping response handled in parent component
      });
    }, 5000);
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setIsConnected(false);
    setConnectionStatus('idle');
    setShowConnectionToast(false);
    
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (connectionToastTimer.current) {
      clearTimeout(connectionToastTimer.current);
      connectionToastTimer.current = null;
    }
  };

  // Auto connect when authenticated
  useEffect(() => {
    if (isAuthenticated && authenticatedUser && !socket) {
      connectSocket();
    }
  }, [isAuthenticated, authenticatedUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  return {
    socket,
    isConnected,
    connectionStatus,
    showConnectionToast,
    disconnectSocket
  };
};
