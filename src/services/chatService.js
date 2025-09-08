export const chatService = {
  // Join room
  joinRoom(socket, roomData) {
    if (!socket) return false;
    
    console.log('Emitting joinRoom with data:', roomData);
    socket.emit('joinRoom', roomData);
    return true;
  },

  // Send message
  sendMessage(socket, message) {
    if (!socket) return false;
    
    console.log('Sending message:', message);
    socket.emit('sendMessage', {
      message: message.trim(),
      type: 'text'
    });
    return true;
  },

  // Send typing indicator
  sendTyping(socket, typingData) {
    if (!socket) return false;
    
    socket.emit('typing', typingData);
    return true;
  },

  // Leave room
  leaveRoom(socket, roomData) {
    if (!socket) return false;
    
    socket.emit('leaveRoom', roomData);
    return true;
  },

  // Generate user ID
  generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  },

  // Create system message
  createSystemMessage(text) {
    return {
      id: Date.now(),
      message: text,
      username: 'System',
      timestamp: new Date().toISOString(),
      isSystem: true
    };
  },

  // Escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
