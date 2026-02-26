# StudyBuddy Development Server Startup Script
# This script starts both the backend and frontend servers in separate windows

Write-Host "🚀 Starting StudyBuddy Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Get the script directory (project root)
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend Server in a new PowerShell window
Write-Host "📦 Starting Backend Server (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; Write-Host '🔧 Backend Server Starting...' -ForegroundColor Yellow; node server.js"

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start Frontend Server in a new PowerShell window
Write-Host "⚛️  Starting Frontend Server (Port 3000)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; Write-Host '🎨 Frontend Server Starting...' -ForegroundColor Yellow; npm start"

Write-Host ""
Write-Host "✅ Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Important Notes:" -ForegroundColor Yellow
Write-Host "   - Backend will run on http://localhost:5000" -ForegroundColor White
Write-Host "   - Frontend will run on http://localhost:3000" -ForegroundColor White
Write-Host "   - Keep both terminal windows open while developing" -ForegroundColor White
Write-Host "   - Press Ctrl+C in each window to stop the servers" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Your app will open automatically in the browser once ready!" -ForegroundColor Cyan
