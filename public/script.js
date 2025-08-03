// Socket.IO connection
const socket = io();

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
        
        // Join the chat
        socket.emit('user_join', currentUser);
        
        // Update UI
        currentUserSpan.textContent = username;
        loginScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
        
        // Focus on message input
        messageInput.focus();
    }
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    
    if (message && currentUser) {
        // Send message to server
        socket.emit('send_message', {
            message: message,
            userId: currentUser.userId,
            username: currentUser.username
        });
        
        // Clear input
        messageInput.value = '';
        
        // Stop typing indicator
        socket.emit('typing_stop', { username: currentUser.username });
    }
});

messageInput.addEventListener('input', () => {
    if (currentUser) {
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
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
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
        fetch('/api/users')
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
    fetch('/api/users')
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
        if (currentUser && typingTimeout) {
            clearTimeout(typingTimeout);
            socket.emit('typing_stop', { username: currentUser.username });
        }
    }
});

// Handle window beforeunload
window.addEventListener('beforeunload', () => {
    if (currentUser && typingTimeout) {
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