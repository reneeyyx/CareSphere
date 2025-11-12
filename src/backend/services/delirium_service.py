from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import joblib

# Load artifacts at startup
model = joblib.load("../models/delirium_model.joblib")
feature_cols = joblib.load("../models/delirium_features.joblib")

app = FastAPI(title="Delirium Risk Classifier")


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