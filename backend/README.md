# RealChat Backend

A real-time chat application backend built with Go, featuring WebSocket communication, MongoDB storage, and JWT authentication.

## Features

- **Real-time messaging** with WebSocket connections
- **Group chat** functionality
- **Direct messaging** between users
- **File upload** support with local storage
- **JWT authentication** with secure user sessions
- **MongoDB** for data persistence
- **Translation support** for multilingual conversations
- **User presence** tracking

## Tech Stack

- **Go** - Backend language
- **Gin/Chi** - HTTP router
- **MongoDB** - Database
- **WebSocket** - Real-time communication
- **JWT** - Authentication
- **Multipart forms** - File uploads

## Project Structure

```
backend/
├── cmd/server/          # Application entry point
├── internal/
│   ├── auth/           # Authentication middleware and handlers
│   ├── config/         # Configuration management
│   ├── db/             # Database connection
│   ├── handlers/       # HTTP request handlers
│   ├── messages/       # Message history endpoints
│   ├── models/         # Data models
│   ├── presence/       # User presence tracking
│   └── ws/             # WebSocket implementation
├── uploads/            # File upload storage
└── go.mod              # Go module dependencies
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - User logout

### Messages
- `GET /messages/dm?user_id=<id>` - Get DM message history
- `GET /messages/group?group_id=<id>` - Get group message history

### Groups
- `POST /groups` - Create new group
- `GET /groups` - Get user's groups
- `POST /groups/join` - Join a group

### File Upload
- `POST /upload` - Upload files
- `GET /uploads/*` - Serve uploaded files

### WebSocket
- `WS /ws` - WebSocket connection for real-time messaging

## Environment Variables

Create a `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=realchat

# JWT Secrets
JWT_ACCESS_SECRET=your-super-secret-jwt-access-key-here
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-here

# Email Configuration (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server Configuration
PORT=5000
BASE_URL=http://localhost:5000
# Frontend origin used for CORS
# Example: CLIENT_URL=http://localhost:5173
# In production set to your deployed frontend URL without trailing slash
# CLIENT_URL=https://your-frontend-domain.com

 
```

## Running the Backend

1. **Install dependencies:**
   ```bash
   go mod tidy
   ```

2. **Set environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB:**
   Make sure MongoDB is running on your system.

4. **Run the server:**
   ```bash
   go run cmd/server/main.go
   ```

The server will start on `http://localhost:5000`

## Development

- **Hot reload:** Use `go run` for development
- **Build:** `go build ./cmd/server` for production
- **Testing:** Add tests in `_test.go` files

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  name: String,
  password_hash: String,
  language: String,
  created_at: Date
}
```

### Messages Collection
```javascript
{
  _id: ObjectId,
  sender_id: String,
  recipient_id: String, // For DMs
  group_id: String,     // For groups
  content: String,
  content_lang: String,
  files: [String],      // Array of file URLs
  created_at: Date
}
```

### Groups Collection
```javascript
{
  _id: ObjectId,
  name: String,
  members: [String],    // Array of user IDs
  created_at: Date
}
```