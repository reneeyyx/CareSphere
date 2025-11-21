# CareSphere - Complete Setup Guide

## Architecture Overview

```
Arduino Sensors → Serial Port (COM10) → Node.js Sensor API (port 4002)
                                              ↓
                                        FastAPI ML Service (port 8001)
                                              ↓
                                        Node.js Backend (port 3001)
                                              ↓
                                        React Frontend (port 5173)
```

## Prerequisites

- Arduino with sensors (light, sound, temperature, pulse oximeter)
- Node.js installed
- Python 3.12 with virtual environment
- COM10 available (or update port in configuration)

## Step-by-Step Setup

### 1. Upload Arduino Code

1. Open Arduino IDE
2. Load `sensors_updated.cpp`
3. Verify your Arduino is connected to COM10 (or update port in code)
4. Upload to Arduino
5. Arduino will start sending JSON sensor data every 5 seconds

### 2. Start Node.js Sensor API (Terminal 1)

```powershell
# From project root
node sensors.js
```

This will:
- Connect to Arduino on COM10
- Read sensor data continuously
- Expose API on http://localhost:4002

**Endpoints:**
- `GET /api/sensors/latest` - Latest reading
- `GET /api/sensors/stats` - Aggregated statistics
- `GET /api/sensors/history` - All readings

### 3. Start FastAPI ML Service (Terminal 2)

```powershell
# Activate virtual environment
& C:\Users\renee\projects\delirium_solution\venv\Scripts\Activate.ps1

# Navigate to backend services
cd src\backend\services

# Start FastAPI
C:/Users/renee/projects/delirium_solution/venv/Scripts/python.exe -m uvicorn delirium_service:app --reload --port 8001
```

This will:
- Load ML model
- Connect to Node.js sensor API
- Expose prediction API on http://localhost:8001

**Endpoints:**
- `POST /predict-delirium` - Manual prediction
- `POST /predict-delirium/from-arduino?age=75` - Live Arduino prediction
- `GET /sensor-data/latest` - Latest sensor data
- `GET /sensor-data/stats` - Sensor statistics

### 4. Start Node.js Backend (Terminal 3)

```powershell
cd services\backend
npm start
```

This will:
- Serve patient data from JSON file
- Fetch live predictions from FastAPI for patient P001
- Expose API on http://localhost:3001

### 5. Start React Frontend (Terminal 4)

```powershell
cd services\frontend
npm run dev
```

This will:
- Start development server on http://localhost:5173
- Display patient dashboard
- Show live monitoring for patient P001 (Margaret Thompson)

## Live Monitoring Patient

**Patient P001 (Margaret Thompson)** is designated for live Arduino monitoring.

When the system is running:
- This patient will show a **🔴 LIVE** badge
- Risk score and level update in real-time based on Arduino sensor data
- Risk factors show the top 3 features from the ML model

## Changing the Monitored Patient

To monitor a different patient, edit `services/backend/server.js`:

```javascript
const ARDUINO_PATIENT_ID = 'P001' // Change to any patient ID
```

## Testing Without Arduino

If Arduino is not connected:
- Sensor API will show connection errors (expected)
- FastAPI will return errors for `/from-arduino` endpoint
- Patient P001 will fall back to static data
- System continues to work with manual predictions

## API Testing

Visit these URLs to test each service:

1. **Sensor API**: http://localhost:4002/api/sensors/latest
2. **FastAPI Docs**: http://localhost:8001/docs
3. **Backend API**: http://localhost:3001/api/patients
4. **Frontend**: http://localhost:5173

## Troubleshooting

### Arduino Not Connecting
- Check Device Manager for correct COM port
- Update `ARDUINO_PORT` in `sensors.js`
- Ensure Arduino is sending data (check Serial Monitor)

### FastAPI Can't Reach Sensor API
- Ensure `sensors.js` is running on port 4002
- Check `SENSOR_API_URL` in `delirium_service.py`

### Frontend Not Showing Live Data
- Verify all 4 services are running
- Check browser console for errors
- Ensure backend can reach FastAPI

## Port Summary

| Service | Port | URL |
|---------|------|-----|
| Node.js Sensor API | 4002 | http://localhost:4002 |
| FastAPI ML Service | 8001 | http://localhost:8001 |
| Node.js Backend | 3001 | http://localhost:3001 |
| React Frontend | 5173 | http://localhost:5173 |

## Data Flow for Live Monitoring

1. Arduino sensors measure environment (light, sound, temp, heart rate)
2. Node.js reads serial data and stores in memory
3. FastAPI calls Node.js API to get aggregated stats
4. FastAPI runs ML prediction on sensor data
5. Backend API calls FastAPI for patient P001
6. Frontend fetches from backend and displays live badge
7. Dashboard updates show real-time risk assessment

Refresh the frontend page to see updated predictions!
