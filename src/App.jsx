import { useState, useEffect, useRef } from 'react';
import { useSocket } from './hooks/useSocket';
import { authService } from './services/authService';
import { chatService } from './services/chatService';
import ConnectionToast from './components/ConnectionToast';
import LoginForm from './components/LoginForm';
import RoomJoinForm from './components/RoomJoinForm';
import ChatHeader from './components/ChatHeader';
import ChatMessages from './components/ChatMessages';
import TypingIndicator from './components/TypingIndicator';
import MessageInput from './components/MessageInput';

function App() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');

  // Room and chat states
  const [currentRoom, setCurrentRoom] = useState('test-room-001');
  const [currentUser, setCurrentUser] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [ping, setPing] = useState('-');
  const [typingUsers, setTypingUsers] = useState('');

  // Socket connection
  const { socket, isConnected, connectionStatus, showConnectionToast, disconnectSocket } = useSocket(isAuthenticated, authenticatedUser);

  // Refs
  const typingTimer = useRef(null);
  const currentUserRef = useRef(null);

  // Check authentication on page load
  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleJoinedRoom = (data) => {
      console.log('Joined room successfully:', data);
      setIsJoined(true);
      const existingMessages = data.messages || [];
      setMessages(existingMessages);
      setViewerCount(data.viewerCount || 0);
      setMessageCount(existingMessages.length);
    };

    const handleNewMessage = (message) => {
      console.log('New message:', message);
      setMessages(prev => [...prev, message]);
      setMessageCount(prev => prev + 1);
    };

    const handleUserJoined = (data) => {
      console.log('User joined:', data);
      addSystemMessage(`${data.username} đã tham gia phòng`);
      setViewerCount(data.viewerCount);
      setIsJoined(true);
    };

    const handleUserLeft = (data) => {
      console.log('User left:', data);
      addSystemMessage(`${data.username} đã rời phòng`);
      setViewerCount(data.viewerCount);
    };

    const handleTyping = (data) => {
      console.log('Typing event received:', data);
      const otherTyping = currentUserRef.current && data.userId !== currentUserRef.current.userId;
      
      if (data.isTyping && otherTyping) {
        setTypingUsers('Có người đang soạn tin nhắn...');
      } else if (!data.isTyping || data.userId === currentUserRef.current?.userId) {
        setTypingUsers('');
      }
    };

    const handlePong = (timestamp) => {
      const pingTime = Date.now() - timestamp;
      setPing(pingTime + ' ms');
    };

    const handleJoinRoomError = (error) => {
      console.error('Join room error:', error);
      alert('Lỗi tham gia phòng: ' + (error.message || error));
    };

    // Add event listeners
    socket.on('joinedRoom', handleJoinedRoom);
    socket.on('newMessage', handleNewMessage);
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);
    socket.on('typing', handleTyping);
    socket.on('userTyping', handleTyping);
    socket.on('pong', handlePong);
    socket.on('joinRoomError', handleJoinRoomError);

    // Cleanup
    return () => {
      socket.off('joinedRoom', handleJoinedRoom);
      socket.off('newMessage', handleNewMessage);
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
      socket.off('typing', handleTyping);
      socket.off('userTyping', handleTyping);
      socket.off('pong', handlePong);
      socket.off('joinRoomError', handleJoinRoomError);
    };
  }, [socket]);

  const checkAuthenticationStatus = async () => {
    try {
      const user = await authService.verify();
      if (user) {
        setAuthenticatedUser(user);
        setIsAuthenticated(true);
        console.log('✅ Already authenticated, will connect socket automatically');
      }
    } catch (error) {
      console.log('Not authenticated:', error);
    }
  };

  const handleLogin = async () => {
    if (!studentIdInput || !birthDateInput) {
      alert('Vui lòng nhập Student ID và Ngày sinh (DDMMYY)');
      return;
    }

    if (birthDateInput.length !== 6) {
      alert('Ngày sinh phải ở định dạng DDMMYY (6 ký tự)');
      return;
    }

    try {
      const user = await authService.login(studentIdInput, birthDateInput);
      setAuthenticatedUser(user);
      setIsAuthenticated(true);
      console.log('✅ Authentication successful, will connect socket automatically');
    } catch (error) {
      alert('Lỗi xác thực: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    
    // Reset all state
    setAuthenticatedUser(null);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsJoined(false);
    setMessages([]);
    setMessageCount(0);
    setViewerCount(0);
    setStudentIdInput('');
    setBirthDateInput('');
    setCurrentRoom('test-room-001');
    
    // Disconnect socket
    disconnectSocket();
  };

  const handleJoinRoom = async () => {
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

    // Create user object
    const userObj = {
      userId: chatService.generateUserId(),
      username: authenticatedUser.fullName,
      studentId: authenticatedUser.studentId,
      fullName: authenticatedUser.fullName
    };

    setCurrentUser(userObj);
    currentUserRef.current = userObj;

    // Join room
    const joinData = {
      roomId: currentRoom.trim(),
      userId: userObj.userId,
      username: userObj.username
    };

    chatService.joinRoom(socket, joinData);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    if (!socket || !isConnected) {
      // Add demo message if not connected
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

    // Send message via socket
    chatService.sendMessage(socket, messageInput);
    setMessageInput('');
    
    // Stop typing indicator
    if (currentUser) {
      chatService.sendTyping(socket, { 
        roomId: currentRoom, 
        userId: currentUser.userId,
        username: currentUser.username,
        isTyping: false 
      });
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    // Start typing indicator
    if (socket && currentRoom && currentUser && isJoined) {
      chatService.sendTyping(socket, { 
        roomId: currentRoom, 
        userId: currentUser.userId,
        username: currentUser.username,
        isTyping: true 
      });

      // Clear existing typing timer
      clearTimeout(typingTimer.current);
      
      // Set timer to stop typing after 2 seconds
      typingTimer.current = setTimeout(() => {
        if (socket && currentRoom && currentUser) {
          chatService.sendTyping(socket, { 
            roomId: currentRoom, 
            userId: currentUser.userId,
            username: currentUser.username,
            isTyping: false 
          });
        }
      }, 2000);
    }
  };

  const addSystemMessage = (text) => {
    const systemMessage = chatService.createSystemMessage(text);
    setMessages(prev => [...prev, systemMessage]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white font-['Inter',sans-serif] main-container">
      <ConnectionToast 
        connectionStatus={connectionStatus} 
        showConnectionToast={showConnectionToast} 
      />
      
      <div className="flex flex-col lg:flex-row lg:h-screen lg:gap-6 lg:p-4">
        {/* Video Section */}
        <div className="flex-1 flex flex-col rounded-[5px] overflow-hidden shadow-lg">
          {/* Video Player */}
          <div className="flex-1 bg-black relative overflow-hidden shadow-2xl h-80 lg:h-auto">
            {/* Inner container */}
            <div className="relative w-full h-full bg-black rounded-[5px] overflow-hidden">
              {/* Animated Border */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 animate-[shimmer_3s_ease-in-out_infinite]"></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-pink-500 to-blue-500 animate-[shimmer_3s_ease-in-out_infinite_reverse]"></div>
                <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-red-500 animate-[shimmer-vertical_3s_ease-in-out_infinite]"></div>
                <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-red-500 via-pink-500 to-blue-500 animate-[shimmer-vertical_3s_ease-in-out_infinite_reverse]"></div>
              </div>

              {/* Floating Icons */}
              <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                {/* Top Left Icons */}
                <div className="absolute top-4 left-4 text-2xl animate-bounce">🎥</div>
                <div className="absolute top-8 left-16 text-lg animate-pulse text-blue-400">✨</div>
                
                {/* Top Right Icons */}
                <div className="absolute top-4 right-4 text-2xl animate-bounce delay-1000">🔴</div>
                <div className="absolute top-8 right-16 text-lg animate-pulse text-red-400 delay-500">⭐</div>
                
                {/* Bottom Left Icons */}
                <div className="absolute bottom-4 left-4 text-xl animate-pulse text-purple-400">🎬</div>
                <div className="absolute bottom-8 left-16 text-lg animate-bounce delay-700">💫</div>
                
                {/* Bottom Right Icons */}
                <div className="absolute bottom-4 right-4 text-xl animate-pulse text-pink-400 delay-300">🎭</div>
                <div className="absolute bottom-8 right-16 text-lg animate-bounce delay-1500">🌟</div>
                
                {/* Center floating icons */}
                <div className="absolute top-1/4 left-1/4 text-sm animate-float text-yellow-400 opacity-60">💎</div>
                <div className="absolute top-3/4 right-1/4 text-sm animate-float-reverse text-cyan-400 opacity-60 delay-1000">🎪</div>
                <div className="absolute top-1/2 left-1/6 text-sm animate-float text-green-400 opacity-60 delay-500">🎨</div>
                <div className="absolute top-1/3 right-1/6 text-sm animate-float-reverse text-orange-400 opacity-60 delay-1500">🎊</div>
              </div>
              
              {/* Corner Decorations */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 z-20 animate-pulse"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-purple-500 z-20 animate-pulse delay-500"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-pink-500 z-20 animate-pulse delay-1000"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-500 z-20 animate-pulse delay-1500"></div>

              <iframe
                className="w-full aspect-[951/535] lg:h-full object-cover relative z-0" 
                src="https://www.youtube-nocookie.com/embed/4xDzrJKXOOY?autoplay=1&mute=1" 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen 
              />
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-full lg:w-96 bg-gradient-to-b from-slate-800 to-gray-800 border-t lg:border-t-0 lg:border-l border-gray-600 flex flex-col lg:max-h-none shadow-2xl rounded-[5px] overflow-hidden">
          {!isJoined ? (
            !isAuthenticated ? (
              <LoginForm
                studentIdInput={studentIdInput}
                setStudentIdInput={setStudentIdInput}
                birthDateInput={birthDateInput}
                setBirthDateInput={setBirthDateInput}
                onLogin={handleLogin}
              />
            ) : (
              <RoomJoinForm
                currentRoom={currentRoom}
                setCurrentRoom={setCurrentRoom}
                authenticatedUser={authenticatedUser}
                onJoinRoom={handleJoinRoom}
                onLogout={handleLogout}
              />
            )
          ) : (
            /* Chat Interface */
            <>
              <ChatHeader 
                viewerCount={viewerCount}
                messageCount={messageCount}
                ping={ping}
              />
              
              <ChatMessages 
                messages={messages}
                currentUser={currentUser}
              />

              <TypingIndicator typingUsers={typingUsers} />

              <MessageInput 
                messageInput={messageInput}
                onInputChange={handleInputChange}
                onSendMessage={handleSendMessage}
                isConnected={isConnected}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App
