import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

// Assumption: auth API is hosted alongside socket server. Change if different.
const API_URL = 'http://192.168.11.182:3000';

function Stream() {
  // Socket states
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('stream-room-001');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  useEffect(() => {
  // no default user — user must authenticate with studentID/password

    // Auto connect and join
    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
    };
  }, []);

  // NOTE: removed auto-join. User must authenticate first, then explicitly choose/join a room.

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectSocket = () => {
    try {
      console.log('Connecting to socket...');
      const newSocket = io('http://192.168.11.182:3000', {
        transports: ['websocket'],
        timeout: 20000,
      });

      newSocket.on('connect', () => {
        console.log('Socket connected!');
        setIsConnected(true);
        startPingTest(newSocket);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
        setIsJoined(false);
        if (pingInterval.current) {
          clearInterval(pingInterval.current);
          pingInterval.current = null;
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
      });

      newSocket.on('userLeft', (data) => {
        console.log('User left:', data);
        addSystemMessage(`${data.username} đã rời phòng`);
        setViewerCount(data.viewerCount);
      });

      newSocket.on('userTyping', (data) => {
        const otherTyping = currentUser && ((data.userId && data.userId !== currentUser.userId) || (data.studentId && data.studentId !== currentUser.studentId));
        if (data.isTyping && otherTyping) {
          setTypingUsers(`${data.username || data.fullName} đang nhập...`);
        } else {
          setTypingUsers('');
        }
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        alert('Lỗi Socket: ' + error.message);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
        // Fallback to demo mode if can't connect
        setTimeout(() => {
          console.log('Enabling demo mode...');
          setIsJoined(true);
          setViewerCount(Math.floor(Math.random() * 50) + 20);
          setMessages([
            { id: 1, username: 'Demo', message: 'Chào mừng đến với chat demo!', timestamp: new Date().toISOString() },
            { id: 2, username: 'System', message: 'Server không khả dụng, đang chạy ở chế độ demo', timestamp: new Date().toISOString(), isSystem: true }
          ]);
        }, 3000);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    }
  };

  const joinRoom = async () => {
    console.log('Join room clicked');
    if (!currentRoom) {
      alert('Vui lòng nhập Room ID!');
      return;
    }

    if (!isAuthenticated || !currentUser) {
      alert('Vui lòng đăng nhập trước khi tham gia phòng');
      return;
    }

    if (!socket) {
      connectSocket();
      alert('Đang kết nối tới server, vui lòng thử lại trong giây lát');
      return;
    }

    if (!isConnected) {
      alert('Chưa kết nối tới server. Vui lòng thử lại!');
      return;
    }

    console.log('Emitting joinRoom with authenticated user', currentUser);
    socket.emit('joinRoom', { roomId: currentRoom, user: currentUser, token: currentUser?.access_token });
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
        setCurrentUser(newUser);
        setIsAuthenticated(true);
        // ensure socket is connecting so user can join when ready
        if (!socket) connectSocket();
        return;
      }

      alert('Đăng nhập thất bại');
    } catch (err) {
      console.error('Login error', err);
      alert('Lỗi xác thực: ' + (err?.response?.data?.message || err.message));
    }
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
    socket.emit('sendMessage', {
      roomId: currentRoom,
      message: messageInput.trim(),
      type: 'text',
      user: currentUser
    });

    setMessageInput('');
    stopTyping();
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
    if (!socket || !currentRoom || !currentUser) return;

    socket.emit('typing', {
      roomId: currentRoom,
      user: currentUser,
      isTyping: true
    });
  };

  const stopTyping = () => {
    if (!socket || !currentRoom || !currentUser) return;

    socket.emit('typing', {
      roomId: currentRoom,
      user: currentUser,
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
      sendMessage();
    } else {
      startTyping();

      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(stopTyping, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white font-['Inter',sans-serif] main-container">
      <div className="flex flex-col lg:flex-row h-screen gap-6 p-4 ">
        {/* Video Section */}
        <div className="flex-1 flex flex-col rounded-[5px] overflow-hidden shadow-lg">
          {/* Connection Status */}
          <div className={`p-3 text-center text-sm font-semibold transition-all duration-300 relative overflow-hidden ${
            isConnected 
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg' 
              : 'bg-gradient-to-r from-red-500 to-rose-600 shadow-lg'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
            <div className="relative flex items-center justify-center gap-2">
              {isConnected ? (
                <>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-sm"></div>
                  <span className="font-medium tracking-wide">Kết nối WebSocket thành công</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
                  <span className="font-medium tracking-wide">Đang kết nối WebSocket...</span>
                </>
              )}
            </div>
          </div>

          {/* Video Player */}
          <div className="flex-1 bg-black relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 z-10 pointer-events-none"></div>
            <iframe
              className="w-full h-full object-cover" 
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
        <div className="w-full lg:w-96 bg-gradient-to-b from-slate-800 to-gray-800 border-t lg:border-t-0 lg:border-l border-gray-600 flex flex-col max-h-[40vh] lg:max-h-none shadow-2xl rounded-[5px] overflow-hidden">
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

                    <div className="mt-3 text-sm text-gray-300">Đăng nhập dưới tên: <span className="text-white font-semibold">{currentUser?.fullName || currentUser?.username}</span></div>
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
              <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 lg:space-y-3 bg-gradient-to-b from-gray-800 to-slate-800">
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
                    <span className="text-gray-300">{typingUsers}</span>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="p-3 lg:p-4 border-t border-gray-600 bg-gradient-to-r from-slate-800 to-gray-800 shadow-inner">
                <div className="flex gap-2 lg:gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
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

export default Stream;