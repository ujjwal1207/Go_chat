# RealChat

A modern, real-time chat application with group messaging, file sharing, and multilingual support. Built with Go backend and React frontend.

## 🚀 Features

- **Real-time messaging** with WebSocket connections
- **Group chat** and direct messaging
- **File upload** and sharing (images and documents)
- **Multilingual support** with automatic translation
- **Modern UI** with dark/light mode themes
- **Responsive design** for mobile and desktop
- **User authentication** with JWT tokens
- **User presence** indicators
- **Emoji support** in messages

## 🏗️ Architecture

This project consists of two main components:

### Backend (Go)
- REST API with Gin/Chi router
- WebSocket server for real-time communication
- MongoDB for data persistence
- JWT authentication
- File upload handling

### Frontend (React)
- Modern React 18 application
- Vite for fast development and building
- Tailwind CSS for styling
- Zustand for state management
- WebSocket client for real-time updates

## 📁 Project Structure

```
realchat/
├── backend/              # Go backend application
│   ├── cmd/server/       # Application entry point
│   ├── internal/         # Internal packages
│   ├── uploads/          # File storage
│   └── README.md         # Backend documentation
├── frontend/             # React frontend application
│   ├── src/              # Source code
│   ├── public/           # Static assets
│   └── README.md         # Frontend documentation
├── start-backend.bat     # Windows startup script
├── start-backend.sh      # Linux/Mac startup script
└── FRONTEND_BACKEND_CONNECTION.md  # Integration guide
```

## 🛠️ Tech Stack

### Backend
- **Go** - High-performance backend language
- **MongoDB** - NoSQL database
- **WebSocket** - Real-time bidirectional communication
- **JWT** - Secure authentication tokens
- **Multipart forms** - File upload handling

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing

## 🚀 Quick Start

### Prerequisites
- Go 1.19+
- Node.js 18+
- MongoDB
- npm or yarn

### 1. Clone and Setup

```bash
git clone <repository-url>
cd realchat
```

### 2. Backend Setup

```bash
cd backend
go mod tidy
cp .env.example .env  # Configure your environment variables
go run cmd/server/main.go
```

The backend will start on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Database

Make sure MongoDB is running. The application will create collections automatically.

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017
DB_NAME=realchat
JWT_SECRET=your-super-secret-jwt-key-here
```

### Frontend Configuration

The frontend automatically connects to the backend. Update API base URL in `frontend/src/lib/api.js` if needed.

## 📡 API Overview

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Current user info

### Messages
- `GET /messages/dm?user_id=<id>` - DM history
- `GET /messages/group?group_id=<id>` - Group history

### Groups
- `POST /groups` - Create group
- `GET /groups` - User's groups

### Files
- `POST /upload` - Upload files
- `GET /uploads/*` - Serve files

### Real-time
- `WS /ws` - WebSocket connection

## 🎨 Features in Detail

### Real-time Communication
- Instant message delivery via WebSocket
- Automatic reconnection on connection loss
- Typing indicators and presence status

### File Sharing
- Image upload with preview
- Document sharing
- Secure file storage with URL generation

### Multilingual Support
- Automatic message translation
- Language preference settings
- Support for multiple languages

### Modern UI/UX
- Responsive design for all devices
- Dark and light theme support
- Smooth animations and transitions
- Intuitive user interface

## 🔒 Security

- JWT token-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- Secure file upload handling

## 🚀 Deployment

### Backend Deployment
```bash
cd backend
go build -o server ./cmd/server
./server
```

### Frontend Deployment
```bash
cd frontend
npm run build
# Serve the dist/ folder with any static server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For questions or issues, please open an issue on GitHub or contact the development team.

---

**Happy chatting! 🎉**