# CareSphere - Quick Start Script
# Run this to start all services

Write-Host "🏥 CareSphere - Starting All Services" -ForegroundColor Cyan
Write-Host ""

# Check if services are already running
$sensor = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*sensors.js*" }
$backend = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
$fastapi = Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue
$frontend = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

Write-Host "Checking service status..." -ForegroundColor Yellow
Write-Host "  Sensor API (4002): $(if ($sensor) { '✓ Running' } else { '✗ Not Running' })"
Write-Host "  Backend API (3001): $(if ($backend) { '✓ Running' } else { '✗ Not Running' })"
Write-Host "  FastAPI (8001): $(if ($fastapi) { '✓ Running' } else { '✗ Not Running' })"
Write-Host "  Frontend (5173): $(if ($frontend) { '✓ Running' } else { '✗ Not Running' })"
Write-Host ""

Write-Host "📋 To start the services, open 4 separate PowerShell terminals:" -ForegroundColor Green
Write-Host ""
Write-Host "Terminal 1 - Sensor API:" -ForegroundColor Cyan
Write-Host "  cd $PSScriptRoot"
Write-Host "  node sensors.js"
Write-Host ""
Write-Host "Terminal 2 - FastAPI:" -ForegroundColor Cyan
Write-Host "  cd $PSScriptRoot"
Write-Host "  & .\venv\Scripts\Activate.ps1"
Write-Host "  cd src\backend\services"
Write-Host "  python -m uvicorn delirium_service:app --reload --port 8001"
Write-Host ""
Write-Host "Terminal 3 - Backend API:" -ForegroundColor Cyan
Write-Host "  cd $PSScriptRoot\services\backend"
Write-Host "  npm start"
Write-Host ""
Write-Host "Terminal 4 - Frontend:" -ForegroundColor Cyan
Write-Host "  cd $PSScriptRoot\services\frontend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Then open: http://localhost:5173" -ForegroundColor Green
