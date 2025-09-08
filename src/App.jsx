import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

// API server for authentication - pointing to production server
const API_URL = 'https://stream.bancongnghe.tech';
const WS_URL = 'wss://stream.bancongnghe.tech';

function App() {
  // Socket states
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // 'idle', 'connecting', 'connected', 'disconnected', 'reconnecting'
  const [showConnectionToast, setShowConnectionToast] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('test-room-001');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  // Chat states
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [ping, setPing] = useState('-');
  const [typingUsers, setTypingUsers] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  // Form states
  // removed manual userId/username fields — we now require studentID + birthDate auth
  const [studentIdInput, setStudentIdInput] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);
  const pingInterval = useRef(null);
  const reconnectTimer = useRef(null);
  const connectionToastTimer = useRef(null);
  const currentUserRef = useRef(null);

  useEffect(() => {
    // Only check authentication status on page load, don't auto-connect socket
    checkAuthenticationStatus();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (connectionToastTimer.current) {
        clearTimeout(connectionToastTimer.current);
      }
    };
  }, []);

  // Only connect socket after authentication
  useEffect(() => {
    if (isAuthenticated && authenticatedUser && !socket) {
      connectSocket();
    }
  }, [isAuthenticated, authenticatedUser]);

  // NOTE: removed auto-join. User must authenticate first, then explicitly choose/join a room.

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectSocket = () => {
    try {
      console.log('Connecting to socket...');
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
        console.log('🔑 Using token for socket authentication');
      }
      
      const newSocket = io(WS_URL, socketOptions);

      newSocket.on('connect', () => {
        console.log('Socket connected!');
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
        console.log('Socket disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setIsJoined(false);
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
          // Reset authentication
          setIsAuthenticated(false);
          setAuthenticatedUser(null);
          setCurrentUser(null);
        } else {
          setIsConnected(false);
          setConnectionStatus('disconnected');
          setShowConnectionToast(true);
          // Start auto-reconnection
          startReconnection();
        }
      });

      newSocket.on('joinedRoom', (data) => {
        console.log('Joined room successfully:', data);
        setIsJoined(true);
        const existingMessages = data.messages || [];
        setMessages(existingMessages);
        setViewerCount(data.viewerCount || 0);
        setMessageCount(existingMessages.length);
      });

      newSocket.on('newMessage', (message) => {
        console.log('New message:', message);
        setMessages(prev => [...prev, message]);
        setMessageCount(prev => prev + 1);
      });

      newSocket.on('userJoined', (data) => {
        console.log('User joined:', data);
        addSystemMessage(`${data.username} đã tham gia phòng`);
        setViewerCount(data.viewerCount);
        
        // Enable message input when we successfully join
        setIsJoined(true);
      });

      newSocket.on('userLeft', (data) => {
        console.log('User left:', data);
        addSystemMessage(`${data.username} đã rời phòng`);
        setViewerCount(data.viewerCount);
      });

      newSocket.on('typing', (data) => {
        console.log('Typing event received:', data);
        console.log('Current user:', currentUserRef.current);
        
        const otherTyping = currentUserRef.current && data.userId !== currentUserRef.current.userId;
        
        if (data.isTyping && otherTyping) {
          setTypingUsers('Có người đang soạn tin nhắn...');
        } else if (!data.isTyping || data.userId === currentUserRef.current?.userId) {
          setTypingUsers('');
        }
      });

      newSocket.on('userTyping', (data) => {
        console.log('UserTyping event received:', data);
        console.log('Current user:', currentUserRef.current);
        
        const otherTyping = currentUserRef.current && ((data.userId && data.userId !== currentUserRef.current.userId) || (data.studentId && data.studentId !== currentUserRef.current.studentId));
        
        if (data.isTyping && otherTyping) {
          setTypingUsers('Có người đang soạn tin nhắn...');
        } else if (!data.isTyping) {
          setTypingUsers('');
        }
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        alert('Lỗi Socket: ' + (error.message || 'Unknown error'));
      });

      newSocket.on('joinRoomError', (error) => {
        console.error('Join room error:', error);
        alert('Lỗi tham gia phòng: ' + (error.message || error));
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
      console.log('Attempting to reconnect...');
      if (socket) {
        socket.disconnect();
      }
      connectSocket();
      reconnectTimer.current = null;
    }, 3000); // Retry every 3 seconds
  };

  const joinRoom = async () => {
    console.log('Join room clicked');
    if (!currentRoom) {
      alert('Vui lòng nhập Room ID!');
      return;
    }

    if (!isAuthenticated || !authenticatedUser) {
      alert('Vui lòng đăng nhập trước khi tham gia phòng');
      return;
    }

    if (!socket) {
      alert('Chưa kết nối tới server. Vui lòng đăng nhập lại!');
      return;
    }

    if (!isConnected) {
      alert('Chưa kết nối tới server. Vui lòng thử lại!');
      return;
    }

    // Create currentUser object when joining room
    const userObj = {
      userId: 'user_' + Math.random().toString(36).substr(2, 9),
      username: authenticatedUser.fullName,
      studentId: authenticatedUser.studentId,
      fullName: authenticatedUser.fullName
    };

    // Set currentUser before emitting joinRoom
    setCurrentUser(userObj);
    currentUserRef.current = userObj;

    // Format data exactly like the working web version
    const joinData = {
      roomId: currentRoom.trim(),
      userId: userObj.userId,
      username: userObj.username
    };

    console.log('Emitting joinRoom with data:', joinData);
    console.log('Setting currentUser to:', userObj);
    socket.emit('joinRoom', joinData);
  };

  const authenticate = async () => {
    if (!(studentIdInput && birthDateInput)) {
      alert('Vui lòng nhập Student ID và Ngày sinh (DDMMYY)');
      return;
    }

    if (birthDateInput.length !== 6) {
      alert('Ngày sinh phải ở định dạng DDMMYY (6 ký tự)');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        studentId: studentIdInput,
        birthDate: birthDateInput,
      }, { withCredentials: true });

      if (res?.data?.user) {
        const userObj = res.data.user;
        const token = res.data.access_token || res.data.token;
        const newUser = { ...userObj, access_token: token };
        setAuthenticatedUser(newUser);
        setIsAuthenticated(true);
        
        console.log('✅ Authentication successful, will connect socket automatically');
        // Socket will be connected automatically via useEffect
        return;
      }

      alert('Đăng nhập thất bại');
    } catch (err) {
      console.error('Login error', err);
      alert('Lỗi xác thực: ' + (err?.response?.data?.message || err.message));
    }
  };

  // Check authentication status on page load (like HTML version)
  const checkAuthenticationStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/verify`, {
        withCredentials: true,
      });

      if (response.data.valid && response.data.user) {
        const userObj = response.data.user;
        setAuthenticatedUser(userObj);
        setIsAuthenticated(true);
        console.log('✅ Already authenticated, will connect socket automatically');
      }
    } catch (error) {
      console.log('Not authenticated:', error);
      // Don't show any error, just stay in login form
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Reset all state
    setAuthenticatedUser(null);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsJoined(false);
    setMessages([]);
    setMessageCount(0);
    setViewerCount(0);
    
    // Disconnect socket
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    // Clear form inputs
    setStudentIdInput('');
    setBirthDateInput('');
    setCurrentRoom('test-room-001');
    
    setConnectionStatus('idle');
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;

    // If no socket connection, add message locally for demo
    if (!socket || !isConnected) {
      const demoMessage = {
        id: Date.now(),
        username: currentUser?.fullName || 'You',
        message: messageInput.trim(),
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, demoMessage]);
      setMessageCount(prev => prev + 1);
      setMessageInput('');
      return;
    }

    console.log('Sending message:', messageInput.trim());
    // Send message in the format server expects
    socket.emit('sendMessage', {
      message: messageInput.trim(),
      type: 'text'
    });

    setMessageInput('');
    
    // Stop typing indicator when sending message
    if (socket && currentRoom && currentUser) {
      socket.emit('typing', { 
        roomId: currentRoom, 
        userId: currentUser.userId,
        username: currentUser.username,
        isTyping: false 
      });
    }
  };

  const addSystemMessage = (text) => {
    const systemMessage = {
      id: Date.now(),
      message: text,
      username: 'System',
      timestamp: new Date().toISOString(),
      isSystem: true
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const startTyping = () => {
    if (!socket || !currentRoom || !currentUser || !isJoined) return;

    socket.emit('typing', {
      roomId: currentRoom,
      userId: currentUser.userId,
      username: currentUser.username,
      isTyping: true
    });
  };

  const stopTyping = () => {
    if (!socket || !currentRoom || !currentUser) return;

    socket.emit('typing', {
      roomId: currentRoom,
      userId: currentUser.userId,
      username: currentUser.username,
      isTyping: false
    });
  };

  const startPingTest = (socketInstance) => {
    if (pingInterval.current) return;

    pingInterval.current = setInterval(() => {
      const start = Date.now();
      socketInstance.emit('ping', start, () => {
        const pingTime = Date.now() - start;
        setPing(pingTime + ' ms');
      });
    }, 5000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      // Stop typing indicator when sending message
      if (socket && currentRoom && currentUser && isJoined) {
        socket.emit('typing', { 
          roomId: currentRoom, 
          userId: currentUser.userId,
          username: currentUser.username,
          isTyping: false 
        });
      }
      sendMessage();
    }
  };

  // Separate function for handling input changes (typing indicator)
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    // Start typing indicator
    if (socket && currentRoom && currentUser && isJoined) {
      console.log('Emitting typing event: isTyping = true');
      socket.emit('typing', { 
        roomId: currentRoom, 
        userId: currentUser.userId,
        username: currentUser.username,
        isTyping: true 
      });

      // Clear existing typing timer
      clearTimeout(typingTimer.current);
      
      // Set timer to stop typing after 2 seconds (like HTML version)
      typingTimer.current = setTimeout(() => {
        if (socket && currentRoom && currentUser) {
          console.log('Timeout: Emitting typing event: isTyping = false');
          socket.emit('typing', { 
            roomId: currentRoom, 
            userId: currentUser.userId,
            username: currentUser.username,
            isTyping: false 
          });
        }
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white font-['Inter',sans-serif] main-container">
      {/* Connection Status Toast - Only show when actually connecting/connected */}
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
      
      <div className="flex flex-col lg:flex-row lg:h-screen lg:gap-6 lg:p-4">
        {/* Video Section */}
        <div className="flex-1 flex flex-col rounded-[5px] overflow-hidden shadow-lg">
          {/* Video Player */}
          <div className="flex-1 bg-black relative overflow-hidden shadow-2xl h-80 lg:h-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 z-10 pointer-events-none"></div>
            <iframe
              className="w-full aspect-[951/535] lg:h-full object-cover" 
              src="https://www.youtube-nocookie.com/embed/4xDzrJKXOOY?autoplay=1&mute=1" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerPolicy="strict-origin-when-cross-origin" 
              allowFullScreen 
            />
          </div>

          {/* Video Info */}
          <div className="p-4 lg:p-6 bg-gradient-to-r from-slate-800 via-gray-800 to-slate-700 border-t border-gray-600 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <div className="relative max-w-4xl mx-auto">
              <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-red-400 via-pink-500 to-rose-400 bg-clip-text text-transparent mb-3 tracking-wide">
                🔴 LiveStream Chat Demo
              </h1>
              <p className="text-sm lg:text-base text-gray-300 leading-relaxed font-medium">
                Trải nghiệm chat realtime với WebSocket và messaging tức thời
              </p>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-full lg:w-96 bg-gradient-to-b from-slate-800 to-gray-800 border-t lg:border-t-0 lg:border-l border-gray-600 flex flex-col lg:max-h-none shadow-2xl rounded-[5px] overflow-hidden">
          {!isJoined ? (
            /* Login Form */
            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 bg-gradient-to-br from-slate-800 via-gray-800 to-slate-700 relative overflow-hidden rounded-[5px]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
              <div className="relative text-center mb-6">
                <h3 className="text-lg lg:text-xl font-bold text-white mb-3 tracking-wide">Tham gia Chat</h3>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto rounded-full shadow-lg"></div>
              </div>

              <div className="relative space-y-4">
                {!isAuthenticated ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-200 tracking-wide">Student ID:</label>
                      <input
                        type="text"
                        value={studentIdInput}
                        onChange={(e) => setStudentIdInput(e.target.value)}
                        className="w-full p-3 border-2 border-gray-600 rounded-[5px] bg-gray-700/80 backdrop-blur-sm text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 placeholder-gray-400 shadow-inner"
                        placeholder="Nhập mã sinh viên"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-200 tracking-wide">Ngày sinh (DDMMYY):</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={birthDateInput}
                        onChange={(e) => setBirthDateInput(e.target.value)}
                        className="w-full p-3 border-2 border-gray-600 rounded-[5px] bg-gray-700/80 backdrop-blur-sm text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 placeholder-gray-400 shadow-inner"
                        placeholder="Ví dụ: 150807"
                      />
                    </div>

                    <div>
                      <button
                        onClick={authenticate}
                        className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 px-4 py-3 rounded-[5px] text-white font-semibold text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                      >
                        🔐 Đăng nhập
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-200 tracking-wide">Room ID:</label>
                      <input
                        type="text"
                        value={currentRoom}
                        onChange={(e) => setCurrentRoom(e.target.value)}
                        className="w-full p-3 border-2 border-gray-600 rounded-[5px] bg-gray-700/80 backdrop-blur-sm text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 placeholder-gray-400 shadow-inner"
                        placeholder="Nhập room ID"
                      />
                    </div>

                    <div>
                      <button
                        onClick={joinRoom}
                        className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 px-4 py-3 rounded-[5px] text-white font-semibold text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                      >
                        🚀 Tham gia phòng chat
                      </button>
                    </div>

                    <div>
                      <button
                        onClick={logout}
                        className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-4 py-3 rounded-[5px] text-white font-semibold text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-xl mt-2"
                      >
                        🚪 Đăng xuất
                      </button>
                    </div>

                    <div className="mt-3 text-sm text-gray-300">Đăng nhập dưới tên: <span className="text-white font-semibold">{authenticatedUser?.fullName || authenticatedUser?.username}</span></div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Chat Interface */
            <>
              {/* Chat Header */}
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

              {/* Messages */}
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

              {/* Typing Indicator */}
              {typingUsers && (
                <div className="px-3 lg:px-4 py-3 text-xs text-gray-400 italic bg-gradient-to-r from-gray-800 to-slate-800 border-t border-gray-600/50">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-gray-300 animate-pulse">{typingUsers}</span>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="p-3 lg:p-4 border-t border-gray-600 bg-gradient-to-r from-slate-800 to-gray-800 shadow-inner">
                <div className="flex gap-2 lg:gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn..."
                    maxLength={500}
                    className="flex-1 p-3 border-2 border-gray-600 rounded-[5px] bg-gray-700/80 backdrop-blur-sm text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 disabled:bg-gray-800/50 disabled:opacity-50 placeholder-gray-400 shadow-inner"
                    disabled={!isConnected}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!isConnected || !messageInput.trim()}
                    className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-[5px] disabled:from-gray-600 disabled:to-gray-700 text-sm hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl relative overflow-hidden group"
                  >
                    <span className="relative z-10">📤</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App
