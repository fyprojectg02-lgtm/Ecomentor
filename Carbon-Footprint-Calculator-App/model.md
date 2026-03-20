# Carbon Footprint Prediction Model

## Dataset

- **File:** `Carbon Emission.csv`
- **Source:** [Kaggle — Individual Carbon Footprint Calculation](https://www.kaggle.com/datasets/dumanmesut/individual-carbon-footprint-calculation)
- **Size:** 10,000 rows × 20 columns
- **Target:** `CarbonEmission` — monthly CO₂ emissions per individual in **kgCO₂e**

### Input Features

| Category | Features |
|---|---|
| Personal | Body Type, Sex, Diet, Social Activity |
| Travel | Transport, Vehicle Type, Vehicle Monthly Distance Km, Frequency of Traveling by Air |
| Energy | Heating Energy Source, Energy Efficiency, Cooking Appliances, TV/PC Hours, Internet Hours, How Often Shower |
| Waste | Waste Bag Size, Waste Bag Weekly Count, Recycling (Paper, Plastic, Glass, Metal) |
| Consumption | Monthly Grocery Bill, How Many New Clothes Monthly |

Two columns — `Recycling` and `Cooking_With` — were stored as stringified Python lists (e.g. `['Metal', 'Paper']`) and expanded into individual binary columns during preprocessing.

---

## Preprocessing

1. **List column expansion** — `Recycling` and `Cooking_With` parsed with `ast.literal_eval` and one-hot encoded into binary columns
2. **Ordinal encoding** — Body Type, Sex, Shower Frequency, Social Activity, Air Travel Frequency, Waste Bag Size, Energy Efficiency mapped to integers
3. **One-hot encoding** — Diet, Heating Energy Source, Transport, Vehicle Type expanded into binary columns
4. **Log transform** — target `CarbonEmission` log-transformed (`np.log`) before training; predictions are reversed with `np.exp` at inference time to handle the right-skewed distribution
5. **StandardScaler** — all 39 features standardized to zero mean and unit variance before being fed to the network

---

## Model

**Algorithm:** `MLPRegressor` — Multi-Layer Perceptron (Artificial Neural Network) from scikit-learn

### Architecture

```
Input (39 features)
      ↓
Hidden Layer 1 — 64 neurons, tanh
      ↓
Hidden Layer 2 — 128 neurons, tanh
      ↓
Hidden Layer 3 — 64 neurons, tanh
      ↓
Output — 1 neuron (log CO₂ prediction)
```

### Hyperparameters

| Parameter | Value |
|---|---|
| Hidden layers | (64, 128, 64) |
| Activation | tanh |
| Optimizer | Adam |
| Learning rate | 0.001 (constant) |
| Max iterations | 500 |
| Early stopping | Yes |
| No-change window | 10 iterations |
| Validation fraction | 10% of training set |
| L2 regularization (alpha) | 0.0001 |
| Random state | 42 |

---

## Training

- **Split:** 80% train / 20% test (8,000 / 2,000 samples), stratified by random seed 42
- **Scaling:** `StandardScaler` fit on training set only, applied to both train and test
- **Early stopping** monitors validation loss and halts training when no improvement is seen for 10 consecutive iterations, preventing overfitting

---

## Results

| Metric | Value |
|---|---|
| Test MAE | 81.80 kgCO₂e |
| Test R² | 0.9873 |
| Accuracy (±10%) | 96.75% |

- **MAE of 81.80 kgCO₂e** — on average, predictions are within ~82 kg of the actual monthly emission. Given the dataset range spans roughly 500–4,000+ kgCO₂e, this is a low absolute error.
- **R² of 0.9873** — the model explains 98.73% of the variance in carbon emissions, indicating a very strong fit.
- **96.75% accuracy** — 96.75% of predictions fall within the true value.

### Output Files

| File | Description |
|---|---|
| `models/model.sav` | Trained MLPRegressor (pickle) |
| `models/scale.sav` | Fitted StandardScaler (pickle) |
