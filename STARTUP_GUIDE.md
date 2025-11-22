# CareSphere Delirium Monitoring System - Startup Guide

## Quick Start (Easiest Method)

### Option 1: Automatic Startup (Recommended)
Double-click `START_ALL_SERVICES.bat` in the project root folder. This will open 4 separate command windows, one for each service.

---

## Manual Startup (Step-by-Step)

If you prefer to start services manually, follow these steps:

### Prerequisites
1. **Arduino connected** to COM port (usually COM7, COM3, or COM10)
2. **Arduino IDE Serial Monitor CLOSED** (it locks the port)
3. **Python virtual environment** available at `venv/`
4. **Node.js dependencies** installed (`npm install` in project root and `services/backend` and `services/frontend`)

---

### Step 1: Start Sensor API (Port 4002)
**Open Terminal 1:**
```powershell
cd C:\Users\renee\projects\delirium_solution
npm run start:sensors
```

**Expected Output:**
```
Sensor API server running on port 4002
Successfully connected to Arduino on COM7
Received sensor data: { light: 405, sound: 129, temperature: 25.92 }
```

**Troubleshooting:**
- If "Error: Opening COM port", close Arduino IDE Serial Monitor
- If port not found, check Arduino connection in Device Manager
- If wrong COM port, the script will auto-detect available ports

---

### Step 2: Start FastAPI ML Service (Port 8001)
**Open Terminal 2:**
```powershell
cd C:\Users\renee\projects\delirium_solution
.\venv\Scripts\Activate.ps1
cd src\backend\services
uvicorn delirium_service:app --host 0.0.0.0 --port 8001
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Troubleshooting:**
- If "ModuleNotFoundError: No module named 'httpx'", run: `pip install httpx`
- If "Cannot find delirium_model.joblib", ensure you're in `src/backend/services/` directory
- If port already in use: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 8001).OwningProcess -Force`

---

### Step 3: Start Backend API (Port 3001)
**Open Terminal 3:**
```powershell
cd C:\Users\renee\projects\delirium_solution
npm run start:backend
```

**Expected Output:**
```
CareSphere Backend API running on http://localhost:3001
Data file: C:\Users\renee\projects\delirium_solution\services\backend\data\patients.json
```

**Troubleshooting:**
- If "Cannot find module 'express'", run in `services/backend`: `npm install`
- If port already in use: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess -Force`

---

### Step 4: Start Frontend (Port 3000)
**Open Terminal 4:**
```powershell
cd C:\Users\renee\projects\delirium_solution
npm run start:frontend
```

**Expected Output:**
```
VITE v5.3.1  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**Troubleshooting:**
- If "Cannot find module", run in `services/frontend`: `npm install`
- If port already in use, Vite will automatically use port 5173

---

## Verify System is Running

**Test in PowerShell:**
```powershell
# Check all services
Get-NetTCPConnection -LocalPort 4002,8001,3001,3000 -ErrorAction SilentlyContinue | Select-Object LocalPort,State

# Test Patient P001 live data
$p = Invoke-RestMethod "http://localhost:3001/api/patients/P001"
Write-Host "Patient: $($p.name)"
Write-Host "Risk Score: $($p.riskScore)"
Write-Host "Live Monitored: $($p.isLiveMonitored)"
```

**Expected Response:**
```
Patient: Margaret Thompson
Risk Score: 99 (or similar high value from Arduino sensors)
Live Monitored: True
```

---

## View the Dashboard

Open your browser and go to: **http://localhost:3000**

You should see:
- Patient P001 (Margaret Thompson) with a **🔴 LIVE** badge
- Risk score that updates every 5 seconds based on Arduino sensor readings
- Risk score should NOT be static at 85 - it should change based on sensor input

---

## Stop All Services

### Quick Stop (Kill All)
```powershell
# Stop all Node.js processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Stop Python/uvicorn
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force

# Or stop by port
Stop-Process -Id (Get-NetTCPConnection -LocalPort 4002).OwningProcess -Force
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8001).OwningProcess -Force
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess -Force
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

### Graceful Stop
Press `Ctrl+C` in each terminal window where services are running.

---

## Data Flow Architecture

```
Arduino (COM7)
    ↓ Serial JSON: {light, sound, temperature, timestamp}
Sensor API (4002)
    ↓ HTTP: /api/sensors/stats
FastAPI ML (8001)
    ↓ HTTP: /predict-delirium/from-arduino
Backend API (3001)
    ↓ HTTP: /api/patients/P001 with isLiveMonitored=true
Frontend (3000)
    ↓ Auto-refresh every 5 seconds
Dashboard Display with 🔴 LIVE badge
```

---

## Common Issues

### Arduino Not Detected
- Close Arduino IDE Serial Monitor
- Check Device Manager → Ports (COM & LPT)
- Update `sensors.js` line with correct COM port if needed
- Replug Arduino USB cable

### Risk Score Always 85
- Verify FastAPI is running and accessible: `Invoke-RestMethod "http://localhost:8001/sensor-data/stats"`
- Check backend logs for "FastAPI not available" warnings
- Ensure sensor API is receiving Arduino data

### Frontend Not Updating
- Check browser console (F12) for errors
- Verify backend is accessible: `Invoke-RestMethod "http://localhost:3001/api/patients/P001"`
- Hard refresh browser: `Ctrl+Shift+R`

### Port Already in Use
Kill the process:
```powershell
$port = 3001  # Change to problematic port
Stop-Process -Id (Get-NetTCPConnection -LocalPort $port).OwningProcess -Force
```

---

## Project Structure

```
delirium_solution/
├── START_ALL_SERVICES.bat          ← Double-click to start everything
├── STARTUP_GUIDE.md                ← This file
├── package.json                    ← NPM scripts for all services
├── sensors.js                      ← Sensor API (Arduino reader)
├── venv/                          ← Python virtual environment
├── src/backend/
│   ├── models/
│   │   ├── delirium_model.joblib
│   │   └── delirium_features.joblib
│   └── services/
│       └── delirium_service.py    ← FastAPI ML service
└── services/
    ├── backend/
    │   ├── server.js              ← Node.js backend API
    │   └── data/
    │       └── patients.json
    └── frontend/
        ├── src/
        │   └── components/
        │       └── PatientRankBar/ ← Shows LIVE badge
        └── package.json
```

---

## NPM Scripts Available

```bash
npm run start:sensors   # Start Arduino sensor API
npm run start:backend   # Start backend server
npm run start:frontend  # Start React frontend
```

---

## Support

If you encounter issues not covered here:
1. Check terminal output for error messages
2. Verify all dependencies are installed
3. Ensure Arduino is connected and Serial Monitor is closed
4. Check that no other applications are using the required ports
