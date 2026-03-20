from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
from functions import input_preprocessing, hesapla

app = Flask(__name__)
CORS(app)

with open("./models/model.sav", "rb") as f:
    model = pickle.load(f)
with open("./models/scale.sav", "rb") as f:
    scaler = pickle.load(f)

@app.route("/calculate", methods=["POST"])
def calculate():
    try:
        body = request.json

        raw = pd.DataFrame([{
            "Body Type": body["bodyType"],
            "Sex": body["sex"],
            "How Often Shower": body["shower"],
            "Social Activity": body["socialActivity"],
            "Monthly Grocery Bill": body["groceryBill"],
            "Frequency of Traveling by Air": body["airTravel"],
            "Vehicle Monthly Distance Km": body["vehicleKm"],
            "Waste Bag Size": body["wasteBagSize"],
            "Waste Bag Weekly Count": body["wasteBagCount"],
            "How Long TV PC Daily Hour": body["tvPcHours"],
            "How Many New Clothes Monthly": body["newClothes"],
            "How Long Internet Daily Hour": body["internetHours"],
            "Energy efficiency": body["energyEfficiency"],
            "Diet": body["diet"],
            "Heating Energy Source": body["heatingSource"],
            "Transport": body["transport"],
            "Vehicle Type": body["vehicleType"],
            "Do You Recyle_Paper": int(body["recyclePaper"]),
            "Do You Recyle_Plastic": int(body["recyclePlastic"]),
            "Do You Recyle_Glass": int(body["recycleGlass"]),
            "Do You Recyle_Metal": int(body["recycleMetal"]),
            "Cooking_with_stove": int(body["cookStove"]),
            "Cooking_with_oven": int(body["cookOven"]),
            "Cooking_with_microwave": int(body["cookMicrowave"]),
            "Cooking_with_grill": int(body["cookGrill"]),
            "Cooking_with_airfryer": int(body["cookAirfryer"]),
        }])

        processed = input_preprocessing(raw)

        # Align columns with training data
        from functions import sample
        sample_df = pd.DataFrame([sample])
        for col in sample_df.columns:
            if col not in processed.columns:
                processed[col] = 0
        processed = processed[sample_df.columns]

        total = float(np.exp(model.predict(scaler.transform(processed)))[0])
        breakdown = hesapla(model, scaler, processed)

        trees = total / 411.4

        return jsonify({
            "total": round(total, 1),
            "breakdown": {k: round(float(v), 1) for k, v in breakdown.items()},
            "trees": round(trees, 1)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5001)
