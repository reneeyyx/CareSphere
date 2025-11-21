from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import joblib
import httpx
import os

# Load artifacts at startup
model = joblib.load("../models/delirium_model.joblib")
feature_cols = joblib.load("../models/delirium_features.joblib")

app = FastAPI(title="Delirium Risk Classifier")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Node.js sensor API URL
SENSOR_API_URL = os.getenv("SENSOR_API_URL", "http://localhost:4002")


class DeliriumInput(BaseModel):
    sound_mean_db: float
    sound_night_db: float
    light_day_lux: float
    light_night_lux: float
    hr_mean: float
    temp_mean: float
    age: float


class DeliriumOutput(BaseModel):
    risk_score: float
    risk_level: str
    label: int
    top_features: list[str]


def risk_level_from_score(score: float) -> str:
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


@app.post("/predict-delirium/from-arduino", response_model=DeliriumOutput)
async def predict_delirium_from_arduino(age: float = 75.0):
    """
    Predict delirium risk using live Arduino sensor data from Node.js API
    
    Args:
        age: Patient age (default: 75.0)
    """
    # Get aggregated sensor stats from Node.js API
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{SENSOR_API_URL}/api/sensors/stats", timeout=5.0)
            response.raise_for_status()
            stats = response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=503, detail=f"Sensor API unavailable: {str(e)}")
    
    # Map Node.js sensor data to model features
    # You may need to adjust these mappings based on your actual sensor calibrations
    input_dict = {
        'sound_mean_db': stats['sound_mean'],  # May need conversion/calibration
        'sound_night_db': stats['sound_mean'],  # Could track day/night separately
        'light_day_lux': stats['light_mean'],   # May need conversion to lux
        'light_night_lux': stats['light_mean'], # Could track day/night separately
        'hr_mean': stats['hr_mean'],
        'temp_mean': stats['temp_mean'],
        'age': age
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