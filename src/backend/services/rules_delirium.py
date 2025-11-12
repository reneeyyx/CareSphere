# rules_delirium.py
import numpy as np
import pandas as pd
from dataclasses import dataclass


@dataclass
class DeliriumRiskConfig:
    noise_threshold_db: float = 60.0          # night noise threshold - Delirium risk sharply increases above ~60 dB, particularly sustained noise peak
    fever_threshold_c: float = 38.0          # fever threshold
    tachy_threshold_bpm: float = 100.0       # tachycardia threshold - Tachycardia is defined clinically as HR ≥ 100 bpm
    high_age_threshold: float = 75.0         # elderly
    circadian_ratio_threshold: float = 1.5   # day/night light ratio
    # global scaling
    base_risk: float = 0.05                  # baseline risk for all
    label_threshold: float = 0.50            # risk -> label


def compute_delirium_risk_row(
    sound_mean_db: float,
    sound_night_db: float,
    light_day_lux: float,
    light_night_lux: float,
    hr_mean: float,
    temp_mean: float,
    age: float,
    cfg: DeliriumRiskConfig = DeliriumRiskConfig(),
):
    """
    Rule-based risk scoring inspired by known delirium risk factors.
    This is NOT clinically validated – use only for synthetic/prototyping.
    """
    risk = cfg.base_risk
    contributions = {}

    # 1) Noise (night-time noise is worse)
    if sound_night_db > cfg.noise_threshold_db:
        extra = min(0.25, (sound_night_db - cfg.noise_threshold_db) / 40.0)
        risk += extra
        contributions["night_noise"] = extra

    if sound_mean_db > cfg.noise_threshold_db:
        extra = min(0.10, (sound_mean_db - cfg.noise_threshold_db) / 50.0)
        risk += extra
        contributions["overall_noise"] = extra

    # 2) Light / circadian disruption
    # If day is not much brighter than night, circadian disruption
    ratio = (light_day_lux + 1.0) / (light_night_lux + 1.0)
    if ratio < cfg.circadian_ratio_threshold:
        extra = 0.20
        risk += extra
        contributions["circadian_light"] = extra

    # 3) Fever / infection
    if temp_mean >= cfg.fever_threshold_c:
        extra = min(0.20, (temp_mean - cfg.fever_threshold_c) / 2.0)
        risk += extra
        contributions["fever"] = extra

    # 4) Tachycardia
    if hr_mean >= cfg.tachy_threshold_bpm:
        extra = min(0.20, (hr_mean - cfg.tachy_threshold_bpm) / 40.0)
        risk += extra
        contributions["tachycardia"] = extra

    # 5) Age
    if age >= cfg.high_age_threshold:
        extra = 0.20
        risk += extra
        contributions["age"] = extra

    # Clamp to [0,1]
    risk = float(np.clip(risk, 0.0, 1.0))
    label = int(risk >= cfg.label_threshold)
    return risk, label, contributions


def compute_delirium_risk_df(df: pd.DataFrame, cfg: DeliriumRiskConfig = DeliriumRiskConfig()):
    """
    Vectorized wrapper: expects columns:
    ['sound_mean_db','sound_night_db','light_day_lux','light_night_lux',
     'hr_mean','temp_mean','age']
    """
    risks = []
    labels = []
    for row in df.itertuples(index=False):
        risk, label, _ = compute_delirium_risk_row(
            sound_mean_db=row.sound_mean_db,
            sound_night_db=row.sound_night_db,
            light_day_lux=row.light_day_lux,
            light_night_lux=row.light_night_lux,
            hr_mean=row.hr_mean,
            temp_mean=row.temp_mean,
            age=row.age,
            cfg=cfg,
        )
        risks.append(risk)
        labels.append(label)

    df = df.copy()
    df["delirium_risk"] = risks
    df["delirium_label"] = labels
    return df