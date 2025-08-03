# Real-Time Chat Application

A modern, real-time chat application built with Node.js, Express, and Socket.IO that enables instant messaging between users with low latency and seamless user experience.

## Features

- **Real-time messaging**: Instant message delivery using Socket.IO
- **User presence**: See who's online and when users join/leave
- **Typing indicators**: Real-time typing status for active users
- **Modern UI**: Clean, responsive design that works on desktop and mobile
- **User avatars**: Automatic avatar generation using user initials
- **System messages**: Notifications for user join/leave events
- **Message timestamps**: Time stamps for all messages
- **Auto-scroll**: Automatic scrolling to latest messages
- **Responsive design**: Optimized for both desktop and mobile devices

## Technology Stack

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.IO
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Modern CSS with gradients and animations
- **Deployment**: Netlify

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone or download the project files to your local machine

2. Navigate to the project directory:
   ```bash
   cd realtimechatapplication
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will start on `http://localhost:3000`

## Deployment to Netlify

### Option 1: Deploy from Git Repository

1. **Push to GitHub/GitLab/Bitbucket**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `public`
   - Deploy

### Option 2: Manual Deployment

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Drag and drop the `public` folder to Netlify
   - Or use Netlify CLI: `netlify deploy --prod --dir=public`

### Netlify Configuration

The project includes `netlify.toml` for optimized deployment:
- Static file serving from `public` directory
- Node.js 18 environment
- SPA routing support
- Development server configuration

## Usage

1. Open your web browser and navigate to the deployed URL
2. Enter your username in the login screen
3. Click "Join Chat" to enter the chat room
4. Start sending messages and see them appear in real-time
5. View the online users list in the sidebar
6. See typing indicators when other users are typing

## Project Structure

```
realtimechatapplication/
├── server.js              # Main server file with Socket.IO setup
├── package.json           # Project dependencies and scripts
├── netlify.toml          # Netlify deployment configuration
├── public/               # Frontend files (deployed to Netlify)
│   ├── index.html        # Main HTML file
│   ├── styles.css        # CSS styles
│   └── script.js         # Frontend JavaScript
└── README.md            # This file
```

## API Endpoints

- `GET /` - Serves the main chat application
- `GET /api/users` - Returns list of currently connected users
- `GET /api/status` - Returns server status and connection count

## Socket.IO Events

### Client to Server
- `user_join` - User joins the chat
- `send_message` - User sends a message
- `typing_start` - User starts typing
- `typing_stop` - User stops typing

### Server to Client
- `user_joined` - New user joined notification
- `user_left` - User left notification
- `receive_message` - New message received
- `users_list` - Updated list of online users
- `user_typing` - Typing indicator updates

## Features in Detail

### Real-time Messaging
Messages are delivered instantly using Socket.IO's bidirectional communication. Each message includes:
- User information
- Message content
- Timestamp
- Unique message ID

### User Management
- Automatic user tracking when joining/leaving
- Real-time user list updates
- User avatars generated from initials
- Online user count display

### Typing Indicators
- Real-time typing status for all users
- Automatic timeout after 1 second of inactivity
- Clean UI integration with typing notifications

### Responsive Design
- Mobile-friendly layout
- Adaptive sidebar for smaller screens
- Touch-friendly interface elements
- Optimized for various screen sizes

## Customization

### Changing the Port
Edit the `PORT` variable in `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

### Modifying Styles
Edit `public/styles.css` to customize the appearance:
- Color scheme
- Layout dimensions
- Typography
- Animations

### Adding Features
The modular structure makes it easy to add new features:
- Private messaging
- File sharing
- Message reactions
- User profiles
- Chat rooms

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the port in `server.js`
   - Kill existing processes on the port

2. **Socket.IO connection errors**
   - Check if the server is running
   - Verify the Socket.IO client script is loaded
   - Check browser console for errors

3. **Messages not appearing**
   - Check browser console for JavaScript errors
   - Verify Socket.IO connection status
   - Check server logs for errors

4. **Netlify deployment issues**
   - Ensure `public` directory contains all frontend files
   - Check build logs in Netlify dashboard
   - Verify `netlify.toml` configuration

### Debug Mode
Enable debug logging by adding to `server.js`:
```javascript
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  debug: true
});
```

## Performance Considerations

- Socket.IO handles connection management automatically
- Messages are broadcast efficiently to all connected clients
- User lists are updated only when necessary
- Typing indicators use debouncing to reduce server load
- Netlify provides global CDN for fast static file delivery

## Security Notes

- This is a basic implementation for demonstration
- For production use, consider adding:
  - User authentication
  - Message encryption
  - Rate limiting
  - Input validation
  - HTTPS enforcement

## License

MIT License - feel free to use this project for learning and development purposes.

## Contributing

This is a demonstration project. For production applications, consider implementing additional security measures and features based on your specific requirements. 