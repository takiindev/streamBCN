import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { authService } from '../services/authService';
import { chatService } from '../services/chatService';
import ConnectionToast from '../components/ConnectionToast';
import LoginForm from '../components/LoginForm';
import RoomJoinForm from '../components/RoomJoinForm';
import ChatHeader from '../components/ChatHeader';
import ChatMessages from '../components/ChatMessages';
import TypingIndicator from '../components/TypingIndicator';
import MessageInput from '../components/MessageInput';

function Stream() {
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
      setIsJoined(true);
      const existingMessages = data.messages || [];
      setMessages(existingMessages);
      setViewerCount(data.viewerCount || 0);
      setMessageCount(existingMessages.length);
    };

    const handleNewMessage = (message) => {
      // Batch state updates to prevent multiple re-renders
      setMessages(prev => {
        // Prevent duplicate messages
        const exists = prev.some(msg => 
          msg.id === message.id || 
          (msg.timestamp === message.timestamp && msg.message === message.message)
        );
        if (exists) return prev;
        
        return [...prev, message];
      });
      setMessageCount(prev => prev + 1);
    };

    const handleUserJoined = (data) => {
      addSystemMessage(`${data.username} đã tham gia phòng`);
      setViewerCount(data.viewerCount);
      setIsJoined(true);
    };

    const handleUserLeft = (data) => {
      addSystemMessage(`${data.username} đã rời phòng`);
      setViewerCount(data.viewerCount);
    };

    const handleTyping = (data) => {
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
      }
    } catch (error) {
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
    <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white font-['Inter',sans-serif] main-container">
      <ConnectionToast 
        connectionStatus={connectionStatus} 
        showConnectionToast={showConnectionToast} 
      />
      
      <div className="flex flex-col h-screen lg:flex-row lg:gap-6 lg:p-4">
        {/* Video Section */}
        <div className="flex-1 flex flex-col bg-black rounded-none lg:rounded-lg overflow-hidden shadow-lg">
          {/* Video Player - Simplified for mobile */}
          <div className="relative bg-black flex-shrink-0">
            <iframe
              className="w-full h-[35vh] sm:h-[40vh] lg:h-[400px] xl:h-full" 
              src="https://www.youtube-nocookie.com/embed/4xDzrJKXOOY?autoplay=1&mute=1" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerPolicy="strict-origin-when-cross-origin" 
              allowFullScreen
              style={{
                minHeight: '200px',
                backgroundColor: '#000'
              }}
            />
          </div>

          {/* Video Info - Simplified */}
          <div className="p-3 lg:p-6 bg-slate-800 border-t border-gray-600 flex-shrink-0">
            <h1 className="text-lg lg:text-2xl font-bold text-red-400 mb-2">
              🔴 LiveStream Chat Demo
            </h1>
            <p className="text-sm lg:text-base text-gray-300">
              Trải nghiệm chat realtime với WebSocket và messaging tức thời
            </p>
          </div>
        </div>

        {/* Chat Section - Fixed height on mobile */}
        <div className="w-full lg:w-96 bg-slate-800 border-t lg:border-t-0 lg:border-l border-gray-600 flex flex-col h-[65vh] lg:h-auto">
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
              
              <div className="flex-1 flex flex-col min-h-0">
                <ChatMessages 
                  messages={messages}
                  currentUser={currentUser}
                />

                <TypingIndicator typingUsers={typingUsers} />
              </div>

              <div className="flex-shrink-0">
                <MessageInput 
                  messageInput={messageInput}
                  onInputChange={handleInputChange}
                  onSendMessage={handleSendMessage}
                  isConnected={isConnected}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Stream;