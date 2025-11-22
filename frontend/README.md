# RealChat Frontend

A modern, responsive real-time chat application frontend built with React, featuring a sleek UI with dark/light mode support, file sharing, and multilingual conversations.

## Features

- **Real-time messaging** with WebSocket connections
- **Modern UI** with Tailwind CSS styling
- **Dark/Light mode** themes
- **File upload** and sharing
- **Group chat** functionality
- **Direct messaging** between users
- **Message translation** support
- **Responsive design** for mobile and desktop
- **User presence** indicators
- **Emoji support** in messages

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **WebSocket** - Real-time communication
- **React Router** - Client-side routing
- **Zustand** - State management
- **Lucide React** - Icon library

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── AuthPage.jsx
│   │   ├── ChatLayout.jsx
│   │   ├── ChatPane.jsx
│   │   ├── MessageBubble.jsx
│   │   ├── MessageInput.jsx
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   │   ├── useWebSocket.js
│   │   ├── useRealChatData.js
│   │   └── ...
│   ├── lib/             # Utilities and services
│   │   ├── api.js       # API client
│   │   ├── utils.js     # Helper functions
│   │   └── ...
│   ├── store/           # State management
│   │   ├── auth.js      # Authentication store
│   │   ├── chat.js      # Chat state store
│   │   └── ...
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # App entry point
│   └── index.css        # Global styles
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── tailwind.config.js   # Tailwind configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running (see backend README)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your backend API URL
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Preview production build:**
   ```bash
   npm run preview
   ```

The frontend will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## Environment Variables

Create a `.env.local` file in the frontend directory:

```env
# Backend API URL (required)
VITE_API_BASE_URL=http://localhost:5000

# For production deployment:
# VITE_API_BASE_URL=https://your-api-domain.com
```

## Key Components

### Authentication Flow
- **AuthPage**: Login and registration forms
- **OnboardingModal**: User setup after registration
- Uses JWT tokens stored in localStorage

### Chat Interface
- **ChatLayout**: Main layout with sidebar and chat pane
- **LeftSidebar**: Conversation list and user search
- **ChatPane**: Message display and input
- **MessageBubble**: Individual message rendering with file support

### Real-time Features
- **useWebSocket**: Manages WebSocket connection and message handling
- **useRealChatData**: Loads conversation history from API
- Automatic reconnection and error handling

## Styling

The application uses Tailwind CSS with a custom design system:

- **Color palette**: Consistent light/dark mode colors
- **Typography**: Clean, readable fonts
- **Spacing**: Consistent spacing scale
- **Components**: Reusable component classes

### Theme Support

The app automatically detects system theme preference and allows manual switching between light and dark modes.

## File Upload

- Supports image uploads (JPG, PNG, GIF, WebP)
- Files are uploaded to backend `/upload` endpoint
- URLs are stored in message objects
- Images display inline, other files show as download links

## WebSocket Communication

Messages are sent via WebSocket with the following structure:

```javascript
{
  type: "send_message",
  chat_type: "dm" | "group",
  text: "message content",
  files: ["url1", "url2"], // optional
  source_lang: "en"
}
```

## Development

### Code Quality
- ESLint configuration for consistent code style
- Prettier for code formatting (recommended)
- TypeScript support available (optional)

### State Management
- **Zustand** for global state
- Separate stores for auth, chat, and UI state
- Reactive updates across components

### API Integration
- Centralized API client in `lib/api.js`
- Automatic token handling for authenticated requests
- Error handling and retry logic

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed
4. Ensure responsive design works on mobile

## Troubleshooting

### Common Issues

- **WebSocket connection fails**: Check backend server is running
- **Messages not loading**: Verify API endpoints and authentication
- **Styling issues**: Clear browser cache, check Tailwind build
- **File uploads fail**: Check backend upload endpoint and file permissions
