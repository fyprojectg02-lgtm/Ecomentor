"use client";
import { useState } from "react";
import { Wind, Car, Trash2, Zap, ShoppingBag, TreePine, Loader2 } from "lucide-react";

const SECTIONS = ["Personal", "Travel", "Waste", "Energy", "Consumption"];

const defaultForm = {
  // Personal
  height: 170, weight: 70,
  sex: "male", diet: "omnivore", socialActivity: "sometimes",
  // Travel
  transport: "public", vehicleType: "None", vehicleKm: 0, airTravel: "never",
  // Waste
  wasteBagSize: "medium", wasteBagCount: 2,
  recyclePaper: false, recyclePlastic: false, recycleGlass: false, recycleMetal: false,
  // Energy
  heatingSource: "natural gas", energyEfficiency: "Sometimes",
  cookStove: false, cookOven: false, cookMicrowave: false, cookGrill: false, cookAirfryer: false,
  tvPcHours: 3, internetHours: 3,
  // Consumption
  shower: "daily", groceryBill: 200, newClothes: 5,
};

function getBMI(h, w) {
  const bmi = w / (h / 100) ** 2;
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

const BREAKDOWN_COLORS = {
  Travel: "#10b981",
  Energy: "#3b82f6",
  Waste: "#f59e0b",
  Diet: "#8b5cf6",
};

export default function CarbonCalculatorPage() {
  const [form, setForm] = useState(defaultForm);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        bodyType: getBMI(form.height, form.weight),
        sex: form.sex,
        shower: form.shower,
        socialActivity: form.socialActivity,
        groceryBill: form.groceryBill,
        airTravel: form.airTravel,
        vehicleKm: form.vehicleKm,
        wasteBagSize: form.wasteBagSize,
        wasteBagCount: form.wasteBagCount,
        tvPcHours: form.tvPcHours,
        newClothes: form.newClothes,
        internetHours: form.internetHours,
        energyEfficiency: form.energyEfficiency,
        diet: form.diet,
        heatingSource: form.heatingSource,
        transport: form.transport,
        vehicleType: form.transport === "private" ? form.vehicleType : "None",
        recyclePaper: form.recyclePaper,
        recyclePlastic: form.recyclePlastic,
        recycleGlass: form.recycleGlass,
        recycleMetal: form.recycleMetal,
        cookStove: form.cookStove,
        cookOven: form.cookOven,
        cookMicrowave: form.cookMicrowave,
        cookGrill: form.cookGrill,
        cookAirfryer: form.cookAirfryer,
      };

      const res = await fetch("/api/carbon-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setStep(5);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500";
  const labelClass = "block text-xs text-gray-400 mb-1";
  const checkboxClass = "w-4 h-4 accent-emerald-500 cursor-pointer";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-[#0b0b0b] border border-[#111] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Wind className="text-emerald-500" size={24} />
          <h2 className="text-xl font-semibold text-white">Carbon Footprint Calculator</h2>
        </div>
        <p className="text-sm text-gray-400">Estimate your monthly CO₂ emissions based on your lifestyle.</p>
      </div>

      {/* Step Tabs */}
      {step < 5 && (
        <div className="flex gap-2 flex-wrap">
          {SECTIONS.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${step === i ? "bg-emerald-600 text-white" : "bg-[#111] text-gray-400 hover:bg-[#1a1a1a]"}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Step 0: Personal */}
      {step === 0 && (
        <div className="bg-[#0b0b0b] border border-[#111] rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Height (cm)</label>
              <input type="number" className={inputClass} value={form.height} onChange={e => set("height", +e.target.value)} min={100} max={250} />
            </div>
            <div>
              <label className={labelClass}>Weight (kg)</label>
              <input type="number" className={inputClass} value={form.weight} onChange={e => set("weight", +e.target.value)} min={30} max={300} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Gender</label>
            <select className={inputClass} value={form.sex} onChange={e => set("sex", e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Diet</label>
            <select className={inputClass} value={form.diet} onChange={e => set("diet", e.target.value)}>
              <option value="omnivore">Omnivore</option>
              <option value="pescatarian">Pescatarian</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Social Activity (going out)</label>
            <select className={inputClass} value={form.socialActivity} onChange={e => set("socialActivity", e.target.value)}>
              <option value="never">Never</option>
              <option value="sometimes">Sometimes</option>
              <option value="often">Often</option>
            </select>
          </div>
        </div>
      )}

      {/* Step 1: Travel */}
      {step === 1 && (
        <div className="bg-[#0b0b0b] border border-[#111] rounded-xl p-6 space-y-4">
          <div>
            <label className={labelClass}>Primary Transport</label>
            <select className={inputClass} value={form.transport} onChange={e => set("transport", e.target.value)}>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="walk/bicycle">Walk / Bicycle</option>
            </select>
          </div>
          {form.transport === "private" && (
            <div>
              <label className={labelClass}>Vehicle Type</label>
              <select className={inputClass} value={form.vehicleType} onChange={e => set("vehicleType", e.target.value)}>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="lpg">LPG</option>
                <option value="electric">Electric</option>
              </select>
            </div>
          )}
          {form.transport !== "walk/bicycle" && (
            <div>
              <label className={labelClass}>Monthly Distance by Vehicle (km): {form.vehicleKm}</label>
              <input type="range" min={0} max={5000} step={10} value={form.vehicleKm} onChange={e => set("vehicleKm", +e.target.value)} className="w-full accent-emerald-500" />
            </div>
          )}
          <div>
            <label className={labelClass}>Air Travel Frequency (last month)</label>
            <select className={inputClass} value={form.airTravel} onChange={e => set("airTravel", e.target.value)}>
              <option value="never">Never</option>
              <option value="rarely">Rarely</option>
              <option value="frequently">Frequently</option>
              <option value="very frequently">Very Frequently</option>
            </select>
          </div>
        </div>
      )}

      {/* Step 2: Waste */}
      {step === 2 && (
        <div className="bg-[#0b0b0b] border border-[#111] rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Waste Bag Size</label>
              <select className={inputClass} value={form.wasteBagSize} onChange={e => set("wasteBagSize", e.target.value)}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra large">Extra Large</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Bags per Week</label>
              <input type="number" className={inputClass} value={form.wasteBagCount} onChange={e => set("wasteBagCount", +e.target.value)} min={0} max={20} />
            </div>
          </div>
          <div>
            <p className={labelClass}>What do you recycle?</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[["recyclePaper","Paper"],["recyclePlastic","Plastic"],["recycleGlass","Glass"],["recycleMetal","Metal"]].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" className={checkboxClass} checked={form[key]} onChange={e => set(key, e.target.checked)} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Energy */}
      {step === 3 && (
        <div className="bg-[#0b0b0b] border border-[#111] rounded-xl p-6 space-y-4">
          <div>
            <label className={labelClass}>Heating Energy Source</label>
            <select className={inputClass} value={form.heatingSource} onChange={e => set("heatingSource", e.target.value)}>
              <option value="natural gas">Natural Gas</option>
              <option value="electricity">Electricity</option>
              <option value="coal">Coal</option>
              <option value="wood">Wood</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Energy Efficiency Practices</label>
            <select className={inputClass} value={form.energyEfficiency} onChange={e => set("energyEfficiency", e.target.value)}>
              <option value="No">No</option>
              <option value="Sometimes">Sometimes</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <p className={labelClass}>Cooking Appliances Used</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[["cookStove","Stove"],["cookOven","Oven"],["cookMicrowave","Microwave"],["cookGrill","Grill"],["cookAirfryer","Air Fryer"]].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" className={checkboxClass} checked={form[key]} onChange={e => set(key, e.target.checked)} />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>TV/PC Daily Hours: {form.tvPcHours}h</label>
              <input type="range" min={0} max={24} value={form.tvPcHours} onChange={e => set("tvPcHours", +e.target.value)} className="w-full accent-emerald-500" />
            </div>
            <div>
              <label className={labelClass}>Internet Daily Hours: {form.internetHours}h</label>
              <input type="range" min={0} max={24} value={form.internetHours} onChange={e => set("internetHours", +e.target.value)} className="w-full accent-emerald-500" />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Consumption */}
      {step === 4 && (
        <div className="bg-[#0b0b0b] border border-[#111] rounded-xl p-6 space-y-4">
          <div>
            <label className={labelClass}>Shower Frequency</label>
            <select className={inputClass} value={form.shower} onChange={e => set("shower", e.target.value)}>
              <option value="less frequently">Less Frequently</option>
              <option value="daily">Daily</option>
              <option value="twice a day">Twice a Day</option>
              <option value="more frequently">More Frequently</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Monthly Grocery Bill ($): {form.groceryBill}</label>
            <input type="range" min={0} max={1000} step={10} value={form.groceryBill} onChange={e => set("groceryBill", +e.target.value)} className="w-full accent-emerald-500" />
          </div>
          <div>
            <label className={labelClass}>New Clothes per Month: {form.newClothes}</label>
            <input type="range" min={0} max={60} value={form.newClothes} onChange={e => set("newClothes", +e.target.value)} className="w-full accent-emerald-500" />
          </div>
        </div>
      )}

      {/* Result */}
      {step === 5 && result && (
        <div className="bg-[#0b0b0b] border border-[#111] rounded-xl p-6 space-y-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">Your Monthly Carbon Footprint</p>
            <p className="text-5xl font-bold text-emerald-400">{result.total}</p>
            <p className="text-gray-400 text-sm mt-1">kgCO₂e / month</p>
          </div>

          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <TreePine className="text-emerald-400 shrink-0" size={24} />
            <p className="text-sm text-gray-300">
              You need approximately <span className="text-emerald-400 font-semibold">{result.trees} trees</span> to offset your monthly emissions.
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-3">Breakdown by Category</p>
            <div className="space-y-3">
              {Object.entries(result.breakdown).map(([cat, val]) => {
                const pct = Math.round((val / result.total) * 100);
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{cat}</span>
                      <span className="text-gray-400">{val} kg ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: BREAKDOWN_COLORS[cat] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={() => { setStep(0); setResult(null); }} className="w-full py-2 rounded-lg bg-[#111] text-gray-300 hover:bg-[#1a1a1a] text-sm transition-colors">
            Recalculate
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
          {error}. Make sure the calculator service is running: <code className="text-xs">python api.py</code> in the Carbon-Footprint-Calculator-App folder.
        </div>
      )}

      {/* Navigation */}
      {step < 5 && (
        <div className="flex justify-between">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="px-5 py-2 rounded-lg bg-[#111] text-gray-300 hover:bg-[#1a1a1a] disabled:opacity-30 text-sm transition-colors">
            Back
          </button>
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm transition-colors">
              Next
            </button>
          ) : (
            <button onClick={handleCalculate} disabled={loading} className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm transition-colors flex items-center gap-2 disabled:opacity-60">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Calculating..." : "Calculate"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
