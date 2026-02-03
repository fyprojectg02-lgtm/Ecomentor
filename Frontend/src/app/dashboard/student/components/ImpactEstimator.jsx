"use client";
import { useState, useEffect } from "react";
import {
    Leaf,
    Droplet,
    Zap,
    TreePine,
    TrendingUp,
    Award,
    BarChart3,
    Loader2
} from "lucide-react";

export default function ImpactEstimator({ studentId, compact = false }) {
    const [impactData, setImpactData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (studentId) {
            fetchImpactMetrics();
        }
    }, [studentId]);

    const fetchImpactMetrics = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/impact-metrics?studentId=${studentId}`);
            const data = await response.json();

            if (data.success) {
                setImpactData(data);
            }
        } catch (error) {
            console.error("Error fetching impact metrics:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
            </div>
        );
    }

    if (!impactData) {
        return (
            <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-6 text-center">
                <p className="text-gray-400">No impact data available yet. Complete activities to see your environmental impact!</p>
            </div>
        );
    }

    const { totalImpact, comparisons, breakdown } = impactData;

    // Compact view for dashboard
    if (compact) {
        return (
            <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/20 rounded-2xl border border-emerald-500/30 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Leaf className="h-6 w-6 text-emerald-400" />
                    <h3 className="text-xl font-bold text-white">Your Environmental Impact</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0f0f0f]/50 rounded-xl p-4 border border-emerald-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Leaf className="h-4 w-4 text-emerald-400" />
                            <p className="text-xs text-gray-400">CO₂ Saved</p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-400">{totalImpact.co2_saved_kg} kg</p>
                    </div>

                    <div className="bg-[#0f0f0f]/50 rounded-xl p-4 border border-emerald-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <TreePine className="h-4 w-4 text-green-400" />
                            <p className="text-xs text-gray-400">Trees Equivalent</p>
                        </div>
                        <p className="text-2xl font-bold text-green-400">{totalImpact.trees_equivalent}</p>
                    </div>
                </div>

                <p className="text-sm text-gray-400 mt-4 text-center">
                    Equal to <span className="text-emerald-400 font-semibold">{comparisons.carTripsAvoided}</span> car trips avoided! 🚗
                </p>
            </div>
        );
    }

    // Full view
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/20 rounded-2xl border border-emerald-500/30 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Leaf className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Environmental Impact Dashboard</h2>
                            <p className="text-sm text-gray-400">Track your positive contribution to the planet</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchImpactMetrics}
                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 transition-colors"
                    >
                        Refresh
                    </button>
                </div>

                {/* Main Impact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0f0f0f]/50 rounded-xl p-5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <Leaf className="h-5 w-5 text-emerald-400" />
                            <p className="text-sm text-gray-400">CO₂ Saved</p>
                        </div>
                        <p className="text-3xl font-bold text-emerald-400 mb-1">{totalImpact.co2_saved_kg}</p>
                        <p className="text-xs text-gray-500">kilograms</p>
                    </div>

                    <div className="bg-[#0f0f0f]/50 rounded-xl p-5 border border-green-500/20 hover:border-green-500/40 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <TreePine className="h-5 w-5 text-green-400" />
                            <p className="text-sm text-gray-400">Trees Equivalent</p>
                        </div>
                        <p className="text-3xl font-bold text-green-400 mb-1">{totalImpact.trees_equivalent}</p>
                        <p className="text-xs text-gray-500">trees planted</p>
                    </div>

                    <div className="bg-[#0f0f0f]/50 rounded-xl p-5 border border-blue-500/20 hover:border-blue-500/40 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <Droplet className="h-5 w-5 text-blue-400" />
                            <p className="text-sm text-gray-400">Water Saved</p>
                        </div>
                        <p className="text-3xl font-bold text-blue-400 mb-1">{totalImpact.water_saved_liters}</p>
                        <p className="text-xs text-gray-500">liters</p>
                    </div>

                    <div className="bg-[#0f0f0f]/50 rounded-xl p-5 border border-yellow-500/20 hover:border-yellow-500/40 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap className="h-5 w-5 text-yellow-400" />
                            <p className="text-sm text-gray-400">Energy Saved</p>
                        </div>
                        <p className="text-3xl font-bold text-yellow-400 mb-1">{totalImpact.energy_saved_kwh}</p>
                        <p className="text-xs text-gray-500">kWh</p>
                    </div>
                </div>
            </div>

            {/* Real-World Comparisons */}
            <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-xl font-bold text-white">Real-World Impact</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
                        <p className="text-sm text-gray-400 mb-2">🚗 Car Trips Avoided</p>
                        <p className="text-2xl font-bold text-white">{comparisons.carTripsAvoided}</p>
                        <p className="text-xs text-gray-500 mt-1">Based on average trip emissions</p>
                    </div>

                    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
                        <p className="text-sm text-gray-400 mb-2">♻️ Plastic Bottles Recycled</p>
                        <p className="text-2xl font-bold text-white">{comparisons.plasticBottlesRecycled}</p>
                        <p className="text-xs text-gray-500 mt-1">Equivalent plastic reduction</p>
                    </div>

                    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
                        <p className="text-sm text-gray-400 mb-2">🚿 Showers Saved</p>
                        <p className="text-2xl font-bold text-white">{comparisons.showersSaved}</p>
                        <p className="text-xs text-gray-500 mt-1">Water conservation equivalent</p>
                    </div>

                    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
                        <p className="text-sm text-gray-400 mb-2">⚡ Homes Energized (1 day)</p>
                        <p className="text-2xl font-bold text-white">{comparisons.homesEnergized}</p>
                        <p className="text-xs text-gray-500 mt-1">Energy savings equivalent</p>
                    </div>
                </div>
            </div>

            {/* Impact Breakdown by Activity */}
            <div className="bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] p-6">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-xl font-bold text-white">Impact by Activity Type</h3>
                </div>

                <div className="space-y-4">
                    {Object.entries(breakdown).map(([type, metrics]) => {
                        const totalImpactScore = parseFloat(metrics.co2_saved_kg) +
                            parseFloat(metrics.plastic_reduced_kg) +
                            (parseFloat(metrics.water_saved_liters) / 100);

                        if (totalImpactScore === 0) return null;

                        return (
                            <div key={type} className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-white capitalize">{type.replace('_', ' ')}</h4>
                                    <Award className="h-4 w-4 text-emerald-400" />
                                </div>

                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-400 text-xs mb-1">CO₂</p>
                                        <p className="text-emerald-400 font-semibold">{metrics.co2_saved_kg.toFixed(1)} kg</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs mb-1">Plastic</p>
                                        <p className="text-blue-400 font-semibold">{metrics.plastic_reduced_kg.toFixed(1)} kg</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs mb-1">Water</p>
                                        <p className="text-cyan-400 font-semibold">{metrics.water_saved_liters.toFixed(1)} L</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Motivational Message */}
            <div className="bg-gradient-to-r from-emerald-900/20 to-green-900/20 rounded-2xl border border-emerald-500/30 p-6 text-center">
                <p className="text-lg text-white font-semibold mb-2">
                    🌍 Keep up the amazing work!
                </p>
                <p className="text-gray-400">
                    Your actions are making a real difference. Every small step counts toward a sustainable future.
                </p>
            </div>
        </div>
    );
}
