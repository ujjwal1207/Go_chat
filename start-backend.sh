#!/bin/bash

# Start the Go backend server for the real-time chat application

echo "🚀 Starting Go backend server..."

# Navigate to the backend directory
cd "$(dirname "$0")/../realtime-chat" || {
    echo "❌ Error: Could not find realtime-chat directory"
    exit 1
}

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Error: Go is not installed or not in PATH"
    echo "Please install Go from https://golang.org/dl/"
    exit 1
fi

# Set default environment variables
export PORT=${PORT:-8080}
export MONGO_URI=${MONGO_URI:-"mongodb://localhost:27017"}
export DB_NAME=${DB_NAME:-"realchat"}
export JWT_SECRET=${JWT_SECRET:-"your-super-secret-jwt-key-here"}

echo "📋 Configuration:"
echo "   Port: $PORT"
echo "   MongoDB URI: $MONGO_URI"
echo "   Database: $DB_NAME"
echo ""

# Check if MongoDB is running (optional check)
if command -v mongosh &> /dev/null; then
    echo "🔍 Checking MongoDB connection..."
    if ! mongosh --quiet --eval "db.runCommand('ping').ok" "$MONGO_URI/$DB_NAME" 2>/dev/null; then
        echo "⚠️  Warning: Could not connect to MongoDB at $MONGO_URI"
        echo "   Make sure MongoDB is running or update MONGO_URI environment variable"
        echo "   The server will still start but database operations will fail"
        echo ""
    else
        echo "✅ MongoDB connection successful"
        echo ""
    fi
fi

# Download dependencies if needed
if [ ! -f "go.mod" ]; then
    echo "📦 Initializing Go module..."
    go mod init realtime-chat
fi

echo "📦 Downloading dependencies..."
go mod tidy

# Build and run the server
echo "🔨 Building and starting server..."
echo "   Server will be available at http://localhost:$PORT"
echo "   WebSocket endpoint: ws://localhost:$PORT/ws"
echo "   Press Ctrl+C to stop"
echo ""

go run cmd/server/main.go