# generate_synthetic_delirium_data.py
# generates this csv: patient_id,window_id,sound_mean_db,sound_night_db,light_day_lux,light_night_lux,hr_mean,temp_mean,age,delirium_risk,delirium_label
import numpy as np
import pandas as pd
from rules_delirium import compute_delirium_risk_df

N = 100_000  # number of windows (e.g., 6h windows across patients)

rng = np.random.default_rng(seed=42)

# Synthetic patients: skew older to get signal
patient_ids = rng.integers(1, 5000, size=N)  # 5k patients
window_ids = np.arange(N)

# Sound (dB)
sound_mean_db = rng.normal(loc=55, scale=10, size=N)       # overall
sound_night_db = rng.normal(loc=50, scale=12, size=N)      # slightly quieter
# Inject some very noisy windows
mask_noisy_night = rng.random(N) < 0.2
sound_night_db[mask_noisy_night] += rng.normal(loc=20, scale=5, size=mask_noisy_night.sum())

# Light (lux)
light_day_lux = rng.lognormal(mean=4.5, sigma=0.5, size=N)   # ~90–3000 lux
light_night_lux = rng.lognormal(mean=1.5, sigma=0.5, size=N) # ~3–30 lux
# Inject circadian disruption cases (similar day/night)
mask_circadian_bad = rng.random(N) < 0.2
light_day_lux[mask_circadian_bad] = rng.lognormal(mean=3.2, sigma=0.3, size=mask_circadian_bad.sum())
light_night_lux[mask_circadian_bad] = rng.lognormal(mean=3.0, sigma=0.3, size=mask_circadian_bad.sum())

# Heart rate (bpm)
hr_mean = rng.normal(loc=80, scale=15, size=N)
mask_tachy = rng.random(N) < 0.15
hr_mean[mask_tachy] += rng.normal(loc=25, scale=10, size=mask_tachy.sum())

# Temperature (°C)
temp_mean = rng.normal(loc=37.0, scale=0.4, size=N)
mask_fever = rng.random(N) < 0.1
temp_mean[mask_fever] += rng.normal(loc=1.3, scale=0.3, size=mask_fever.sum())

# Age (years)
age = rng.normal(loc=72, scale=12, size=N)
age = np.clip(age, 18, 100)

df = pd.DataFrame(
    {
        "patient_id": patient_ids,
        "window_id": window_ids,
        "sound_mean_db": sound_mean_db,
        "sound_night_db": sound_night_db,
        "light_day_lux": light_day_lux,
        "light_night_lux": light_night_lux,
        "hr_mean": hr_mean,
        "temp_mean": temp_mean,
        "age": age,
    }
)

df = compute_delirium_risk_df(df)

print(df.head())
print(df["delirium_label"].value_counts(normalize=True))

# Save to CSV
df.to_csv("synthetic_delirium_data.csv", index=False)
print("Saved synthetic_delirium_data.csv")
