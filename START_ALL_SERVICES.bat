@echo off
echo ========================================
echo CareSphere - Starting All Services
echo ========================================
echo.

echo Starting services in separate windows...
echo.

REM Start Sensor API (Arduino)
echo [1/4] Starting Sensor API on port 4002...
start "CareSphere - Sensor API" cmd /k "cd /d C:\Users\renee\projects\delirium_solution && npm run start:sensors"
timeout /t 3 /nobreak > nul

REM Start FastAPI ML Service
echo [2/4] Starting FastAPI ML Service on port 8001...
start "CareSphere - FastAPI ML" cmd /k "cd /d C:\Users\renee\projects\delirium_solution\src\backend\services && C:\Users\renee\projects\delirium_solution\venv\Scripts\activate && uvicorn delirium_service:app --host 0.0.0.0 --port 8001"
timeout /t 3 /nobreak > nul

REM Start Backend API
echo [3/4] Starting Backend API on port 3001...
start "CareSphere - Backend API" cmd /k "cd /d C:\Users\renee\projects\delirium_solution && npm run start:backend"
timeout /t 3 /nobreak > nul

REM Start Frontend
echo [4/4] Starting Frontend on port 3000...
start "CareSphere - Frontend" cmd /k "cd /d C:\Users\renee\projects\delirium_solution && npm run start:frontend"

echo.
echo ========================================
echo All services are starting!
echo ========================================
echo.
echo Check the opened windows for each service.
echo.
echo Services:
echo   - Sensor API:    http://localhost:4002
echo   - FastAPI ML:    http://localhost:8001
echo   - Backend API:   http://localhost:3001
echo   - Frontend:      http://localhost:3000
echo.
echo Open http://localhost:3000 in your browser to view the dashboard!
echo.
pause
