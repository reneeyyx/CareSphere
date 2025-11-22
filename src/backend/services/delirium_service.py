"""FastAPI Delirium Risk Prediction Service

This service provides ML-based delirium risk predictions using:
- Pre-trained XGBoost model
- Real-time Arduino sensor data (light, sound, temperature)
- Patient demographic information (age)

Endpoints:
- /predict-delirium: Manual prediction with all parameters
- /predict-delirium/from-arduino: Live prediction using Arduino sensors
- /sensor-data/latest: Get latest sensor reading
- /sensor-data/stats: Get aggregated sensor statistics
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import joblib
import httpx
import os

# Load pre-trained ML model and feature list at startup
# Model trained on: sound_mean_db, sound_night_db, light_day_lux, light_night_lux, hr_mean, temp_mean, age
model = joblib.load("../models/delirium_model.joblib")
feature_cols = joblib.load("../models/delirium_features.joblib")

app = FastAPI(title="Delirium Risk Classifier")

# Enable CORS to allow requests from frontend (port 3000) and backend (port 3001)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# URL for Node.js sensor API that reads Arduino data
SENSOR_API_URL = os.getenv("SENSOR_API_URL", "http://localhost:4002")


class DeliriumInput(BaseModel):
    """Input model for delirium prediction with all required environmental factors"""
    sound_mean_db: float          # Average sound level in decibels
    sound_night_db: float          # Nighttime sound level in decibels
    light_day_lux: float           # Daytime light level in lux
    light_night_lux: float         # Nighttime light level in lux
    hr_mean: float = 75.0          # Mean heart rate (default: 75 bpm - normal resting)
    temp_mean: float               # Average temperature in Celsius
    age: float                     # Patient age in years


class DeliriumOutput(BaseModel):
    """Output model containing risk prediction and feature importance"""
    risk_score: float              # Probability of delirium (0.0 to 1.0)
    risk_level: str                # Categorical risk: LOW, MEDIUM, or HIGH
    label: int                     # Binary prediction: 0 (no delirium) or 1 (delirium)
    top_features: list[str]        # Top 3 contributing features to risk


def risk_level_from_score(score: float) -> str:
    """Convert probability score to categorical risk level
    
    Args:
        score: Probability from 0.0 to 1.0
    
    Returns:
        Risk category: LOW (<20%), MEDIUM (20-50%), or HIGH (>50%)
    """
    if score < 0.2:
        return "LOW"
    elif score < 0.5:
        return "MEDIUM"
    else:
        return "HIGH"


@app.get("/sensor-data/latest")
async def get_latest_sensor_data():
    """Get the most recent sensor reading from Node.js API"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{SENSOR_API_URL}/api/sensors/latest", timeout=5.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=503, detail=f"Sensor API unavailable: {str(e)}")


@app.get("/sensor-data/stats")
async def get_sensor_stats():
    """Get aggregated sensor statistics from Node.js API"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{SENSOR_API_URL}/api/sensors/stats", timeout=5.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=503, detail=f"Sensor API unavailable: {str(e)}")


@app.post("/predict-delirium", response_model=DeliriumOutput)
def predict_delirium(input_data: DeliriumInput):
    # Arrange inputs in correct feature order
    x = np.array([[getattr(input_data, f) for f in feature_cols]])

    proba = float(model.predict_proba(x)[0, 1])
    label = int(proba >= 0.5)
    level = risk_level_from_score(proba)

    # Simple global feature importance
    xgb_model = model.named_steps["clf"]
    importances = xgb_model.feature_importances_
    feature_importance_pairs = sorted(
        zip(feature_cols, importances),
        key=lambda t: -t[1],
    )
    top_features = [name for name, _ in feature_importance_pairs[:3]]

    return DeliriumOutput(
        risk_score=proba,
        risk_level=level,
        label=label,
        top_features=top_features,
    )


@app.get("/predict-delirium/from-arduino", response_model=DeliriumOutput)
async def predict_delirium_from_arduino(age: float = 75.0):
    """
    Predict delirium risk using live Arduino sensor data
    
    This endpoint:
    1. Fetches real-time sensor readings from Node.js sensor API (port 4002)
    2. Maps sensor values to ML model features
    3. Runs prediction using pre-trained XGBoost model
    4. Returns risk score, level, and top contributing factors
    
    Args:
        age: Patient age in years (default: 75.0)
    
    Returns:
        DeliriumOutput with risk_score, risk_level, label, and top_features
    
    Raises:
        HTTPException: If sensor API is unavailable (503)
    """
    # Fetch aggregated sensor statistics from Node.js API
    # Stats include: sound_mean, light_mean, temp_mean, temp_min, temp_max
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{SENSOR_API_URL}/api/sensors/stats", timeout=5.0)
            response.raise_for_status()
            stats = response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=503, detail=f"Sensor API unavailable: {str(e)}")
    
    # Map Arduino sensor data to ML model feature requirements
    # Note: Using same value for day/night since Arduino doesn't track time of day
    # TODO: Implement time-based day/night tracking for more accurate predictions
    input_dict = {
        'sound_mean_db': stats['sound_mean'],    # Raw analog value (0-1023) - may need dB conversion
        'sound_night_db': stats['sound_mean'],   # Same as day (no time tracking yet)
        'light_day_lux': stats['light_mean'],    # Raw analog value (0-1023) - may need lux conversion
        'light_night_lux': stats['light_mean'],  # Same as day (no time tracking yet)
        'hr_mean': 75.0,                         # Heart rate sensor removed - using default normal value
        'temp_mean': stats['temp_mean'],         # Temperature in Celsius from TMP36 sensor
        'age': age                               # Patient age from query parameter
    }
    
    # Arrange inputs in correct feature order
    x = np.array([[input_dict[f] for f in feature_cols]])
    
    proba = float(model.predict_proba(x)[0, 1])
    label = int(proba >= 0.5)
    level = risk_level_from_score(proba)
    
    # Get feature importance
    xgb_model = model.named_steps["clf"]
    importances = xgb_model.feature_importances_
    feature_importance_pairs = sorted(
        zip(feature_cols, importances),
        key=lambda t: -t[1],
    )
    top_features = [name for name, _ in feature_importance_pairs[:3]]
    
    return DeliriumOutput(
        risk_score=proba,
        risk_level=level,
        label=label,
        top_features=top_features,
    )