// Socket.IO connection with configurable backend URL
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? window.location.origin 
  : 'https://realtimechat.railway.app'; // Railway backend URL

const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  timeout: 20000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// DOM elements
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const messagesContainer = document.getElementById('messagesContainer');
const usersList = document.getElementById('usersList');
const currentUserSpan = document.getElementById('currentUser');
const onlineCountSpan = document.getElementById('onlineCount');
const typingIndicator = document.getElementById('typingIndicator');
const typingUserSpan = document.getElementById('typingUser');

// Application state
let currentUser = null;
let typingTimeout = null;
let connectedUsers = [];
let isConnected = false;

// Connection status handling
function showConnectionStatus(message, isError = false) {
    const statusDiv = document.createElement('div');
    statusDiv.className = `system-message ${isError ? 'error' : ''}`;
    statusDiv.textContent = message;
    messagesContainer.appendChild(statusDiv);
    scrollToBottom();
}

// Utility functions
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitials(username) {
    return username.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function createUserAvatar(username) {
    const avatar = document.createElement('div');
    avatar.className = 'user-avatar';
    avatar.textContent = getInitials(username);
    return avatar;
}

function createMessageElement(messageData, isOwn = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : ''}`;
    
    const avatar = createUserAvatar(messageData.username);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';
    
    const usernameSpan = document.createElement('span');
    usernameSpan.className = 'message-username';
    usernameSpan.textContent = messageData.username;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = formatTime(messageData.timestamp);
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = messageData.message;
    
    headerDiv.appendChild(usernameSpan);
    headerDiv.appendChild(timeSpan);
    contentDiv.appendChild(headerDiv);
    contentDiv.appendChild(textDiv);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    return messageDiv;
}

function createSystemMessage(message) {
    const systemDiv = document.createElement('div');
    systemDiv.className = 'system-message';
    systemDiv.textContent = message;
    return systemDiv;
}

function updateUsersList(users) {
    usersList.innerHTML = '';
    connectedUsers = users;
    
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        
        const avatar = createUserAvatar(user.username);
        const nameSpan = document.createElement('span');
        nameSpan.className = 'user-name';
        nameSpan.textContent = user.username;
        
        userItem.appendChild(avatar);
        userItem.appendChild(nameSpan);
        usersList.appendChild(userItem);
    });
    
    onlineCountSpan.textContent = users.length;
}

function showTypingIndicator(username) {
    typingUserSpan.textContent = username;
    typingIndicator.classList.remove('hidden');
}

function hideTypingIndicator() {
    typingIndicator.classList.add('hidden');
}

// Event listeners
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    
    if (username) {
        currentUser = {
            username: username,
            userId: Date.now() + Math.random()
        };
        
        // Update UI first
        currentUserSpan.textContent = username;
        loginScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
        
        // Show connection status
        showConnectionStatus('Connecting to chat server...');
        
        // Try to join the chat if connected
        if (isConnected) {
            socket.emit('user_join', currentUser);
        } else {
            showConnectionStatus('Server not available. Running in demo mode.', true);
            // Add demo user to the list
            updateUsersList([{ id: currentUser.userId, username: currentUser.username }]);
        }
        
        // Focus on message input
        messageInput.focus();
    }
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    
    if (message && currentUser) {
        if (isConnected) {
            // Send message to server
            socket.emit('send_message', {
                message: message,
                userId: currentUser.userId,
                username: currentUser.username
            });
        } else {
            // Demo mode - create local message
            const messageData = {
                id: Date.now() + Math.random(),
                userId: currentUser.userId,
                username: currentUser.username,
                message: message,
                timestamp: new Date(),
                type: 'message'
            };
            const messageElement = createMessageElement(messageData, true);
            messagesContainer.appendChild(messageElement);
            scrollToBottom();
        }
        
        // Clear input
        messageInput.value = '';
        
        // Stop typing indicator
        if (isConnected) {
            socket.emit('typing_stop', { username: currentUser.username });
        }
    }
});

messageInput.addEventListener('input', () => {
    if (currentUser && isConnected) {
        // Clear existing timeout
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }
        
        // Emit typing start
        socket.emit('typing_start', { username: currentUser.username });
        
        // Set timeout to stop typing indicator
        typingTimeout = setTimeout(() => {
            socket.emit('typing_stop', { username: currentUser.username });
        }, 1000);
    }
});

// Socket.IO event listeners
socket.on('connect', () => {
    console.log('Connected to server');
    isConnected = true;
    showConnectionStatus('Connected to chat server!');
    
    // If user is already logged in, join the chat
    if (currentUser) {
        socket.emit('user_join', currentUser);
    }
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    isConnected = false;
    showConnectionStatus('Disconnected from server. Trying to reconnect...', true);
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    isConnected = false;
    showConnectionStatus('Cannot connect to server. Running in demo mode.', true);
});

socket.on('users_list', (users) => {
    updateUsersList(users);
});

socket.on('user_joined', (data) => {
    // Add system message for user joining
    const systemMessage = createSystemMessage(data.message);
    messagesContainer.appendChild(systemMessage);
    scrollToBottom();
    
    // Update users list if we're already in the chat
    if (currentUser) {
        // Request updated users list
        fetch(`${BACKEND_URL}/api/users`)
            .then(response => response.json())
            .then(users => updateUsersList(users))
            .catch(error => console.error('Error fetching users:', error));
    }
});

socket.on('user_left', (data) => {
    // Add system message for user leaving
    const systemMessage = createSystemMessage(data.message);
    messagesContainer.appendChild(systemMessage);
    scrollToBottom();
    
    // Update users list
    fetch(`${BACKEND_URL}/api/users`)
        .then(response => response.json())
        .then(users => updateUsersList(users))
        .catch(error => console.error('Error fetching users:', error));
});

socket.on('receive_message', (messageData) => {
    const isOwn = currentUser && messageData.userId === currentUser.userId;
    const messageElement = createMessageElement(messageData, isOwn);
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
});

socket.on('user_typing', (data) => {
    if (data.isTyping) {
        showTypingIndicator(data.username);
    } else {
        hideTypingIndicator();
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, stop typing indicator
        if (currentUser && typingTimeout && isConnected) {
            clearTimeout(typingTimeout);
            socket.emit('typing_stop', { username: currentUser.username });
        }
    }
});

// Handle window beforeunload
window.addEventListener('beforeunload', () => {
    if (currentUser && typingTimeout && isConnected) {
        clearTimeout(typingTimeout);
        socket.emit('typing_stop', { username: currentUser.username });
    }
});

// Auto-scroll to bottom when new messages arrive
const observer = new MutationObserver(() => {
    scrollToBottom();
});

observer.observe(messagesContainer, {
    childList: true,
    subtree: true
});

// Initialize
console.log('Chat application initialized');
console.log('Backend URL:', BACKEND_URL); 