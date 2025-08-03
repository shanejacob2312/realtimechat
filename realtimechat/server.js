const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users
const connectedUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle user joining
  socket.on('user_join', (userData) => {
    const { username, userId } = userData;
    
    // Store user information
    connectedUsers.set(socket.id, {
      id: userId,
      username: username,
      socketId: socket.id,
      joinedAt: new Date()
    });

    // Broadcast user joined to all clients
    io.emit('user_joined', {
      userId: userId,
      username: username,
      timestamp: new Date(),
      message: `${username} joined the chat`
    });

    // Send current users list to the new user
    const usersList = Array.from(connectedUsers.values()).map(user => ({
      id: user.id,
      username: user.username
    }));
    socket.emit('users_list', usersList);

    console.log(`${username} joined the chat`);
  });

  // Handle incoming messages
  socket.on('send_message', (messageData) => {
    const { message, userId, username } = messageData;
    const user = connectedUsers.get(socket.id);
    
    if (user) {
      const messageObj = {
        id: Date.now() + Math.random(),
        userId: userId,
        username: username,
        message: message,
        timestamp: new Date(),
        type: 'message'
      };

      // Broadcast message to all connected clients
      io.emit('receive_message', messageObj);
      console.log(`Message from ${username}: ${message}`);
    }
  });

  // Handle typing indicator
  socket.on('typing_start', (userData) => {
    const { username } = userData;
    socket.broadcast.emit('user_typing', {
      username: username,
      isTyping: true
    });
  });

  socket.on('typing_stop', (userData) => {
    const { username } = userData;
    socket.broadcast.emit('user_typing', {
      username: username,
      isTyping: false
    });
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    
    if (user) {
      connectedUsers.delete(socket.id);
      
      // Broadcast user left to all clients
      io.emit('user_left', {
        userId: user.id,
        username: user.username,
        timestamp: new Date(),
        message: `${user.username} left the chat`
      });

      console.log(`${user.username} disconnected`);
    }
  });
});

// API Routes
app.get('/api/users', (req, res) => {
  const users = Array.from(connectedUsers.values()).map(user => ({
    id: user.id,
    username: user.username
  }));
  res.json(users);
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    connectedUsers: connectedUsers.size,
    timestamp: new Date()
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Chat application available at http://localhost:${PORT}`);
}); 