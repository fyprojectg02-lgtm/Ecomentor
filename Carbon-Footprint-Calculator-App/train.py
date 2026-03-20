"""
Training script for Carbon Footprint MLPRegressor model.
Reads 'Carbon Emission.csv', preprocesses, trains, evaluates, and saves
model.sav + scale.sav into the models/ folder.
"""

import ast
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score

# ── 1. Load ──────────────────────────────────────────────────────────────────
df = pd.read_csv("Carbon Emission.csv")
print(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")

# ── 2. Expand list-columns (Recycling, Cooking_With) ─────────────────────────
def expand_list_col(df, col, prefix):
    """Parse stringified lists and one-hot encode each unique value."""
    parsed = df[col].apply(lambda x: ast.literal_eval(x) if pd.notna(x) and x != "[]" else [])
    all_vals = sorted({v for lst in parsed for v in lst})
    for val in all_vals:
        clean = val.strip().replace(" ", "_").replace("/", "_")
        df[f"{prefix}_{clean}"] = parsed.apply(lambda lst: int(val in lst))
    return df.drop(columns=[col])

df = expand_list_col(df, "Recycling",    "Do You Recyle")
df = expand_list_col(df, "Cooking_With", "Cooking_with")

# Normalise cooking column names to lowercase to match functions.py expectations
df.columns = [
    c if not c.startswith("Cooking_with") else "Cooking_with_" + c.split("Cooking_with_")[1].lower()
    for c in df.columns
]

# ── 3. Encode categorical columns ────────────────────────────────────────────
body_map      = {"underweight": 0, "normal": 1, "overweight": 2, "obese": 3}
sex_map       = {"female": 0, "male": 1}
shower_map    = {"less frequently": 0, "daily": 1, "twice a day": 2, "more frequently": 3}
social_map    = {"never": 0, "sometimes": 1, "often": 2}
air_map       = {"never": 0, "rarely": 1, "frequently": 2, "very frequently": 3}
waste_sz_map  = {"small": 0, "medium": 1, "large": 2, "extra large": 3}
energy_eff_map= {"No": 0, "Sometimes": 1, "Yes": 2}

df["Body Type"]                      = df["Body Type"].map(body_map)
df["Sex"]                            = df["Sex"].map(sex_map)
df["How Often Shower"]               = df["How Often Shower"].map(shower_map)
df["Social Activity"]                = df["Social Activity"].map(social_map)
df["Frequency of Traveling by Air"]  = df["Frequency of Traveling by Air"].map(air_map)
df["Waste Bag Size"]                 = df["Waste Bag Size"].map(waste_sz_map)
df["Energy efficiency"]              = df["Energy efficiency"].map(energy_eff_map)

# One-hot encode remaining categoricals
df = pd.get_dummies(df, columns=["Diet", "Heating Energy Source", "Transport", "Vehicle Type"], dtype=int)

# ── 4. Align columns to match the original model's feature order ──────────────
EXPECTED_COLS = [
    'Body Type', 'Sex', 'How Often Shower', 'Social Activity',
    'Monthly Grocery Bill', 'Frequency of Traveling by Air',
    'Vehicle Monthly Distance Km', 'Waste Bag Size', 'Waste Bag Weekly Count',
    'How Long TV PC Daily Hour', 'How Many New Clothes Monthly',
    'How Long Internet Daily Hour', 'Energy efficiency',
    'Do You Recyle_Paper', 'Do You Recyle_Plastic',
    'Do You Recyle_Glass', 'Do You Recyle_Metal',
    'Cooking_with_stove', 'Cooking_with_oven', 'Cooking_with_microwave',
    'Cooking_with_grill', 'Cooking_with_airfryer',
    'Diet_omnivore', 'Diet_pescatarian', 'Diet_vegan', 'Diet_vegetarian',
    'Heating Energy Source_coal', 'Heating Energy Source_electricity',
    'Heating Energy Source_natural gas', 'Heating Energy Source_wood',
    'Transport_private', 'Transport_public', 'Transport_walk/bicycle',
    'Vehicle Type_None', 'Vehicle Type_diesel', 'Vehicle Type_electric',
    'Vehicle Type_hybrid', 'Vehicle Type_lpg', 'Vehicle Type_petrol',
]

# Add any missing columns as 0
for col in EXPECTED_COLS:
    if col not in df.columns:
        df[col] = 0

X = df[EXPECTED_COLS]
y = np.log(df["CarbonEmission"])   # log-transform target (model predicts log scale)

print(f"Features: {X.shape[1]}  |  Target: log(CarbonEmission)")

# ── 5. Train / test split ─────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ── 6. Scale ──────────────────────────────────────────────────────────────────
scaler = StandardScaler()
X_train_sc = scaler.fit_transform(X_train)
X_test_sc  = scaler.transform(X_test)

# ── 7. Train MLPRegressor ─────────────────────────────────────────────────────
model = MLPRegressor(
    hidden_layer_sizes=(64, 128, 64),
    activation="tanh",
    solver="adam",
    learning_rate_init=0.001,
    max_iter=500,
    early_stopping=True,
    n_iter_no_change=10,
    validation_fraction=0.1,
    alpha=0.0001,
    random_state=42,
    verbose=True,
)

print("\nTraining model...")
model.fit(X_train_sc, y_train)
print(f"Stopped at iteration: {model.n_iter_}")

# ── 8. Evaluate ───────────────────────────────────────────────────────────────
y_pred_log = model.predict(X_test_sc)
y_pred     = np.exp(y_pred_log)
y_true     = np.exp(y_test)

mae = mean_absolute_error(y_true, y_pred)
r2  = r2_score(y_true, y_pred)

# Accuracy: % of predictions within ±10% of actual value
within_10pct = np.mean(np.abs(y_pred - y_true) / y_true <= 0.10) * 100

print(f"\nTest MAE      : {mae:.2f} kgCO₂e")
print(f"Test R²       : {r2:.4f}")
print(f"Accuracy: {within_10pct:.2f}%")

# ── 9. Save ───────────────────────────────────────────────────────────────────
with open("models/model.sav", "wb") as f:
    pickle.dump(model, f)
with open("models/scale.sav", "wb") as f:
    pickle.dump(scaler, f)

print("\nSaved → models/model.sav")
print("Saved → models/scale.sav")
