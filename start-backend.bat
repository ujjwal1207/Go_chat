@echo off
echo 🚀 Starting Go backend server...

cd /d "%~dp0realtime-chat" || (
    echo ❌ Error: Could not find realtime-chat directory
    pause
    exit /b 1
)

where go >nul 2>nul || (
    echo ❌ Error: Go is not installed or not in PATH
    echo Please install Go from https://golang.org/dl/
    pause
    exit /b 1
)

if not defined PORT set PORT=5000
if not defined MONGO_URI set MONGO_URI=mongodb://localhost:27017
if not defined DB_NAME set DB_NAME=realchat
if not defined JWT_SECRET set JWT_SECRET=your-super-secret-jwt-key-here

echo 📋 Configuration:
echo    Port: %PORT%
echo    MongoDB URI: %MONGO_URI%
echo    Database: %DB_NAME%
echo.

if not exist go.mod (
    echo 📦 Initializing Go module...
    go mod init realtime-chat
)

echo 📦 Downloading dependencies...
go mod tidy

echo 🔨 Building and starting server...
echo    Server will be available at http://localhost:%PORT%
echo    WebSocket endpoint: ws://localhost:%PORT%/ws
echo    Press Ctrl+C to stop
echo.

go run cmd/server/main.go